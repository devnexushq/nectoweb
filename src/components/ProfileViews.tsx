import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ContactButtons } from "@/components/ContactButtons";
import { ReviewsSection } from "@/components/ReviewsSection";
import { MapPin, Clock, Briefcase, Star, User } from "lucide-react";
import { withTimeout } from "@/lib/safeAsync";
import { isUpdateFresh, formatShortRelativeTime } from "@/lib/freshness";

const PUBLIC_WORKER_DETAIL_COLUMNS =
  "id,name,job_type,experience,phone,whatsapp,description,area,business_hours,rating,photo_url,latest_update,latest_update_at";
const PUBLIC_WORKER_DETAIL_COLUMNS_FALLBACK =
  "id,name,job_type,experience,phone,whatsapp,description,area,business_hours,rating,photo_url";

const PUBLIC_SHOP_DETAIL_COLUMNS =
  "id,shop_name,owner_name,category,phone,whatsapp,description,area,business_hours,rating,photo_url,latest_update,latest_update_at";
const PUBLIC_SHOP_DETAIL_COLUMNS_FALLBACK =
  "id,shop_name,owner_name,category,phone,whatsapp,description,area,business_hours,rating,photo_url";

const PUBLIC_PRODUCT_COLUMNS = "id,name,price,photo_url,visibility,created_at";

export function WorkerProfileView() {
  const { id } = useParams() as { id: string };
  const [w, setW] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactTrigger, setContactTrigger] = useState(0);

  useEffect(() => {
    (async () => {
      const fetchWorker = async () => {
        let res = await supabase
          .from("workers")
          .select(PUBLIC_WORKER_DETAIL_COLUMNS)
          .eq("id", id)
          .maybeSingle();
        if (res.error && res.error.code === "42703") {
          res = await supabase
            .from("workers")
            .select(PUBLIC_WORKER_DETAIL_COLUMNS_FALLBACK)
            .eq("id", id)
            .maybeSingle();
        }
        return res;
      };

      const result = await withTimeout(fetchWorker());
      setW(result?.data ?? null);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="py-10 text-center text-muted-foreground">Loading...</div>;
  if (!w) return <div className="py-10 text-center text-muted-foreground">Worker not found.</div>;

  const isFresh = isUpdateFresh(w.latest_update, w.latest_update_at);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl overflow-hidden bg-white border border-border">
        <div className="h-40 bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center">
          {w.photo_url ? (
            <img src={w.photo_url} alt={w.name} className="h-full w-full object-cover" />
          ) : (
            <User className="h-16 w-16 text-primary/40" />
          )}
        </div>
        <div className="p-4">
          <h2 className="text-xl font-bold">{w.name}</h2>
          <p className="text-sm text-primary font-medium mt-0.5">{w.job_type}</p>
          <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Briefcase className="h-4 w-4" />
              {w.experience} yrs exp
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {w.area}
            </span>
            <span className="inline-flex items-center gap-1">
              <Star className="h-4 w-4 fill-accent text-accent" />
              {Number(w.rating ?? 0).toFixed(1)}
            </span>
          </div>
          {w.business_hours && (
            <p className="mt-2 text-sm text-muted-foreground inline-flex items-center gap-1">
              <Clock className="h-4 w-4" /> {formatHours(w.business_hours)}
            </p>
          )}
          {w.description && (
            <p className="mt-3 text-sm text-foreground leading-relaxed">{w.description}</p>
          )}

          {/* Today's Update highlight banner: after description, before WhatsApp/Call buttons */}
          {isFresh && (
            <div className="mt-3.5 rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-950 flex items-start gap-2 shadow-sm">
              <span className="text-xs shrink-0 mt-0.5">🔴</span>
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-amber-950">{w.latest_update}</span>
                <span className="text-amber-700 font-normal ml-1.5">
                  · {formatShortRelativeTime(w.latest_update_at)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <ContactButtons
        whatsapp={w.whatsapp}
        phone={w.phone}
        toId={w.id}
        toType="worker"
        onContactLogged={() => setContactTrigger((c) => c + 1)}
      />

      <ReviewsSection
        targetId={w.id}
        targetType="worker"
        targetName={w.name}
        initialRating={w.rating}
        contactTrigger={contactTrigger}
        onRatingUpdated={(newRating) => {
          setW((prev: any) => (prev ? { ...prev, rating: newRating } : prev));
        }}
      />
    </div>
  );
}

export function ShopProfileView() {
  const { id } = useParams() as { id: string };
  const [s, setS] = useState<any | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactTrigger, setContactTrigger] = useState(0);

  useEffect(() => {
    (async () => {
      const fetchShop = async () => {
        let res = await supabase
          .from("shops")
          .select(PUBLIC_SHOP_DETAIL_COLUMNS)
          .eq("id", id)
          .maybeSingle();
        if (res.error && res.error.code === "42703") {
          res = await supabase
            .from("shops")
            .select(PUBLIC_SHOP_DETAIL_COLUMNS_FALLBACK)
            .eq("id", id)
            .maybeSingle();
        }
        return res;
      };

      const result = await withTimeout(
        Promise.all([
          fetchShop(),
          supabase
            .from("products")
            .select(PUBLIC_PRODUCT_COLUMNS)
            .eq("shop_id", id)
            .eq("visibility", "visible")
            .order("created_at", { ascending: false }),
        ]),
      );
      const [{ data }, { data: prods }] = result ?? [{ data: null }, { data: [] as any[] }];
      setS(data);
      setProducts(prods ?? []);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="py-10 text-center text-muted-foreground">Loading...</div>;
  if (!s) return <div className="py-10 text-center text-muted-foreground">Shop not found.</div>;

  const isFresh = isUpdateFresh(s.latest_update, s.latest_update_at);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl overflow-hidden bg-white border border-border">
        <div className="h-40 bg-gradient-to-br from-accent/20 to-primary/15 flex items-center justify-center">
          {s.photo_url ? (
            <img src={s.photo_url} alt={s.shop_name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-primary/40">{s.shop_name?.[0]}</span>
          )}
        </div>
        <div className="p-4">
          <h2 className="text-xl font-bold">{s.shop_name}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Owner: {s.owner_name}</p>
          <p className="text-sm text-primary font-medium mt-0.5">{s.category}</p>
          <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {s.area}
            </span>
            <span className="inline-flex items-center gap-1">
              <Star className="h-4 w-4 fill-accent text-accent" />
              {Number(s.rating ?? 0).toFixed(1)}
            </span>
          </div>
          {s.business_hours && (
            <p className="mt-2 text-sm text-muted-foreground inline-flex items-center gap-1">
              <Clock className="h-4 w-4" /> {formatHours(s.business_hours)}
            </p>
          )}
          {s.description && (
            <p className="mt-3 text-sm text-foreground leading-relaxed">{s.description}</p>
          )}

          {/* Today's Update highlight banner: after description, before WhatsApp/Call buttons */}
          {isFresh && (
            <div className="mt-3.5 rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-950 flex items-start gap-2 shadow-sm">
              <span className="text-xs shrink-0 mt-0.5">🔴</span>
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-amber-950">{s.latest_update}</span>
                <span className="text-amber-700 font-normal ml-1.5">
                  · {formatShortRelativeTime(s.latest_update_at)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <ContactButtons
        whatsapp={s.whatsapp}
        phone={s.phone}
        toId={s.id}
        toType="shop"
        onContactLogged={() => setContactTrigger((c) => c + 1)}
      />

      <section className="rounded-2xl p-4 bg-white border border-border">
        <h3 className="font-semibold mb-3">Products</h3>
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">No products listed yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p) => (
              <div key={p.id} className="rounded-lg border border-border overflow-hidden">
                <div className="h-24 bg-muted flex items-center justify-center">
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
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <ReviewsSection
        targetId={s.id}
        targetType="shop"
        targetName={s.shop_name}
        initialRating={s.rating}
        contactTrigger={contactTrigger}
        onRatingUpdated={(newRating) => {
          setS((prev: any) => (prev ? { ...prev, rating: newRating } : prev));
        }}
      />
    </div>
  );
}

function formatHours(h: any): string {
  if (!h) return "";
  if (typeof h === "string") return h;
  const from = h.from ?? "";
  const to = h.to ?? "";
  const days = Array.isArray(h.days) ? h.days.join(", ") : (h.days ?? "");
  return [from && to ? `${from} – ${to}` : "", days].filter(Boolean).join(" • ");
}
