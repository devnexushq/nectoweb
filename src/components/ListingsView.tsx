import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SearchBar, AreaFilterBar } from "@/components/SearchBar";
import { ListingCard, type ListingCardData } from "@/components/ListingCard";
import { EmptyState } from "@/components/EmptyState";
import { withTimeout } from "@/lib/safeAsync";
import {
  getRole,
  getUserId,
  getUserPincode,
  getUserArea,
  setUserPincode,
  setUserArea,
} from "@/lib/role";

type Mode = "workers" | "shops" | "mixed";

const VISIBILITY_ALL: ("local" | "all_india")[] = ["local", "all_india"];

const PUBLIC_WORKER_COLUMNS =
  "id,name,job_type,description,area,rating,photo_url,visibility,registered_at,latest_update,latest_update_at";
const PUBLIC_WORKER_COLUMNS_FALLBACK =
  "id,name,job_type,description,area,rating,photo_url,visibility,registered_at";

const PUBLIC_SHOP_COLUMNS =
  "id,shop_name,category,description,area,rating,photo_url,visibility,registered_at,latest_update,latest_update_at";
const PUBLIC_SHOP_COLUMNS_FALLBACK =
  "id,shop_name,category,description,area,rating,photo_url,visibility,registered_at";

const PAGE_SIZE = 25;

export function ListingsView({
  mode,
  hrefPrefix,
  registerCtaTo,
  registerCtaLabel,
  placeholder,
}: {
  mode: Mode;
  hrefPrefix: string;
  registerCtaTo?: string;
  registerCtaLabel?: string;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("");
  const [visibility, setVisibility] = useState<"local" | "all_india">("local");
  const [workers, setWorkers] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Viewer's own pincode
  const [viewerPincode, setViewerPincode] = useState<string>(() => getUserPincode()?.trim() || "");
  const [loadingViewer, setLoadingViewer] = useState<boolean>(true);

  // 1. Fetch current viewer's own pincode and area from their own record in database
  useEffect(() => {
    let cancelled = false;
    async function loadViewerLocation() {
      const role = getRole();
      const userId = getUserId();
      if (!role || !userId) {
        if (!cancelled) setLoadingViewer(false);
        return;
      }

      const table = role === "customer" ? "customers" : role === "worker" ? "workers" : "shops";
      try {
        let res = await supabase.from(table).select("pincode, area").eq("id", userId).maybeSingle();

        if (res.error && res.error.code === "42703") {
          res = await supabase.from(table).select("area").eq("id", userId).maybeSingle();
        }

        if (!cancelled && res.data) {
          const pin = (res.data.pincode || "").trim();
          const ar = (res.data.area || "").trim();
          if (pin) {
            setViewerPincode(pin);
            setUserPincode(pin);
          }
          if (ar) {
            setUserArea(ar);
          }
        }
      } catch (err) {
        console.error("Could not fetch viewer location:", err);
      } finally {
        if (!cancelled) setLoadingViewer(false);
      }
    }

    loadViewerLocation();
    return () => {
      cancelled = true;
    };
  }, []);

  // Listen for realtime session updates to user PIN code (e.g. from profile edits or registration)
  useEffect(() => {
    const onPinUpdate = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === "string") {
        setViewerPincode(detail.trim());
      } else {
        setViewerPincode(getUserPincode()?.trim() || "");
      }
    };
    window.addEventListener("necto_pincode_updated", onPinUpdate);
    return () => {
      window.removeEventListener("necto_pincode_updated", onPinUpdate);
    };
  }, []);

  const vPin = viewerPincode.trim();

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, area, visibility, vPin, mode]);

  // 2. Fetch workers and shops listings scoped at the database query level
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (visibility === "local" && loadingViewer && !vPin) {
        setLoading(true);
        return;
      }

      if (visibility === "local" && !vPin) {
        setWorkers([]);
        setShops([]);
        setFetchError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setFetchError(null);

      const fetchWorkers = async (): Promise<{ rows: any[]; error: string | null }> => {
        if (mode === "shops") return { rows: [], error: null };
        const buildQuery = (columns: string) => {
          let q = supabase
            .from("workers")
            .select(columns)
            .eq("approval_status", "approved")
            .eq("visibility", visibility);
          if (visibility === "local") {
            q = q.eq("pincode", vPin);
          }
          return q.order("registered_at", { ascending: false }).limit(200);
        };

        let res = await buildQuery(PUBLIC_WORKER_COLUMNS);
        if (res.error && res.error.code === "42703") {
          res = await buildQuery(PUBLIC_WORKER_COLUMNS_FALLBACK);
        }
        return { rows: res.data ?? [], error: res.error?.message ?? null };
      };

      const fetchShops = async (): Promise<{ rows: any[]; error: string | null }> => {
        if (mode === "workers") return { rows: [], error: null };
        const buildQuery = (columns: string) => {
          let q = supabase
            .from("shops")
            .select(columns)
            .eq("approval_status", "approved")
            .eq("visibility", visibility);
          if (visibility === "local") {
            q = q.eq("pincode", vPin);
          }
          return q.order("registered_at", { ascending: false }).limit(200);
        };

        let res = await buildQuery(PUBLIC_SHOP_COLUMNS);
        if (res.error && res.error.code === "42703") {
          res = await buildQuery(PUBLIC_SHOP_COLUMNS_FALLBACK);
        }
        return { rows: res.data ?? [], error: res.error?.message ?? null };
      };

      const result = await withTimeout(Promise.all([fetchWorkers(), fetchShops()]));
      if (cancelled) return;
      if (!result) {
        setFetchError("Request timed out while loading listings. Please try again.");
        setWorkers([]);
        setShops([]);
        setLoading(false);
        return;
      }
      const [wRes, sRes] = result;
      if (wRes.error || sRes.error) {
        setFetchError("Could not load listings right now. Please try again.");
      }
      setWorkers(wRes.rows);
      setShops(sRes.rows);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, visibility, vPin, loadingViewer, reloadTick]);

  const role = getRole();
  const profilePath =
    role === "customer"
      ? "/c/profile"
      : role === "worker"
        ? "/w/profile"
        : role === "shop"
          ? "/s/profile"
          : null;

  const items: ListingCardData[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const a = area.trim().toLowerCase();

    // Defense-in-depth strict Role-Based Visibility check
    const visFilter = (item: { visibility?: string | null }) => {
      const itemVis = String(item.visibility ?? "")
        .trim()
        .toLowerCase();
      if (visibility === "all_india") {
        return itemVis === "all_india";
      }
      return itemVis === "local" && Boolean(vPin);
    };

    const w: ListingCardData[] = workers
      .filter(visFilter)
      .filter((x) => !a || (x.area || "").toLowerCase().includes(a))
      .filter(
        (x) =>
          !q ||
          x.name?.toLowerCase().includes(q) ||
          x.job_type?.toLowerCase().includes(q) ||
          x.description?.toLowerCase().includes(q) ||
          x.area?.toLowerCase().includes(q),
      )
      .map((x) => ({
        id: x.id,
        type: "worker",
        name: x.name,
        subtitle: x.job_type,
        area: x.area,
        rating: Number(x.rating ?? 0),
        photo_url: x.photo_url,
        latest_update: x.latest_update,
        latest_update_at: x.latest_update_at,
      }));

    const s: ListingCardData[] = shops
      .filter(visFilter)
      .filter((x) => !a || (x.area || "").toLowerCase().includes(a))
      .filter(
        (x) =>
          !q ||
          x.shop_name?.toLowerCase().includes(q) ||
          x.category?.toLowerCase().includes(q) ||
          x.description?.toLowerCase().includes(q) ||
          x.area?.toLowerCase().includes(q),
      )
      .map((x) => ({
        id: x.id,
        type: "shop",
        name: x.shop_name,
        subtitle: x.category,
        area: x.area,
        rating: Number(x.rating ?? 0),
        photo_url: x.photo_url,
        latest_update: x.latest_update,
        latest_update_at: x.latest_update_at,
      }));

    // Deduplicate by composite role-entity id
    const seen = new Set<string>();
    return [...w, ...s].filter((item) => {
      const key = `${item.type}:${item.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [workers, shops, query, area, visibility, vPin]);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = items.length > visibleItems.length;

  return (
    <div className="space-y-3">
      <SearchBar value={query} onChange={setQuery} placeholder={placeholder} />

      <div className="flex items-center gap-2">
        <div
          className="inline-flex rounded-lg bg-muted p-1 text-xs font-semibold"
          role="group"
          aria-label="Discovery scope"
        >
          {VISIBILITY_ALL.map((v) => (
            <button
              type="button"
              key={v}
              aria-pressed={visibility === v}
              onClick={() => setVisibility(v)}
              className={`px-3 py-2 rounded-md transition ${
                visibility === v ? "bg-white text-primary shadow-sm" : "text-muted-foreground"
              }`}
            >
              {v === "local" ? "Local" : "All India"}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground ml-auto">
          {loading ? "Loading..." : `${items.length} results`}
        </span>
      </div>

      {query.trim() && <AreaFilterBar value={area} onChange={setArea} />}

      <div className="space-y-2 pt-1">
        {fetchError && !loading && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive flex items-center justify-between gap-2">
            <span>{fetchError}</span>
            <button
              type="button"
              onClick={() => setReloadTick((t) => t + 1)}
              className="shrink-0 rounded-lg bg-white px-2.5 py-1 font-semibold text-foreground border border-border hover:bg-muted"
            >
              Retry
            </button>
          </div>
        )}
        {!loading && !loadingViewer && visibility === "local" && !vPin ? (
          <EmptyState
            title="Set your PIN code in your profile to see local results"
            subtitle="Add your 6-digit PIN code in your profile so we can show you verified local services and shops in your area."
            ctaLabel={profilePath ? "Edit Profile" : registerCtaLabel || "Register"}
            ctaTo={profilePath || registerCtaTo || "/"}
          />
        ) : !loading && !fetchError && items.length === 0 ? (
          <EmptyState
            title={
              query.trim()
                ? `No results found for "${query}"${area.trim() ? ` in ${area}` : ""}`
                : visibility === "local"
                  ? `No local listings found for PIN code ${vPin}`
                  : "No All India listings found"
            }
            subtitle={
              query.trim()
                ? "Try a nearby skill, shop category, or area."
                : visibility === "local"
                  ? "Try switching to the 'All India' tab or check back soon."
                  : "Check back soon as more businesses join Necto."
            }
            ctaLabel={registerCtaLabel}
            ctaTo={registerCtaTo}
          />
        ) : (
          <>
            {visibleItems.map((it) => (
              <ListingCard key={`${it.type}-${it.id}`} item={it} hrefPrefix={hrefPrefix} />
            ))}
            {hasMore && (
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="w-full h-10 rounded-xl border border-border bg-white text-xs font-semibold text-primary hover:bg-muted transition"
              >
                Show more ({items.length - visibleItems.length} remaining)
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
