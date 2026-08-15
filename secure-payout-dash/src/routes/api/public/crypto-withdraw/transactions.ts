import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

export const Route = createFileRoute("/api/public/crypto-withdraw/transactions")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),

      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const sender = (url.searchParams.get("sender") ?? "").trim().toLowerCase();
          if (!/^0x[a-f0-9]{40}$/.test(sender)) {
            return new Response(JSON.stringify({ error: "Invalid sender address" }), {
              status: 400,
              headers: CORS,
            });
          }

          const { createClient } = await import("@supabase/supabase-js");
          const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
          const supabase = createClient(process.env["SUPABASE_URL"]!, key, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: {
              fetch: (input: RequestInfo | URL, init?: RequestInit) => {
                const headers = new Headers(init?.headers);
                if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
                  headers.delete("Authorization");
                }
                headers.set("apikey", key);
                return fetch(input, { ...init, headers });
              },
            },
          });

          const { data, error } = await supabase
            .from("withdrawal_transactions")
            .select(
              "id, tx_hash, sender_address, recipient_address, amount, token_symbol, token_address, chain_id, tx_type, status, created_at",
            )
            .eq("sender_address", sender)
            .order("created_at", { ascending: false })
            .limit(100);

          if (error) {
            return new Response(JSON.stringify({ error: error.message }), {
              status: 500,
              headers: CORS,
            });
          }
          return new Response(JSON.stringify({ transactions: data ?? [] }), {
            status: 200,
            headers: CORS,
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: (err as Error).message }), {
            status: 500,
            headers: CORS,
          });
        }
      },
    },
  },
});
