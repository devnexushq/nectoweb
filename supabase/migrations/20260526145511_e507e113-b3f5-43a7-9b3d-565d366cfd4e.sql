
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  area text NOT NULL,
  phone text NOT NULL,
  role text NOT NULL DEFAULT 'customer',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO anon, authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read customers" ON public.customers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public insert customers" ON public.customers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public update customers" ON public.customers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public delete customers" ON public.customers FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE public.workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  job_type text NOT NULL,
  experience int NOT NULL DEFAULT 0,
  phone text NOT NULL,
  whatsapp text NOT NULL,
  description text,
  area text NOT NULL,
  visibility text NOT NULL DEFAULT 'local',
  business_hours jsonb,
  photo_url text,
  rating numeric NOT NULL DEFAULT 0,
  registered_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workers TO anon, authenticated;
GRANT ALL ON public.workers TO service_role;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read workers" ON public.workers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public insert workers" ON public.workers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public update workers" ON public.workers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public delete workers" ON public.workers FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE public.shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_name text NOT NULL,
  shop_name text NOT NULL,
  category text NOT NULL,
  phone text NOT NULL,
  whatsapp text NOT NULL,
  description text,
  area text NOT NULL,
  visibility text NOT NULL DEFAULT 'local',
  business_hours jsonb,
  photo_url text,
  rating numeric NOT NULL DEFAULT 0,
  registered_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shops TO anon, authenticated;
GRANT ALL ON public.shops TO service_role;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read shops" ON public.shops FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public insert shops" ON public.shops FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public update shops" ON public.shops FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public delete shops" ON public.shops FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read products" ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public insert products" ON public.products FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public update products" ON public.products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public delete products" ON public.products FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE public.contacts_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_phone text,
  from_name text,
  to_id uuid NOT NULL,
  to_type text NOT NULL,
  contact_type text NOT NULL,
  "timestamp" timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts_log TO anon, authenticated;
GRANT ALL ON public.contacts_log TO service_role;
ALTER TABLE public.contacts_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read contacts_log" ON public.contacts_log FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public insert contacts_log" ON public.contacts_log FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TABLE public.support_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_queries TO anon, authenticated;
GRANT ALL ON public.support_queries TO service_role;
ALTER TABLE public.support_queries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public insert support_queries" ON public.support_queries FOR INSERT TO anon, authenticated WITH CHECK (true);
