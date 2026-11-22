import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Phone, MessageCircle, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/lib/role";
import { TodaysUpdateCard } from "@/components/TodaysUpdateCard";

import { withTimeout } from "@/lib/safeAsync";

export default function WorkerDashboard() {
  const ready = useRoleGuard("worker");
  const [me, setMe] = useState<any>(null);
  const [stats, setStats] = useState({ total: 0, wa: 0, call: 0 });
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
    (async () => {
      const result = await withTimeout(
        Promise.all([
          supabase.from("workers").select("*").eq("id", id).maybeSingle(),
          supabase
            .from("contacts_log")
            .select("contact_type")
            .eq("to_id", id)
            .eq("to_type", "worker"),
        ]),
      );
      if (cancelled) return;
      if (!result) {
        setLoadError("Could not load dashboard data. Please check your connection.");
        setLoading(false);
        return;
      }
      const [wRes, logsRes] = result;
      if (wRes.error || logsRes.error) {
        setLoadError("Could not load your latest dashboard stats. Please retry.");
      }
      setMe(wRes.data ?? null);
      const logs = logsRes.data;
      const total = logs?.length ?? 0;
      const wa = logs?.filter((l) => l.contact_type === "whatsapp").length ?? 0;
      const call = logs?.filter((l) => l.contact_type === "call").length ?? 0;
      setStats({ total, wa, call });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadTick]);

  if (!ready) return null;
  return (
    <AppShell role="worker" title="Dashboard">
      <h2 className="text-xl font-bold">
        Welcome back{me?.name ? `, ${me.name.split(" ")[0]}` : ""} 👋
      </h2>
      <p className="text-sm text-muted-foreground">Here's how customers are reaching you.</p>

      {loadError && (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 flex items-center justify-between gap-3">
          <p className="text-xs sm:text-sm text-destructive font-medium">{loadError}</p>
          <button
            type="button"
            onClick={() => setReloadTick((t) => t + 1)}
            className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mt-4">
        <Stat icon={Users} label="Total" value={loading ? "—" : stats.total} />
        <Stat icon={MessageCircle} label="WhatsApp" value={loading ? "—" : stats.wa} accent />
        <Stat icon={Phone} label="Calls" value={loading ? "—" : stats.call} />
      </div>

      <TodaysUpdateCard
        table="workers"
        id={me?.id}
        initialUpdate={me?.latest_update}
        initialUpdateAt={me?.latest_update_at}
        onUpdateChanged={(latest_update, latest_update_at) => {
          setMe((prev: any) => ({ ...prev, latest_update, latest_update_at }));
        }}
      />

      <div className="mt-6 grid grid-cols-2 gap-3">
        <QuickAction to="/w/contacts" label="View Contacts" />
        <QuickAction to="/w/shops" label="Browse Shops" />
        <QuickAction to="/w/profile" label="My Profile" />
      </div>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value, accent }: any) {
  return (
    <div
      className={`rounded-2xl p-3 border ${accent ? "bg-accent/10 border-accent/30" : "bg-white border-border"}`}
    >
      <Icon className={`h-5 w-5 ${accent ? "text-accent" : "text-primary"}`} />
      <div className="text-2xl font-extrabold mt-2">{value}</div>
      <div className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</div>
    </div>
  );
}
function QuickAction({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="rounded-xl p-4 bg-white border border-border hover:border-primary text-sm font-semibold text-foreground"
    >
      {label}
    </Link>
  );
}
