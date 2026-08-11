-- Sequential migration to fix RLS and missing admin access policies

-- 1. Ensure activity_feed table structure is fully prepared and has RLS enabled
ALTER TABLE IF EXISTS public.activity_feed ENABLE ROW LEVEL SECURITY;

-- 2. Add policies for activity_feed
DROP POLICY IF EXISTS "Published official updates are readable" ON public.activity_feed;
CREATE POLICY "Published official updates are readable"
ON public.activity_feed
FOR SELECT
TO anon, authenticated
USING (
  type = 'official_update'
  AND status = 'published'
  AND (expires_at IS NULL OR expires_at >= now())
);

DROP POLICY IF EXISTS "admins manage activity_feed" ON public.activity_feed;
CREATE POLICY "admins manage activity_feed"
ON public.activity_feed
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));


-- 3. Ensure activity_views table exists, has RLS enabled, and proper policies
CREATE TABLE IF NOT EXISTS public.activity_views (
  activity_id uuid NOT NULL,
  user_id text NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (activity_id, user_id)
);

ALTER TABLE public.activity_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read activity_views" ON public.activity_views;
CREATE POLICY "public read activity_views" ON public.activity_views
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "public insert/update activity_views" ON public.activity_views;
CREATE POLICY "public insert/update activity_views" ON public.activity_views
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);


-- 4. Add SELECT policy for support_queries to allow admins to view them
DROP POLICY IF EXISTS "admins read support_queries" ON public.support_queries;
CREATE POLICY "admins read support_queries" ON public.support_queries
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
