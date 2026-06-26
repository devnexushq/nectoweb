import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  clearAccount,
  getRole,
  getUserId,
  homePathFor,
  registerPathFor,
  type Role,
} from "@/lib/role";

export async function accountExists(role: Role, id: string): Promise<boolean | null> {
  const query = role === "customer"
    ? supabase.from("customers").select("id").eq("id", id).maybeSingle()
    : role === "worker"
      ? supabase.from("workers").select("id").eq("id", id).maybeSingle()
      : supabase.from("shops").select("id").eq("id", id).maybeSingle();

  const { data, error } = await query;
  if (error) return null;
  return Boolean(data);
}

export function useRoleGuard(requireRole: Role, requireRegistered = true) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const validate = async () => {
      setReady(false);
      const role = getRole();
      if (!role) {
        navigate("/", { replace: true });
        return;
      }
      if (role !== requireRole) {
        navigate(homePathFor(role), { replace: true });
        return;
      }

      const id = getUserId();
      if (requireRegistered && !id) {
        navigate(registerPathFor(role), { replace: true });
        return;
      }

      if (requireRegistered && id) {
        const exists = await accountExists(role, id);
        if (cancelled) return;
        if (exists === false) {
          clearAccount();
          navigate("/", { replace: true });
          return;
        }
      }

      if (!cancelled) setReady(true);
    };

    validate();
    return () => { cancelled = true; };
  }, [pathname, navigate, requireRole, requireRegistered]);

  return ready;
}
