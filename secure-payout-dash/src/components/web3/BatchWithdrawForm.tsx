import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Contract, isAddress, parseEther, parseUnits } from "ethers";
import { Layers, Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useWallet } from "@/lib/web3/wallet";
import {
  BATCH_ABI,
  BATCH_TRANSFER_CONTRACT,
  CHAINS,
  ERC20_ABI,
  explorerTx,
  truncate,
  type ChainId,
} from "@/lib/web3/constants";
import { recordTransaction, updateTransactionStatus } from "@/lib/web3/tx-api";
import { useTokenMetadata } from "@/lib/web3/token";
import { cn } from "@/lib/utils";

type TokenType = "NATIVE" | "TOKEN";
type Row = { address: string; amount: string; valid: boolean };

function parseRows(raw: string): Row[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [address = "", amount = ""] = line.split(/[,;\t]+/).map((p) => p.trim());
      return {
        address,
        amount,
        valid: isAddress(address) && Number(amount) > 0,
      };
    });
}

export function BatchWithdrawForm({ onRecorded }: { onRecorded: () => void }) {
  const { address, chainId, getProvider, isSupportedChain, refreshBalances } = useWallet();
  const [tokenType, setTokenType] = useState<TokenType>("NATIVE");
  const [tokenAddressInput, setTokenAddressInput] = useState("");
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const chain = chainId !== null ? CHAINS[chainId as ChainId] : undefined;

  useEffect(() => {
    if (chain?.usdt && !tokenAddressInput) {
      setTokenAddressInput(chain.usdt);
    }
  }, [chain, tokenAddressInput]);

  const tokenMeta = useTokenMetadata(tokenType === "TOKEN" ? tokenAddressInput : "");

  const activeSymbol = tokenType === "NATIVE" ? "BNB" : tokenMeta.symbol || "TOKEN";
  const activeDecimals = tokenType === "NATIVE" ? 18 : tokenMeta.decimals;

  const rows = useMemo(() => parseRows(raw), [raw]);
  const validRows = rows.filter((r) => r.valid);
  const total = validRows.reduce((sum, r) => sum + Number(r.amount), 0);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "")
        .split(/\r?\n/)
        .filter((line) => !/address/i.test(line))
        .join("\n");
      setRaw(text.trim());
      toast.success("CSV loaded", { description: `${parseRows(text).length} rows parsed` });
    };
    reader.readAsText(file);
  }

  async function submit() {
    if (!address || !chain) {
      toast.error("Connect your wallet first");
      return;
    }
    if (!validRows.length) {
      toast.error("Add at least one valid recipient row");
      return;
    }
    if (validRows.length !== rows.length) {
      toast.error("Fix invalid rows before submitting");
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
      const batch = new Contract(BATCH_TRANSFER_CONTRACT, BATCH_ABI, signer);
      const recipients = validRows.map((r) => r.address);
      const amounts = validRows.map((r) =>
        tokenType === "TOKEN" ? parseUnits(r.amount, activeDecimals) : parseEther(r.amount),
      );
      const sum = amounts.reduce((a, b) => a + b, 0n);

      if (tokenType === "TOKEN") {
        const tokenContractAddress = tokenAddressInput.trim();
        const erc20 = new Contract(tokenContractAddress, ERC20_ABI, signer);
        const allowance = (await (erc20["allowance"] as (o: string, s: string) => Promise<bigint>)(
          address,
          BATCH_TRANSFER_CONTRACT,
        )) as bigint;

        if (allowance < sum) {
          toast.info("Approval required", { description: "Confirm the ERC20 approve in MetaMask" });
          const approveTx = await (
            erc20["approve"] as (
              s: string,
              v: bigint,
            ) => Promise<{ hash: string; wait: () => Promise<unknown> }>
          )(BATCH_TRANSFER_CONTRACT, sum);
          toast.success("Approval broadcasted", { description: approveTx.hash });
          await recordTransaction({
            txHash: approveTx.hash,
            senderAddress: address,
            recipientAddress: BATCH_TRANSFER_CONTRACT,
            amount: Number(total),
            tokenSymbol: activeSymbol,
            tokenAddress: tokenContractAddress,
            chainId: chain.id,
            txType: "approve",
            status: "pending",
          });
          onRecorded();
          await approveTx.wait();
          await updateTransactionStatus(approveTx.hash, "success");
          toast.success("Allowance confirmed");
        }
      }

      toast.info("Confirm batch transfer in MetaMask");
      const tokenContractAddr = tokenAddressInput.trim();
      const batchTokenFn = batch.getFunction("batchTransferTokenFromSender") ?? batch.getFunction("batchTransferToken");

      const tx =
        tokenType === "NATIVE"
          ? await (batch.getFunction("batchTransferBNB"))(recipients, amounts, { value: sum })
          : await batchTokenFn(tokenContractAddr, recipients, amounts);

      toast.success("Batch broadcasted", { description: tx.hash });
      await recordTransaction({
        txHash: tx.hash,
        senderAddress: address,
        recipientAddress: `${validRows.length} recipients (batch)`,
        amount: total,
        tokenSymbol: activeSymbol,
        tokenAddress: tokenType === "TOKEN" ? tokenAddressInput.trim() : null,
        chainId: chain.id,
        txType: "batch",
        status: "pending",
      });
      onRecorded();

      const receipt = await tx.wait();
      const ok = receipt?.status === 1;
      await updateTransactionStatus(tx.hash, ok ? "success" : "failed");
      toast[ok ? "success" : "error"](ok ? "Batch confirmed on-chain" : "Batch reverted", {
        description: tx.hash,
        action: {
          label: "BscScan",
          onClick: () => window.open(explorerTx(chain.id, tx.hash), "_blank", "noopener"),
        },
      });
      setRaw("");
      await refreshBalances();
      onRecorded();
    } catch (error) {
      toast.error("Batch transfer failed", {
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
          <h2 className="text-base font-semibold">Batch Withdrawal</h2>
          <p className="text-xs text-muted-foreground">
            Disperser contract {truncate(BATCH_TRANSFER_CONTRACT)}
          </p>
        </div>
        <Layers className="size-4 text-accent" />
      </div>

      <div className="space-y-4">
        {/* Token Mode Selection */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTokenType("NATIVE")}
            className={cn(
              "rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
              tokenType === "NATIVE"
                ? "border-accent/60 bg-accent/10 text-accent"
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
                ? "border-accent/60 bg-accent/10 text-accent"
                : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground",
            )}
          >
            BEP20 / ERC20 Token
          </button>
        </div>

        {/* Custom Token Contract Address */}
        {tokenType === "TOKEN" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="batchTokenAddress">Token Contract Address</Label>
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
              id="batchTokenAddress"
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

        {/* Recipients input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="batch">Recipients (address, amount per line)</Label>
            <Button variant="glass" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="size-3.5" /> CSV
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv,text/plain"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
              }}
            />
          </div>
          <Textarea
            id="batch"
            rows={6}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={"0xAbC...123, 0.05\n0xDeF...456, 0.10"}
            className="font-mono text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-glass-border bg-secondary/30 px-3.5 py-2.5 text-xs">
          <span className="text-muted-foreground">
            {validRows.length} valid / {rows.length} rows parsed
          </span>
          <div className="flex items-center gap-3 font-mono">
            {address && tokenType === "TOKEN" && tokenMeta.symbol && (
              <span className="text-muted-foreground">
                Wallet Balance: <strong className="text-emerald-400 font-medium">{tokenMeta.balance} {activeSymbol}</strong>
              </span>
            )}
            <span className="text-primary font-semibold">
              Batch Total: {total ? total.toFixed(6) : "0"} {activeSymbol}
            </span>
          </div>
        </div>

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
          {busy ? "Processing batch..." : `Execute batch ${activeSymbol} payout`}
        </Button>
      </div>
    </div>
  );
}
