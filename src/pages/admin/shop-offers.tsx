import { useEffect, useState } from "react";
import { EyeOff, Send, Trash2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import RequireAdmin from "@/components/admin/RequireAdmin";
import StatusBadge from "@/components/admin/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import type { ShopOffer } from "@/lib/shopOffers";

const db = supabase as any;

type AdminOffer = ShopOffer & {
  shops?: { shop_name: string | null; area: string | null; category: string | null } | null;
};

export default function AdminShopOffers() {
  const [rows, setRows] = useState<AdminOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await db
      .from("activity_feed")
      .select("*, shops!activity_feed_linked_shop_id_fkey(shop_name, area, category)")
      .eq("type", "offer")
      .order("created_at", { ascending: false });
    if (error) setMessage(error.message);
    else setRows((data ?? []) as AdminOffer[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function setStatus(row: AdminOffer, status: "published" | "hidden") {
    const { error } = await db.from("activity_feed").update({ status, updated_at: new Date().toISOString() }).eq("id", row.id);
    if (error) setMessage(error.message);
    else {
      setMessage(`Offer moved to ${status}.`);
      await load();
    }
  }

  async function deleteOffer(row: AdminOffer) {
    if (!window.confirm(`Delete shop offer: ${row.title}?`)) return;
    const { error } = await db.from("activity_feed").delete().eq("id", row.id);
    if (error) setMessage(error.message);
    else {
      setMessage("Offer deleted.");
      await load();
    }
  }

  return (
    <RequireAdmin>
      <AdminLayout title="Shop Offers">
        <div className="mb-5 rounded-3xl border border-white/70 bg-slate-950 p-6 text-white shadow-xl shadow-slate-300/70">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">Activity Center</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">Shop Offer Control</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">Review, hide, publish, or delete shop-created promotional offers.</p>
        </div>

        {message && <div className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{message}</div>}

        <section className="overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-xl shadow-slate-200/70">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Offer</th>
                  <th className="px-4 py-3">Shop</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Area</th>
                  <th className="px-4 py-3">Ends</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">Loading offers...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">No shop offers yet.</td></tr>
                ) : rows.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="px-4 py-3"><div className="font-bold text-slate-950">{row.title}</div><div className="line-clamp-1 text-xs text-slate-500">{row.message}</div></td>
                    <td className="px-4 py-3">{row.shops?.shop_name ?? "Shop"}</td>
                    <td className="px-4 py-3">{row.category ?? row.shops?.category ?? "-"}</td>
                    <td className="px-4 py-3">{row.area ?? row.shops?.area ?? "-"}</td>
                    <td className="px-4 py-3">{new Date(row.offer_end_at ?? row.expires_at ?? row.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setStatus(row, "published")} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 font-semibold hover:bg-slate-50"><Send className="h-4 w-4" />Publish</button>
                        <button onClick={() => setStatus(row, "hidden")} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 font-semibold hover:bg-slate-50"><EyeOff className="h-4 w-4" />Hide</button>
                        <button onClick={() => deleteOffer(row)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-rose-200 px-3 font-semibold text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" />Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </AdminLayout>
    </RequireAdmin>
  );
}
