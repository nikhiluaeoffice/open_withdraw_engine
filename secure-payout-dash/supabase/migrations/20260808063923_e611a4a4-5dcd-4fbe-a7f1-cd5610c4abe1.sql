CREATE TABLE public.withdrawal_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tx_hash TEXT NOT NULL UNIQUE,
  sender_address TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  token_symbol TEXT NOT NULL DEFAULT 'BNB',
  token_address TEXT,
  chain_id INTEGER NOT NULL DEFAULT 97,
  tx_type TEXT NOT NULL DEFAULT 'single',
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_withdrawal_tx_sender ON public.withdrawal_transactions (lower(sender_address), created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.withdrawal_transactions TO anon;
GRANT SELECT, INSERT, UPDATE ON public.withdrawal_transactions TO authenticated;
GRANT ALL ON public.withdrawal_transactions TO service_role;

ALTER TABLE public.withdrawal_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view withdrawal records" ON public.withdrawal_transactions FOR SELECT USING (true);
CREATE POLICY "Anyone can record a withdrawal" ON public.withdrawal_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update withdrawal status" ON public.withdrawal_transactions FOR UPDATE USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER withdrawal_transactions_updated_at
BEFORE UPDATE ON public.withdrawal_transactions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();