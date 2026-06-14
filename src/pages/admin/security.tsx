import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import RequireAdmin from "@/components/admin/RequireAdmin";
import StatusBadge from "@/components/admin/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Lock, AlertTriangle, Activity } from "lucide-react";

type ActivityRow = { id: string; action: string; entity_type: string | null; actor_email: string | null; created_at: string };

export default function AdminSecurity() {
  const [recent, setRecent] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("activity_logs").select("id,action,entity_type,actor_email,created_at").order("created_at", { ascending: false }).limit(12).then(({ data }) => {
      setRecent((data as ActivityRow[]) ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <RequireAdmin>
      <AdminLayout title="Security Center">
        <div className="grid gap-4 md:grid-cols-3">
          <SecurityCard icon={ShieldCheck} title="Admin route protection" status="Active" tone="emerald" body="Admin pages are guarded by Supabase session and admin role checks." />
          <SecurityCard icon={Lock} title="Secret exposure" status="Blocked" tone="cyan" body="No service role keys, JWT secrets, database passwords, or environment values are rendered." />
          <SecurityCard icon={AlertTriangle} title="Risk monitor" status="Normal" tone="amber" body="Review audit logs for unusual admin actions, traffic spikes, and suspicious records." />
        </div>
        <section className="mt-6 rounded-2xl border border-white/70 bg-white/90 p-4 shadow-xl shadow-slate-200/70">
          <div className="mb-3 flex items-center gap-2"><Activity className="h-4 w-4 text-slate-500" /><h2 className="text-sm font-semibold">Recent security-relevant activity</h2></div>
          <div className="divide-y divide-slate-100">
            {loading ? <div className="py-8 text-sm text-slate-500">Loading...</div> : recent.length === 0 ? <div className="py-8 text-sm text-slate-500">No activity yet</div> : recent.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                <StatusBadge status={r.action} />
                <span className="font-medium">{r.entity_type ?? "system"}</span>
                <span className="text-slate-500">{r.actor_email ?? "system"}</span>
                <span className="ml-auto text-xs text-slate-500">{new Date(r.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </section>
      </AdminLayout>
    </RequireAdmin>
  );
}

function SecurityCard({ icon: Icon, title, status, body, tone }: { icon: any; title: string; status: string; body: string; tone: "emerald" | "cyan" | "amber" }) {
  const colors = { emerald: "from-emerald-400 to-teal-400", cyan: "from-cyan-400 to-blue-400", amber: "from-amber-300 to-orange-400" };
  return (
    <div className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-200/70 transition hover:-translate-y-1">
      <div className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${colors[tone]} text-white shadow-lg`}><Icon className="h-5 w-5" /></div>
      <div className="text-sm font-semibold text-slate-950">{title}</div>
      <div className="mt-1 text-2xl font-black">{status}</div>
      <p className="mt-2 text-sm text-slate-500">{body}</p>
    </div>
  );
}
