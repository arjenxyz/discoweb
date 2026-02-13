-- Add metadata column to system_mails for structured mail data (JSON)

ALTER TABLE public.system_mails
  ADD COLUMN IF NOT EXISTS metadata jsonb;

-- Backfill is intentionally left empty; metadata will be populated for new receipts.