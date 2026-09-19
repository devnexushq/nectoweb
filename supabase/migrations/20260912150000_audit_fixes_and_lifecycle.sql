-- ==============================================================================
-- NECTO AUDIT & LIFECYCLE MIGRATION
-- Fixes foreign key constraints, RLS policies, table aliases, and cascade deletes
-- ==============================================================================

-- 1. FOREIGN KEY CASCADE FOR PRODUCTS -> SHOPS
-- Ensures orphaned products are not left behind when a shop is removed
ALTER TABLE IF EXISTS public.products
  DROP CONSTRAINT IF EXISTS products_shop_id_fkey;

ALTER TABLE IF EXISTS public.products
  ADD CONSTRAINT products_shop_id_fkey
  FOREIGN KEY (shop_id)
  REFERENCES public.shops(id)
  ON DELETE CASCADE;

-- 2. ACTIVITY FEED CONSTRAINT & RLS ADJUSTMENTS
-- Remove auth.users FK constraint on activity_feed.created_by so shops can publish offers
ALTER TABLE IF EXISTS public.activity_feed
  DROP CONSTRAINT IF EXISTS activity_feed_created_by_fkey;

ALTER TABLE IF EXISTS public.activity_feed
  ALTER COLUMN created_by DROP NOT NULL;

-- Ensure activity_feed allows shop offers insert without conflicting auth.users constraint
DROP POLICY IF EXISTS "shops create own offers" ON public.activity_feed;
CREATE POLICY "shops create own offers"
  ON public.activity_feed
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    type = 'offer'
    AND linked_shop_id IS NOT NULL
  );

DROP POLICY IF EXISTS "shops update own offers" ON public.activity_feed;
CREATE POLICY "shops update own offers"
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

DROP POLICY IF EXISTS "shops delete own offers" ON public.activity_feed;
CREATE POLICY "shops delete own offers"
  ON public.activity_feed
  FOR DELETE
  TO anon, authenticated
  USING (
    type = 'offer'
    AND linked_shop_id IS NOT NULL
  );

-- 3. CONTACTS LOG RLS & CONSTRAINTS
DROP POLICY IF EXISTS "public insert contacts_log" ON public.contacts_log;
CREATE POLICY "public insert contacts_log"
  ON public.contacts_log
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "public read contacts_log" ON public.contacts_log;
CREATE POLICY "public read contacts_log"
  ON public.contacts_log
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 4. SUPPORT QUERIES RLS & CONSTRAINTS
DROP POLICY IF EXISTS "public insert support_queries" ON public.support_queries;
CREATE POLICY "public insert support_queries"
  ON public.support_queries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 5. COMPATIBILITY VIEWS FOR ALIASES / MISSPELLINGS
-- Maps legacy or external service names to their canonical tables
CREATE OR REPLACE VIEW public.customer AS
  SELECT * FROM public.customers;

CREATE OR REPLACE VIEW public.contacts_logs AS
  SELECT * FROM public.contacts_log;

CREATE OR REPLACE VIEW public.support_wyires AS
  SELECT * FROM public.support_queries;

CREATE OR REPLACE VIEW public.users_roles AS
  SELECT * FROM public.user_roles;

-- 6. PERFORMANCE & QUERY INDEXES
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON public.products(shop_id);
CREATE INDEX IF NOT EXISTS idx_contacts_log_target ON public.contacts_log(to_id, to_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_views_user ON public.activity_views(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_offers ON public.activity_feed(type, status, linked_shop_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_location ON public.activity_feed(visibility_scope, city, area);
