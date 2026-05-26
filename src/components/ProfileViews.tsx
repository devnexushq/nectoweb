import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ContactButtons } from "@/components/ContactButtons";
import { MapPin, Clock, Briefcase, Star, User } from "lucide-react";

export function WorkerProfileView() {
  const { id } = useParams({ strict: false }) as { id: string };
  const [w, setW] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("workers").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      setW(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="py-10 text-center text-muted-foreground">Loading...</div>;
  if (!w) return <div className="py-10 text-center text-muted-foreground">Worker not found.</div>;

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
            <span className="inline-flex items-center gap-1"><Briefcase className="h-4 w-4" />{w.experience} yrs exp</span>
            <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{w.area}</span>
            <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-accent text-accent" />{Number(w.rating ?? 0).toFixed(1)}</span>
          </div>
          {w.business_hours && (
            <p className="mt-2 text-sm text-muted-foreground inline-flex items-center gap-1">
              <Clock className="h-4 w-4" /> {formatHours(w.business_hours)}
            </p>
          )}
          {w.description && <p className="mt-3 text-sm text-foreground leading-relaxed">{w.description}</p>}
        </div>
      </div>

      <ContactButtons whatsapp={w.whatsapp} phone={w.phone} toId={w.id} toType="worker" />

      <section className="rounded-2xl p-4 bg-white border border-border">
        <h3 className="font-semibold mb-2">Reviews & Rating</h3>
        <p className="text-sm text-muted-foreground">Average rating {Number(w.rating ?? 0).toFixed(1)} / 5. Reviews coming soon.</p>
      </section>
    </div>
  );
}

export function ShopProfileView() {
  const { id } = useParams({ strict: false }) as { id: string };
  const [s, setS] = useState<any | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data }, { data: prods }] = await Promise.all([
        supabase.from("shops").select("*").eq("id", id).maybeSingle(),
        supabase.from("products").select("*").eq("shop_id", id).order("created_at", { ascending: false }),
      ]);
      setS(data);
      setProducts(prods ?? []);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="py-10 text-center text-muted-foreground">Loading...</div>;
  if (!s) return <div className="py-10 text-center text-muted-foreground">Shop not found.</div>;

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
            <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{s.area}</span>
            <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-accent text-accent" />{Number(s.rating ?? 0).toFixed(1)}</span>
          </div>
          {s.business_hours && (
            <p className="mt-2 text-sm text-muted-foreground inline-flex items-center gap-1">
              <Clock className="h-4 w-4" /> {formatHours(s.business_hours)}
            </p>
          )}
          {s.description && <p className="mt-3 text-sm text-foreground leading-relaxed">{s.description}</p>}
        </div>
      </div>

      <ContactButtons whatsapp={s.whatsapp} phone={s.phone} toId={s.id} toType="shop" />

      <section className="rounded-2xl p-4 bg-white border border-border">
        <h3 className="font-semibold mb-3">Products</h3>
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">No products listed yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p) => (
              <div key={p.id} className="rounded-lg border border-border overflow-hidden">
                <div className="h-24 bg-muted flex items-center justify-center">
                  {p.photo_url ? <img src={p.photo_url} alt={p.name} className="h-full w-full object-cover" /> : <span className="text-xs text-muted-foreground">No image</span>}
                </div>
                <div className="p-2">
                  <div className="text-sm font-semibold truncate">{p.name}</div>
                  <div className="text-xs text-accent font-bold">₹{Number(p.price).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl p-4 bg-white border border-border">
        <h3 className="font-semibold mb-2">Reviews & Rating</h3>
        <p className="text-sm text-muted-foreground">Average rating {Number(s.rating ?? 0).toFixed(1)} / 5. Reviews coming soon.</p>
      </section>
    </div>
  );
}

function formatHours(h: any): string {
  if (!h) return "";
  if (typeof h === "string") return h;
  const from = h.from ?? "";
  const to = h.to ?? "";
  const days = Array.isArray(h.days) ? h.days.join(", ") : h.days ?? "";
  return [from && to ? `${from} – ${to}` : "", days].filter(Boolean).join(" • ");
}
