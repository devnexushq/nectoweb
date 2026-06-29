import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CalendarDays, Edit3, MapPin, Tag } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { getUserId } from "@/lib/role";
import { fetchShopOffer, type ShopOffer } from "@/lib/shopOffers";

export default function ShopOfferView() {
  const ready = useRoleGuard("shop");
  const navigate = useNavigate();
  const { id } = useParams();
  const [offer, setOffer] = useState<ShopOffer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !id) return;
    const shopId = getUserId();
    if (!shopId) return;
    fetchShopOffer(shopId, id)
      .then((row) => {
        if (!row) {
          toast.error("Offer not found.");
          navigate("/s/offers", { replace: true });
        } else {
          setOffer(row);
        }
      })
      .catch((error) => toast.error((error as Error).message || "Could not load offer."))
      .finally(() => setLoading(false));
  }, [ready, id, navigate]);

  if (!ready) return null;

  return (
    <AppShell role="shop" title="Offer Details">
      {loading ? (
        <div className="rounded-2xl border border-border bg-white p-8 text-center text-sm text-muted-foreground">Loading offer...</div>
      ) : offer && (
        <article className="rounded-3xl border border-border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">{offer.status}</span>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">{offer.visibility_scope}</span>
          </div>
          <h1 className="mt-4 text-2xl font-black text-foreground">{offer.title}</h1>
          {offer.discount_text && <p className="mt-2 inline-flex rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">{offer.discount_text}</p>}
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-foreground">{offer.message}</p>
          <div className="mt-5 grid gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><Tag className="h-4 w-4 text-primary" />{offer.category}</div>
            <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{offer.area}, {offer.city}</div>
            <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" />Ends {new Date(offer.offer_end_at ?? offer.expires_at ?? offer.created_at).toLocaleDateString()}</div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link to={`/s/offers/${offer.id}/edit`} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white hover:bg-primary/90"><Edit3 className="h-4 w-4" />Edit Offer</Link>
            <Link to="/s/offers" className="inline-flex h-11 items-center justify-center rounded-xl border border-border font-bold hover:bg-muted">Back to Offers</Link>
          </div>
        </article>
      )}
    </AppShell>
  );
}
