import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ShopProfileView } from "@/components/ProfileViews";
import { useRoleGuard } from "@/hooks/useRoleGuard";

export const Route = createFileRoute("/c/shop/$id")({ component: Page });

function Page() {
  const ready = useRoleGuard("customer");
  if (!ready) return null;
  return (
    <AppShell role="customer">
      <Link to="/c/shops" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-3"><ArrowLeft className="h-4 w-4" /> Back</Link>
      <ShopProfileView />
    </AppShell>
  );
}
