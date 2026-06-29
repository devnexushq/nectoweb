import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Edit3, Eye, EyeOff, Plus, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { getUserId } from "@/lib/role";
import {
  deleteShopOffer,
  fetchShopOffers,
  saveShopOffer,
  updateOfferStatus,
  type ShopOffer,
} from "@/lib/shopOffers";

type Bucket = "active" | "draft" | "expired" | "hidden";

function isExpired(offer: ShopOffer) {
  const value = offer.offer_end_at ?? offer.expires_at;
  return Boolean(value && new Date(value).getTime() < Date.now());
}

function bucketFor(offer: ShopOffer): Bucket {
  if (offer.status === "hidden") return "hidden";
  if (offer.status === "draft") return "draft";
  if (isExpired(offer)) return "expired";
  return "active";
}

const SECTIONS: { key: Bucket; title: string; empty: string }[] = [
  { key: "active", title: "Active Offers", empty: "No active offers." },
  { key: "draft", title: "Draft Offers", empty: "No draft offers." },
  { key: "expired", title: "Expired Offers", empty: "No expired offers." },
  { key: "hidden", title: "Hidden Offers", empty: "No hidden offers." },
];

export default function ShopOffersPage() {
  const ready = useRoleGuard("shop");
  const [offers, setOffers] = useState<ShopOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const shopId = getUserId();
    if (!shopId) return;
    setLoading(true);
    try {
      setOffers(await fetchShopOffers(shopId));
    } catch (error) {
      toast.error((error as Error).message || "Could not load offers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (ready) load(); }, [ready]);

  const grouped = useMemo(() => {
    return SECTIONS.reduce((acc, section) => {
      acc[section.key] = offers.filter((offer) => bucketFor(offer) === section.key);
      return acc;
    }, {} as Record<Bucket, ShopOffer[]>);
  }, [offers]);

  async function hideOffer(offer: ShopOffer) {
    const shopId = getUserId();
    if (!shopId) return;
    setBusyId(offer.id);
    try {
      await updateOfferStatus(shopId, offer.id, "hidden");
      toast.success("Offer hidden.");
      await load();
    } catch (error) {
      toast.error((error as Error).message || "Could not hide offer.");
    } finally {
      setBusyId(null);
    }
  }

  async function removeOffer(offer: ShopOffer) {
    const ok = window.confirm(`Delete offer: ${offer.title}? This cannot be undone.`);
    if (!ok) return;
    const shopId = getUserId();
    if (!shopId) return;
    setBusyId(offer.id);
    try {
      await deleteShopOffer(shopId, offer.id);
      toast.success("Offer deleted.");
      await load();
    } catch (error) {
      toast.error((error as Error).message || "Could not delete offer.");
    } finally {
      setBusyId(null);
    }
  }

  async function duplicateOffer(offer: ShopOffer) {
    const shopId = getUserId();
    if (!shopId) return;
    setBusyId(offer.id);
    try {
      await saveShopOffer(shopId, {
        title: `${offer.title} copy`,
        message: offer.message,
        category: offer.category ?? "",
        discount_text: offer.discount_text ?? "",
        offer_start_at: (offer.offer_start_at ?? new Date().toISOString()).slice(0, 10),
        offer_end_at: (offer.offer_end_at ?? offer.expires_at ?? new Date().toISOString()).slice(0, 10),
        city: offer.city ?? "",
        area: offer.area ?? "",
        district: offer.district ?? "",
        state: offer.state ?? "",
        visibility_scope: offer.visibility_scope,
        status: "draft",
      });
      toast.success("Draft copy created.");
      await load();
    } catch (error) {
      toast.error((error as Error).message || "Could not duplicate offer.");
    } finally {
      setBusyId(null);
    }
  }

  if (!ready) return null;

  return (
    <AppShell role="shop" title="Shop Offers">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Create, publish, hide, and track your local promotional offers.</p>
        </div>
        <Link to="/s/offers/new" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-sm hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Create Offer
        </Link>
      </div>

      {loading ? (
        <div className="mt-5 rounded-2xl border border-border bg-white p-8 text-center text-sm text-muted-foreground">Loading offers...</div>
      ) : offers.length === 0 ? (
        <EmptyState title="No offers yet" subtitle="Create your first offer to appear in the Activity Center." ctaLabel="Create Offer" ctaTo="/s/offers/new" />
      ) : (
        <div className="mt-5 space-y-5">
          {SECTIONS.map((section) => (
            <section key={section.key} className="rounded-2xl border border-border bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <Tag className="h-4 w-4 text-primary" />
                <h2 className="font-bold text-foreground">{section.title}</h2>
                <span className="ml-auto rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">{grouped[section.key].length}</span>
              </div>
              <div className="divide-y divide-border">
                {grouped[section.key].length === 0 ? (
                  <div className="p-5 text-sm text-muted-foreground">{section.empty}</div>
                ) : grouped[section.key].map((offer) => (
                  <article key={offer.id} className="p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">{offer.status}</span>
                      <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground">{offer.category}</span>
                      <time className="ml-auto text-xs text-muted-foreground">Ends {new Date(offer.offer_end_at ?? offer.expires_at ?? offer.created_at).toLocaleDateString()}</time>
                    </div>
                    <h3 className="mt-2 text-base font-bold">{offer.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{offer.message}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link to={`/s/offers/${offer.id}`} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold hover:bg-muted"><Eye className="h-4 w-4" />View</Link>
                      <Link to={`/s/offers/${offer.id}/edit`} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold hover:bg-muted"><Edit3 className="h-4 w-4" />Edit</Link>
                      <button disabled={busyId === offer.id} onClick={() => hideOffer(offer)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold hover:bg-muted disabled:opacity-60"><EyeOff className="h-4 w-4" />Hide</button>
                      <button disabled={busyId === offer.id} onClick={() => duplicateOffer(offer)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold hover:bg-muted disabled:opacity-60"><Copy className="h-4 w-4" />Duplicate</button>
                      <button disabled={busyId === offer.id} onClick={() => removeOffer(offer)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-destructive/20 px-3 text-sm font-semibold text-destructive hover:bg-destructive/5 disabled:opacity-60"><Trash2 className="h-4 w-4" />Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </AppShell>
  );
}
