import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { WorkerProfileView } from "@/components/ProfileViews";
import { useRoleGuard } from "@/hooks/useRoleGuard";

export const Route = createFileRoute("/s/worker/$id")({ component: Page });

function Page() {
  const ready = useRoleGuard("shop");
  if (!ready) return null;
  return (
    <AppShell role="shop">
      <Link to="/s/workers" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-3"><ArrowLeft className="h-4 w-4" /> Back</Link>
      <WorkerProfileView />
    </AppShell>
  );
}
