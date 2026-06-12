import { useCallback, useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import RequireAdmin from "@/components/admin/RequireAdmin";
import DataTable, { Column } from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Worker = Tables<"workers">;
const STATUSES = ["all", "approved", "rejected", "suspended"];

export default function AdminWorkers() {
  const [rows, setRows] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("workers").select("*").order("registered_at", { ascending: false }).limit(1000);
    if (filter !== "all") q = q.eq("approval_status", filter);
    const { data } = await q;
    setRows((data as Worker[]) ?? []);
    setLoading(false);
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  const columns: Column<Worker>[] = [
    { key: "name", header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "phone", header: "Phone", render: (r) => r.phone },
    { key: "cat", header: "Category", render: (r) => r.job_type },
    { key: "area", header: "Area", render: (r) => r.area },
    { key: "reg", header: "Registered", render: (r) => new Date(r.registered_at).toLocaleDateString() },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.approval_status} /> },
  ];

  return (
    <RequireAdmin>
      <AdminLayout title="Workers">
        <DataTable
          rows={rows} columns={columns} loading={loading}
          searchPlaceholder="Search workers..."
          searchFields={(r) => `${r.name} ${r.phone} ${r.job_type} ${r.area}`}
          filters={
            <div className="flex gap-1.5 flex-wrap">
              {STATUSES.map((s) => (
                <button key={s} onClick={() => setFilter(s)}
                  className={`px-3 h-9 rounded-md text-xs font-medium border capitalize ${
                    filter === s ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}>{s}</button>
              ))}
            </div>
          }
        />
      </AdminLayout>
    </RequireAdmin>
  );
}
