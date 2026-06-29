import { useEffect, useMemo, useState } from "react";
import { ExternalLink, MapPin, Megaphone, Tag, X } from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { getUserId, type Role } from "@/lib/role";
import {
  fetchOfficialUpdates,
  fetchVisibleShopOffers,
  fetchViewedActivityIds,
  getActivityViewerKey,
  markActivityViewed,
  type ActivityFeedItem,
} from "@/lib/activity";

export default function ActivityPage({ role }: { role: Role }) {
  const ready = useRoleGuard(role);
  const [updates, setUpdates] = useState<ActivityFeedItem[]>([]);
  const [offers, setOffers] = useState<ActivityFeedItem[]>([]);
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<ActivityFeedItem | null>(null);
  const [loading, setLoading] = useState(true);

  const viewerKey = useMemo(() => {
    const userId = getUserId();
    return userId ? getActivityViewerKey(role, userId) : null;
  }, [role]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    const load = async () => {
      const userId = getUserId();
      if (!userId) return;
      const key = getActivityViewerKey(role, userId);
      const [officialItems, offerItems, viewed] = await Promise.all([
        fetchOfficialUpdates(role, userId),
        fetchVisibleShopOffers(role, userId),
        fetchViewedActivityIds(key),
      ]);
      if (!cancelled) {
        setUpdates(officialItems);
        setOffers(offerItems);
        setViewedIds(viewed);
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [ready, role]);

  const openUpdate = async (item: ActivityFeedItem) => {
    setSelected(item);
    if (!viewerKey || viewedIds.has(item.id)) return;
    const marked = await markActivityViewed(item.id, viewerKey);
    if (marked) setViewedIds((current) => new Set([...current, item.id]));
  };

  if (!ready) return null;

  return (
    <AppShell role={role} title="Activity">
      <p className="text-sm text-muted-foreground">Stay updated with what's happening on Necto.</p>

      <section className="mt-5 rounded-2xl border border-border bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-primary">Official Necto Updates</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Announcements, feature updates, platform improvements, maintenance notices, and official updates from Necto Team.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">Loading official updates...</div>
          ) : updates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                <Megaphone className="h-6 w-6" />
              </div>
              <p className="mt-3 font-semibold text-foreground">No official updates yet.</p>
            </div>
          ) : updates.map((item) => {
            const isNew = !viewedIds.has(item.id);
            return (
              <article key={item.id} className="rounded-2xl border border-border bg-background p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">Official</span>
                  {isNew && <span className="rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">NEW</span>}
                  <time className="ml-auto text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</time>
                </div>
                <h3 className="mt-3 text-base font-bold text-foreground">{item.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.message}</p>
                <button type="button" onClick={() => openUpdate(item)} className="mt-3 text-sm font-bold text-primary hover:underline">
                  Read More
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-border bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Tag className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-primary">Shop Offers</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Local discounts, special offers, and promotions from nearby shops.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">Loading shop offers...</div>
          ) : offers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                <Tag className="h-6 w-6" />
              </div>
              <p className="mt-3 font-semibold text-foreground">No active offers.</p>
            </div>
          ) : offers.map((item) => {
            const isNew = !viewedIds.has(item.id);
            const shopHref = role === "customer" ? `/c/shop/${item.linked_shop_id}` : role === "worker" ? `/w/shop/${item.linked_shop_id}` : `/s/shop/${item.linked_shop_id}`;
            return (
              <article key={item.id} className="rounded-2xl border border-border bg-background p-4 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
                <div className="flex items-start gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-muted">
                    {item.shops?.photo_url ? <img src={item.shops.photo_url} alt={item.shops.shop_name ?? "Shop"} className="h-full w-full object-cover" /> : <Tag className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">Offer</span>
                      {isNew && <span className="rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">NEW</span>}
                      <time className="ml-auto text-xs text-muted-foreground">Ends {new Date(item.offer_end_at ?? item.expires_at ?? item.created_at).toLocaleDateString()}</time>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-muted-foreground">{item.shops?.shop_name ?? "Local shop"}</p>
                    <h3 className="mt-1 text-base font-bold text-foreground">{item.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.message}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-muted px-2 py-1 font-semibold">{item.category ?? item.shops?.category ?? "Offer"}</span>
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{item.area || item.city || item.shops?.area || "Nearby"}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <button type="button" onClick={() => openUpdate(item)} className="text-sm font-bold text-primary hover:underline">
                        View Offer
                      </button>
                      {item.linked_shop_id && (
                        <Link to={shopHref} className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700 hover:underline">
                          View Shop <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/50 p-0 backdrop-blur-sm sm:place-items-center sm:p-4" role="dialog" aria-modal="true">
          <div className="max-h-[86vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-3xl">
            <div className="flex items-start gap-3">
              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${selected.type === "offer" ? "bg-emerald-50 text-emerald-700" : "bg-primary/10 text-primary"}`}>
                {selected.type === "offer" ? <Tag className="h-5 w-5" /> : <Megaphone className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${selected.type === "offer" ? "bg-emerald-50 text-emerald-700" : "bg-primary/10 text-primary"}`}>
                  {selected.type === "offer" ? "Shop Offer" : "Official"}
                </span>
                <h2 className="mt-3 text-xl font-black text-foreground">{selected.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {selected.type === "offer" ? `Ends ${new Date(selected.offer_end_at ?? selected.expires_at ?? selected.created_at).toLocaleDateString()}` : `Published ${new Date(selected.created_at).toLocaleString()}`}
                </p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground hover:bg-muted" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            {selected.type === "offer" && (
              <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">
                <div className="font-bold">{selected.shops?.shop_name ?? "Local shop"}</div>
                <div className="mt-1">{selected.category}{selected.discount_text ? ` • ${selected.discount_text}` : ""}</div>
              </div>
            )}
            <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-foreground">{selected.message}</p>
            <button type="button" onClick={() => setSelected(null)} className="mt-6 h-11 w-full rounded-xl bg-primary font-bold text-white">
              Close
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
