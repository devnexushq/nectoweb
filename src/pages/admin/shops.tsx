import { useCallback, useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import RequireAdmin from "@/components/admin/RequireAdmin";
import DataTable, { Column } from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import ApprovalActions from "@/components/admin/ApprovalActions";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Shop = Tables<"shops">;
const STATUSES = ["all", "pending", "approved", "rejected", "suspended"];

export default function AdminShops() {
  const [rows, setRows] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("shops").select("*").order("registered_at", { ascending: false }).limit(1000);
    if (filter !== "all") q = q.eq("approval_status", filter);
    const { data } = await q;
    setRows((data as Shop[]) ?? []);
    setLoading(false);
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  const columns: Column<Shop>[] = [
    { key: "name", header: "Shop", render: (r) => <span className="font-medium">{r.shop_name}</span> },
    { key: "owner", header: "Owner", render: (r) => r.owner_name },
    { key: "phone", header: "Phone", render: (r) => r.phone },
    { key: "area", header: "Area", render: (r) => r.area },
    { key: "reg", header: "Registered", render: (r) => new Date(r.registered_at).toLocaleDateString() },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.approval_status} /> },
    { key: "actions", header: "Actions",
      render: (r) => <ApprovalActions entity="shop" id={r.id} currentStatus={r.approval_status} onChanged={load} /> },
  ];

  return (
    <RequireAdmin>
      <AdminLayout title="Shops">
        <DataTable
          rows={rows} columns={columns} loading={loading}
          searchPlaceholder="Search shops..."
          searchFields={(r) => `${r.shop_name} ${r.owner_name} ${r.phone} ${r.area} ${r.category}`}
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
