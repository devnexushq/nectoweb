import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Phone, MessageCircle, Users, User } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/lib/role";



export default function WorkerDashboard() {
  const ready = useRoleGuard("worker");
  const [me, setMe] = useState<any>(null);
  const [stats, setStats] = useState({ total: 0, wa: 0, call: 0 });

  useEffect(() => {
    const id = getUserId();
    if (!id) return;
    (async () => {
      const [{ data: w }, { data: logs }] = await Promise.all([
        supabase.from("workers").select("*").eq("id", id).maybeSingle(),
        supabase.from("contacts_log").select("contact_type").eq("to_id", id).eq("to_type", "worker"),
      ]);
      setMe(w);
      const total = logs?.length ?? 0;
      const wa = logs?.filter((l) => l.contact_type === "whatsapp").length ?? 0;
      setStats({ total, wa, call: total - wa });
    })();
  }, []);

  if (!ready) return null;
  return (
    <AppShell role="worker" title="Dashboard">
      <h2 className="text-xl font-bold">Welcome back{me?.name ? `, ${me.name.split(" ")[0]}` : ""} 👋</h2>
      <p className="text-sm text-muted-foreground">Here's how customers are reaching you.</p>

      <div className="grid grid-cols-3 gap-3 mt-4">
        <Stat icon={Users} label="Total" value={stats.total} />
        <Stat icon={MessageCircle} label="WhatsApp" value={stats.wa} accent />
        <Stat icon={Phone} label="Calls" value={stats.call} />
      </div>

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
    <div className={`rounded-2xl p-3 border ${accent ? "bg-accent/10 border-accent/30" : "bg-white border-border"}`}>
      <Icon className={`h-5 w-5 ${accent ? "text-accent" : "text-primary"}`} />
      <div className="text-2xl font-extrabold mt-2">{value}</div>
      <div className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</div>
    </div>
  );
}
function QuickAction({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="rounded-xl p-4 bg-white border border-border hover:border-primary text-sm font-semibold text-foreground">
      {label}
    </Link>
  );
}
