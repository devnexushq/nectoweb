import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Eye, Save, Send, Tag } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { getUserId } from "@/lib/role";
import {
  EMPTY_OFFER_FORM,
  fetchShopOffer,
  fetchShopOffers,
  fetchShopProfile,
  offerToForm,
  saveShopOffer,
  validateOffer,
  type OfferStatus,
  type OfferVisibilityScope,
  type ShopOfferInput,
} from "@/lib/shopOffers";

const CONTROL = "mt-1 w-full h-11 rounded-xl border border-border bg-white px-3 text-sm outline-none transition focus:border-primary";
const TEXTAREA = "mt-1 w-full min-h-28 rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary";

export default function ShopOfferEditor() {
  const ready = useRoleGuard("shop");
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [form, setForm] = useState<ShopOfferInput>(EMPTY_OFFER_FORM);
  const [initialStatus, setInitialStatus] = useState<OfferStatus>("draft");
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [published, setPublished] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const shopId = getUserId();
    if (!shopId) return;

    async function load() {
      try {
        if (id) {
          const offer = await fetchShopOffer(shopId, id);
          if (!offer) {
            toast.error("Offer not found.");
            navigate("/s/offers", { replace: true });
            return;
          }
          setForm(offerToForm(offer));
          setInitialStatus(offer.status);
          setPublished(offer.status === "published");
        } else {
          const shop = await fetchShopProfile(shopId);
          setForm({
            ...EMPTY_OFFER_FORM,
            category: shop?.category ?? "",
            city: shop?.area ?? "",
            area: shop?.area ?? "",
            visibility_scope: shop?.visibility === "all_india" ? "all_india" : "local",
          });
        }
      } catch (error) {
        toast.error((error as Error).message || "Could not load offer.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [ready, id, navigate]);

  const publishLocked = useMemo(() => published && form.status === "published", [published, form.status]);

  const update = <K extends keyof ShopOfferInput>(key: K, value: ShopOfferInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (key !== "status") setPublished(false);
  };

  async function persist(status: OfferStatus, mode: "draft" | "publish" | "update") {
    const shopId = getUserId();
    if (!shopId || saving) return;
    const nextForm = { ...form, status };
    const validation = validateOffer(nextForm);
    if (validation) {
      toast.error(validation);
      return;
    }

    if (mode === "publish" && !id) {
      const existing = await fetchShopOffers(shopId);
      const activeCount = existing.filter((offer) => {
        const end = offer.offer_end_at ?? offer.expires_at;
        return offer.status === "published" && (!end || new Date(end).getTime() >= Date.now());
      }).length;
      if (activeCount >= 3) {
        toast.error("You can keep up to 3 active published offers at a time.");
        return;
      }
    }

    setSaving(true);
    try {
      const saved = await saveShopOffer(shopId, nextForm, id);
      setInitialStatus(saved.status);
      setForm(offerToForm(saved));
      if (saved.status === "published") {
        setPublished(true);
        toast.success("Offer published successfully.");
      } else {
        toast.success(mode === "update" ? "Offer updated." : "Offer saved as draft.");
      }
      navigate(`/s/offers/${saved.id}/edit`, { replace: true });
    } catch (error) {
      toast.error((error as Error).message || "Could not save offer.");
    } finally {
      setSaving(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    persist(form.status, isEditing ? "update" : "draft");
  }

  if (!ready) return null;

  return (
    <AppShell role="shop" title={isEditing ? "Edit Offer" : "Create Offer"}>
      <div className="mb-4 rounded-2xl border border-primary/15 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary text-white"><Tag className="h-5 w-5" /></div>
          <div>
            <h2 className="font-bold text-primary">Shop Offer Management</h2>
            <p className="mt-1 text-sm text-muted-foreground">Published offers appear in Activity Center for nearby customers and workers.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-white p-8 text-center text-sm text-muted-foreground">Loading offer...</div>
      ) : (
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-white p-4 shadow-sm">
          <Field label="Offer Title"><input className={CONTROL} value={form.title} onChange={(e) => update("title", e.target.value)} /></Field>
          <Field label="Offer Description"><textarea className={TEXTAREA} value={form.message} onChange={(e) => update("message", e.target.value)} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Offer Category"><input className={CONTROL} value={form.category} onChange={(e) => update("category", e.target.value)} placeholder="Grocery, hardware, festival..." /></Field>
            <Field label="Optional Discount Text"><input className={CONTROL} value={form.discount_text} onChange={(e) => update("discount_text", e.target.value)} placeholder="10% off, Buy 1 Get 1..." /></Field>
            <Field label="Start Date"><input type="date" className={CONTROL} value={form.offer_start_at} onChange={(e) => update("offer_start_at", e.target.value)} /></Field>
            <Field label="End Date"><input type="date" className={CONTROL} value={form.offer_end_at} onChange={(e) => update("offer_end_at", e.target.value)} /></Field>
            <Field label="City"><input className={CONTROL} value={form.city} onChange={(e) => update("city", e.target.value)} /></Field>
            <Field label="Area"><input className={CONTROL} value={form.area} onChange={(e) => update("area", e.target.value)} /></Field>
            <Field label="District"><input className={CONTROL} value={form.district} onChange={(e) => update("district", e.target.value)} /></Field>
            <Field label="State"><input className={CONTROL} value={form.state} onChange={(e) => update("state", e.target.value)} /></Field>
            <Field label="Location Visibility">
              <select className={CONTROL} value={form.visibility_scope} onChange={(e) => update("visibility_scope", e.target.value as OfferVisibilityScope)}>
                <option value="local">Local</option>
                <option value="district">District</option>
                <option value="state">State</option>
                <option value="all_india">All India</option>
              </select>
            </Field>
            <Field label="Status">
              <select className={CONTROL} value={form.status} onChange={(e) => update("status", e.target.value as OfferStatus)}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="hidden">Hidden</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <button disabled={saving} type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-white font-bold text-foreground hover:bg-muted disabled:opacity-60">
              <Save className="h-4 w-4" /> {isEditing ? "Update Offer" : "Save Draft"}
            </button>
            {publishLocked ? (
              <button disabled type="button" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 font-bold text-white opacity-90">
                <CheckCircle2 className="h-4 w-4" /> Published
              </button>
            ) : (
              <button disabled={saving} type="button" onClick={() => persist("published", isEditing && initialStatus !== "draft" ? "update" : "publish")} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white hover:bg-primary/90 disabled:opacity-60">
                <Send className="h-4 w-4" /> {isEditing && initialStatus !== "draft" ? "Update Offer" : "Publish"}
              </button>
            )}
            <Link to="/s/offers" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-white font-bold text-foreground hover:bg-muted">
              <Eye className="h-4 w-4" /> Manage Offers
            </Link>
          </div>
        </form>
      )}
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-sm font-semibold text-foreground">{label}{children}</label>;
}
