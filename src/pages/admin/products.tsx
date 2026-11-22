import { useCallback, useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import RequireAdmin from "@/components/admin/RequireAdmin";
import DataTable, { Column } from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { adminApi } from "@/lib/admin/api";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

type Row = {
  id: string;
  name: string;
  price: number;
  created_at: string;
  visibility: string;
  shop_id: string;
  shop_name?: string;
};

export default function AdminProducts() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase
      .from("products")
      .select("id, name, price, created_at, visibility, shop_id, shops(shop_name)")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) {
      setLoadError(error.message || "Could not load products.");
    }
    const mapped: Row[] = (data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      created_at: p.created_at,
      visibility: (p as { visibility?: string }).visibility ?? "visible",
      shop_id: p.shop_id,
      shop_name: (p as { shops?: { shop_name?: string } }).shops?.shop_name,
    }));
    setRows(mapped);
    setLoading(false);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (id: string, visibility: string) => {
    setBusy(id);
    try {
      await adminApi.setProductVisibility(id, visibility === "hidden" ? "visible" : "hidden");
      toast.success("Updated");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Product",
      render: (r) => <span className="font-medium">{r.name}</span>,
    },
    { key: "shop", header: "Shop", render: (r) => r.shop_name ?? "—" },
    { key: "price", header: "Price", render: (r) => `₹${r.price}` },
    {
      key: "created",
      header: "Created",
      render: (r) => new Date(r.created_at).toLocaleDateString(),
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.visibility} /> },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <Button
          size="sm"
          variant="outline"
          className="h-7"
          disabled={busy === r.id}
          onClick={() => toggle(r.id, r.visibility)}
        >
          {r.visibility === "hidden" ? (
            <>
              <Eye className="h-3.5 w-3.5 mr-1" /> Restore
            </>
          ) : (
            <>
              <EyeOff className="h-3.5 w-3.5 mr-1" /> Hide
            </>
          )}
        </Button>
      ),
    },
  ];

  return (
    <RequireAdmin>
      <AdminLayout title="Products">
        {loadError && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {loadError}
          </div>
        )}
        <DataTable
          rows={rows}
          columns={columns}
          loading={loading}
          searchPlaceholder="Search products..."
          searchFields={(r) => `${r.name} ${r.shop_name ?? ""}`}
        />
      </AdminLayout>
    </RequireAdmin>
  );
}
