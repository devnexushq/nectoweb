import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/lib/role";
import { withTimeout } from "@/lib/safeAsync";
import { InstallButton } from "@/components/InstallButton";
import { ProfileActions } from "@/components/ProfileActions";
import { LegalInfoSection } from "@/components/LegalInfoSection";

export default function CustomerProfile() {
  const ready = useRoleGuard("customer");
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const id = getUserId();
    if (!id) {
      setLoading(false);
      return;
    }
    withTimeout(supabase.from("customers").select("*").eq("id", id).maybeSingle()).then((result) => {
      setMe(result?.data ?? null);
      setLoading(false);
    });
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
          <ProfileActions role="customer" me={me} lockDaysLeft={0} onUpdated={setMe} middleSlot={<LegalInfoSection />} />
          <InstallButton className="w-full h-12 rounded-xl" size="lg" variant="outline" />
        </div>
      ) : <p className="text-sm text-muted-foreground">{loading ? "Loading..." : "Profile not found."}</p>}
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
