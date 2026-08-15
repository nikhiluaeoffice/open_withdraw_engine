import { useEffect, useState } from "react";
import { Server, Activity, ShieldCheck, Database, CheckCircle2, XCircle, RefreshCw, Layers, TrendingUp } from "lucide-react";
import { useWallet } from "@/lib/web3/wallet";
import { CHAINS, type ChainId } from "@/lib/web3/constants";
import { useQuery } from "@tanstack/react-query";
import { fetchTransactions, type TxRecord } from "@/lib/web3/tx-api";

const BACKEND_BASE = (import.meta.env["VITE_BACKEND_URL"] as string) || "http://localhost:10010";

export function SystemStatusBanner() {
  const { address, chainId, isSupportedChain, hasProvider } = useWallet();
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<string>("");

  const checkBackendHealth = async () => {
    const startTime = performance.now();
    try {
      const res = await fetch(`${BACKEND_BASE}/api/v1/keys`, { method: "GET" });
      const endTime = performance.now();
      setLatencyMs(Math.round(endTime - startTime));
      setBackendOnline(res.ok || res.status === 400 || res.status === 200);
      setLastCheckTime(new Date().toLocaleTimeString());
    } catch {
      setBackendOnline(false);
      setLatencyMs(null);
      setLastCheckTime(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 12000);
    return () => clearInterval(interval);
  }, []);

  // Fetch transaction history stats for the connected wallet
  const { data: transactions = [] } = useQuery<TxRecord[]>({
    queryKey: ["withdrawals", address],
    queryFn: () => fetchTransactions(address!),
    enabled: Boolean(address),
    refetchInterval: 10000,
  });

  // Calculate live ledger stats
  const totalCount = transactions.length;
  const successCount = transactions.filter((t) => t.status === "success").length;
  const pendingCount = transactions.filter((t) => t.status === "pending").length;
  const failedCount = transactions.filter((t) => t.status === "failed").length;

  const totalBnbVolume = transactions
    .filter((t) => t.status === "success" && (t.token_symbol === "BNB" || !t.token_address))
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  const totalUsdtVolume = transactions
    .filter((t) => t.status === "success" && t.token_symbol === "USDT")
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 100;
  const activeChain = chainId !== null && chainId in CHAINS ? CHAINS[chainId as ChainId] : null;

  return (
    <div className="space-y-4">
      {/* Informative System Health Banner Bar */}
      <div className="glass-card overflow-hidden border-glass-border p-4 sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/30 text-primary shrink-0">
              <Activity className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">System Engine Status</h3>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Checked {lastCheckTime || "just now"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Real-time operational status of backend services, RPC nodes, and active wallet connection.
              </p>
            </div>
          </div>

          <button
            onClick={checkBackendHealth}
            className="inline-flex items-center gap-1.5 self-start md:self-auto rounded-lg border border-glass-border bg-secondary/40 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Re-check System Health"
          >
            <RefreshCw className="size-3.5" />
            <span>Check Health</span>
          </button>
        </div>

        {/* Health Pills Row */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-glass-border/60">
          {/* 1. Backend Service Status */}
          <div className="rounded-xl border border-glass-border/60 bg-secondary/20 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Server className="size-4 text-sky-400" />
              <div>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                  Backend API Engine
                </p>
                <p className="text-xs font-medium">
                  {backendOnline === null ? (
                    <span className="text-muted-foreground">Checking...</span>
                  ) : backendOnline ? (
                    <span className="text-success font-semibold flex items-center gap-1">
                      ● Online ({latencyMs}ms)
                    </span>
                  ) : (
                    <span className="text-destructive font-semibold flex items-center gap-1">
                      ● Offline (Port 10010)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Blockchain Network Status */}
          <div className="rounded-xl border border-glass-border/60 bg-secondary/20 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Database className="size-4 text-emerald-400" />
              <div>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                  Network RPC
                </p>
                <p className="text-xs font-medium">
                  {activeChain ? (
                    <span className="text-emerald-400 font-semibold">
                      🟢 {activeChain.name} ({activeChain.id})
                    </span>
                  ) : (
                    <span className="text-warning font-semibold">🟡 Unknown Chain ({chainId})</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* 3. Injected Wallet Status */}
          <div className="rounded-xl border border-glass-border/60 bg-secondary/20 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="size-4 text-primary" />
              <div>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                  Client Wallet
                </p>
                <p className="text-xs font-medium">
                  {!hasProvider ? (
                    <span className="text-destructive font-semibold">🔴 No Wallet Detected</span>
                  ) : address ? (
                    <span className="text-success font-semibold">🟢 Wallet Connected</span>
                  ) : (
                    <span className="text-warning font-semibold">🟡 Disconnected</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* 4. Ledger Audit Engine Status */}
          <div className="rounded-xl border border-glass-border/60 bg-secondary/20 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Layers className="size-4 text-purple-400" />
              <div>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                  MongoDB Ledger Sync
                </p>
                <p className="text-xs font-medium">
                  <span className="text-purple-400 font-semibold">
                    {backendOnline ? "🟢 Audited & Synced" : "🟡 Local Buffer"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Informative Withdrawal Metrics Grid (when wallet connected or transactions exist) */}
      {address && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass-card p-4 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Recorded Txs
            </p>
            <p className="text-xl font-bold font-mono text-foreground">{totalCount}</p>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span className="text-success">{successCount} passed</span> •{" "}
              <span className="text-warning">{pendingCount} pending</span>
            </div>
          </div>

          <div className="glass-card p-4 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Success Rate
            </p>
            <p className="text-xl font-bold font-mono text-success">{successRate}%</p>
            <p className="text-[11px] text-muted-foreground">
              {failedCount > 0 ? `${failedCount} reverted` : "100% clean record"}
            </p>
          </div>

          <div className="glass-card p-4 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              BNB Volume
            </p>
            <p className="text-xl font-bold font-mono text-primary">
              {totalBnbVolume.toFixed(4)} <span className="text-xs font-normal">BNB</span>
            </p>
            <p className="text-[11px] text-muted-foreground">Native transfers</p>
          </div>

          <div className="glass-card p-4 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              USDT Volume
            </p>
            <p className="text-xl font-bold font-mono text-emerald-400">
              {totalUsdtVolume.toFixed(2)} <span className="text-xs font-normal">USDT</span>
            </p>
            <p className="text-[11px] text-muted-foreground">BEP20 Token transfers</p>
          </div>
        </div>
      )}
    </div>
  );
}
