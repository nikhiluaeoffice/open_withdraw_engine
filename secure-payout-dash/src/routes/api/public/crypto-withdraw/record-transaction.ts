import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
  "Content-Type": "application/json",
};

const addressSchema = z
  .string()
  .trim()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM address");

const recordSchema = z.object({
  txHash: z
    .string()
    .trim()
    .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash"),
  senderAddress: addressSchema,
  recipientAddress: z.string().trim().min(1).max(200),
  amount: z.coerce.number().nonnegative().finite(),
  tokenSymbol: z.string().trim().max(20).default("BNB"),
  tokenAddress: addressSchema.nullish(),
  chainId: z.coerce.number().int().positive(),
  txType: z.enum(["single", "batch", "approve"]).default("single"),
  status: z.enum(["pending", "success", "failed"]).default("pending"),
  errorMessage: z.string().trim().max(500).nullish(),
});

const patchSchema = z.object({
  txHash: z
    .string()
    .trim()
    .regex(/^0x[a-fA-F0-9]{64}$/),
  status: z.enum(["pending", "success", "failed"]),
  errorMessage: z.string().trim().max(500).nullish(),
});

async function getClient() {
  const { createClient } = await import("@supabase/supabase-js");
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(process.env["SUPABASE_URL"]!, key, {
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
}

export const Route = createFileRoute("/api/public/crypto-withdraw/record-transaction")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),

      POST: async ({ request }) => {
        try {
          const parsed = recordSchema.safeParse(await request.json());
          if (!parsed.success) {
            return new Response(
              JSON.stringify({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }),
              { status: 400, headers: CORS },
            );
          }
          const p = parsed.data;
          const supabase = await getClient();
          const { data, error } = await supabase
            .from("withdrawal_transactions")
            .upsert(
              {
                tx_hash: p.txHash,
                sender_address: p.senderAddress.toLowerCase(),
                recipient_address: p.recipientAddress,
                amount: p.amount,
                token_symbol: p.tokenSymbol,
                token_address: p.tokenAddress ?? null,
                chain_id: p.chainId,
                tx_type: p.txType,
                status: p.status,
                error_message: p.errorMessage ?? null,
              },
              { onConflict: "tx_hash" },
            )
            .select("id, tx_hash, status")
            .single();

          if (error) {
            return new Response(JSON.stringify({ error: error.message }), {
              status: 500,
              headers: CORS,
            });
          }
          return new Response(JSON.stringify({ success: true, record: data }), {
            status: 201,
            headers: CORS,
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: (err as Error).message }), {
            status: 500,
            headers: CORS,
          });
        }
      },

      PATCH: async ({ request }) => {
        try {
          const parsed = patchSchema.safeParse(await request.json());
          if (!parsed.success) {
            return new Response(JSON.stringify({ error: "Invalid payload" }), {
              status: 400,
              headers: CORS,
            });
          }
          const supabase = await getClient();
          const { error } = await supabase
            .from("withdrawal_transactions")
            .update({
              status: parsed.data.status,
              error_message: parsed.data.errorMessage ?? null,
            })
            .eq("tx_hash", parsed.data.txHash);

          if (error) {
            return new Response(JSON.stringify({ error: error.message }), {
              status: 500,
              headers: CORS,
            });
          }
          return new Response(JSON.stringify({ success: true }), { status: 200, headers: CORS });
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
