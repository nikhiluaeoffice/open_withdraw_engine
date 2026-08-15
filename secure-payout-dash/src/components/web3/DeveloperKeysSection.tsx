import React, { useState, useEffect } from "react";
import { Key, Copy, Check, Plus, Trash2, Code, ShieldCheck, Terminal, ExternalLink, BookOpen, FileText } from "lucide-react";
import { toast } from "sonner";

interface ApiKeyItem {
  id: string;
  keyId: string;
  name: string;
  environment: "testnet" | "mainnet";
  permissions: string[];
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:10010";
const SWAGGER_DOCS_URL = `${API_BASE}/api/docs`;

export function DeveloperKeysSection() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [environment, setEnvironment] = useState<"testnet" | "mainnet">("testnet");
  const [newCreatedKey, setNewCreatedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"sdk" | "curl" | "python">("sdk");

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/keys`);
      const data = await res.json();
      if (data.success) {
        setKeys(data.keys || []);
      }
    } catch (err) {
      console.error("Failed to load API keys:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) {
      toast.error("Please enter a key name.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/keys/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: keyName,
          environment,
          merchantEmail: "developer@platform.local",
        }),
      });

      const data = await res.json();
      if (data.success && data.apiKey) {
        setNewCreatedKey(data.apiKey.secretKey);
        setKeyName("");
        toast.success("API Secret Key generated!");
        fetchKeys();
      } else {
        toast.error(data.error || "Failed to generate key.");
      }
    } catch (err: any) {
      toast.error("Error connecting to server: " + err.message);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this API Secret Key?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/v1/keys/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("API key revoked.");
        fetchKeys();
      } else {
        toast.error(data.error || "Failed to revoke key.");
      }
    } catch (err: any) {
      toast.error("Error revoking key: " + err.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const sampleSecretKey = newCreatedKey || (keys[0] ? `sk_${keys[0].environment}_...` : "sk_test_51NxSampleSecretKey");

  const codeSnippets = {
    sdk: `import { WithdrawClient } from '@reusable-withdraw/sdk';

const withdraw = new WithdrawClient({
  secretKey: '${sampleSecretKey}',
  environment: '${environment}',
  baseUrl: '${API_BASE}'
});

// Transfer Token
const response = await withdraw.transferToken({
  receiver: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  tokenAddress: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
  amount: 10.5
});

console.log('Transaction Hash:', response.transactionHash);`,
    curl: `curl -X POST ${API_BASE}/api/v1/withdrawals/token \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${sampleSecretKey}" \\
  -d '{
    "receiver": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "tokenAddress": "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd",
    "amount": 10.5
  }'`,
    python: `import requests

url = "${API_BASE}/api/v1/withdrawals/token"
headers = {
    "x-api-key": "${sampleSecretKey}",
    "Content-Type": "application/json"
}
payload = {
    "receiver": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "tokenAddress": "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd",
    "amount": 10.5
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
  };

  return (
    <div id="developer-sdk-settings" className="glass-card space-y-6 p-5 sm:p-8 scroll-mt-24 transition-all duration-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Key className="size-4" /> Developer API & Client SDK Platform
          </div>
          <h3 className="text-xl font-semibold sm:text-2xl">Developer API Secret Keys</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Generate Secret Keys to integrate crypto withdrawals directly into your backend code using our SDK or REST API.
          </p>
        </div>
        <a
          href={SWAGGER_DOCS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500 transition-all shadow-sm shrink-0"
        >
          <BookOpen className="size-4 text-emerald-400" />
          <span>Interactive Swagger UI Docs</span>
          <ExternalLink className="size-3.5 opacity-75" />
        </a>
      </div>

      {newCreatedKey && (
        <div className="rounded-xl border border-warning/50 bg-warning/10 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-warning uppercase tracking-wider">
              ⚠️ Save your API Secret Key now!
            </span>
            <button
              onClick={() => copyToClipboard(newCreatedKey)}
              className="inline-flex items-center gap-1 text-xs font-medium text-warning hover:underline"
            >
              {copiedKey ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copiedKey ? "Copied" : "Copy Secret Key"}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            This secret key will <strong>never be shown again</strong>. Keep it secret and do not expose it in client-side applications.
          </p>
          <div className="font-mono text-xs bg-background/80 p-2.5 rounded border border-glass-border break-all selection:bg-primary">
            {newCreatedKey}
          </div>
        </div>
      )}

      {/* Form to generate new key */}
      <form onSubmit={handleGenerateKey} className="grid gap-3 sm:grid-cols-3">
        <input
          type="text"
          placeholder="Key Name (e.g. Production Backend)"
          value={keyName}
          onChange={(e) => setKeyName(e.target.value)}
          className="rounded-lg border border-glass-border bg-secondary/50 px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <select
          value={environment}
          onChange={(e) => setEnvironment(e.target.value as "testnet" | "mainnet")}
          className="rounded-lg border border-glass-border bg-secondary/50 px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="testnet">Testnet (ChainId: 97)</option>
          <option value="mainnet">Mainnet (ChainId: 56)</option>
        </select>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="size-4" /> Generate Secret Key
        </button>
      </form>

      {/* Active API Keys Table */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Active API Secret Keys</h4>
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading keys...</p>
        ) : keys.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No API keys created yet. Generate one above!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-glass-border text-muted-foreground">
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3">Key ID</th>
                  <th className="py-2 px-3">Environment</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Created</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id} className="border-b border-glass-border/40 hover:bg-secondary/20">
                    <td className="py-2.5 px-3 font-medium text-foreground">{k.name}</td>
                    <td className="py-2.5 px-3 font-mono text-muted-foreground">{k.keyId}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          k.environment === "mainnet" ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"
                        }`}
                      >
                        {k.environment}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-medium ${k.isActive ? "text-success" : "text-muted-foreground"}`}>
                        ● {k.isActive ? "Active" : "Revoked"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {new Date(k.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {k.isActive && (
                        <button
                          onClick={() => handleRevokeKey(k.id)}
                          className="text-destructive hover:text-destructive/80 p-1 rounded hover:bg-destructive/10 transition-colors"
                          title="Revoke Key"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Code Integration Preview */}
      <div className="space-y-3 pt-4 border-t border-glass-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="size-4 text-primary" />
            <h4 className="text-sm font-semibold">Integration Code Quickstart</h4>
          </div>
          <div className="flex gap-1 bg-secondary/50 p-1 rounded-lg border border-glass-border text-xs">
            {(["sdk", "curl", "python"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  selectedTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "sdk" ? "TypeScript SDK" : tab.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="relative rounded-xl border border-glass-border bg-slate-950 p-4 font-mono text-xs text-slate-200 overflow-x-auto">
          <button
            onClick={() => copyToClipboard(codeSnippets[selectedTab])}
            className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded bg-slate-800/80 hover:bg-slate-800 transition-colors"
          >
            {copiedKey ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
          </button>
          <pre>{codeSnippets[selectedTab]}</pre>
        </div>
      </div>
    </div>
  );
}
