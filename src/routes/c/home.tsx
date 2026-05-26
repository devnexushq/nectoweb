import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ListingsView } from "@/components/ListingsView";
import { useRoleGuard } from "@/hooks/useRoleGuard";

export const Route = createFileRoute("/c/home")({ component: CustomerHome });

function CustomerHome() {
  const ready = useRoleGuard("customer");
  if (!ready) return null;
  return (
    <AppShell role="customer" title="NECTO">
      <p className="text-sm text-muted-foreground mb-3">Discover Local, Buy Local</p>
      <ListingsView
        mode="mixed"
        hrefPrefix="/c"
        registerCtaTo="/c/register"
        registerCtaLabel="Tell us more"
        placeholder="Search doctor, electrician, tent, plumber..."
      />
    </AppShell>
  );
}
