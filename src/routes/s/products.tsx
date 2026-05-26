import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/lib/role";

export const Route = createFileRoute("/s/products")({ component: Products });

function Products() {
  const ready = useRoleGuard("shop");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  async function refresh() {
    const id = getUserId(); if (!id) return;
    const { data } = await supabase.from("products").select("*").eq("shop_id", id).order("created_at", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []);

  async function remove(productId: string) {
    if (!confirm("Delete this product?")) return;
    await supabase.from("products").delete().eq("id", productId);
    refresh();
  }

  if (!ready) return null;
  return (
    <AppShell role="shop" title="My Products">
      <button onClick={() => { setEditing(null); setOpen(true); }} className="w-full h-11 rounded-xl bg-accent text-white font-semibold inline-flex items-center justify-center gap-2 hover:bg-accent/90 mb-4">
        <Plus className="h-4 w-4" /> Add Product
      </button>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : items.length === 0 ? (
        <EmptyState title="No products yet" subtitle="Add your first product to attract customers." />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map((p) => (
            <div key={p.id} className="rounded-xl border border-border overflow-hidden bg-white">
              <div className="h-28 bg-muted flex items-center justify-center">
                {p.photo_url ? <img src={p.photo_url} alt={p.name} className="h-full w-full object-cover" /> : <span className="text-xs text-muted-foreground">No image</span>}
              </div>
              <div className="p-2">
                <div className="text-sm font-semibold truncate">{p.name}</div>
                <div className="text-xs text-accent font-bold">₹{Number(p.price).toLocaleString()}</div>
                <div className="flex gap-1 mt-2">
                  <button onClick={() => { setEditing(p); setOpen(true); }} className="flex-1 text-xs h-7 rounded-md border border-border hover:bg-muted">Edit</button>
                  <button onClick={() => remove(p.id)} className="h-7 w-7 rounded-md border border-border text-destructive hover:bg-destructive/5 inline-flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {open && <ProductModal initial={editing} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); refresh(); }} />}
    </AppShell>
  );
}

function ProductModal({ initial, onClose, onSaved }: { initial: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    price: initial?.price?.toString() ?? "",
    photo_url: initial?.photo_url ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.price) return toast.error("Name and price are required");
    const id = getUserId(); if (!id) return;
    setSaving(true);
    const payload = { ...form, price: Number(form.price), shop_id: id };
    const res = initial
      ? await supabase.from("products").update(payload).eq("id", initial.id)
      : await supabase.from("products").insert(payload);
    setSaving(false);
    if (res.error) return toast.error("Could not save");
    toast.success(initial ? "Updated" : "Added");
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">{initial ? "Edit Product" : "Add Product"}</h2>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={save} className="space-y-3">
          <input className="w-full h-11 px-3 rounded-lg border border-border focus:border-primary outline-none" placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <textarea rows={3} className="w-full px-3 py-2 rounded-lg border border-border focus:border-primary outline-none" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input className="w-full h-11 px-3 rounded-lg border border-border focus:border-primary outline-none" placeholder="Price (₹)" inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <input className="w-full h-11 px-3 rounded-lg border border-border focus:border-primary outline-none" placeholder="Photo URL (optional)" value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} />
          <button disabled={saving} className="w-full h-11 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-60">{saving ? "Saving..." : "Save"}</button>
        </form>
      </div>
    </div>
  );
}
