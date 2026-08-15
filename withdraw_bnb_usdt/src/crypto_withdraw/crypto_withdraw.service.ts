import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { ethers } from 'ethers';
import batchABI from '../abi/batchTransfer';
import erc20Abi from '../abi/erc20Abi';
import { Admin_wallet_data, rpc, network_Details } from '../constants/constant';
import Web3 from 'web3';

function sanitizeBigInt(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return obj.toString();
    if (Array.isArray(obj)) return obj.map(sanitizeBigInt);
    if (typeof obj === 'object') {
        const res: any = {};
        for (const key of Object.keys(obj)) {
            res[key] = sanitizeBigInt(obj[key]);
        }
        return res;
    }
    return obj;
}

@Injectable()
export class CryptoWithdrawService implements OnModuleInit {
    private web3: Web3;
    private adminAccount: any;
    private provider: ethers.JsonRpcProvider;

    constructor(
        @InjectModel(Transaction.name)
        private readonly transactionModel: Model<TransactionDocument>,
    ) {
        this.web3 = new Web3(new Web3.providers.HttpProvider(rpc.BNBCOIN));
        this.provider = new ethers.JsonRpcProvider(rpc.BNBCOIN);
    }

    async getTransactions(sender?: string, limit: number = 100, merchantId?: any): Promise<Transaction[]> {
        const filter: any = {};
        if (sender) {
            filter.senderAddress = sender.toLowerCase();
        }
        if (merchantId) {
            filter.merchantId = merchantId;
        }
        return this.transactionModel.find(filter).sort({ createdAt: -1 }).limit(limit).exec();
    }

    async recordTransaction(payload: {
        txHash: string;
        senderAddress: string;
        recipientAddress: string;
        amount: number;
        tokenSymbol?: string;
        tokenAddress?: string | null;
        chainId?: number;
        txType?: string;
        status?: string;
        errorMessage?: string | null;
        merchantId?: any;
        apiKeyId?: any;
    }): Promise<TransactionDocument> {
        const sender = payload.senderAddress.toLowerCase();
        const existing = await this.transactionModel.findOne({ txHash: payload.txHash });
        if (existing) {
            existing.status = payload.status ?? existing.status;
            if (payload.errorMessage !== undefined) existing.errorMessage = payload.errorMessage ?? undefined;
            if (payload.merchantId) existing.merchantId = payload.merchantId;
            if (payload.apiKeyId) existing.apiKeyId = payload.apiKeyId;
            return existing.save();
        }

        const doc = new this.transactionModel({
            txHash: payload.txHash,
            senderAddress: sender,
            recipientAddress: payload.recipientAddress,
            amount: payload.amount,
            tokenSymbol: payload.tokenSymbol || 'BNB',
            tokenAddress: payload.tokenAddress || null,
            chainId: payload.chainId || network_Details.BNB_CHAIN_ID || 97,
            txType: payload.txType || 'single',
            status: payload.status || 'pending',
            errorMessage: payload.errorMessage || null,
            merchantId: payload.merchantId || null,
            apiKeyId: payload.apiKeyId || null,
        });
        return doc.save();
    }

    async updateTransactionStatus(
        txHash: string,
        status: string,
        errorMessage?: string,
    ): Promise<any> {
        return this.transactionModel.updateOne(
            { txHash },
            { $set: { status, errorMessage: errorMessage || null } },
        );
    }

    async getStats(sender?: string, merchantId?: any): Promise<any> {
        const filter: any = {};
        if (sender) filter.senderAddress = sender.toLowerCase();
        if (merchantId) filter.merchantId = merchantId;

        const [total, success, failed, pending] = await Promise.all([
            this.transactionModel.countDocuments(filter),
            this.transactionModel.countDocuments({ ...filter, status: 'success' }),
            this.transactionModel.countDocuments({ ...filter, status: 'failed' }),
            this.transactionModel.countDocuments({ ...filter, status: 'pending' }),
        ]);

        return { total, success, failed, pending };
    }

    async onModuleInit() {
        let privateKeyRaw = Admin_wallet_data.ADMIN_BNB_MNEMONIC_PRIVATE_KEY || '';
        if (privateKeyRaw.startsWith('0x')) {
            privateKeyRaw = privateKeyRaw.slice(2);
        }
        if (privateKeyRaw.length !== 64) {
            throw new Error("Invalid private key length. Expected 64 hex characters.");
        }
        const privateKey = `0x${privateKeyRaw}`;
        this.adminAccount = this.web3.eth.accounts.privateKeyToAccount(privateKey);
        console.log("Admin wallet address:", this.adminAccount.address);
    }


    async transfer(receiver: string, amount: number, options?: { merchantId?: any; apiKeyId?: any }): Promise<any> {
        try {
            if (!this.adminAccount) {
                await this.onModuleInit();
            }
            const network = network_Details;
            const currentNonce = await this.web3.eth.getTransactionCount(this.adminAccount.address, 'pending');
            const balance = await this.web3.eth.getBalance(this.adminAccount.address);
            console.log("Admin wallet balance:", this.web3.utils.fromWei(balance, 'ether'));

            const amountWei = this.web3.utils.toWei(amount.toString(), 'ether');
            if (BigInt(balance) < BigInt(amountWei)) {
                throw new Error("Insufficient balance to cover the transaction.");
            }

            let gasPrice: any;
            try {
                gasPrice = await this.web3.eth.getGasPrice();
            } catch {
                gasPrice = this.web3.utils.toWei('3', 'gwei');
            }

            const tx = {
                nonce: currentNonce,
                to: this.web3.utils.toChecksumAddress(receiver),
                value: amountWei,
                gas: 21000,
                gasPrice: gasPrice,
                chainId: network.BNB_CHAIN_ID,
            };

            const signedTx = await this.web3.eth.accounts.signTransaction(tx, this.adminAccount.privateKey);
            console.log("Signed Transaction:", signedTx);

            const rawTx = signedTx.rawTransaction || (signedTx as any).raw;
            const receipt = await this.web3.eth.sendSignedTransaction(rawTx);
            console.log("Transaction Receipt:", receipt);

            if (receipt.transactionHash) {
                await this.recordTransaction({
                    txHash: receipt.transactionHash.toString(),
                    senderAddress: this.adminAccount.address,
                    recipientAddress: receiver,
                    amount: Number(amount),
                    tokenSymbol: 'BNB',
                    tokenAddress: null,
                    chainId: network.BNB_CHAIN_ID,
                    txType: 'single',
                    status: receipt.status ? 'success' : 'failed',
                    merchantId: options?.merchantId,
                    apiKeyId: options?.apiKeyId,
                }).catch(err => console.error("Failed to record transaction to MongoDB:", err));
            }

            return sanitizeBigInt(receipt);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error("Error during BNB transfer:", errorMessage);
            throw new Error("BNB transaction failed: " + errorMessage);
        }
    }

    async transferToken(
        receiver: string,
        amount: number | string,
        tokenAddress: string,
        tokenDecimals: number = 18,
        options?: { merchantId?: any; apiKeyId?: any }
    ): Promise<any> {
        try {
            if (!this.adminAccount) {
                await this.onModuleInit();
            }
            const network = network_Details;
            const abi = erc20Abi;
            const checksumTokenAddress = this.web3.utils.toChecksumAddress(tokenAddress);
            const contract = new this.web3.eth.Contract(abi, checksumTokenAddress);

            const formattedAmountWei = ethers.parseUnits(amount.toString(), tokenDecimals).toString();

            // Verify contract bytecode exists at tokenAddress
            const code = await this.web3.eth.getCode(checksumTokenAddress);
            if (!code || code === '0x' || code === '0x0') {
                throw new Error(`Invalid token contract address ${tokenAddress}. No smart contract bytecode deployed at this address on network (ChainId: ${network.BNB_CHAIN_ID}).`);
            }

            // Enforce on-chain token balance check specifically for token transfers
            try {
                const erc20Contract = new this.web3.eth.Contract(erc20Abi, checksumTokenAddress);
                const onChainBalanceWei: any = await erc20Contract.methods.balanceOf(this.adminAccount.address).call();
                if (onChainBalanceWei !== undefined && onChainBalanceWei !== null) {
                    if (BigInt(onChainBalanceWei) < BigInt(formattedAmountWei)) {
                        const readableBalance = ethers.formatUnits(onChainBalanceWei.toString(), tokenDecimals);
                        throw new Error(`Insufficient token balance on-chain. Sender (${this.adminAccount.address}) has ${readableBalance} tokens, required: ${amount}.`);
                    }
                }
            } catch (err: any) {
                if (err.message && err.message.includes('Insufficient token balance')) {
                    throw err;
                }
                throw new Error(`Failed to query token balance for ${tokenAddress}: ${err.message || err}`);
            }

            const data = contract.methods.transfer(this.web3.utils.toChecksumAddress(receiver), formattedAmountWei).encodeABI();

            const currentNonce = await this.web3.eth.getTransactionCount(this.adminAccount.address, 'pending');

            let gasPrice: any;
            try {
                gasPrice = await this.web3.eth.getGasPrice();
            } catch {
                gasPrice = this.web3.utils.toWei('5', 'gwei');
            }

            const tx = {
                nonce: currentNonce,
                to: this.web3.utils.toChecksumAddress(tokenAddress),
                data: data,
                gas: 100000,
                gasPrice: gasPrice,
                chainId: network.BNB_CHAIN_ID,
            };

            const signedTx = await this.web3.eth.accounts.signTransaction(tx, this.adminAccount.privateKey);
            const rawTx = signedTx.rawTransaction || (signedTx as any).raw;
            const receipt = await this.web3.eth.sendSignedTransaction(rawTx);

            if (receipt.transactionHash) {
                await this.recordTransaction({
                    txHash: receipt.transactionHash.toString(),
                    senderAddress: this.adminAccount.address,
                    recipientAddress: receiver,
                    amount: Number(amount),
                    tokenSymbol: 'TOKEN',
                    tokenAddress: tokenAddress,
                    chainId: network.BNB_CHAIN_ID,
                    txType: 'token',
                    status: receipt.status ? 'success' : 'failed',
                    merchantId: options?.merchantId,
                    apiKeyId: options?.apiKeyId,
                }).catch(err => console.error("Failed to record token transaction to MongoDB:", err));
            }

            return sanitizeBigInt(receipt);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error("Error during token transfer:", errorMessage);
            throw new Error("Token transfer failed: " + errorMessage);
        }
    }

    // async processBatchTransferEVMCoin(
    //     tokenAddresses: string[],
    //     toAddresses: string[][],
    //     rawAmounts: string[][],
    //     tokenDecimals: number[],
    //     networkSymbol: string = 'BNB'
    // ): Promise<{ success: boolean; txHash?: any; error?: string }> {
    //     try {
    //         if (!this.adminAccount) {
    //             await this.onModuleInit();
    //         }
    //         const wallet = new ethers.Wallet(
    //             this.adminAccount.privateKey,
    //             this.provider
    //         );

    //         const contract = new ethers.Contract(
    //             this.getContractAddress(networkSymbol),
    //             batchABI,
    //             wallet
    //         );

    //         const formattedAmounts = rawAmounts.map((group, i) =>
    //             group.map((v) => ethers.parseUnits(v.toString(), tokenDecimals[i]).toString())
    //         );

    //         const nativeTokenIndex = tokenAddresses.findIndex(
    //             (addr) => addr.toLowerCase() === '0x0000000000000000000000000000000000000000'
    //         );

    //         const totalNative = nativeTokenIndex >= 0
    //             ? formattedAmounts[nativeTokenIndex].reduce((acc, v) => acc + BigInt(v), 0n)
    //             : 0n;

    //         const txOptions: any = {};
    //         if (totalNative > 0n) {
    //             txOptions.value = totalNative;
    //         }

    //         const estimatedGas = await contract.batchTransferGrouped.estimateGas(
    //             tokenAddresses,
    //             toAddresses,
    //             formattedAmounts,
    //             txOptions
    //         );

    //         txOptions.gasLimit = estimatedGas + 100000n;

    //         const txResponse = await contract.batchTransferGrouped(
    //             tokenAddresses,
    //             toAddresses,
    //             formattedAmounts,
    //             txOptions
    //         );

    //         const receipt = await txResponse.wait();

    //         return {
    //             success: receipt.status === 1,
    //             txHash: sanitizeBigInt({
    //                 hash: txResponse.hash,
    //                 blockNumber: receipt.blockNumber,
    //                 gasUsed: receipt.gasUsed.toString(),
    //                 from: receipt.from,
    //                 to: receipt.to,
    //             }),
    //         };

    //     } catch (error: any) {
    //         return { success: false, error: error.message };
    //     }
    // }

    async batchTransferTokenFromSender(
        tokenAddress: string,
        recipients: string[],
        rawAmounts: (string | number)[],
        tokenDecimals: number = 18,
        networkSymbol: string = 'BNB'
    ): Promise<{ success: boolean; txHash?: any; error?: string }> {
        try {
            if (!this.adminAccount) {
                await this.onModuleInit();
            }

            const checksumTokenAddress = this.web3.utils.toChecksumAddress(tokenAddress);

            // Verify contract bytecode exists at tokenAddress
            const code = await this.web3.eth.getCode(checksumTokenAddress);
            if (!code || code === '0x' || code === '0x0') {
                throw new Error(`Invalid token contract address ${tokenAddress}. No smart contract bytecode deployed at this address on network.`);
            }

            const formattedAmounts = rawAmounts.map((amt) =>
                ethers.parseUnits(amt.toString(), tokenDecimals).toString()
            );

            const totalRequiredWei = formattedAmounts.reduce(
                (acc, val) => acc + BigInt(val),
                0n
            );

            // Fetch and verify on-chain token balance of sender
            const erc20Contract = new this.web3.eth.Contract(erc20Abi, checksumTokenAddress);
            const onChainBalanceWei: any = await erc20Contract.methods.balanceOf(this.adminAccount.address).call();

            if (onChainBalanceWei !== undefined && onChainBalanceWei !== null) {
                if (BigInt(onChainBalanceWei) < totalRequiredWei) {
                    const readableBalance = ethers.formatUnits(onChainBalanceWei.toString(), tokenDecimals);
                    const readableRequired = ethers.formatUnits(totalRequiredWei.toString(), tokenDecimals);
                    throw new Error(
                        `Insufficient token balance on-chain. Sender (${this.adminAccount.address}) has ${readableBalance} tokens, required total: ${readableRequired}.`
                    );
                }
            }

            const batchContractAddress = this.getContractAddress(networkSymbol);
            if (!batchContractAddress) {
                throw new Error(`Unsupported network symbol ${networkSymbol}`);
            }

            // Check ERC20 allowance for the Batch Contract
            const allowanceWei: any = await erc20Contract.methods.allowance(this.adminAccount.address, batchContractAddress).call();

            if (BigInt(allowanceWei) < totalRequiredWei) {
                console.log(`Approving batch contract ${batchContractAddress} to spend tokens...`);
                const approveData = erc20Contract.methods.approve(batchContractAddress, ethers.MaxUint256.toString()).encodeABI();
                const nonce = await this.web3.eth.getTransactionCount(this.adminAccount.address, 'pending');
                let gasPrice: any;
                try {
                    gasPrice = await this.web3.eth.getGasPrice();
                } catch {
                    gasPrice = this.web3.utils.toWei('5', 'gwei');
                }

                const approveTx = {
                    nonce: nonce,
                    to: checksumTokenAddress,
                    data: approveData,
                    gas: 100000,
                    gasPrice: gasPrice,
                    chainId: network_Details.BNB_CHAIN_ID,
                };

                const signedApproveTx = await this.web3.eth.accounts.signTransaction(approveTx, this.adminAccount.privateKey);
                const rawApproveTx = signedApproveTx.rawTransaction || (signedApproveTx as any).raw;
                const approveReceipt = await this.web3.eth.sendSignedTransaction(rawApproveTx);
                console.log("Token Approval Receipt:", approveReceipt);
            }

            const wallet = new ethers.Wallet(this.adminAccount.privateKey, this.provider);
            const contract = new ethers.Contract(batchContractAddress, batchABI, wallet);

            const checksumRecipients = recipients.map((r) => this.web3.utils.toChecksumAddress(r));

            const estimatedGas = await contract.batchTransferTokenFromSender.estimateGas(
                checksumTokenAddress,
                checksumRecipients,
                formattedAmounts
            );

            const txResponse = await contract.batchTransferTokenFromSender(
                checksumTokenAddress,
                checksumRecipients,
                formattedAmounts,
                { gasLimit: estimatedGas + 100000n }
            );

            const receipt = await txResponse.wait();

            if (txResponse.hash) {
                const totalAmount = rawAmounts.reduce<number>((acc, v) => acc + Number(v), 0);
                await this.recordTransaction({
                    txHash: txResponse.hash,
                    senderAddress: this.adminAccount.address,
                    recipientAddress: `${recipients.length} recipients`,
                    amount: totalAmount,
                    tokenSymbol: 'BATCH_TOKEN',
                    tokenAddress: tokenAddress,
                    chainId: network_Details.BNB_CHAIN_ID,
                    txType: 'batch',
                    status: receipt.status === 1 ? 'success' : 'failed',
                }).catch(err => console.error("Failed to record batch token transaction to MongoDB:", err));
            }

            return {
                success: receipt.status === 1,
                txHash: sanitizeBigInt({
                    hash: txResponse.hash,
                    blockNumber: receipt.blockNumber,
                    gasUsed: receipt.gasUsed.toString(),
                    from: receipt.from,
                    to: receipt.to,
                }),
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    private getContractAddress(networkSymbol: string): string {
        const addressMap: Record<string, string> = {
            BNB: '0xf02c17Ed8bD759B1a7B345ad42Fd6f4567C326B4',
        };
        return addressMap[networkSymbol] || '';
    }
}
