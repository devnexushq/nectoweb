-- Migration: Normalize existing phone numbers to E.164 format and enforce unique duplicate checks
-- Tables affected: customers, workers, shops

-- Helper function to normalize numbers to E.164 assuming +91 for 10-digit Indian numbers
CREATE OR REPLACE FUNCTION public.normalize_to_e164_in(raw_phone text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  digits text;
BEGIN
  IF raw_phone IS NULL OR trim(raw_phone) = '' THEN
    RETURN raw_phone;
  END IF;

  -- If already in full E.164 format (starts with +)
  IF raw_phone LIKE '+%' THEN
    -- Strip any internal spaces/dashes after the +
    RETURN '+' || regexp_replace(substring(raw_phone from 2), '[^0-9]', '', 'g');
  END IF;

  -- Extract all digits
  digits := regexp_replace(raw_phone, '[^0-9]', '', 'g');

  -- Case 1: Exactly 10 digits -> prepend +91
  IF length(digits) = 10 THEN
    RETURN '+91' || digits;
  -- Case 2: 11 digits starting with 0 -> strip 0 and prepend +91
  ELSIF length(digits) = 11 AND digits LIKE '0%' THEN
    RETURN '+91' || substring(digits from 2);
  -- Case 3: 12 digits starting with 91 -> prepend +
  ELSIF length(digits) = 12 AND digits LIKE '91%' THEN
    RETURN '+' || digits;
  -- Otherwise, if digits exist, prepend +91 if length <= 10 or + if longer
  ELSIF length(digits) > 0 THEN
    RETURN '+91' || digits;
  ELSE
    RETURN raw_phone;
  END IF;
END;
$$;

-- 1. Migrate public.customers
UPDATE public.customers
SET phone = public.normalize_to_e164_in(phone)
WHERE phone IS NOT NULL AND phone NOT LIKE '+%';

-- 2. Migrate public.workers
UPDATE public.workers
SET 
  phone = public.normalize_to_e164_in(phone),
  whatsapp = CASE 
    WHEN whatsapp IS NOT NULL AND whatsapp <> '' THEN public.normalize_to_e164_in(whatsapp)
    ELSE public.normalize_to_e164_in(phone)
  END
WHERE phone IS NOT NULL;

-- 3. Migrate public.shops
UPDATE public.shops
SET 
  phone = public.normalize_to_e164_in(phone),
  whatsapp = CASE 
    WHEN whatsapp IS NOT NULL AND whatsapp <> '' THEN public.normalize_to_e164_in(whatsapp)
    ELSE public.normalize_to_e164_in(phone)
  END
WHERE phone IS NOT NULL;

-- Enforce Unique Indexes on Phone column for all 3 tables to prevent duplicates at database level
-- Remove any duplicate test rows if present (keeping most recent by created_at / id)
DELETE FROM public.customers a USING public.customers b
WHERE a.phone = b.phone AND a.created_at < b.created_at;

DELETE FROM public.workers a USING public.workers b
WHERE a.phone = b.phone AND a.registered_at < b.registered_at;

DELETE FROM public.shops a USING public.shops b
WHERE a.phone = b.phone AND a.registered_at < b.registered_at;

-- Create Unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_phone_unique 
  ON public.customers (phone);

CREATE UNIQUE INDEX IF NOT EXISTS idx_workers_phone_unique 
  ON public.workers (phone);

CREATE UNIQUE INDEX IF NOT EXISTS idx_shops_phone_unique 
  ON public.shops (phone);

-- Add check constraints to guarantee E.164 compliance (+ followed by 7 to 15 digits)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_customers_phone_e164'
  ) THEN
    ALTER TABLE public.customers
      ADD CONSTRAINT chk_customers_phone_e164
      CHECK (phone ~ '^\+[1-9][0-9]{6,14}$');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_workers_phone_e164'
  ) THEN
    ALTER TABLE public.workers
      ADD CONSTRAINT chk_workers_phone_e164
      CHECK (phone ~ '^\+[1-9][0-9]{6,14}$');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_shops_phone_e164'
  ) THEN
    ALTER TABLE public.shops
      ADD CONSTRAINT chk_shops_phone_e164
      CHECK (phone ~ '^\+[1-9][0-9]{6,14}$');
  END IF;
END $$;
