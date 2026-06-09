import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import RequireAdmin from "@/components/admin/RequireAdmin";
import StatCard from "@/components/admin/StatCard";
import { supabase } from "@/integrations/supabase/client";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Users, Hammer, Store, Package, LifeBuoy } from "lucide-react";

type DayRow = { date: string; customers: number; workers: number; shops: number };

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b", approved: "#10b981", rejected: "#ef4444", suspended: "#64748b",
};

export default function AdminAnalytics() {
  const [counts, setCounts] = useState({ c: 0, w: 0, s: 0, p: 0, sq: 0 });
  const [growth, setGrowth] = useState<DayRow[]>([]);
  const [approvals, setApprovals] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const head = { count: "exact" as const, head: true };
      const since = new Date(); since.setDate(since.getDate() - 29); since.setHours(0,0,0,0);
      const sinceIso = since.toISOString();

      const [c, w, s, p, sq, custRows, wRows, sRows, pendC, appC, rejC, susC, pendW, appW, rejW, susW, pendS, appS, rejS, susS]
        = await Promise.all([
        supabase.from("customers").select("*", head),
        supabase.from("workers").select("*", head),
        supabase.from("shops").select("*", head),
        supabase.from("products").select("*", head),
        supabase.from("support_queries").select("*", head),
        supabase.from("customers").select("created_at").gte("created_at", sinceIso),
        supabase.from("workers").select("registered_at").gte("registered_at", sinceIso),
        supabase.from("shops").select("registered_at").gte("registered_at", sinceIso),
        supabase.from("customers").select("*", head).eq("approval_status", "pending"),
        supabase.from("customers").select("*", head).eq("approval_status", "approved"),
        supabase.from("customers").select("*", head).eq("approval_status", "rejected"),
        supabase.from("customers").select("*", head).eq("approval_status", "suspended"),
        supabase.from("workers").select("*", head).eq("approval_status", "pending"),
        supabase.from("workers").select("*", head).eq("approval_status", "approved"),
        supabase.from("workers").select("*", head).eq("approval_status", "rejected"),
        supabase.from("workers").select("*", head).eq("approval_status", "suspended"),
        supabase.from("shops").select("*", head).eq("approval_status", "pending"),
        supabase.from("shops").select("*", head).eq("approval_status", "approved"),
        supabase.from("shops").select("*", head).eq("approval_status", "rejected"),
        supabase.from("shops").select("*", head).eq("approval_status", "suspended"),
      ]);

      setCounts({ c: c.count ?? 0, w: w.count ?? 0, s: s.count ?? 0, p: p.count ?? 0, sq: sq.count ?? 0 });

      // Build last 30 days bucket
      const bucket: Record<string, DayRow> = {};
      for (let i = 0; i < 30; i++) {
        const d = new Date(since); d.setDate(since.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        bucket[key] = { date: key.slice(5), customers: 0, workers: 0, shops: 0 };
      }
      const bump = (iso: string, k: "customers" | "workers" | "shops") => {
        const key = iso.slice(0, 10);
        if (bucket[key]) bucket[key][k]++;
      };
      (custRows.data ?? []).forEach((r: { created_at: string }) => bump(r.created_at, "customers"));
      (wRows.data ?? []).forEach((r: { registered_at: string }) => bump(r.registered_at, "workers"));
      (sRows.data ?? []).forEach((r: { registered_at: string }) => bump(r.registered_at, "shops"));
      setGrowth(Object.values(bucket));

      setApprovals([
        { name: "pending",   value: (pendC.count ?? 0) + (pendW.count ?? 0) + (pendS.count ?? 0) },
        { name: "approved",  value: (appC.count ?? 0)  + (appW.count ?? 0)  + (appS.count ?? 0) },
        { name: "rejected",  value: (rejC.count ?? 0)  + (rejW.count ?? 0)  + (rejS.count ?? 0) },
        { name: "suspended", value: (susC.count ?? 0)  + (susW.count ?? 0)  + (susS.count ?? 0) },
      ]);

      setLoading(false);
    };
    load();
  }, []);

  return (
    <RequireAdmin>
      <AdminLayout title="Analytics">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          <StatCard label="Customers" value={loading ? "—" : counts.c} icon={Users} accent="bg-indigo-50 text-indigo-600" />
          <StatCard label="Workers" value={loading ? "—" : counts.w} icon={Hammer} accent="bg-amber-50 text-amber-600" />
          <StatCard label="Shops" value={loading ? "—" : counts.s} icon={Store} accent="bg-sky-50 text-sky-600" />
          <StatCard label="Products" value={loading ? "—" : counts.p} icon={Package} accent="bg-purple-50 text-purple-600" />
          <StatCard label="Support" value={loading ? "—" : counts.sq} icon={LifeBuoy} accent="bg-rose-50 text-rose-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <h2 className="text-sm font-semibold mb-3">Registration growth (last 30 days)</h2>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={growth}>
                  <CartesianGrid stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" fontSize={11} stroke="#94a3b8" />
                  <YAxis allowDecimals={false} fontSize={11} stroke="#94a3b8" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="customers" stackId="a" fill="#6366f1" />
                  <Bar dataKey="workers" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="shops" stackId="a" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <h2 className="text-sm font-semibold mb-3">Approval status breakdown</h2>
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={approvals} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                    {approvals.map((a) => <Cell key={a.name} fill={STATUS_COLORS[a.name]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </AdminLayout>
    </RequireAdmin>
  );
}
