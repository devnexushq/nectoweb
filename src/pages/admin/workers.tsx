import { useCallback, useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import RequireAdmin from "@/components/admin/RequireAdmin";
import DataTable, { Column } from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import ApprovalActions from "@/components/admin/ApprovalActions";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Worker = Tables<"workers">;
const STATUSES = ["all", "pending", "approved", "suspended", "rejected"];

export default function AdminWorkers() {
  const [rows, setRows] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    let q = supabase
      .from("workers")
      .select("*")
      .order("registered_at", { ascending: false })
      .limit(1000);
    if (filter !== "all") q = q.eq("approval_status", filter);
    const { data, error } = await q;
    if (error) {
      setLoadError(error.message || "Could not load workers.");
    }
    setRows((data as Worker[]) ?? []);
    setLoading(false);
  }, [filter]);
  useEffect(() => {
    void load();
  }, [load]);

  const columns: Column<Worker>[] = [
    { key: "name", header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "phone", header: "Phone", render: (r) => r.phone },
    { key: "cat", header: "Category", render: (r) => r.job_type },
    { key: "area", header: "Area", render: (r) => r.area },
    {
      key: "pin",
      header: "PIN",
      render: (r) => <span className="text-xs font-mono">{r.pincode ?? "—"}</span>,
    },
    {
      key: "vis",
      header: "Visibility",
      render: (r) => (
        <span
          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
            r.visibility === "all_india"
              ? "bg-purple-100 text-purple-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {r.visibility === "all_india" ? "All India" : "Local"}
        </span>
      ),
    },
    {
      key: "reg",
      header: "Registered",
      render: (r) => new Date(r.registered_at).toLocaleDateString(),
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.approval_status} /> },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <ApprovalActions
          table="workers"
          id={r.id}
          currentStatus={r.approval_status}
          onStatusUpdated={load}
        />
      ),
    },
  ];

  return (
    <RequireAdmin>
      <AdminLayout title="Workers">
        {loadError && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {loadError}
          </div>
        )}
        <DataTable
          rows={rows}
          columns={columns}
          loading={loading}
          searchPlaceholder="Search workers by name, phone, category, area, PIN..."
          searchFields={(r) =>
            `${r.name} ${r.phone} ${r.job_type} ${r.area} ${r.pincode ?? ""} ${r.visibility ?? ""}`
          }
          filters={
            <div className="flex gap-1.5 flex-wrap">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-3 h-9 rounded-md text-xs font-medium border capitalize ${
                    filter === s
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          }
        />
      </AdminLayout>
    </RequireAdmin>
  );
}
