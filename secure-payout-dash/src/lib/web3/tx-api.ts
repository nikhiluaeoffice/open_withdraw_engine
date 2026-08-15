import { toast } from "sonner";

const BACKEND_BASE = (import.meta.env["VITE_BACKEND_URL"] as string) || "http://localhost:10010";

export const RECORD_ENDPOINT = `${BACKEND_BASE}/crypto-withdraw/record-transaction`;
export const HISTORY_ENDPOINT = `${BACKEND_BASE}/crypto-withdraw/transactions`;

export type TxRecord = {
  id: string;
  tx_hash: string;
  sender_address: string;
  recipient_address: string;
  amount: number;
  token_symbol: string;
  token_address: string | null;
  chain_id: number;
  tx_type: string;
  status: "pending" | "success" | "failed";
  created_at: string;
};

export type RecordPayload = {
  txHash: string;
  senderAddress: string;
  recipientAddress: string;
  amount: number;
  tokenSymbol: string;
  tokenAddress?: string | null;
  chainId: number;
  txType?: "single" | "batch" | "approve";
  status?: "pending" | "success" | "failed";
  errorMessage?: string | null;
};

export async function recordTransaction(payload: RecordPayload) {
  try {
    const res = await fetch(RECORD_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await res.json()) as { success?: boolean; error?: string };
    if (!res.ok || json.success === false) {
      toast.error("Could not save record to MongoDB", { description: json.error });
      return false;
    }
    toast.success("MongoDB record saved", { description: "Transaction stored in the ledger." });
    return true;
  } catch (err) {
    toast.error("Failed to connect to MongoDB backend API", { description: (err as Error).message });
    return false;
  }
}

export async function updateTransactionStatus(
  txHash: string,
  status: "pending" | "success" | "failed",
  errorMessage?: string,
) {
  try {
    await fetch(RECORD_ENDPOINT, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txHash, status, errorMessage: errorMessage ?? null }),
    });
  } catch (err) {
    console.error("Failed to update status in MongoDB backend:", err);
  }
}

export async function fetchTransactions(sender: string): Promise<TxRecord[]> {
  try {
    const res = await fetch(`${HISTORY_ENDPOINT}?sender=${encodeURIComponent(sender)}`);
    if (!res.ok) return [];
    const json = (await res.json()) as { success?: boolean; transactions?: TxRecord[] };
    return json.transactions ?? [];
  } catch (err) {
    console.error("Failed to fetch transactions from MongoDB backend:", err);
    return [];
  }
}

