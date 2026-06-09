import { useCallback, useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import RequireAdmin from "@/components/admin/RequireAdmin";
import DataTable, { Column } from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import ApprovalActions from "@/components/admin/ApprovalActions";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Customer = Tables<"customers">;

const STATUSES = ["all", "pending", "approved", "rejected", "suspended"];

export default function AdminCustomers() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("customers").select("*").order("created_at", { ascending: false }).limit(1000);
    if (filter !== "all") q = q.eq("approval_status", filter);
    const { data } = await q;
    setRows((data as Customer[]) ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const columns: Column<Customer>[] = [
    { key: "name", header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "phone", header: "Phone", render: (r) => r.phone },
    { key: "area", header: "Area", render: (r) => r.area },
    { key: "created", header: "Registered", render: (r) => new Date(r.created_at).toLocaleDateString() },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.approval_status} /> },
    { key: "terms", header: "Terms",
      render: (r) => r.terms_accepted
        ? <span className="text-xs text-emerald-700">Yes{r.terms_accepted_at ? ` · ${new Date(r.terms_accepted_at).toLocaleDateString()}` : ""}</span>
        : <span className="text-xs text-rose-700">No</span>
    },
    { key: "updated", header: "Updated", render: (r) => new Date(r.last_updated_at).toLocaleDateString() },
    { key: "actions", header: "Actions",
      render: (r) => <ApprovalActions entity="customer" id={r.id} currentStatus={r.approval_status} onChanged={load} />,
    },
  ];

  return (
    <RequireAdmin>
      <AdminLayout title="Customers">
        <DataTable
          rows={rows}
          columns={columns}
          loading={loading}
          searchPlaceholder="Search by name, phone, area..."
          searchFields={(r) => `${r.name} ${r.phone} ${r.area}`}
          filters={
            <div className="flex gap-1.5 flex-wrap">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-3 h-9 rounded-md text-xs font-medium border capitalize ${
                    filter === s ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >{s}</button>
              ))}
            </div>
          }
        />
      </AdminLayout>
    </RequireAdmin>
  );
}
