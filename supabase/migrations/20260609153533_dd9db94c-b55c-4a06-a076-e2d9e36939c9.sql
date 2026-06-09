
-- 1. Enum
CREATE TYPE public.app_role AS ENUM ('admin');

-- 2. user_roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role function (must exist before policies using it)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "users read own role" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "admins read all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. approval_history
CREATE TABLE public.approval_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('customer','worker','shop')),
  entity_id uuid NOT NULL,
  previous_status text,
  new_status text NOT NULL,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX approval_history_entity_idx ON public.approval_history(entity_type, entity_id);
CREATE INDEX approval_history_created_idx ON public.approval_history(created_at DESC);
GRANT SELECT ON public.approval_history TO authenticated;
GRANT ALL ON public.approval_history TO service_role;
ALTER TABLE public.approval_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read approval history" ON public.approval_history
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. activity_logs
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX activity_logs_created_idx ON public.activity_logs(created_at DESC);
CREATE INDEX activity_logs_entity_idx ON public.activity_logs(entity_type, entity_id);
CREATE INDEX activity_logs_action_idx ON public.activity_logs(action);
GRANT SELECT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read activity logs" ON public.activity_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Add visibility to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'visible'
  CHECK (visibility IN ('visible','hidden'));

-- 6. Approval indexes
CREATE INDEX IF NOT EXISTS customers_approval_idx ON public.customers(approval_status);
CREATE INDEX IF NOT EXISTS workers_approval_idx ON public.workers(approval_status);
CREATE INDEX IF NOT EXISTS shops_approval_idx ON public.shops(approval_status);
CREATE INDEX IF NOT EXISTS customers_created_idx ON public.customers(created_at DESC);
CREATE INDEX IF NOT EXISTS workers_created_idx ON public.workers(registered_at DESC);
CREATE INDEX IF NOT EXISTS shops_created_idx ON public.shops(registered_at DESC);

-- 7. Triggers: registration audit
CREATE OR REPLACE FUNCTION public.log_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ent text;
BEGIN
  ent := TG_ARGV[0];
  INSERT INTO public.activity_logs(action, entity_type, entity_id, metadata)
  VALUES ('registration', ent, NEW.id, jsonb_build_object('source','public_registration'));
  RETURN NEW;
END;
$$;

CREATE TRIGGER customers_log_registration AFTER INSERT ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.log_registration('customer');
CREATE TRIGGER workers_log_registration AFTER INSERT ON public.workers
  FOR EACH ROW EXECUTE FUNCTION public.log_registration('worker');
CREATE TRIGGER shops_log_registration AFTER INSERT ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.log_registration('shop');

-- 8. Triggers: approval status change audit
CREATE OR REPLACE FUNCTION public.log_approval_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ent text;
  actor uuid;
BEGIN
  ent := TG_ARGV[0];
  IF NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
    BEGIN
      actor := auth.uid();
    EXCEPTION WHEN OTHERS THEN
      actor := NULL;
    END;
    INSERT INTO public.approval_history(entity_type, entity_id, previous_status, new_status, changed_by, notes)
    VALUES (ent, NEW.id, OLD.approval_status, NEW.approval_status, actor, NEW.approval_notes);
    INSERT INTO public.activity_logs(actor_id, action, entity_type, entity_id, metadata)
    VALUES (actor, 'approval_change', ent, NEW.id,
            jsonb_build_object('from', OLD.approval_status, 'to', NEW.approval_status));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER customers_log_approval AFTER UPDATE OF approval_status ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.log_approval_change('customer');
CREATE TRIGGER workers_log_approval AFTER UPDATE OF approval_status ON public.workers
  FOR EACH ROW EXECUTE FUNCTION public.log_approval_change('worker');
CREATE TRIGGER shops_log_approval AFTER UPDATE OF approval_status ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.log_approval_change('shop');
