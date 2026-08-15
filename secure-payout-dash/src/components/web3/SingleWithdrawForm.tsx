import { useCallback, useEffect, useState } from "react";
import { Contract, isAddress, parseEther, parseUnits } from "ethers";
import { Fuel, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWallet } from "@/lib/web3/wallet";
import { CHAINS, ERC20_ABI, explorerTx, type ChainId } from "@/lib/web3/constants";
import { estimateGasCost } from "@/lib/web3/gas";
import { recordTransaction, updateTransactionStatus } from "@/lib/web3/tx-api";
import { useTokenMetadata } from "@/lib/web3/token";
import { cn } from "@/lib/utils";

type TokenType = "NATIVE" | "TOKEN";

export function SingleWithdrawForm({ onRecorded }: { onRecorded: () => void }) {
  const { address, chainId, getProvider, isSupportedChain, refreshBalances } = useWallet();
  const [tokenType, setTokenType] = useState<TokenType>("NATIVE");
  const [tokenAddressInput, setTokenAddressInput] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [gas, setGas] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const chain = chainId !== null ? CHAINS[chainId as ChainId] : undefined;

  // Set default chain USDT address when chain loads or when switching to TOKEN mode
  useEffect(() => {
    if (chain?.usdt && !tokenAddressInput) {
      setTokenAddressInput(chain.usdt);
    }
  }, [chain, tokenAddressInput]);

  const tokenMeta = useTokenMetadata(tokenType === "TOKEN" ? tokenAddressInput : "");

  const activeSymbol = tokenType === "NATIVE" ? "BNB" : tokenMeta.symbol || "TOKEN";
  const activeDecimals = tokenType === "NATIVE" ? 18 : tokenMeta.decimals;

  const previewGas = useCallback(async () => {
    if (!address || !chain || !isAddress(recipient) || !Number(amount)) {
      setGas(null);
      return;
    }
    try {
      const provider = getProvider();
      if (tokenType === "NATIVE") {
        setGas(
          await estimateGasCost(provider, {
            from: address,
            to: recipient,
            value: parseEther(amount),
          }),
        );
      } else {
        if (!isAddress(tokenAddressInput) || tokenMeta.error) {
          setGas(null);
          return;
        }
        const erc20 = new Contract(tokenAddressInput.trim(), ERC20_ABI, provider);
        const data = erc20.interface.encodeFunctionData("transfer", [
          recipient,
          parseUnits(amount, activeDecimals),
        ]);
        setGas(await estimateGasCost(provider, { from: address, to: tokenAddressInput.trim(), data }));
      }
    } catch {
      setGas(null);
    }
  }, [address, chain, recipient, amount, tokenType, tokenAddressInput, tokenMeta, activeDecimals, getProvider]);

  useEffect(() => {
    const timer = setTimeout(() => void previewGas(), 500);
    return () => clearTimeout(timer);
  }, [previewGas]);

  async function submit() {
    if (!address || !chain) {
      toast.error("Connect your wallet first");
      return;
    }
    if (!isAddress(recipient)) {
      toast.error("Enter a valid recipient address");
      return;
    }
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error("Enter an amount greater than zero");
      return;
    }

    if (tokenType === "TOKEN") {
      if (!isAddress(tokenAddressInput)) {
        toast.error("Enter a valid token contract address");
        return;
      }
      if (tokenMeta.error) {
        toast.error("Cannot transfer invalid token contract", { description: tokenMeta.error });
        return;
      }
    }

    setBusy(true);
    try {
      const signer = await getProvider().getSigner();
      toast.info("Confirm in MetaMask", { description: "Waiting for your signature..." });

      const tx =
        tokenType === "NATIVE"
          ? await signer.sendTransaction({ to: recipient, value: parseEther(amount) })
          : await (
              new Contract(tokenAddressInput.trim(), ERC20_ABI, signer)["transfer"] as (
                to: string,
                v: bigint,
              ) => Promise<{ hash: string; wait: () => Promise<{ status: number | null } | null> }>
            )(recipient, parseUnits(amount, activeDecimals));

      toast.success("Transaction broadcasted", { description: tx.hash });

      await recordTransaction({
        txHash: tx.hash,
        senderAddress: address,
        recipientAddress: recipient,
        amount: value,
        tokenSymbol: activeSymbol,
        tokenAddress: tokenType === "TOKEN" ? tokenAddressInput.trim() : null,
        chainId: chain.id,
        txType: "single",
        status: "pending",
      });
      onRecorded();

      const receipt = await tx.wait();
      const ok = receipt?.status === 1;
      await updateTransactionStatus(tx.hash, ok ? "success" : "failed");
      toast[ok ? "success" : "error"](ok ? "Confirmed on-chain" : "Transaction reverted", {
        description: tx.hash,
        action: {
          label: "BscScan",
          onClick: () => window.open(explorerTx(chain.id, tx.hash), "_blank", "noopener"),
        },
      });
      setRecipient("");
      setAmount("");
      await refreshBalances();
      onRecorded();
    } catch (error) {
      toast.error("Transaction failed", {
        description: ((error as { shortMessage?: string }).shortMessage ??
          (error as Error).message) as string,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass-card p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Single Withdrawal</h2>
          <p className="text-xs text-muted-foreground">
            Non-custodial payout — supports any ERC20 / BEP20 token
          </p>
        </div>
        <Send className="size-4 text-primary" />
      </div>

      <div className="space-y-4">
        {/* Token Mode Selection */}
        <div className="space-y-2">
          <Label>Asset Type</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTokenType("NATIVE")}
              className={cn(
                "rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
                tokenType === "NATIVE"
                  ? "border-primary/60 bg-primary/10 text-primary glow-ring"
                  : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground",
              )}
            >
              Native (BNB)
            </button>
            <button
              type="button"
              onClick={() => {
                setTokenType("TOKEN");
                if (!tokenAddressInput && chain?.usdt) {
                  setTokenAddressInput(chain.usdt);
                }
              }}
              className={cn(
                "rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
                tokenType === "TOKEN"
                  ? "border-primary/60 bg-primary/10 text-primary glow-ring"
                  : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground",
              )}
            >
              BEP20 / ERC20 Token
            </button>
          </div>
        </div>

        {/* Custom Token Address Input */}
        {tokenType === "TOKEN" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="tokenAddress">Token Contract Address</Label>
              {chain?.usdt && (
                <button
                  type="button"
                  onClick={() => setTokenAddressInput(chain.usdt)}
                  className="text-[11px] text-accent hover:underline"
                >
                  Use Default USDT
                </button>
              )}
            </div>
            <Input
              id="tokenAddress"
              value={tokenAddressInput}
              placeholder="0x... (e.g. USDT, BUSD, DAI contract)"
              className="font-mono text-xs"
              onChange={(e) => setTokenAddressInput(e.target.value.trim())}
            />

            {/* Token Resolution Card */}
            <div className="rounded-xl border border-glass-border bg-secondary/30 p-3 text-xs">
              {tokenMeta.loading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin text-accent" />
                  <span>Detecting token metadata from blockchain...</span>
                </div>
              ) : tokenMeta.error ? (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{tokenMeta.error}</span>
                </div>
              ) : tokenMeta.symbol ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between font-medium text-foreground">
                    <span className="flex items-center gap-1.5 text-accent">
                      <CheckCircle2 className="size-3.5 text-emerald-400" />
                      {tokenMeta.name} ({tokenMeta.symbol})
                    </span>
                    <span className="font-mono text-muted-foreground">
                      Decimals: {tokenMeta.decimals}
                    </span>
                  </div>
                  {address && (
                    <p className="font-mono text-[11px] text-muted-foreground">
                      Your Balance: <span className="text-foreground">{tokenMeta.balance} {tokenMeta.symbol}</span>
                    </p>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground">Enter a contract address above to auto-detect token details.</span>
              )}
            </div>
          </div>
        )}

        {/* Recipient Address */}
        <div className="space-y-2">
          <Label htmlFor="recipient">Recipient address</Label>
          <Input
            id="recipient"
            value={recipient}
            maxLength={42}
            placeholder="0x..."
            className="font-mono text-xs"
            onChange={(e) => setRecipient(e.target.value)}
          />
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount ({activeSymbol})</Label>
          <Input
            id="amount"
            value={amount}
            inputMode="decimal"
            placeholder="0.00"
            className="font-mono text-xs"
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          />
        </div>

        {/* Gas Preview */}
        <div className="flex items-center gap-2 rounded-xl border border-glass-border bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
          <Fuel className="size-3.5 text-accent" />
          {gas ? (
            <span className="font-mono">Est. gas ≈ {gas} BNB</span>
          ) : (
            <span>Gas preview appears once the form is valid</span>
          )}
        </div>

        {/* Submit Button */}
        <Button
          variant="hero"
          size="xl"
          className="w-full"
          disabled={
            busy ||
            !address ||
            !isSupportedChain ||
            (tokenType === "TOKEN" && (!tokenMeta.symbol || Boolean(tokenMeta.error)))
          }
          onClick={() => void submit()}
        >
          {busy ? "Awaiting signature..." : `Withdraw ${activeSymbol}`}
        </Button>
      </div>
    </div>
  );
}
