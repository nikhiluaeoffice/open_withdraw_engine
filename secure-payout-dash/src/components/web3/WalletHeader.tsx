import { Copy, LogOut, Wallet, Globe, Code, FileText, ExternalLink, LayoutDashboard } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/lib/web3/wallet";
import { CHAINS, truncate, type ChainId } from "@/lib/web3/constants";

const SWAGGER_DOCS_URL = (import.meta as any).env?.VITE_API_BASE_URL
  ? `${(import.meta as any).env.VITE_API_BASE_URL}/api/docs`
  : "http://localhost:10010/api/docs";

function BalancePill({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-xl border border-glass-border bg-glass px-2.5 sm:px-4 py-1.5 sm:py-2 backdrop-blur-md">
      <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-mono text-xs sm:text-sm font-medium text-foreground">
        {value} <span className="text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}

export function WalletHeader() {
  const {
    address,
    chainId,
    bnbBalance,
    usdtBalance,
    connect,
    disconnect,
    connecting,
    switchChain,
  } = useWallet();

  return (
    <header className="sticky top-0 z-30 border-b border-glass-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-3.5 sm:px-5 py-3 sm:py-4">
        {/* Brand Logo & Title */}
        <Link to="/" className="flex items-center gap-2.5 sm:gap-3 hover:opacity-90 transition-opacity">
          <img src="/logo.svg" alt="ChainPayout Logo" className="size-8 sm:size-10 rounded-full shadow-md transition-transform hover:scale-105" />
          <div>
            <h1 className="text-base sm:text-lg font-semibold leading-tight">
              Chain<span className="text-gradient">Payout</span>
            </h1>
            <p className="hidden xs:block text-[11px] sm:text-xs text-muted-foreground">Non-custodial withdrawal console</p>
          </div>
        </Link>

        {/* Action Controls & Network Switcher */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Navigation Links */}
          <Link
            to="/"
            activeProps={{ className: "border-primary bg-primary/20 text-primary font-bold shadow-sm" }}
            inactiveProps={{ className: "border-glass-border bg-glass text-muted-foreground hover:text-foreground hover:bg-secondary/50" }}
            className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 backdrop-blur-md text-[11px] sm:text-xs transition-all cursor-pointer"
          >
            <LayoutDashboard className="size-3.5 sm:size-4 shrink-0" />
            <span>Dashboard</span>
          </Link>

          <Link
            to="/docs"
            activeProps={{ className: "border-primary bg-primary/20 text-primary font-bold shadow-sm" }}
            inactiveProps={{ className: "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20" }}
            className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 backdrop-blur-md text-[11px] sm:text-xs font-semibold transition-all cursor-pointer active:scale-95"
            title="Open Developer SDK & API Documentation Page"
          >
            <Code className="size-3.5 sm:size-4 text-primary shrink-0" />
            <span>Developer SDK Docs</span>
          </Link>

          {/* Swagger API Docs Button */}
          <a
            href={SWAGGER_DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 backdrop-blur-md text-[11px] sm:text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Open Swagger REST API Interactive Documentation"
          >
            <FileText className="size-3.5 sm:size-4 text-emerald-400 shrink-0" />
            <span>Swagger UI</span>
            <ExternalLink className="size-3 shrink-0 opacity-75" />
          </a>

          {/* Network Switcher Select */}
          <div className="relative inline-flex items-center gap-1.5 rounded-xl border border-glass-border bg-glass px-2.5 sm:px-3 py-1.5 backdrop-blur-md">
            <Globe className="size-3.5 sm:size-4 text-accent shrink-0" />
            <select
              value={chainId && chainId in CHAINS ? chainId : 97}
              onChange={(e) => {
                const targetChain = Number(e.target.value) as ChainId;
                void switchChain(targetChain);
              }}
              className="bg-transparent text-[11px] sm:text-xs font-semibold text-foreground focus:outline-none cursor-pointer pr-1"
            >
              <option value={97} className="bg-background text-foreground">
                🟡 BSC Testnet (97)
              </option>
              <option value={56} className="bg-background text-foreground">
                🟢 BSC Mainnet (56)
              </option>
            </select>
          </div>

          {address ? (
            <div className="flex items-center gap-2 flex-wrap">
              <BalancePill label="Native" value={bnbBalance} unit="BNB" />
              <BalancePill label="Stable" value={usdtBalance} unit="USDT" />

              <div className="flex items-center gap-1 rounded-xl border border-glass-border bg-glass px-2.5 sm:px-3 py-1.5 sm:py-2 backdrop-blur-md">
                <span className="font-mono text-xs sm:text-sm">{truncate(address)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 sm:size-7"
                  onClick={() => {
                    void navigator.clipboard.writeText(address);
                    toast.success("Address copied");
                  }}
                >
                  <Copy className="size-3 sm:size-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="size-6 sm:size-7" onClick={disconnect}>
                  <LogOut className="size-3 sm:size-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="hero" size="default" className="sm:size-lg text-xs sm:text-sm" onClick={() => void connect()} disabled={connecting}>
              <Wallet className="size-3.5 sm:size-4" />
              {connecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
