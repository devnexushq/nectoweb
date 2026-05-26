import { AppShell } from "@/components/AppShell";
import { ListingsView } from "@/components/ListingsView";
import { useRoleGuard } from "@/hooks/useRoleGuard";



export default function CustomerWorkers() {
  const ready = useRoleGuard("customer");
  if (!ready) return null;
  return (
    <AppShell role="customer" title="Workers">
      <ListingsView mode="workers" hrefPrefix="/c" registerCtaTo="/" registerCtaLabel="Become a Worker" placeholder="Search by job type or name..." />
    </AppShell>
  );
}
