-- Adds GA4 identifiers to payments for accurate server-side purchase events
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS ga_client_id text,
  ADD COLUMN IF NOT EXISTS ga_session_id text,
  ADD COLUMN IF NOT EXISTS ga_session_number integer;

CREATE INDEX IF NOT EXISTS idx_payments_ga_client_id ON public.payments(ga_client_id);
CREATE INDEX IF NOT EXISTS idx_payments_ga_session_id ON public.payments(ga_session_id);

