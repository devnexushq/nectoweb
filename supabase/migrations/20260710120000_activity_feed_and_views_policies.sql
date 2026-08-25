-- Migration to ensure public tables support_queries, activity_feed, and activity_views have proper RLS policies enabled for public and admin access.

-- 1. Ensure support_queries allows public creation and admin read/update
ALTER TABLE IF EXISTS public.support_queries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert support_queries" ON public.support_queries;
CREATE POLICY "Anyone can insert support_queries"
ON public.support_queries
FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view support_queries" ON public.support_queries;
CREATE POLICY "Admins can view support_queries"
ON public.support_queries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update support_queries" ON public.support_queries;
CREATE POLICY "Admins can update support_queries"
ON public.support_queries
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  )
);

-- 2. Ensure activity_feed and activity_views policies support published updates & admin queries
ALTER TABLE IF EXISTS public.activity_feed ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published official updates are readable" ON public.activity_feed;
CREATE POLICY "Published official updates are readable"
ON public.activity_feed
FOR SELECT
TO public
USING (
  type = 'official'
  AND status = 'published'
  AND (expires_at IS NULL OR expires_at >= now())
);

DROP POLICY IF EXISTS "Admins can manage all activity_feed items" ON public.activity_feed;
CREATE POLICY "Admins can manage all activity_feed items"
ON public.activity_feed
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  )
);

ALTER TABLE IF EXISTS public.activity_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can record activity_views" ON public.activity_views;
CREATE POLICY "Users can record activity_views"
ON public.activity_views
FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own activity_views" ON public.activity_views;
CREATE POLICY "Users can view own activity_views"
ON public.activity_views
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  )
);
