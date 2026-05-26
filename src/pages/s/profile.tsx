import { useEffect, useMemo, useState } from "react";
import { Lock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/lib/role";
import { editLockDaysLeft } from "@/routes/w/profile";



export default function ShopProfilePage() {
  const ready = useRoleGuard("shop");
  const [me, setMe] = useState<any>(null);
  useEffect(() => {
    const id = getUserId(); if (!id) return;
    supabase.from("shops").select("*").eq("id", id).maybeSingle().then(({ data }) => setMe(data));
  }, []);
  const lock = useMemo(() => editLockDaysLeft(me?.registered_at), [me]);
  if (!ready) return null;
  return (
    <AppShell role="shop" title="My Profile">
      {me ? (
        <div className="space-y-3">
          <div className="rounded-2xl p-5 bg-white border border-border space-y-2">
            <Row label="Shop Name" value={me.shop_name} />
            <Row label="Owner" value={me.owner_name} />
            <Row label="Category" value={me.category} />
            <Row label="Phone" value={me.phone} />
            <Row label="WhatsApp" value={me.whatsapp} />
            <Row label="Area" value={me.area} />
            <Row label="Visibility" value={me.visibility === "local" ? "Local Only" : "All India"} />
            <Row label="Description" value={me.description ?? "—"} />
          </div>
          <button disabled={lock > 0} className="w-full h-12 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-60 inline-flex items-center justify-center gap-2">
            {lock > 0 ? <><Lock className="h-4 w-4" /> Edit unlocks in {lock} day{lock === 1 ? "" : "s"}</> : "Edit Profile"}
          </button>
        </div>
      ) : <p className="text-sm text-muted-foreground">Loading...</p>}
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-right max-w-[60%]">{value}</span>
    </div>
  );
}
