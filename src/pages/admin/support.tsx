import { useCallback, useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import RequireAdmin from "@/components/admin/RequireAdmin";
import DataTable, { Column } from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { adminApi, SupportStatus } from "@/lib/admin/api";
import { toast } from "sonner";

type Row = Tables<"support_queries">;
const STATUSES: SupportStatus[] = ["open", "in_progress", "resolved"];

export default function AdminSupport() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("support_queries").select("*").order("created_at", { ascending: false }).limit(1000);
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setRows((data as Row[]) ?? []);
    setLoading(false);
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  const update = async (id: string, status: SupportStatus) => {
    setBusy(id);
    try { await adminApi.updateSupport(id, status); toast.success("Updated"); load(); }
    catch (e) { toast.error((e as Error).message); }
    finally { setBusy(null); }
  };

  const columns: Column<Row>[] = [
    { key: "name", header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "phone", header: "Phone", render: (r) => r.phone },
    { key: "message", header: "Message", render: (r) => (
      <div className="max-w-md truncate" title={r.message}>{r.message}</div>
    )},
    { key: "created", header: "Created", render: (r) => new Date(r.created_at).toLocaleString() },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "actions", header: "Set status", render: (r) => (
      <select
        disabled={busy === r.id}
        value={r.status}
        onChange={(e) => update(r.id, e.target.value as SupportStatus)}
        className="h-8 text-xs border border-slate-200 rounded-md px-2 bg-white"
      >
        {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
      </select>
    )},
  ];

  return (
    <RequireAdmin>
      <AdminLayout title="Support requests">
        <DataTable
          rows={rows} columns={columns} loading={loading}
          searchPlaceholder="Search support..."
          searchFields={(r) => `${r.name} ${r.phone} ${r.message}`}
          filters={
            <div className="flex gap-1.5 flex-wrap">
              {["all", ...STATUSES].map((s) => (
                <button key={s} onClick={() => setFilter(s)}
                  className={`px-3 h-9 rounded-md text-xs font-medium border capitalize ${
                    filter === s ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}>{s.replace("_"," ")}</button>
              ))}
            </div>
          }
        />
      </AdminLayout>
    </RequireAdmin>
  );
}
