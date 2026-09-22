-- Migration: 20260922100000_reviews_and_ratings.sql
-- Description: Creates reviews table, target constraint, upsert unique indexes,
-- live rating aggregation trigger, and RLS policies.

-- 1. Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES public.workers(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  reviewer_phone TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT CHECK (comment IS NULL OR length(comment) <= 300),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_reviews_target CHECK (
    (worker_id IS NOT NULL AND shop_id IS NULL) OR
    (worker_id IS NULL AND shop_id IS NOT NULL)
  )
);

-- 2. Unique indexes for upsert behavior (one review per phone per worker/shop)
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique_worker
  ON public.reviews (worker_id, reviewer_phone)
  WHERE worker_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique_shop
  ON public.reviews (shop_id, reviewer_phone)
  WHERE shop_id IS NOT NULL;

-- 3. Query lookup indexes
CREATE INDEX IF NOT EXISTS idx_reviews_worker_lookup
  ON public.reviews (worker_id, created_at DESC)
  WHERE worker_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_shop_lookup
  ON public.reviews (shop_id, created_at DESC)
  WHERE shop_id IS NOT NULL;

-- 4. Trigger to update worker and shop average ratings automatically
CREATE OR REPLACE FUNCTION public.update_entity_rating_from_reviews()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_worker_id UUID;
  target_shop_id UUID;
  avg_worker_rating NUMERIC;
  avg_shop_rating NUMERIC;
BEGIN
  target_worker_id := COALESCE(NEW.worker_id, OLD.worker_id);
  target_shop_id := COALESCE(NEW.shop_id, OLD.shop_id);

  IF target_worker_id IS NOT NULL THEN
    SELECT ROUND(COALESCE(AVG(rating), 0)::numeric, 1)
    INTO avg_worker_rating
    FROM public.reviews
    WHERE worker_id = target_worker_id;

    UPDATE public.workers
    SET rating = avg_worker_rating
    WHERE id = target_worker_id;
  END IF;

  IF target_shop_id IS NOT NULL THEN
    SELECT ROUND(COALESCE(AVG(rating), 0)::numeric, 1)
    INTO avg_shop_rating
    FROM public.reviews
    WHERE shop_id = target_shop_id;

    UPDATE public.shops
    SET rating = avg_shop_rating
    WHERE id = target_shop_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_update_rating_on_reviews ON public.reviews;
CREATE TRIGGER trg_update_rating_on_reviews
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_entity_rating_from_reviews();

-- 5. Row Level Security (RLS)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read reviews" ON public.reviews;
CREATE POLICY "public read reviews"
  ON public.reviews
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "public insert reviews" ON public.reviews;
CREATE POLICY "public insert reviews"
  ON public.reviews
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "public update reviews" ON public.reviews;
CREATE POLICY "public update reviews"
  ON public.reviews
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "public delete reviews" ON public.reviews;
CREATE POLICY "public delete reviews"
  ON public.reviews
  FOR DELETE
  TO anon, authenticated
  USING (true);

GRANT ALL ON public.reviews TO anon, authenticated, service_role;

-- 6. Ensure contacts_log RLS allows anonymous / authenticated insertion
ALTER TABLE IF EXISTS public.contacts_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public insert contacts_log" ON public.contacts_log;
CREATE POLICY "public insert contacts_log"
  ON public.contacts_log
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
GRANT ALL ON public.contacts_log TO anon, authenticated, service_role;
