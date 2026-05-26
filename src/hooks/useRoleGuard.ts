import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getRole, getUserId, homePathFor, registerPathFor, type Role } from "@/lib/role";

export function useRoleGuard(requireRole: Role, requireRegistered = true) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const role = getRole();
    if (!role) { navigate("/"); return; }
    if (role !== requireRole) { navigate(homePathFor(role)); return; }
    if (requireRegistered && !getUserId()) { navigate(registerPathFor(role)); return; }
    setReady(true);
  }, [pathname, navigate, requireRole, requireRegistered]);

  return ready;
}
