
-- Helper trigger function for last_updated_at
CREATE OR REPLACE FUNCTION public.set_last_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.last_updated_at = now();
  RETURN NEW;
END;
$$;

-- customers
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS terms_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version text,
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS account_created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS approval_notes text;

DROP TRIGGER IF EXISTS trg_customers_last_updated ON public.customers;
CREATE TRIGGER trg_customers_last_updated
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.set_last_updated_at();

-- workers
ALTER TABLE public.workers
  ADD COLUMN IF NOT EXISTS terms_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version text,
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS account_created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS approval_notes text;

DROP TRIGGER IF EXISTS trg_workers_last_updated ON public.workers;
CREATE TRIGGER trg_workers_last_updated
BEFORE UPDATE ON public.workers
FOR EACH ROW EXECUTE FUNCTION public.set_last_updated_at();

-- shops
ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS terms_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version text,
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS account_created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS approval_notes text;

DROP TRIGGER IF EXISTS trg_shops_last_updated ON public.shops;
CREATE TRIGGER trg_shops_last_updated
BEFORE UPDATE ON public.shops
FOR EACH ROW EXECUTE FUNCTION public.set_last_updated_at();
