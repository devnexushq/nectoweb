import { AppShell } from "@/components/AppShell";
import { ListingsView } from "@/components/ListingsView";
import { useRoleGuard } from "@/hooks/useRoleGuard";



export default function Page() {
  const ready = useRoleGuard("shop");
  if (!ready) return null;
  return (
    <AppShell role="shop" title="Find Workers">
      <ListingsView mode="workers" hrefPrefix="/s" registerCtaTo="/" registerCtaLabel="Register a Worker" placeholder="Search by job type or name..." />
    </AppShell>
  );
}
