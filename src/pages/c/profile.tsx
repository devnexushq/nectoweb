import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/lib/role";
import { InstallButton } from "@/components/InstallButton";



export default function CustomerProfile() {
  const ready = useRoleGuard("customer");
  const [me, setMe] = useState<any>(null);
  useEffect(() => {
    const id = getUserId();
    if (!id) return;
    supabase.from("customers").select("*").eq("id", id).maybeSingle().then(({ data }) => setMe(data));
  }, []);
  if (!ready) return null;
  return (
    <AppShell role="customer" title="My Profile">
      {me ? (
        <div className="space-y-3">
          <div className="rounded-2xl p-5 bg-white border border-border space-y-2">
            <Row label="Name" value={me.name} />
            <Row label="Area" value={me.area} />
            <Row label="Phone" value={me.phone} />
          </div>
          <InstallButton className="w-full h-12 rounded-xl" size="lg" variant="outline" />
        </div>
      ) : <p className="text-sm text-muted-foreground">Loading...</p>}
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
