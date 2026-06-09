import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/lib/admin/auth";
import { Loader2 } from "lucide-react";

export default function RequireAdmin({ children }: { children: ReactNode }) {
  const { loading, user, isAdmin } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user || !isAdmin) navigate("/admin/login", { replace: true });
  }, [loading, user, isAdmin, navigate]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }
  return <>{children}</>;
}
