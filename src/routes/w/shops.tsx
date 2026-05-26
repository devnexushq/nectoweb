import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ListingsView } from "@/components/ListingsView";
import { useRoleGuard } from "@/hooks/useRoleGuard";

export const Route = createFileRoute("/w/shops")({ component: Page });

function Page() {
  const ready = useRoleGuard("worker");
  if (!ready) return null;
  return (
    <AppShell role="worker" title="Browse Shops">
      <ListingsView mode="shops" hrefPrefix="/w" registerCtaTo="/" registerCtaLabel="List a Shop" placeholder="Search shops by name or category..." />
    </AppShell>
  );
}
