import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { getRole, getUserId, homePathFor, registerPathFor, type Role } from "@/lib/role";

/**
 * Ensures the user is in the right role section.
 * - requireRole: which role this route requires
 * - requireRegistered: if true, redirects to registration when no necto_user_id stored
 */
export function useRoleGuard(requireRole: Role, requireRegistered = true) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const role = getRole();
    if (!role) {
      navigate({ to: "/" });
      return;
    }
    if (role !== requireRole) {
      navigate({ to: homePathFor(role) });
      return;
    }
    if (requireRegistered && !getUserId()) {
      navigate({ to: registerPathFor(role) });
      return;
    }
    setReady(true);
  }, [pathname, navigate, requireRole, requireRegistered]);

  return ready;
}
