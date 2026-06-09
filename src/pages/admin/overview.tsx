import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import RequireAdmin from "@/components/admin/RequireAdmin";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, Hammer, Store, Package, LifeBuoy, Clock,
  CheckCircle2, XCircle, UserPlus, Activity,
} from "lucide-react";

type Counts = {
  customers: number; workers: number; shops: number; products: number;
  support: number; pending: number; approved: number; rejected: number; today: number;
};

type ActivityRow = {
  id: string; action: string; entity_type: string | null; entity_id: string | null;
  actor_email: string | null; created_at: string;
};

export default function AdminOverview() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [recent, setRecent] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const head = { count: "exact" as const, head: true };
      const startToday = new Date(); startToday.setHours(0, 0, 0, 0);
      const todayIso = startToday.toISOString();

      const [c, w, s, p, sq, pend, app, rej, todayC, todayW, todayS, act] = await Promise.all([
        supabase.from("customers").select("*", head),
        supabase.from("workers").select("*", head),
        supabase.from("shops").select("*", head),
        supabase.from("products").select("*", head),
        supabase.from("support_queries").select("*", head),
        supabase.from("customers").select("*", head).eq("approval_status", "pending"),
        supabase.from("customers").select("*", head).eq("approval_status", "approved"),
        supabase.from("customers").select("*", head).eq("approval_status", "rejected"),
        supabase.from("customers").select("*", head).gte("created_at", todayIso),
        supabase.from("workers").select("*", head).gte("registered_at", todayIso),
        supabase.from("shops").select("*", head).gte("registered_at", todayIso),
        supabase.from("activity_logs").select("id,action,entity_type,entity_id,actor_email,created_at")
          .order("created_at", { ascending: false }).limit(10),
      ]);

      const pendAll = await Promise.all([
        supabase.from("workers").select("*", head).eq("approval_status", "pending"),
        supabase.from("shops").select("*", head).eq("approval_status", "pending"),
      ]);
      const appAll = await Promise.all([
        supabase.from("workers").select("*", head).eq("approval_status", "approved"),
        supabase.from("shops").select("*", head).eq("approval_status", "approved"),
      ]);
      const rejAll = await Promise.all([
        supabase.from("workers").select("*", head).eq("approval_status", "rejected"),
        supabase.from("shops").select("*", head).eq("approval_status", "rejected"),
      ]);

      setCounts({
        customers: c.count ?? 0,
        workers: w.count ?? 0,
        shops: s.count ?? 0,
        products: p.count ?? 0,
        support: sq.count ?? 0,
        pending: (pend.count ?? 0) + (pendAll[0].count ?? 0) + (pendAll[1].count ?? 0),
        approved: (app.count ?? 0) + (appAll[0].count ?? 0) + (appAll[1].count ?? 0),
        rejected: (rej.count ?? 0) + (rejAll[0].count ?? 0) + (rejAll[1].count ?? 0),
        today: (todayC.count ?? 0) + (todayW.count ?? 0) + (todayS.count ?? 0),
      });
      setRecent((act.data as ActivityRow[]) ?? []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <RequireAdmin>
      <AdminLayout title="Overview">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
          <StatCard label="Customers" value={loading ? "—" : counts!.customers} icon={Users} accent="bg-indigo-50 text-indigo-600" />
          <StatCard label="Workers" value={loading ? "—" : counts!.workers} icon={Hammer} accent="bg-amber-50 text-amber-600" />
          <StatCard label="Shops" value={loading ? "—" : counts!.shops} icon={Store} accent="bg-sky-50 text-sky-600" />
          <StatCard label="Products" value={loading ? "—" : counts!.products} icon={Package} accent="bg-purple-50 text-purple-600" />
          <StatCard label="Support" value={loading ? "—" : counts!.support} icon={LifeBuoy} accent="bg-rose-50 text-rose-600" />
          <StatCard label="Pending" value={loading ? "—" : counts!.pending} icon={Clock} accent="bg-amber-50 text-amber-600" />
          <StatCard label="Approved" value={loading ? "—" : counts!.approved} icon={CheckCircle2} accent="bg-emerald-50 text-emerald-600" />
          <StatCard label="Rejected" value={loading ? "—" : counts!.rejected} icon={XCircle} accent="bg-rose-50 text-rose-600" />
          <StatCard label="New today" value={loading ? "—" : counts!.today} icon={UserPlus} accent="bg-slate-100 text-slate-700" />
        </div>

        <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-500" />
            <h2 className="text-sm font-semibold">Recent activity</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {recent.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">No activity yet</div>
            ) : recent.map((r) => (
              <div key={r.id} className="px-4 py-3 flex items-center gap-3 text-sm">
                <StatusBadge status={r.action.replace("_change","")} />
                <div className="flex-1 min-w-0 truncate">
                  <span className="font-medium">{r.action.replaceAll("_"," ")}</span>
                  {r.entity_type && <span className="text-slate-500"> · {r.entity_type}</span>}
                  {r.actor_email && <span className="text-slate-500"> · {r.actor_email}</span>}
                </div>
                <div className="text-xs text-slate-500 whitespace-nowrap">
                  {new Date(r.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </AdminLayout>
    </RequireAdmin>
  );
}
