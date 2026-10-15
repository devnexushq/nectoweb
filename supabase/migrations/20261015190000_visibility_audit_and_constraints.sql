-- ==============================================================================
-- NECTO — Visibility, Role Discovery & Pincode Integrity Audit & Migration
-- ==============================================================================
-- PURPOSE:
-- 1. Ensure worker and shop tables enforce valid visibility ('local', 'all_india').
-- 2. Provide safe diagnostic queries for inspecting live record counts and status.
-- 3. Prevent invalid visibility values and ensure pincode index exists for fast lookup.
-- 4. Never drop tables or delete user data.
-- ==============================================================================

-- 1. DIAGNOSTIC SECTION (Execute in Supabase SQL Editor to inspect live database counts)
-- ------------------------------------------------------------------------------
-- Query A: Worker visibility breakdown & pincode coverage
-- SELECT 
--   visibility, 
--   COUNT(*) AS total_workers,
--   COUNT(pincode) AS with_pincode,
--   COUNT(*) - COUNT(pincode) AS missing_pincode
-- FROM public.workers
-- GROUP BY visibility;

-- Query B: Shop visibility breakdown & pincode coverage
-- SELECT 
--   visibility, 
--   COUNT(*) AS total_shops,
--   COUNT(pincode) AS with_pincode,
--   COUNT(*) - COUNT(pincode) AS missing_pincode
-- FROM public.shops
-- GROUP BY visibility;

-- Query C: Customer record check (confirm customers have NO visibility column or value)
-- SELECT 
--   COUNT(*) AS total_customers,
--   COUNT(pincode) AS with_pincode,
--   COUNT(*) - COUNT(pincode) AS missing_pincode
-- FROM public.customers;

-- Query D: Find any workers with unexpected or null visibility
-- SELECT id, name, phone, area, pincode, visibility, registered_at
-- FROM public.workers
-- WHERE visibility IS NULL OR visibility NOT IN ('local', 'all_india');

-- Query E: Find any shops with unexpected or null visibility
-- SELECT id, shop_name, phone, area, pincode, visibility, registered_at
-- FROM public.shops
-- WHERE visibility IS NULL OR visibility NOT IN ('local', 'all_india');

-- Query F: Find any local workers missing required 6-digit PIN code
-- SELECT id, name, phone, area, pincode, registered_at
-- FROM public.workers
-- WHERE visibility = 'local' AND (pincode IS NULL OR length(trim(pincode)) != 6);

-- Query G: Find any local shops missing required 6-digit PIN code
-- SELECT id, shop_name, phone, area, pincode, registered_at
-- FROM public.shops
-- WHERE visibility = 'local' AND (pincode IS NULL OR length(trim(pincode)) != 6);


-- 2. SCHEMA CONSTRAINTS & INDEXES (Idempotent and safe)
-- ------------------------------------------------------------------------------

-- Ensure pincode columns exist
ALTER TABLE IF EXISTS public.customers
  ADD COLUMN IF NOT EXISTS pincode VARCHAR(10);

ALTER TABLE IF EXISTS public.workers
  ADD COLUMN IF NOT EXISTS pincode VARCHAR(10);

ALTER TABLE IF EXISTS public.shops
  ADD COLUMN IF NOT EXISTS pincode VARCHAR(10);

-- Ensure visibility columns default to 'local'
ALTER TABLE IF EXISTS public.workers
  ALTER COLUMN visibility SET DEFAULT 'local';

ALTER TABLE IF EXISTS public.shops
  ALTER COLUMN visibility SET DEFAULT 'local';

-- Safely add check constraints for visibility if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'workers_visibility_check'
  ) THEN
    ALTER TABLE public.workers
      ADD CONSTRAINT workers_visibility_check 
      CHECK (visibility IN ('local', 'all_india'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'shops_visibility_check'
  ) THEN
    ALTER TABLE public.shops
      ADD CONSTRAINT shops_visibility_check 
      CHECK (visibility IN ('local', 'all_india'));
  END IF;
END $$;

-- Fast compound indexes for role-based discovery lookups
CREATE INDEX IF NOT EXISTS idx_workers_visibility_pincode 
  ON public.workers(visibility, pincode);

CREATE INDEX IF NOT EXISTS idx_shops_visibility_pincode 
  ON public.shops(visibility, pincode);
