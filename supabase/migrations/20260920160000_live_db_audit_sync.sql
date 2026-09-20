-- Migration: 20260920160000_live_db_audit_sync.sql
-- Fixes live Supabase schema, foreign keys, RLS policies, and data normalization

-- 1. Contacts Log Insert Policy for anonymous & authenticated users
ALTER TABLE IF EXISTS public.contacts_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public insert contacts_log" ON public.contacts_log;
CREATE POLICY "public insert contacts_log"
  ON public.contacts_log
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 2. Support Queries Insert Policy for anonymous & authenticated users
ALTER TABLE IF EXISTS public.support_queries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public insert support_queries" ON public.support_queries;
CREATE POLICY "public insert support_queries"
  ON public.support_queries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 3. Activity Feed (Shop Offers): Remove Auth Users FK and allow shop profiles to manage offers
ALTER TABLE IF EXISTS public.activity_feed
  DROP CONSTRAINT IF EXISTS activity_feed_created_by_fkey;

ALTER TABLE IF EXISTS public.activity_feed
  ALTER COLUMN created_by DROP NOT NULL;

DROP POLICY IF EXISTS "Shop profiles can create offers" ON public.activity_feed;
CREATE POLICY "Shop profiles can create offers"
  ON public.activity_feed
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    type = 'offer'
    AND linked_shop_id IS NOT NULL
  );

DROP POLICY IF EXISTS "Shop profiles can update their offers" ON public.activity_feed;
CREATE POLICY "Shop profiles can update their offers"
  ON public.activity_feed
  FOR UPDATE
  TO anon, authenticated
  USING (
    type = 'offer'
    AND linked_shop_id IS NOT NULL
  )
  WITH CHECK (
    type = 'offer'
    AND linked_shop_id IS NOT NULL
  );

DROP POLICY IF EXISTS "Shop profiles can delete their offers" ON public.activity_feed;
CREATE POLICY "Shop profiles can delete their offers"
  ON public.activity_feed
  FOR DELETE
  TO anon, authenticated
  USING (
    type = 'offer'
    AND linked_shop_id IS NOT NULL
  );

-- 4. Cascade delete on products when shop is deleted
ALTER TABLE IF EXISTS public.products
  DROP CONSTRAINT IF EXISTS products_shop_id_fkey,
  ADD CONSTRAINT products_shop_id_fkey
    FOREIGN KEY (shop_id)
    REFERENCES public.shops(id)
    ON DELETE CASCADE;

-- 5. Helper function and data normalization for phone numbers to E.164
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

  IF raw_phone LIKE '+%' THEN
    RETURN '+' || regexp_replace(substring(raw_phone from 2), '[^0-9]', '', 'g');
  END IF;

  digits := regexp_replace(raw_phone, '[^0-9]', '', 'g');

  IF length(digits) = 10 THEN
    RETURN '+91' || digits;
  ELSIF length(digits) = 11 AND digits LIKE '0%' THEN
    RETURN '+91' || substring(digits from 2);
  ELSIF length(digits) = 12 AND digits LIKE '91%' THEN
    RETURN '+' || digits;
  ELSIF length(digits) > 0 THEN
    RETURN '+91' || digits;
  ELSE
    RETURN raw_phone;
  END IF;
END;
$$;

-- Normalize existing un-prefixed Indian phone numbers in live tables
UPDATE public.customers
SET phone = public.normalize_to_e164_in(phone)
WHERE phone IS NOT NULL AND phone NOT LIKE '+%';

UPDATE public.workers
SET phone = public.normalize_to_e164_in(phone),
    whatsapp = CASE 
      WHEN whatsapp IS NOT NULL AND whatsapp <> '' THEN public.normalize_to_e164_in(whatsapp)
      ELSE public.normalize_to_e164_in(phone)
    END
WHERE phone IS NOT NULL AND (phone NOT LIKE '+%' OR (whatsapp IS NOT NULL AND whatsapp NOT LIKE '+%'));

UPDATE public.shops
SET phone = public.normalize_to_e164_in(phone),
    whatsapp = CASE 
      WHEN whatsapp IS NOT NULL AND whatsapp <> '' THEN public.normalize_to_e164_in(whatsapp)
      ELSE public.normalize_to_e164_in(phone)
    END
WHERE phone IS NOT NULL AND (phone NOT LIKE '+%' OR (whatsapp IS NOT NULL AND whatsapp NOT LIKE '+%'));

-- 6. Compatibility views
CREATE OR REPLACE VIEW public.customer AS SELECT * FROM public.customers;
CREATE OR REPLACE VIEW public.contacts_logs AS SELECT * FROM public.contacts_log;
CREATE OR REPLACE VIEW public.support_wyires AS SELECT * FROM public.support_queries;
CREATE OR REPLACE VIEW public.users_roles AS SELECT * FROM public.user_roles;
