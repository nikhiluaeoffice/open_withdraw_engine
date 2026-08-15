import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Code,
  BookOpen,
  Key,
  ShieldCheck,
  Terminal,
  Copy,
  Check,
  Zap,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Server,
  Layers,
} from "lucide-react";
import { WalletProvider } from "@/lib/web3/wallet";
import { WalletHeader } from "@/components/web3/WalletHeader";
import { DeveloperKeysSection } from "@/components/web3/DeveloperKeysSection";
import { toast } from "sonner";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Developer SDK & API Documentation — ChainPayout" },
      {
        name: "description",
        content:
          "Integrate non-custodial crypto withdrawals into your backend applications using the ChainPayout TypeScript SDK, REST APIs, or Python client.",
      },
    ],
  }),
  component: DocsPage,
});

function DocsContent() {
  const [activeSection, setActiveSection] = useState<
    "quickstart" | "keys" | "sdk-ref" | "rest-ref" | "security"
  >("quickstart");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copySnippet = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast.success("Code snippet copied to clipboard");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:10010";
  const SWAGGER_DOCS_URL = `${API_BASE}/api/docs`;

  return (
    <div className="min-h-screen pb-16">
      <WalletHeader />

      <main className="mx-auto max-w-7xl px-3.5 sm:px-6 py-6 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="size-3" /> Dashboard Console
          </Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground font-medium">Developer SDK & API Docs</span>
        </div>

        {/* Hero Section */}
        <section className="glass-card relative overflow-hidden p-6 sm:p-10 border-primary/20 bg-gradient-to-br from-background via-secondary/20 to-primary/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Code className="size-3.5" /> Official TypeScript SDK v1.0.0
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">
                Developer <span className="text-gradient">SDK & REST Docs</span>
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Connect your serverless functions, NestJS backends, or custom web apps to the ChainPayout non-custodial engine. Perform automated BNB and BEP20 USDT token transfers securely with key authentication.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 font-mono text-xs bg-slate-900 border border-glass-border rounded-lg px-3 py-2 text-emerald-400">
                  <Terminal className="size-3.5 text-muted-foreground" />
                  <span>npm install @reusable-withdraw/sdk</span>
                  <button
                    onClick={() => copySnippet("npm install @reusable-withdraw/sdk", "install")}
                    className="ml-2 text-slate-400 hover:text-white transition-colors"
                  >
                    {copiedCode === "install" ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                  </button>
                </div>
                <a
                  href={SWAGGER_DOCS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all"
                >
                  <BookOpen className="size-3.5" /> Swagger REST UI
                  <ExternalLink className="size-3 opacity-75" />
                </a>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div className="glass-card p-4 text-center border-glass-border">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">Supported Networks</p>
                <p className="text-sm font-bold text-foreground mt-1">BSC Testnet / Mainnet</p>
              </div>
              <div className="glass-card p-4 text-center border-glass-border">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">Supported Tokens</p>
                <p className="text-sm font-bold text-foreground mt-1">BNB & BEP20 USDT</p>
              </div>
              <div className="glass-card p-4 text-center border-glass-border">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">Custody Risk</p>
                <p className="text-sm font-bold text-success mt-1">0% Non-Custodial</p>
              </div>
              <div className="glass-card p-4 text-center border-glass-border">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">Auth Standard</p>
                <p className="text-sm font-bold text-primary mt-1">x-api-key / Secret</p>
              </div>
            </div>
          </div>
        </section>

        {/* Documentation Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Nav */}
          <aside className="space-y-1 lg:col-span-1">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Documentation Index
            </p>
            {[
              { id: "quickstart", label: "⚡ Quickstart & Setup", icon: Zap },
              { id: "keys", label: "🔑 API Secret Keys", icon: Key },
              { id: "sdk-ref", label: "📦 SDK Class Reference", icon: Code },
              { id: "rest-ref", label: "🌐 REST API Endpoints", icon: Server },
              { id: "security", label: "🛡️ Non-Custodial Security", icon: ShieldCheck },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as any)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                  activeSection === item.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                <item.icon className="size-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            ))}
          </aside>

          {/* Main Docs Section */}
          <div className="lg:col-span-3 space-y-8">
            {activeSection === "quickstart" && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Quickstart Guide</h2>
                  <p className="text-sm text-muted-foreground">
                    Follow these 3 simple steps to integrate automated crypto withdrawals in your application.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Step 1 */}
                  <div className="glass-card p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        1
                      </span>
                      <h3 className="text-sm font-bold">Install SDK Package</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Install the lightweight SDK in your Node.js or TypeScript backend project.
                    </p>
                    <div className="relative rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-200">
                      <code>npm install @reusable-withdraw/sdk</code>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="glass-card p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        2
                      </span>
                      <h3 className="text-sm font-bold">Generate API Secret Key</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Navigate to the <strong>API Secret Keys</strong> tab to generate your <code>sk_test_...</code> key for testing or production.
                    </p>
                    <button
                      onClick={() => setActiveSection("keys")}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <Key className="size-3.5" /> Manage Secret Keys Now &rarr;
                    </button>
                  </div>

                  {/* Step 3 */}
                  <div className="glass-card p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        3
                      </span>
                      <h3 className="text-sm font-bold">Instantiate Client & Transfer</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Initialize <code>WithdrawClient</code> and trigger token transfers programmatically.
                    </p>
                    <div className="relative rounded-lg bg-slate-950 p-4 font-mono text-xs text-slate-200 overflow-x-auto">
                      <button
                        onClick={() =>
                          copySnippet(
                            `import { WithdrawClient } from '@reusable-withdraw/sdk';\n\nconst withdraw = new WithdrawClient({\n  secretKey: 'sk_test_your_secret_key',\n  environment: 'testnet',\n  baseUrl: '${API_BASE}'\n});\n\n// Trigger Token Payout\nconst result = await withdraw.transferToken({\n  receiver: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',\n  tokenAddress: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',\n  amount: 25.0\n});\n\nconsole.log('Tx Hash:', result.data.transactionHash);`,
                            "qs-snippet"
                          )
                        }
                        className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded bg-slate-800"
                      >
                        {copiedCode === "qs-snippet" ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                      </button>
                      <pre>{`import { WithdrawClient } from '@reusable-withdraw/sdk';

const withdraw = new WithdrawClient({
  secretKey: 'sk_test_your_secret_key',
  environment: 'testnet',
  baseUrl: '${API_BASE}'
});

// Trigger Token Payout
const result = await withdraw.transferToken({
  receiver: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  tokenAddress: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
  amount: 25.0
});

console.log('Tx Hash:', result.data.transactionHash);`}</pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "keys" && (
              <div className="space-y-4">
                <DeveloperKeysSection />
              </div>
            )}

            {activeSection === "sdk-ref" && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">SDK Class Reference</h2>
                  <p className="text-sm text-muted-foreground">
                    Detailed documentation for the <code>WithdrawClient</code> TypeScript class methods and configurations.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Method 1 */}
                  <div className="glass-card p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-primary">
                        transferNative(options: NativeTransferOptions)
                      </span>
                      <span className="text-[10px] bg-secondary px-2 py-0.5 rounded font-mono">
                        POST /api/v1/withdrawals/native
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Transfers native BNB coins to a designated wallet address on BNB Smart Chain.
                    </p>
                    <div className="rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-200">
                      <pre>{`await withdraw.transferNative({
  receiver: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  amount: 0.05 // BNB amount
});`}</pre>
                    </div>
                  </div>

                  {/* Method 2 */}
                  <div className="glass-card p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-primary">
                        transferToken(options: TokenTransferOptions)
                      </span>
                      <span className="text-[10px] bg-secondary px-2 py-0.5 rounded font-mono">
                        POST /api/v1/withdrawals/token
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Transfers BEP20 tokens (such as USDT) to a recipient address.
                    </p>
                    <div className="rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-200">
                      <pre>{`await withdraw.transferToken({
  receiver: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  tokenAddress: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd", // USDT contract address
  amount: 100.0,
  tokenDecimals: 18 // Default 18
});`}</pre>
                    </div>
                  </div>

                  {/* Method 3 */}
                  <div className="glass-card p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-primary">
                        getTransactions(sender?: string)
                      </span>
                      <span className="text-[10px] bg-secondary px-2 py-0.5 rounded font-mono">
                        GET /api/v1/transactions
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Retrieves transaction ledger records associated with your merchant API key.
                    </p>
                  </div>

                  {/* Method 4 */}
                  <div className="glass-card p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-primary">
                        getStats(sender?: string)
                      </span>
                      <span className="text-[10px] bg-secondary px-2 py-0.5 rounded font-mono">
                        GET /api/v1/stats
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Fetches aggregated metrics including total volume, succeeded counts, pending, and failed transactions.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "rest-ref" && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">REST API Endpoints</h2>
                  <p className="text-sm text-muted-foreground">
                    Raw HTTP REST API documentation for cURL, Python, Go, PHP, or language-agnostic integrations.
                  </p>
                </div>

                <div className="glass-card p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Layers className="size-4 text-emerald-400" />
                    <h3 className="text-sm font-bold">Required Request Headers</h3>
                  </div>
                  <div className="rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-200">
                    <p><span className="text-sky-400">Content-Type:</span> application/json</p>
                    <p><span className="text-sky-400">x-api-key:</span> sk_test_your_secret_key</p>
                    <p><span className="text-sky-400">Authorization:</span> Bearer sk_test_your_secret_key</p>
                  </div>

                  <h3 className="text-sm font-bold pt-2">cURL Transfer Example</h3>
                  <div className="relative rounded-lg bg-slate-950 p-4 font-mono text-xs text-slate-200 overflow-x-auto">
                    <pre>{`curl -X POST ${API_BASE}/api/v1/withdrawals/token \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: sk_test_your_secret_key" \\
  -d '{
    "receiver": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "tokenAddress": "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd",
    "amount": 50.0
  }'`}</pre>
                  </div>

                  <div className="pt-2">
                    <a
                      href={SWAGGER_DOCS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-black hover:bg-emerald-400 transition-all"
                    >
                      <BookOpen className="size-4" /> Open Full Interactive Swagger API Docs
                    </a>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "security" && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Non-Custodial Architecture</h2>
                  <p className="text-sm text-muted-foreground">
                    How ChainPayout guarantees security without holding your private keys.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="glass-card p-5 space-y-2">
                    <ShieldCheck className="size-6 text-success" />
                    <h3 className="text-sm font-bold">Client-Side Wallet Signing</h3>
                    <p className="text-xs text-muted-foreground">
                      Transactions in the console dashboard are generated and signed locally inside your browser extension (MetaMask). Private keys never leave your device.
                    </p>
                  </div>

                  <div className="glass-card p-5 space-y-2">
                    <Key className="size-6 text-primary" />
                    <h3 className="text-sm font-bold">API Secret Key Isolation</h3>
                    <p className="text-xs text-muted-foreground">
                      Developer API Secret Keys use cryptographically secure random bytes hashed with SHA-256 before storage in the database.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export function DocsPage() {
  return (
    <WalletProvider>
      <DocsContent />
    </WalletProvider>
  );
}
