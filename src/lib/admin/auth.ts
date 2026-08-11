import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type AdminAuthState = {
  loading: boolean;
  user: User | null;
  isAdmin: boolean;
  error: string | null;
};

function readableError(error: unknown) {
  if (!error) return null;
  return error instanceof Error ? error.message : String(error);
}

export function useAdminAuth(): AdminAuthState {
  const [state, setState] = useState<AdminAuthState>({ loading: true, user: null, isAdmin: false, error: null });

  useEffect(() => {
    let mounted = true;

    const evaluate = async (user: User | null) => {
      if (!user) {
        if (mounted) setState({ loading: false, user: null, isAdmin: false, error: null });
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!mounted) return;
      if (error) {
        setState({ loading: false, user, isAdmin: false, error: readableError(error) ?? "Unable to verify admin access." });
        return;
      }
      setState({ loading: false, user, isAdmin: !!data, error: null });
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => void evaluate(session?.user ?? null), 0);
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        if (mounted) setState({ loading: false, user: null, isAdmin: false, error: readableError(error) ?? "Unable to load session." });
        return;
      }
      return evaluate(data.session?.user ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

export async function signOutAdmin() {
  await supabase.auth.signOut();
}
