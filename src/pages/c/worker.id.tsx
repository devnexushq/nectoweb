import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { WorkerProfileView } from "@/components/ProfileViews";
import { useRoleGuard } from "@/hooks/useRoleGuard";



export default function Page() {
  const ready = useRoleGuard("customer");
  if (!ready) return null;
  return (
    <AppShell role="customer">
      <Link to="/c/workers" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-3"><ArrowLeft className="h-4 w-4" /> Back</Link>
      <WorkerProfileView />
    </AppShell>
  );
}
