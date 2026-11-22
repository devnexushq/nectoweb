import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/lib/role";
import { withTimeout } from "@/lib/safeAsync";
import { InstallButton } from "@/components/InstallButton";
import { ProfileActions } from "@/components/ProfileActions";
import { LegalInfoSection } from "@/components/LegalInfoSection";

export default function WorkerProfile() {
  const ready = useRoleGuard("worker");
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    const id = getUserId();
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    withTimeout(supabase.from("workers").select("*").eq("id", id).maybeSingle()).then((result) => {
      if (cancelled) return;
      if (!result || result.error) {
        setLoadError("Could not load profile. Please check your connection.");
        setLoading(false);
        return;
      }
      setMe(result.data ?? null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [reloadTick]);

  const lock = useMemo(() => editLockDaysLeft(me?.registered_at), [me]);

  if (!ready) return null;
  return (
    <AppShell role="worker" title="My Profile">
      {me ? (
        <div className="space-y-3">
          <div className="rounded-2xl p-5 bg-white border border-border space-y-2">
            <Row label="Name" value={me.name} />
            <Row label="Job Type" value={me.job_type} />
            <Row label="Experience" value={`${me.experience} years`} />
            <Row label="Phone" value={me.phone} />
            <Row label="WhatsApp" value={me.whatsapp} />
            <Row label="Area" value={me.area} />
            {me.pincode && <Row label="PIN Code" value={me.pincode} />}
            <Row
              label="Visibility"
              value={
                me.visibility === "local"
                  ? "Local Only"
                  : me.visibility === "all_india"
                    ? "All India"
                    : "Not Set"
              }
            />
            <Row label="Description" value={me.description ?? "—"} />
          </div>
          <ProfileActions
            role="worker"
            me={me}
            lockDaysLeft={lock}
            onUpdated={setMe}
            middleSlot={<LegalInfoSection />}
          />
          <InstallButton className="w-full h-12 rounded-xl" size="lg" variant="outline" />
        </div>
      ) : loadError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-center space-y-3">
          <p className="text-sm font-medium text-destructive">{loadError}</p>
          <button
            type="button"
            onClick={() => setReloadTick((t) => t + 1)}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-white hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading..." : "Profile not found."}
        </p>
      )}
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

export function editLockDaysLeft(registeredAt?: string): number {
  if (!registeredAt) return 0;
  const ms = new Date(registeredAt).getTime() + 7 * 24 * 60 * 60 * 1000 - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}
