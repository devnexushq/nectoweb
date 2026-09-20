-- ==============================================================================
-- MIGRATION: Add Today's Update columns to workers and shops tables
-- latest_update: Text status update (max 150 characters, nullable)
-- latest_update_at: Timestamp when update was posted (timestamptz, nullable)
-- ==============================================================================

ALTER TABLE IF EXISTS public.workers
  ADD COLUMN IF NOT EXISTS latest_update VARCHAR(150),
  ADD COLUMN IF NOT EXISTS latest_update_at TIMESTAMPTZ;

ALTER TABLE IF EXISTS public.shops
  ADD COLUMN IF NOT EXISTS latest_update VARCHAR(150),
  ADD COLUMN IF NOT EXISTS latest_update_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_workers_latest_update_at ON public.workers(latest_update_at);
CREATE INDEX IF NOT EXISTS idx_shops_latest_update_at ON public.shops(latest_update_at);
