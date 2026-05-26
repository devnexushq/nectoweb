import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ListingsView } from "@/components/ListingsView";
import { useRoleGuard } from "@/hooks/useRoleGuard";

export const Route = createFileRoute("/c/shops")({ component: CustomerShops });

function CustomerShops() {
  const ready = useRoleGuard("customer");
  if (!ready) return null;
  return (
    <AppShell role="customer" title="Shops">
      <ListingsView mode="shops" hrefPrefix="/c" registerCtaTo="/" registerCtaLabel="List your Shop" placeholder="Search shops by name or category..." />
    </AppShell>
  );
}
