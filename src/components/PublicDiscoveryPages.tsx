import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ListingsView } from "@/components/ListingsView";
import { ShopProfileView, WorkerProfileView } from "@/components/ProfileViews";
import { getRole, getUserId, homePathFor, registerPathFor, type Role } from "@/lib/role";

const ROLE_PREFIX: Record<Role, string> = {
  customer: "/c",
  worker: "/w",
  shop: "/s",
};

function useDiscoveryAccess(requiredRole?: Role) {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    const currentRole = getRole();
    if (!currentRole) {
      navigate("/");
      return;
    }
    if (requiredRole && currentRole !== requiredRole) {
      navigate(homePathFor(currentRole));
      return;
    }
    if (!getUserId()) {
      navigate(registerPathFor(currentRole));
      return;
    }
    setRole(requiredRole ?? currentRole);
  }, [navigate, requiredRole]);

  return role;
}

export function PublicWorkersPage({ role: requiredRole, hrefPrefix, title = "Workers" }: { role?: Role; hrefPrefix?: string; title?: string }) {
  const role = useDiscoveryAccess(requiredRole);
  if (!role) return null;

  return (
    <AppShell role={role} title={title}>
      <ListingsView
        mode="workers"
        hrefPrefix={hrefPrefix ?? ROLE_PREFIX[role]}
        placeholder="Search by skill, name, or local area..."
      />
    </AppShell>
  );
}

export function PublicShopsPage({ role: requiredRole, hrefPrefix, title = "Shops" }: { role?: Role; hrefPrefix?: string; title?: string }) {
  const role = useDiscoveryAccess(requiredRole);
  if (!role) return null;

  return (
    <AppShell role={role} title={title}>
      <ListingsView
        mode="shops"
        hrefPrefix={hrefPrefix ?? ROLE_PREFIX[role]}
        placeholder="Search by shop name, category, or local area..."
      />
    </AppShell>
  );
}

export function PublicWorkerProfilePage({ role: requiredRole, backTo, backLabel = "Back to Workers" }: { role?: Role; backTo?: string; backLabel?: string }) {
  const role = useDiscoveryAccess(requiredRole);
  if (!role) return null;

  return (
    <AppShell role={role}>
      <Link to={backTo ?? `${ROLE_PREFIX[role]}/workers`} className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-3">
        <ArrowLeft className="h-4 w-4" /> {backLabel}
      </Link>
      <WorkerProfileView />
    </AppShell>
  );
}

export function PublicShopProfilePage({ role: requiredRole, backTo, backLabel = "Back to Shops" }: { role?: Role; backTo?: string; backLabel?: string }) {
  const role = useDiscoveryAccess(requiredRole);
  if (!role) return null;

  return (
    <AppShell role={role}>
      <Link to={backTo ?? `${ROLE_PREFIX[role]}/shops`} className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-3">
        <ArrowLeft className="h-4 w-4" /> {backLabel}
      </Link>
      <ShopProfileView />
    </AppShell>
  );
}
