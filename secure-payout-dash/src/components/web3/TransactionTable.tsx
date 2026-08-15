import { ExternalLink, History, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "./StatusBadge";
import { useWallet } from "@/lib/web3/wallet";
import { explorerTx, truncate } from "@/lib/web3/constants";
import { fetchTransactions } from "@/lib/web3/tx-api";

export function TransactionTable() {
  const { address } = useWallet();

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["withdrawals", address],
    queryFn: () => fetchTransactions(address!),
    enabled: Boolean(address),
    refetchInterval: 15000,
  });

  const rows = data ?? [];

  return (
    <section className="glass-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-glass-border px-4 sm:px-6 py-4">
        <div className="flex items-center gap-2">
          <History className="size-4 text-primary" />
          <h2 className="text-sm sm:text-base font-semibold">Withdrawal Ledger</h2>
        </div>
        <Button variant="glass" size="sm" onClick={() => void refetch()} disabled={!address}>
          <RefreshCw className={isFetching ? "size-3.5 animate-spin" : "size-3.5"} />
          <span className="hidden xs:inline">Refresh</span>
        </Button>
      </div>

      {!address ? (
        <p className="px-6 py-12 text-center text-xs sm:text-sm text-muted-foreground">
          Connect a wallet to load its transaction history.
        </p>
      ) : rows.length === 0 ? (
        <p className="px-6 py-12 text-center text-xs sm:text-sm text-muted-foreground">
          No withdrawals recorded for {truncate(address)} yet.
        </p>
      ) : (
        <>
          {/* Mobile Stacked Card View (screens < 640px) */}
          <div className="block sm:hidden divide-y divide-glass-border">
            {rows.map((row) => (
              <div key={row.id} className="p-4 space-y-2.5 bg-secondary/10">
                <div className="flex items-center justify-between gap-2">
                  <a
                    href={explorerTx(row.chain_id, row.tx_hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-xs text-accent hover:underline"
                  >
                    {truncate(row.tx_hash, 8, 6)}
                    <ExternalLink className="size-3" />
                  </a>
                  <StatusBadge status={row.status} />
                </div>

                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-muted-foreground">
                    To: {row.recipient_address.startsWith("0x") ? truncate(row.recipient_address, 6, 4) : row.recipient_address}
                  </span>
                  <span className="font-semibold text-foreground">
                    {Number(row.amount)} <span className="text-muted-foreground">{row.token_symbol}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-glass-border/40">
                  <span className="capitalize">Type: {row.tx_type}</span>
                  <span>{new Date(row.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop & Tablet Table View (screens >= 640px) */}
          <div className="hidden sm:block overflow-x-auto touch-pan-x">
            <Table>
              <TableHeader>
                <TableRow className="border-glass-border hover:bg-transparent">
                  <TableHead>Tx Hash</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} className="border-glass-border">
                    <TableCell>
                      <a
                        href={explorerTx(row.chain_id, row.tx_hash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-mono text-xs text-accent hover:underline"
                      >
                        {truncate(row.tx_hash, 10, 6)}
                        <ExternalLink className="size-3" />
                      </a>
                    </TableCell>
                    <TableCell className="text-xs capitalize text-muted-foreground">
                      {row.tx_type}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {row.recipient_address.startsWith("0x")
                        ? truncate(row.recipient_address)
                        : row.recipient_address}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {Number(row.amount)}{" "}
                      <span className="text-muted-foreground">{row.token_symbol}</span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {new Date(row.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </section>
  );
}
