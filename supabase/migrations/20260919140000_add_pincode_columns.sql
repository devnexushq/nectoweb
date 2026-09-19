-- ==============================================================================
-- MIGRATION: Add internal pincode columns to customers, workers, and shops
-- Note: Pincode is strictly internal for location proximity filtering.
-- Pincode is NEVER exposed or selected for public profile or card display.
-- ==============================================================================

ALTER TABLE IF EXISTS public.customers
  ADD COLUMN IF NOT EXISTS pincode VARCHAR(10);

ALTER TABLE IF EXISTS public.workers
  ADD COLUMN IF NOT EXISTS pincode VARCHAR(10);

ALTER TABLE IF EXISTS public.shops
  ADD COLUMN IF NOT EXISTS pincode VARCHAR(10);

CREATE INDEX IF NOT EXISTS idx_workers_pincode ON public.workers(pincode);
CREATE INDEX IF NOT EXISTS idx_shops_pincode ON public.shops(pincode);
CREATE INDEX IF NOT EXISTS idx_customers_pincode ON public.customers(pincode);
