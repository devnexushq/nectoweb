import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, X, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/lib/role";

export default function Products() {
  const ready = useRoleGuard("shop");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  async function refresh() {
    const id = getUserId();
    if (!id) return;
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("shop_id", id)
      .order("created_at", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  }
  useEffect(() => {
    refresh();
  }, []);

  async function remove(productId: string) {
    if (!confirm("Delete this product?")) return;
    const id = getUserId();
    if (!id) return;
    await supabase.from("products").delete().eq("id", productId).eq("shop_id", id);
    refresh();
  }

  if (!ready) return null;
  return (
    <AppShell role="shop" title="My Products">
      <button
        onClick={() => {
          setEditing(null);
          setOpen(true);
        }}
        className="w-full h-11 rounded-xl bg-accent text-white font-semibold inline-flex items-center justify-center gap-2 hover:bg-accent/90 mb-4"
      >
        <Plus className="h-4 w-4" /> Add Product
      </button>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : items.length === 0 ? (
        <EmptyState
          title="No products yet"
          subtitle="Add your first product to attract customers."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map((p) => (
            <div key={p.id} className="rounded-xl border border-border overflow-hidden bg-white">
              <div className="h-28 bg-muted flex items-center justify-center">
                {p.photo_url ? (
                  <img src={p.photo_url} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-muted-foreground">No image</span>
                )}
              </div>
              <div className="p-2">
                <div className="text-sm font-semibold truncate">{p.name}</div>
                <div className="text-xs text-accent font-bold">
                  ₹{Number(p.price).toLocaleString()}
                </div>
                <div className="flex gap-1 mt-2">
                  <button
                    onClick={() => {
                      setEditing(p);
                      setOpen(true);
                    }}
                    className="flex-1 text-xs h-7 rounded-md border border-border hover:bg-muted"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(p.id)}
                    className="h-7 w-7 rounded-md border border-border text-destructive hover:bg-destructive/5 inline-flex items-center justify-center"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {open && (
        <ProductModal
          initial={editing}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            refresh();
          }}
        />
      )}
    </AppShell>
  );
}

function ProductModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    price: initial?.price?.toString() ?? "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initial?.photo_url || null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WebP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size must be less than 5MB");
      return;
    }
    setSelectedFile(file);
    setPhotoRemoved(false);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  }

  function removePhoto() {
    setSelectedFile(null);
    setPreviewUrl(null);
    setPhotoRemoved(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = form.name.trim();
    const trimmedPrice = form.price.trim();
    if (!trimmedName || !trimmedPrice) {
      return toast.error("Name and price are required");
    }
    const numPrice = Number(trimmedPrice);
    if (isNaN(numPrice) || numPrice < 0) {
      return toast.error("Please enter a valid price");
    }

    const id = getUserId();
    if (!id) return toast.error("Shop session expired. Please log in.");

    setSaving(true);
    let finalPhotoUrl: string | null = photoRemoved ? null : (initial?.photo_url ?? null);

    // If the user selected a new file, upload to product-images Supabase Storage bucket
    if (selectedFile) {
      try {
        const safeName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filePath = `${id}/${Date.now()}_${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(filePath, selectedFile, {
            cacheControl: "3600",
            upsert: true,
            contentType: selectedFile.type,
          });

        if (uploadError) {
          console.error("Image upload failed:", uploadError);
          toast.error(
            `Image upload failed (${uploadError.message || "Storage error"}). Product details will still be saved.`,
          );
        } else {
          const { data: publicUrlData } = supabase.storage
            .from("product-images")
            .getPublicUrl(filePath);
          if (publicUrlData?.publicUrl) {
            finalPhotoUrl = publicUrlData.publicUrl;
          }
        }
      } catch (err) {
        console.error("Storage upload exception:", err);
        toast.error("Image upload failed. Saving product details without new image.");
      }
    }

    const payload = {
      name: trimmedName,
      description: form.description.trim(),
      price: numPrice,
      photo_url: finalPhotoUrl,
      shop_id: id,
    };

    const res = initial
      ? await supabase.from("products").update(payload).eq("id", initial.id).eq("shop_id", id)
      : await supabase.from("products").insert(payload);

    setSaving(false);

    if (res.error) {
      return toast.error("Could not save product: " + res.error.message);
    }

    toast.success(initial ? "Product updated" : "Product added");
    onSaved();
  }

  return (
    <div
      id="product-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="product-modal-card"
        className="bg-white rounded-2xl w-full max-w-md p-5 my-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">{initial ? "Edit Product" : "Add Product"}</h2>
          <button
            type="button"
            id="close-product-modal-btn"
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={save} className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Product Name *
            </label>
            <input
              id="product-name-input"
              className="w-full h-11 px-3 rounded-lg border border-border focus:border-primary outline-none text-sm"
              placeholder="e.g. Wireless Earbuds"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Description (optional)
            </label>
            <textarea
              id="product-description-input"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border focus:border-primary outline-none text-sm resize-none"
              placeholder="Brief description of the product"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Price (₹) *
            </label>
            <input
              id="product-price-input"
              className="w-full h-11 px-3 rounded-lg border border-border focus:border-primary outline-none text-sm"
              placeholder="e.g. 499"
              inputMode="decimal"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>

          {/* Product Photo Upload Section */}
          <div>
            <input
              ref={fileInputRef}
              id="product-photo-file-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />

            {previewUrl ? (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground block">
                  Product Photo
                </label>
                <div className="relative rounded-xl border border-border overflow-hidden bg-muted/20 h-36 flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Product preview"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    id="change-product-photo-btn"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 h-9 rounded-lg border border-border text-xs font-medium hover:bg-muted inline-flex items-center justify-center gap-1.5 transition"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Change Photo
                  </button>
                  <button
                    type="button"
                    id="remove-product-photo-btn"
                    onClick={removePhoto}
                    className="h-9 px-3 rounded-lg border border-border text-xs font-medium text-destructive hover:bg-destructive/5 inline-flex items-center justify-center gap-1.5 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground block">
                  Product Photo (optional)
                </label>
                <div
                  id="product-photo-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFile(file);
                  }}
                  className={`cursor-pointer rounded-xl border-2 border-dashed p-4 flex flex-col items-center justify-center text-center transition ${
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/30"
                  }`}
                >
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-1.5 text-muted-foreground">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    Tap to upload photo or take picture
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Supports JPG, PNG, WebP up to 5MB
                  </p>
                </div>
              </div>
            )}
          </div>

          <button
            id="save-product-submit-btn"
            type="submit"
            disabled={saving}
            className="w-full h-11 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-60 inline-flex items-center justify-center gap-2 transition"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving Product...</span>
              </>
            ) : (
              <span>{initial ? "Save Changes" : "Add Product"}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
