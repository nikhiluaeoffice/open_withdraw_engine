import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Zap, KeyRound } from "lucide-react";
import { WalletProvider, useWallet } from "@/lib/web3/wallet";
import { WalletHeader } from "@/components/web3/WalletHeader";
import { SingleWithdrawForm } from "@/components/web3/SingleWithdrawForm";
import { BatchWithdrawForm } from "@/components/web3/BatchWithdrawForm";
import { TransactionTable } from "@/components/web3/TransactionTable";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ChainPayout — Non-Custodial BNB & USDT Withdrawal Dashboard" },
      {
        name: "description",
        content:
          "Sign BNB and USDT withdrawals directly in MetaMask, run batch payouts on BNB Smart Chain, and keep an auditable ledger of every transaction hash.",
      },
      { property: "og:title", content: "ChainPayout — Non-Custodial Withdrawal Dashboard" },
      {
        property: "og:description",
        content:
          "Client-side signing with MetaMask, batch payouts on BNB Smart Chain, and a live withdrawal ledger.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function Notice() {
  const { hasProvider, address, chainId, isSupportedChain } = useWallet();

  if (!hasProvider) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        No injected wallet found. Install MetaMask to sign withdrawals.
      </div>
    );
  }
  if (address && !isSupportedChain) {
    return (
      <div className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
        Chain {chainId} is not supported. Switch to BNB Smart Chain Testnet or Mainnet.
      </div>
    );
  }
  return null;
}

function Dashboard() {
  const queryClient = useQueryClient();
  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["withdrawals"] });

  return (
    <div className="min-h-screen">
      <WalletHeader />

      <main className="mx-auto max-w-7xl space-y-6 px-3.5 sm:px-6 py-4 sm:py-8">
        <section className="glass-card relative overflow-hidden p-5 sm:p-8">
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-glass-border bg-secondary/40 px-3 py-1 text-[10px] sm:text-[11px] uppercase tracking-widest text-muted-foreground">
            <span className="status-dot text-success" /> Zero private-key backend
          </p>
          <h2 className="max-w-2xl text-xl font-semibold leading-tight sm:text-3xl lg:text-4xl">
            Withdrawals signed in your <span className="text-gradient">own wallet</span>, recorded
            in your ledger.
          </h2>
          <p className="mt-2 sm:mt-3 max-w-xl text-xs sm:text-sm text-muted-foreground">
            Every transfer is broadcast straight from MetaMask. The backend only ever stores the
            resulting transaction hash and its on-chain status.
          </p>
          <div className="mt-5 sm:mt-6 grid gap-2.5 sm:gap-3 grid-cols-1 sm:grid-cols-3">
            {[
              { icon: KeyRound, title: "No key custody", body: "Keys never leave your browser." },
              { icon: Zap, title: "Batch disperse", body: "One tx, many recipients." },
              { icon: ShieldCheck, title: "Auditable", body: "Hash-level BscScan trail." },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-glass-border bg-secondary/30 p-3.5 sm:p-4"
              >
                <item.icon className="mb-1.5 sm:mb-2 size-4 text-primary" />
                <p className="text-xs sm:text-sm font-medium">{item.title}</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <Notice />

        <div className="grid gap-6 lg:grid-cols-2">
          <SingleWithdrawForm onRecorded={invalidate} />
          <BatchWithdrawForm onRecorded={invalidate} />
        </div>

        <TransactionTable />
      </main>
    </div>
  );
}

function DashboardPage() {
  return (
    <WalletProvider>
      <Dashboard />
    </WalletProvider>
  );
}
