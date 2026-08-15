import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { CryptoWithdrawService } from './crypto_withdraw.service';
import {
    NativeTransferDto,
    TokenTransferDto,
    BatchTransferTokenDto,
    BatchTransferDto,
    RecordTransactionDto,
    PatchTransactionDto,
} from './dto/crypto_withdraw.dto';

@ApiTags('Crypto Withdraw')
@Controller('crypto-withdraw')
export class CryptoWithdrawController {
    constructor(private readonly cryptoWithdrawService: CryptoWithdrawService) { }

    @Get('transactions')
    @ApiOperation({ summary: 'Get stored withdrawal transaction ledger from MongoDB' })
    @ApiQuery({ name: 'sender', required: false, description: 'Filter by sender address' })
    @ApiResponse({ status: 200, description: 'List of transactions retrieved from MongoDB' })
    async getTransactions(@Query('sender') sender?: string) {
        try {
            const list = await this.cryptoWithdrawService.getTransactions(sender);
            const formatted = list.map((tx: any) => ({
                id: tx._id.toString(),
                tx_hash: tx.txHash,
                sender_address: tx.senderAddress,
                recipient_address: tx.recipientAddress,
                amount: tx.amount,
                token_symbol: tx.tokenSymbol,
                token_address: tx.tokenAddress,
                chain_id: tx.chainId,
                tx_type: tx.txType,
                status: tx.status,
                error_message: tx.errorMessage,
                created_at: tx.createdAt,
            }));
            return { success: true, transactions: formatted };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    }

    @Post('record-transaction')
    @ApiOperation({ summary: 'Record or update client-submitted withdrawal transaction in MongoDB' })
    @ApiBody({ type: RecordTransactionDto })
    @ApiResponse({ status: 201, description: 'Transaction recorded successfully in MongoDB' })
    async recordTransaction(@Body() body: RecordTransactionDto) {
        try {
            const record = await this.cryptoWithdrawService.recordTransaction(body);
            return { success: true, record };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    }

    @Patch('record-transaction')
    @ApiOperation({ summary: 'Update transaction status in MongoDB' })
    @ApiBody({ type: PatchTransactionDto })
    @ApiResponse({ status: 200, description: 'Transaction status updated successfully' })
    async updateTransactionStatus(@Body() body: PatchTransactionDto) {
        try {
            await this.cryptoWithdrawService.updateTransactionStatus(
                body.txHash,
                body.status,
                body.errorMessage,
            );
            return { success: true };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get transaction aggregate metrics from MongoDB' })
    @ApiQuery({ name: 'sender', required: false, description: 'Filter by sender address' })
    async getStats(@Query('sender') sender?: string) {
        try {
            const stats = await this.cryptoWithdrawService.getStats(sender);
            return { success: true, stats };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    }


    @Post('transfer')
    @ApiOperation({ summary: 'Transfer native BNB coin to recipient' })
    @ApiBody({ type: NativeTransferDto })
    @ApiResponse({ status: 200, description: 'Native BNB transfer successful.' })
    @ApiResponse({ status: 400, description: 'Transaction failed or bad input.' })
    async transfer(@Body() body: NativeTransferDto) {
        try {
            const receipt = await this.cryptoWithdrawService.transfer(
                body.receiver,
                body.amount,
            );
            return {
                success: true,
                data: receipt,
            };
        } catch (error) {
            return {
                success: false,
                error: (error as Error).message,
            };
        }
    }

    @Post('transfer-token')
    @ApiOperation({ summary: 'Transfer BEP20 / ERC20 token to recipient' })
    @ApiBody({ type: TokenTransferDto })
    @ApiResponse({ status: 200, description: 'Token transfer successful.' })
    @ApiResponse({ status: 400, description: 'Token transaction failed or bad input.' })
    async transferToken(@Body() body: TokenTransferDto) {
        try {
            const receipt = await this.cryptoWithdrawService.transferToken(
                body.receiver,
                body.amount,
                body.tokenAddress,
                body.tokenDecimals ?? 18,
            );
            return {
                success: true,
                data: receipt,
            };
        } catch (error) {
            return {
                success: false,
                error: (error as Error).message,
            };
        }
    }

    @Post('batch-transfer-token')
    @ApiOperation({ summary: 'Batch transfer a single token to multiple recipients (using batchTransferTokenFromSender)' })
    @ApiBody({ type: BatchTransferTokenDto })
    @ApiResponse({ status: 200, description: 'Batch token transfer executed successfully.' })
    @ApiResponse({ status: 400, description: 'Batch token transaction failed or bad input.' })
    async batchTransferToken(@Body() body: BatchTransferTokenDto) {
        try {
            const result = await this.cryptoWithdrawService.batchTransferTokenFromSender(
                body.tokenAddress,
                body.recipients,
                body.amounts,
                body.tokenDecimals ?? 18,
                body.networkSymbol || 'BNB',
            );

            if (!result.success) {
                return { success: false, error: result.error };
            }

            return {
                success: true,
                data: {
                    transaction: result.txHash,
                    tokenAddress: body.tokenAddress,
                    recipients: body.recipients.map((to, i) => ({
                        to,
                        amount: body.amounts[i],
                    })),
                },
            };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    }

    // @Post('batch-transfer')
    // @ApiOperation({ summary: 'Batch transfer native BNB and/or tokens to multiple recipients' })
    // @ApiBody({ type: BatchTransferDto })
    // @ApiResponse({ status: 200, description: 'Batch transfer executed successfully.' })
    // @ApiResponse({ status: 400, description: 'Batch transaction failed or bad input.' })
    // async batchTransfer(@Body() body: BatchTransferDto) {
    //     try {
    //         // Check if user called batch-transfer specifically with tokenAddress + recipients/amounts (or receivers)
    //         if (body.tokenAddress && (body.receivers?.[0] || (body as any).recipients) && body.amounts) {
    //             const recipientsList = body.receivers?.[0] || (body as any).recipients;
    //             const amountsList = Array.isArray(body.amounts[0]) ? body.amounts[0] : body.amounts;
    //             const decimals = body.tokenDecimals || (body.decimals?.[0] ?? 18);

    //             const result = await this.cryptoWithdrawService.batchTransferTokenFromSender(
    //                 body.tokenAddress,
    //                 recipientsList,
    //                 amountsList,
    //                 decimals,
    //                 body.networkSymbol || 'BNB',
    //             );

    //             if (!result.success) {
    //                 return { success: false, error: result.error };
    //             }

    //             return {
    //                 success: true,
    //                 data: {
    //                     transaction: result.txHash,
    //                     batch: [
    //                         {
    //                             token: body.tokenAddress,
    //                             decimals: decimals,
    //                             transfers: recipientsList.map((to: string, j: number) => ({
    //                                 to,
    //                                 amount: amountsList[j],
    //                             })),
    //                         },
    //                     ],
    //                 },
    //             };
    //         }

    //         let tokens: string[] = [];
    //         let receivers: string[][] = [];
    //         let amounts: string[][] = [];
    //         let decimals: number[] = [];
    //         let networkSymbol = body.networkSymbol || 'BNB';

    //         // Support legacy payload structure with body.transactions.recipientsData.recipients
    //         if (body.transactions?.recipientsData?.recipients) {
    //             const recipients = body.transactions.recipientsData.recipients;

    //             const tokenMap = new Map<
    //                 string,
    //                 { receivers: string[]; amounts: string[] }
    //             >();
    //             const decimalsMap = new Map<string, number>();

    //             for (const recipient of recipients) {
    //                 const token = recipient.token || '0x0000000000000000000000000000000000000000';
    //                 const address = recipient.address;
    //                 const amount = recipient.amount.toString();

    //                 if (!tokenMap.has(token)) {
    //                     tokenMap.set(token, { receivers: [], amounts: [] });
    //                     decimalsMap.set(token, 18);
    //                 }

    //                 tokenMap.get(token)!.receivers.push(address);
    //                 tokenMap.get(token)!.amounts.push(amount);
    //             }

    //             tokens = Array.from(tokenMap.keys());
    //             receivers = tokens.map((t) => tokenMap.get(t)!.receivers);
    //             amounts = tokens.map((t) => tokenMap.get(t)!.amounts);
    //             decimals = tokens.map((t) => decimalsMap.get(t) || 18);
    //         } else if (body.tokens && body.receivers && body.amounts) {
    //             tokens = body.tokens;
    //             receivers = body.receivers;
    //             amounts = body.amounts;
    //             decimals = body.decimals || tokens.map(() => 18);
    //         } else {
    //             return {
    //                 success: false,
    //                 error: 'Invalid request payload structure. Provide tokens/receivers/amounts or tokenAddress/recipients/amounts or transactions payload.',
    //             };
    //         }

    //         const result = await this.cryptoWithdrawService.processBatchTransferEVMCoin(
    //             tokens,
    //             receivers,
    //             amounts,
    //             decimals,
    //             networkSymbol,
    //         );

    //         if (!result.success) {
    //             return { success: false, error: result.error };
    //         }

    //         const batchTransfers = tokens.map((token, i) => ({
    //             token,
    //             decimals: decimals[i],
    //             transfers: receivers[i].map((to, j) => ({
    //                 to,
    //                 amount: amounts[i][j],
    //             })),
    //         }));

    //         return {
    //             success: true,
    //             data: {
    //                 transaction: result.txHash,
    //                 batch: batchTransfers,
    //             },
    //         };
    //     } catch (error) {
    //         return { success: false, error: (error as Error).message };
    //     }
    // }
}
