-- ==============================================================================
-- NECTO — PROPOSED DATABASE SECURITY, RLS & VISIBILITY HARDENING MIGRATION
-- ==============================================================================
-- STATUS: PROPOSAL ONLY — DO NOT RUN DIRECTLY ON PRODUCTION WITHOUT:
--   1. Reviewing every statement against live Supabase state
--   2. Taking a full PostgreSQL backup / enabling Point-in-Time Recovery (PITR)
--   3. Explicit owner approval
--
-- BACKUP PLAN (Run before applying):
--   pg_dump "$SUPABASE_DB_URL" --schema=public --format=custom \
--     -f "necto_public_backup_$(date +%Y%m%d_%H%M%S).dump"
--
-- URGENT MANUAL ACTION REQUIRED IN SUPABASE AUTH:
--   Historical migration 20260612150754_daa620bb-f00c-42b9-a489-030d2b1d51fa.sql
--   set a seed password on the admin account (niharmohanta14@gmail.com).
--   Rotate that password immediately in Supabase Dashboard -> Authentication -> Users
--   or via the Admin Reset Password flow, and ensure MFA is enabled.
-- ==============================================================================


-- ==============================================================================
-- PHASE A: NON-BREAKING IMMEDIATE HARDENING (Safe with current frontend)
-- Affected tables: public.workers, public.shops, public.products,
--                  public.support_queries, public.reviews
-- ==============================================================================

-- 1. Harden trigger/SECURITY DEFINER search_path against schema hijacking
ALTER FUNCTION public.update_entity_rating_from_reviews() SET search_path = public;
ALTER FUNCTION public.force_registration_approved() SET search_path = public;

-- 2. Enforce that public catalog reads only return approved workers/shops
--    (admins still see all statuses via public.has_role(auth.uid(), 'admin'))
DROP POLICY IF EXISTS "public read workers" ON public.workers;
CREATE POLICY "public read approved workers"
  ON public.workers
  FOR SELECT
  TO anon, authenticated
  USING (
    approval_status = 'approved'
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "public read shops" ON public.shops;
CREATE POLICY "public read approved shops"
  ON public.shops
  FOR SELECT
  TO anon, authenticated
  USING (
    approval_status = 'approved'
    OR public.has_role(auth.uid(), 'admin')
  );

-- 3. Enforce that public product reads only return visible products of approved shops
DROP POLICY IF EXISTS "public read products" ON public.products;
CREATE POLICY "public read visible approved products"
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (
    (
      visibility = 'visible'
      AND EXISTS (
        SELECT 1 FROM public.shops s
        WHERE s.id = products.shop_id
          AND s.approval_status = 'approved'
      )
    )
    OR public.has_role(auth.uid(), 'admin')
  );

-- 4. Explicit admin policies on support_queries (keeps public write-only for submissions)
CREATE POLICY "admins read support queries"
  ON public.support_queries
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins update support queries"
  ON public.support_queries
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Enforce valid 6-digit PIN when worker/shop visibility is 'local'
--    (Marked NOT VALID first so any legacy rows do not fail deployment; audit & clean before VALIDATE)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'workers_local_requires_6digit_pincode'
  ) THEN
    ALTER TABLE public.workers
      ADD CONSTRAINT workers_local_requires_6digit_pincode
      CHECK (visibility <> 'local' OR (pincode IS NOT NULL AND pincode ~ '^[0-9]{6}$')) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'shops_local_requires_6digit_pincode'
  ) THEN
    ALTER TABLE public.shops
      ADD CONSTRAINT shops_local_requires_6digit_pincode
      CHECK (visibility <> 'local' OR (pincode IS NOT NULL AND pincode ~ '^[0-9]{6}$')) NOT VALID;
  END IF;
END $$;

-- 6. Safe PIN-filtered discovery RPC (never exposes raw pincode to browse callers)
CREATE OR REPLACE FUNCTION public.get_discovery_listings(
  p_entity text,
  p_visibility text,
  p_pincode text DEFAULT NULL,
  p_limit int DEFAULT 100
)
RETURNS TABLE (
  id uuid,
  primary_name text,
  secondary_name text,
  category_or_job text,
  description text,
  area text,
  phone text,
  whatsapp text,
  experience int,
  business_hours jsonb,
  photo_url text,
  rating numeric,
  visibility text,
  approval_status text,
  registered_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit int := GREATEST(1, LEAST(COALESCE(p_limit, 100), 200));
  v_pin text := NULLIF(BTRIM(COALESCE(p_pincode, '')), '');
BEGIN
  IF p_visibility NOT IN ('local', 'all_india') THEN
    RETURN;
  END IF;

  IF p_visibility = 'local' AND (v_pin IS NULL OR v_pin !~ '^[0-9]{6}$') THEN
    RETURN;
  END IF;

  IF p_entity = 'workers' THEN
    RETURN QUERY
    SELECT
      w.id,
      w.name AS primary_name,
      NULL::text AS secondary_name,
      w.job_type AS category_or_job,
      w.description,
      w.area,
      w.phone,
      w.whatsapp,
      w.experience,
      w.business_hours,
      w.photo_url,
      w.rating,
      w.visibility,
      w.approval_status,
      w.registered_at
    FROM public.workers w
    WHERE w.approval_status = 'approved'
      AND w.visibility = p_visibility
      AND (p_visibility <> 'local' OR w.pincode = v_pin)
    ORDER BY w.rating DESC, w.registered_at DESC
    LIMIT v_limit;
  ELSIF p_entity = 'shops' THEN
    RETURN QUERY
    SELECT
      s.id,
      s.shop_name AS primary_name,
      s.owner_name AS secondary_name,
      s.category AS category_or_job,
      s.description,
      s.area,
      s.phone,
      s.whatsapp,
      NULL::int AS experience,
      s.business_hours,
      s.photo_url,
      s.rating,
      s.visibility,
      s.approval_status,
      s.registered_at
    FROM public.shops s
    WHERE s.approval_status = 'approved'
      AND s.visibility = p_visibility
      AND (p_visibility <> 'local' OR s.pincode = v_pin)
    ORDER BY s.rating DESC, s.registered_at DESC
    LIMIT v_limit;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_discovery_listings(text, text, text, int) TO anon, authenticated;

-- 7. Safe boolean duplicate phone lookup RPC (avoids exposing customer/worker/shop rows to anon)
CREATE OR REPLACE FUNCTION public.check_phone_registered(
  p_table text,
  p_candidates text[]
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_found boolean := false;
BEGIN
  IF p_candidates IS NULL OR array_length(p_candidates, 1) IS NULL THEN
    RETURN false;
  END IF;

  IF p_table = 'customers' THEN
    SELECT EXISTS(SELECT 1 FROM public.customers WHERE phone = ANY(p_candidates)) INTO v_found;
  ELSIF p_table = 'workers' THEN
    SELECT EXISTS(SELECT 1 FROM public.workers WHERE phone = ANY(p_candidates)) INTO v_found;
  ELSIF p_table = 'shops' THEN
    SELECT EXISTS(SELECT 1 FROM public.shops WHERE phone = ANY(p_candidates)) INTO v_found;
  END IF;

  RETURN COALESCE(v_found, false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_phone_registered(text, text[]) TO anon, authenticated;


-- 8. Restrict product-images bucket to safe raster MIME types (removes image/svg+xml XSS risk)
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'product-images';


-- ==============================================================================
-- PHASE B: FULL AUTH & PII LOCKDOWN (Run ONLY after pairing Edge Functions /
--          signed user sessions for Customers, Workers, and Shops)
-- ==============================================================================
-- Why deferred?
--   Currently Customers, Workers, and Shops do not hold Supabase Auth JWTs
--   (auth.uid() IS NULL for those roles; only Admin signs in with Supabase Auth).
--   Dropping direct anon table policies below without first migrating profile
--   reads/edits/deletes to authenticated Edge Functions or Supabase Phone OTP
--   would block user profile updates and phone backfill in the client app.
--
-- Target Phase B statements (commented until auth migration is complete):
--
--   -- Customers: lock PII completely to owning user or admin
--   DROP POLICY IF EXISTS "public read customers" ON public.customers;
--   DROP POLICY IF EXISTS "public update customers" ON public.customers;
--   DROP POLICY IF EXISTS "public delete customers" ON public.customers;
--   CREATE POLICY "admins manage customers" ON public.customers
--     FOR ALL TO authenticated
--     USING (public.has_role(auth.uid(), 'admin'))
--     WITH CHECK (public.has_role(auth.uid(), 'admin'));
--
--   -- Contacts log: restrict SELECT to admins / owning worker-shop session
--   DROP POLICY IF EXISTS "public read contacts_log" ON public.contacts_log;
--   CREATE POLICY "admins read contacts_log" ON public.contacts_log
--     FOR SELECT TO authenticated
--     USING (public.has_role(auth.uid(), 'admin'));
--
--   -- Reviews: require an authentic contacts_log entry on INSERT and drop public DELETE
--   DROP POLICY IF EXISTS "public insert reviews" ON public.reviews;
--   DROP POLICY IF EXISTS "public update reviews" ON public.reviews;
--   DROP POLICY IF EXISTS "public delete reviews" ON public.reviews;
--   CREATE POLICY "eligible customers insert reviews" ON public.reviews
--     FOR INSERT TO anon, authenticated
--     WITH CHECK (
--       EXISTS (
--         SELECT 1 FROM public.contacts_log cl
--         WHERE cl.from_phone = reviews.reviewer_phone
--           AND (
--             (reviews.worker_id IS NOT NULL AND cl.to_id = reviews.worker_id AND cl.to_type = 'worker')
--             OR (reviews.shop_id IS NOT NULL AND cl.to_id = reviews.shop_id AND cl.to_type = 'shop')
--           )
--       )
--     );


-- ==============================================================================
-- ROLLBACK PLAN (If Phase A causes unexpected issues)
-- ==============================================================================
-- DROP POLICY IF EXISTS "public read approved workers" ON public.workers;
-- CREATE POLICY "public read workers" ON public.workers FOR SELECT TO anon, authenticated USING (true);
--
-- DROP POLICY IF EXISTS "public read approved shops" ON public.shops;
-- CREATE POLICY "public read shops" ON public.shops FOR SELECT TO anon, authenticated USING (true);
--
-- DROP POLICY IF EXISTS "public read visible approved products" ON public.products;
-- CREATE POLICY "public read products" ON public.products FOR SELECT TO anon, authenticated USING (true);
--
-- DROP POLICY IF EXISTS "admins read support queries" ON public.support_queries;
-- DROP POLICY IF EXISTS "admins update support queries" ON public.support_queries;
--
-- ALTER TABLE public.workers DROP CONSTRAINT IF EXISTS workers_local_requires_6digit_pincode;
-- ALTER TABLE public.shops DROP CONSTRAINT IF EXISTS shops_local_requires_6digit_pincode;
--
-- DROP FUNCTION IF EXISTS public.get_discovery_listings(text, text, text, int);
-- DROP FUNCTION IF EXISTS public.check_phone_registered(text, text[]);
