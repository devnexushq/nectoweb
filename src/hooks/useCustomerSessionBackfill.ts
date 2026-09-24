import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getRole, getUserId, getUserPhone, setUserPhone } from "@/lib/role";

/**
 * Backfills `necto_user_phone` in localStorage for customer sessions
 * created before the phone field was stored locally.
 * Runs silently once per session/app load.
 */
export function useCustomerSessionBackfill() {
  useEffect(() => {
    const role = getRole();
    const phone = getUserPhone();
    const userId = getUserId();

    // Only backfill when current user is a customer with an active userId but missing phone
    if (role === "customer" && userId && !phone) {
      let isMounted = true;

      supabase
        .from("customers")
        .select("phone")
        .eq("id", userId)
        .maybeSingle()
        .then(({ data, error }) => {
          if (!isMounted) return;
          if (!error && data?.phone) {
            setUserPhone(data.phone);
            window.dispatchEvent(new CustomEvent("necto_phone_updated", { detail: data.phone }));
          }
        })
        .catch(() => {
          // Silent fallback - ignore network errors
        });

      return () => {
        isMounted = false;
      };
    }
  }, []);
}
