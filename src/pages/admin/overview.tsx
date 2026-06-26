import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import RequireAdmin from "@/components/admin/RequireAdmin";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, Hammer, Store, Package, LifeBuoy, Phone, MessageCircle,
  TrendingUp, UserPlus, Activity, Target, Clock,
} from "lucide-react";

type Counts = {
  customers: number; workers: number; shops: number; products: number; support: number;
  today: number; week: number; month: number; calls: number; whatsapp: number;
};

type ActivityRow = { id: string; action: string; entity_type: string | null; entity_id: string | null; actor_email: string | null; created_at: string; };
type RecentRegistration = {
  id: string;
  type: "Customer" | "Worker" | "Shop";
  name: string;
  category: string;
  area: string;
  status: string;
  createdAt: string;
};

type CustomerRow = { id: string; name: string; area: string | null; approval_status: string | null; created_at: string; };
type WorkerRow = { id: string; name: string; job_type: string | null; area: string | null; approval_status: string | null; registered_at: string; };
type ShopRow = { id: string; shop_name: string; category: string | null; area: string | null; approval_status: string | null; registered_at: string; };

export default function AdminOverview() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [recent, setRecent] = useState<ActivityRow[]>([]);
  const [latestRegistrations, setLatestRegistrations] = useState<RecentRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const head = { count: "exact" as const, head: true };
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const week = new Date(); week.setDate(week.getDate() - 7);
      const month = new Date(); month.setDate(month.getDate() - 30);
      const [
        c, w, s, p, sq,
        todayC, todayW, todayS,
        weekC, weekW, weekS,
        monthC, monthW, monthS,
        logs, act,
        latestC, latestW, latestS,
      ] = await Promise.all([
        supabase.from("customers").select("*", head),
        supabase.from("workers").select("*", head),
        supabase.from("shops").select("*", head),
        supabase.from("products").select("*", head),
        supabase.from("support_queries").select("*", head),
        supabase.from("customers").select("*", head).gte("created_at", today.toISOString()),
        supabase.from("workers").select("*", head).gte("registered_at", today.toISOString()),
        supabase.from("shops").select("*", head).gte("registered_at", today.toISOString()),
        supabase.from("customers").select("*", head).gte("created_at", week.toISOString()),
        supabase.from("workers").select("*", head).gte("registered_at", week.toISOString()),
        supabase.from("shops").select("*", head).gte("registered_at", week.toISOString()),
        supabase.from("customers").select("*", head).gte("created_at", month.toISOString()),
        supabase.from("workers").select("*", head).gte("registered_at", month.toISOString()),
        supabase.from("shops").select("*", head).gte("registered_at", month.toISOString()),
        supabase.from("contacts_log").select("contact_type"),
        supabase.from("activity_logs").select("id,action,entity_type,entity_id,actor_email,created_at").order("created_at", { ascending: false }).limit(10),
        supabase.from("customers").select("id,name,area,approval_status,created_at").order("created_at", { ascending: false }).limit(6),
        supabase.from("workers").select("id,name,job_type,area,approval_status,registered_at").order("registered_at", { ascending: false }).limit(6),
        supabase.from("shops").select("id,shop_name,category,area,approval_status,registered_at").order("registered_at", { ascending: false }).limit(6),
      ]);
      const contactRows = logs.data ?? [];
      const registrationRows: RecentRegistration[] = [
        ...((latestC.data as CustomerRow[] | null) ?? []).map((row) => ({
          id: row.id,
          type: "Customer" as const,
          name: row.name,
          category: "Customer",
          area: row.area ?? "—",
          status: row.approval_status ?? "approved",
          createdAt: row.created_at,
        })),
        ...((latestW.data as WorkerRow[] | null) ?? []).map((row) => ({
          id: row.id,
          type: "Worker" as const,
          name: row.name,
          category: row.job_type ?? "Worker",
          area: row.area ?? "—",
          status: row.approval_status ?? "approved",
          createdAt: row.registered_at,
        })),
        ...((latestS.data as ShopRow[] | null) ?? []).map((row) => ({
          id: row.id,
          type: "Shop" as const,
          name: row.shop_name,
          category: row.category ?? "Shop",
          area: row.area ?? "—",
          status: row.approval_status ?? "approved",
          createdAt: row.registered_at,
        })),
      ]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);

      setCounts({
        customers: c.count ?? 0, workers: w.count ?? 0, shops: s.count ?? 0, products: p.count ?? 0, support: sq.count ?? 0,
        today: (todayC.count ?? 0) + (todayW.count ?? 0) + (todayS.count ?? 0),
        week: (weekC.count ?? 0) + (weekW.count ?? 0) + (weekS.count ?? 0),
        month: (monthC.count ?? 0) + (monthW.count ?? 0) + (monthS.count ?? 0),
        calls: contactRows.filter((l: any) => l.contact_type === "call").length,
        whatsapp: contactRows.filter((l: any) => l.contact_type === "whatsapp").length,
      });
      setRecent((act.data as ActivityRow[]) ?? []);
      setLatestRegistrations(registrationRows);
      setLoading(false);
    };
    load();
  }, []);

  const totalUsers = counts ? counts.customers + counts.workers + counts.shops : 0;

  return (
    <RequireAdmin>
      <AdminLayout title="Overview">
        <div className="mb-6 rounded-3xl border border-white/70 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300/70">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Necto command center</p><h2 className="mt-2 text-3xl font-black tracking-tight">Platform pulse, growth, and operations</h2></div><div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-200">Live admin-safe metrics</div></div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5 md:gap-4">
          <StatCard label="Total users" value={loading ? "—" : totalUsers} icon={Users} hint="All roles" accent="bg-indigo-50 text-indigo-600" />
          <StatCard label="Customers" value={loading ? "—" : counts!.customers} icon={Users} accent="bg-indigo-50 text-indigo-600" />
          <StatCard label="Workers" value={loading ? "—" : counts!.workers} icon={Hammer} accent="bg-amber-50 text-amber-600" />
          <StatCard label="Shops" value={loading ? "—" : counts!.shops} icon={Store} accent="bg-sky-50 text-sky-600" />
          <StatCard label="Products" value={loading ? "—" : counts!.products} icon={Package} accent="bg-purple-50 text-purple-600" />
          <StatCard label="New today" value={loading ? "—" : counts!.today} icon={UserPlus} hint="Daily growth" accent="bg-emerald-50 text-emerald-600" />
          <StatCard label="Weekly growth" value={loading ? "—" : counts!.week} icon={TrendingUp} accent="bg-cyan-50 text-cyan-600" />
          <StatCard label="Monthly growth" value={loading ? "—" : counts!.month} icon={Target} accent="bg-slate-100 text-slate-700" />
          <StatCard label="Calls" value={loading ? "—" : counts!.calls} icon={Phone} accent="bg-rose-50 text-rose-600" />
          <StatCard label="WhatsApp" value={loading ? "—" : counts!.whatsapp} icon={MessageCircle} accent="bg-emerald-50 text-emerald-600" />
          <StatCard label="Support" value={loading ? "—" : counts!.support} icon={LifeBuoy} accent="bg-orange-50 text-orange-600" />
        </div>

        <div className="mt-6 rounded-2xl border border-white/70 bg-white/90 shadow-xl shadow-slate-200/70 backdrop-blur">
          <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3"><Clock className="h-4 w-4 text-slate-500" /><h2 className="text-sm font-semibold">Latest registrations</h2><span className="ml-auto text-xs text-slate-500">Customers, workers, and shops</span></div>
          <div className="divide-y divide-slate-100">
            {loading ? <div className="px-4 py-8 text-center text-sm text-slate-500">Loading latest registrations...</div> : latestRegistrations.length === 0 ? <div className="px-4 py-8 text-center text-sm text-slate-500">No registrations yet</div> : latestRegistrations.map((r) => (
              <div key={`${r.type}-${r.id}`} className="grid gap-2 px-4 py-3 text-sm md:grid-cols-[120px_1fr_160px_130px_150px] md:items-center">
                <StatusBadge status={r.type} />
                <div className="min-w-0"><div className="truncate font-semibold text-slate-950">{r.name}</div><div className="truncate text-xs text-slate-500">{r.category}</div></div>
                <div className="truncate text-slate-600">{r.area}</div>
                <StatusBadge status={r.status} />
                <div className="text-xs text-slate-500 md:text-right">{new Date(r.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/70 bg-white/90 shadow-xl shadow-slate-200/70 backdrop-blur">
          <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3"><Activity className="h-4 w-4 text-slate-500" /><h2 className="text-sm font-semibold">Recent activity feed</h2></div>
          <div className="divide-y divide-slate-100">
            {recent.length === 0 ? <div className="px-4 py-8 text-center text-sm text-slate-500">No activity yet</div> : recent.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3 text-sm"><StatusBadge status={r.action.replace("_change", "")} /><div className="min-w-0 flex-1 truncate"><span className="font-medium">{r.action.replaceAll("_", " ")}</span>{r.entity_type && <span className="text-slate-500"> · {r.entity_type}</span>}{r.actor_email && <span className="text-slate-500"> · {r.actor_email}</span>}</div><div className="whitespace-nowrap text-xs text-slate-500">{new Date(r.created_at).toLocaleString()}</div></div>
            ))}
          </div>
        </div>
      </AdminLayout>
    </RequireAdmin>
  );
}
