import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowLeft, ChevronRight, Clock, ExternalLink, MapPin, Megaphone, Sparkles, Tag, X } from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { getUserId, type Role } from "@/lib/role";
import {
  fetchOfficialUpdates,
  fetchVisibleShopOffers,
  fetchViewedActivityIds,
  getActivityPath,
  getActivityViewerKey,
  markActivityViewed,
  type ActivityFeedItem,
} from "@/lib/activity";

type ActivityCategory = "official" | "shop-offers" | "new-near-you";

function categoryPath(role: Role, category: ActivityCategory) {
  return `${getActivityPath(role)}/${category}`;
}

function shopPath(role: Role, shopId: string | null | undefined) {
  if (!shopId) return getActivityPath(role);
  if (role === "customer") return `/c/shop/${shopId}`;
  if (role === "worker") return `/w/shop/${shopId}`;
  return `/s/shop/${shopId}`;
}

function useActivityData(role: Role, ready: boolean) {
  const [updates, setUpdates] = useState<ActivityFeedItem[]>([]);
  const [offers, setOffers] = useState<ActivityFeedItem[]>([]);
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const viewerKey = useMemo(() => {
    const userId = getUserId();
    return userId ? getActivityViewerKey(role, userId) : null;
  }, [role]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    async function load() {
      const userId = getUserId();
      if (!userId) return;
      setLoading(true);
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
    }

    load();
    return () => { cancelled = true; };
  }, [ready, role]);

  return { updates, offers, viewedIds, setViewedIds, viewerKey, loading };
}

export default function ActivityPage({ role }: { role: Role }) {
  const ready = useRoleGuard(role);
  const { updates, offers, viewedIds, loading } = useActivityData(role, ready);

  if (!ready) return null;

  const hasNewOfficial = updates.some((item) => !viewedIds.has(item.id));
  const hasNewOffers = offers.some((item) => !viewedIds.has(item.id));

  return (
    <AppShell role={role} title="Activity">
      <p className="text-sm text-muted-foreground">Stay updated with what's happening on Necto.</p>

      <div className="mt-5 grid gap-3">
        <CategoryCard
          to={categoryPath(role, "official")}
          icon={<Megaphone className="h-5 w-5" />}
          title="Official Necto Updates"
          description="Announcements, feature updates, platform improvements, and official notices."
          accent="primary"
          loading={loading}
          hasNew={hasNewOfficial}
        />
        <CategoryCard
          to={categoryPath(role, "shop-offers")}
          icon={<Tag className="h-5 w-5" />}
          title="Shop Offers"
          description="Local discounts, special offers, and promotions from nearby shops."
          accent="emerald"
          loading={loading}
          hasNew={hasNewOffers}
        />
        <CategoryCard
          to={categoryPath(role, "new-near-you")}
          icon={<Sparkles className="h-5 w-5" />}
          title="New Near You"
          description="New local activity around your area."
          accent="amber"
          loading={false}
          hasNew={false}
          badgeText="Coming Soon"
        />
      </div>
    </AppShell>
  );
}

function CategoryCard({
  to,
  icon,
  title,
  description,
  accent,
  loading,
  hasNew,
  badgeText,
}: {
  to: string;
  icon: ReactNode;
  title: string;
  description: string;
  accent: "primary" | "emerald" | "amber";
  loading: boolean;
  hasNew: boolean;
  badgeText?: string;
}) {
  const accentClass = accent === "emerald"
    ? "bg-emerald-50 text-emerald-700"
    : accent === "amber"
      ? "bg-amber-50 text-amber-700"
      : "bg-primary/10 text-primary";

  return (
    <Link to={to} className="group flex items-center gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
      <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${accentClass}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-bold text-foreground">{title}</h2>
          {!loading && hasNew && <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">NEW</span>}
          {badgeText && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{badgeText}</span>}
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{description}</p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}

export function ActivityCategoryPage({ role, category }: { role: Role; category: ActivityCategory }) {
  const ready = useRoleGuard(role);
  const { updates, offers, viewedIds, setViewedIds, viewerKey, loading } = useActivityData(role, ready);
  const [selected, setSelected] = useState<ActivityFeedItem | null>(null);

  const items = category === "official" ? updates : category === "shop-offers" ? offers : [];
  const title = category === "official" ? "Official Necto Updates" : category === "shop-offers" ? "Shop Offers" : "New Near You";

  const openItem = async (item: ActivityFeedItem) => {
    setSelected(item);
    if (!viewerKey || viewedIds.has(item.id)) return;
    const marked = await markActivityViewed(item.id, viewerKey);
    if (marked) setViewedIds((current) => new Set([...current, item.id]));
  };

  if (!ready) return null;

  if (category === "new-near-you") {
    return (
      <AppShell role={role} title={title}>
        <BackToActivity role={role} />
        <div className="mt-5 rounded-3xl border border-border bg-white p-8 text-center shadow-sm">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-700">
            <Clock className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-black text-foreground">Coming Soon</h2>
          <p className="mt-2 text-sm text-muted-foreground">New Near You will arrive in a future update.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role={role} title={title}>
      <BackToActivity role={role} />

      <section className="mt-5 rounded-2xl border border-border bg-white p-4 shadow-sm">
        {category === "official" ? (
          <p className="text-sm text-muted-foreground">Newest official updates appear first.</p>
        ) : (
          <p className="text-sm text-muted-foreground">Newest active local shop offers appear first.</p>
        )}

        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
              Loading {category === "official" ? "official updates" : "shop offers"}...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
              <div className={`mx-auto grid h-12 w-12 place-items-center rounded-full ${category === "official" ? "bg-primary/10 text-primary" : "bg-emerald-50 text-emerald-700"}`}>
                {category === "official" ? <Megaphone className="h-6 w-6" /> : <Tag className="h-6 w-6" />}
              </div>
              <p className="mt-3 font-semibold text-foreground">{category === "official" ? "No official updates yet." : "No active offers."}</p>
            </div>
          ) : items.map((item) => (
            category === "official"
              ? <OfficialUpdateCard key={item.id} item={item} isNew={!viewedIds.has(item.id)} onOpen={() => openItem(item)} />
              : <OfferCard key={item.id} role={role} item={item} isNew={!viewedIds.has(item.id)} onOpen={() => openItem(item)} />
          ))}
        </div>
      </section>

      {selected && <ActivityDetailModal item={selected} onClose={() => setSelected(null)} />}
    </AppShell>
  );
}

function BackToActivity({ role }: { role: Role }) {
  return (
    <Link to={getActivityPath(role)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-white px-3 text-sm font-bold text-foreground shadow-sm hover:bg-muted">
      <ArrowLeft className="h-4 w-4" /> Back
    </Link>
  );
}

function OfficialUpdateCard({ item, isNew, onOpen }: { item: ActivityFeedItem; isNew: boolean; onOpen: () => void }) {
  return (
    <article className="rounded-2xl border border-border bg-background p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">Official</span>
        {isNew && <span className="rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">NEW</span>}
        <time className="ml-auto text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</time>
      </div>
      <h3 className="mt-3 text-base font-bold text-foreground">{item.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.message}</p>
      <button type="button" onClick={onOpen} className="mt-3 text-sm font-bold text-primary hover:underline">
        Read More
      </button>
    </article>
  );
}

function OfferCard({ role, item, isNew, onOpen }: { role: Role; item: ActivityFeedItem; isNew: boolean; onOpen: () => void }) {
  return (
    <article className="rounded-2xl border border-border bg-background p-4 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
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
            <button type="button" onClick={onOpen} className="text-sm font-bold text-primary hover:underline">
              View Offer
            </button>
            {item.linked_shop_id && (
              <Link to={shopPath(role, item.linked_shop_id)} className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700 hover:underline">
                View Shop <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function ActivityDetailModal({ item, onClose }: { item: ActivityFeedItem; onClose: () => void }) {
  const isOffer = item.type === "offer";

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/50 p-0 backdrop-blur-sm sm:place-items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="max-h-[86vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-3xl">
        <div className="flex items-start gap-3">
          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${isOffer ? "bg-emerald-50 text-emerald-700" : "bg-primary/10 text-primary"}`}>
            {isOffer ? <Tag className="h-5 w-5" /> : <Megaphone className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${isOffer ? "bg-emerald-50 text-emerald-700" : "bg-primary/10 text-primary"}`}>
              {isOffer ? "Shop Offer" : "Official"}
            </span>
            <h2 className="mt-3 text-xl font-black text-foreground">{item.title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {isOffer ? `Ends ${new Date(item.offer_end_at ?? item.expires_at ?? item.created_at).toLocaleDateString()}` : `Published ${new Date(item.created_at).toLocaleString()}`}
            </p>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground hover:bg-muted" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        {isOffer && (
          <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">
            <div className="font-bold">{item.shops?.shop_name ?? "Local shop"}</div>
            <div className="mt-1">{item.category}{item.discount_text ? ` • ${item.discount_text}` : ""}</div>
          </div>
        )}
        <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-foreground">{item.message}</p>
        <button type="button" onClick={onClose} className="mt-6 h-11 w-full rounded-xl bg-primary font-bold text-white">
          Close
        </button>
      </div>
    </div>
  );
}
