import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import RequireAdmin from "@/components/admin/RequireAdmin";
import DataTable, { Column } from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import { supabase } from "@/integrations/supabase/client";

type Row = {
  id: string;
  actor_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: unknown;
  created_at: string;
};

export default function AdminActivity() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadError(null);
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (cancelled) return;
      if (error) {
        setLoadError(error.message || "Could not load activity log.");
      }
      setRows((data as Row[]) ?? []);
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const columns: Column<Row>[] = [
    { key: "time", header: "When", render: (r) => new Date(r.created_at).toLocaleString() },
    { key: "action", header: "Action", render: (r) => <StatusBadge status={r.action} /> },
    { key: "entity", header: "Entity", render: (r) => `${r.entity_type ?? "—"}` },
    {
      key: "id",
      header: "Entity ID",
      render: (r) => (
        <code className="text-[11px] text-slate-500">{r.entity_id?.slice(0, 8) ?? "—"}</code>
      ),
    },
    { key: "actor", header: "Actor", render: (r) => r.actor_email ?? "system" },
    {
      key: "meta",
      header: "Details",
      render: (r) => (
        <code className="text-[11px] text-slate-500 max-w-xs truncate inline-block align-middle">
          {JSON.stringify(r.metadata)}
        </code>
      ),
    },
  ];

  return (
    <RequireAdmin>
      <AdminLayout title="Activity log">
        {loadError && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {loadError}
          </div>
        )}
        <DataTable
          rows={rows}
          columns={columns}
          loading={loading}
          searchPlaceholder="Search action, entity, actor..."
          searchFields={(r) => `${r.action} ${r.entity_type ?? ""} ${r.actor_email ?? ""}`}
        />
      </AdminLayout>
    </RequireAdmin>
  );
}
