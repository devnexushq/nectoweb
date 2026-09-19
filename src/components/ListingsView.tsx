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

// Select pincode for internal proximity matching computation only (never passed to ListingCard)
const PUBLIC_WORKER_COLUMNS =
  "id,name,job_type,description,area,rating,photo_url,visibility,registered_at,pincode";
const PUBLIC_WORKER_COLUMNS_FALLBACK =
  "id,name,job_type,description,area,rating,photo_url,visibility,registered_at";

const PUBLIC_SHOP_COLUMNS =
  "id,shop_name,category,description,area,rating,photo_url,visibility,registered_at,pincode";
const PUBLIC_SHOP_COLUMNS_FALLBACK =
  "id,shop_name,category,description,area,rating,photo_url,visibility,registered_at";

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

  // Viewer's own pincode and area
  const [viewerPincode, setViewerPincode] = useState<string>(() => getUserPincode()?.trim() || "");
  const [viewerArea, setViewerArea] = useState<string>(() => getUserArea()?.trim() || "");
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
            setViewerArea(ar);
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

  // Fetch workers and shops listings
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);

      const fetchWorkers = async () => {
        if (mode === "shops") return [];
        let res = await supabase
          .from("workers")
          .select(PUBLIC_WORKER_COLUMNS)
          .order("registered_at", { ascending: false });
        if (res.error && res.error.code === "42703") {
          res = await supabase
            .from("workers")
            .select(PUBLIC_WORKER_COLUMNS_FALLBACK)
            .order("registered_at", { ascending: false });
        }
        return res.data ?? [];
      };

      const fetchShops = async () => {
        if (mode === "workers") return [];
        let res = await supabase
          .from("shops")
          .select(PUBLIC_SHOP_COLUMNS)
          .order("registered_at", { ascending: false });
        if (res.error && res.error.code === "42703") {
          res = await supabase
            .from("shops")
            .select(PUBLIC_SHOP_COLUMNS_FALLBACK)
            .order("registered_at", { ascending: false });
        }
        return res.data ?? [];
      };

      const result = await withTimeout(Promise.all([fetchWorkers(), fetchShops()]));
      if (cancelled) return;
      const [w, s] = result ?? [[], []];
      setWorkers(w);
      setShops(s);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const role = getRole();
  const profilePath =
    role === "customer"
      ? "/c/profile"
      : role === "worker"
        ? "/w/profile"
        : role === "shop"
          ? "/s/profile"
          : null;

  const vPin = viewerPincode.trim();
  const vArea = viewerArea.trim().toLowerCase();
  const hasViewerLocation = Boolean(vPin || vArea);

  const items: ListingCardData[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const a = area.trim().toLowerCase();

    // Local tab proximity matching logic
    const matchesLocal = (item: {
      pincode?: string | null;
      area?: string | null;
      visibility?: string | null;
    }) => {
      // Only show workers/shops where visibility === "local"
      if (item.visibility && item.visibility !== "local") {
        return false;
      }

      // If viewer has no pincode and no area, local tab cannot match
      if (!hasViewerLocation) {
        return false;
      }

      const itemPin = item.pincode ? String(item.pincode).trim() : "";
      const itemArea = item.area ? String(item.area).trim().toLowerCase() : "";

      // Match by pincode when both viewer and listing have one:
      // exact match, OR same first 3 digits (broader nearby-zone match)
      if (vPin && itemPin) {
        if (vPin === itemPin) return true;
        if (vPin.length >= 3 && itemPin.length >= 3 && vPin.slice(0, 3) === itemPin.slice(0, 3)) {
          return true;
        }
        return false;
      }

      // For older records that don't have a pincode stored yet:
      // fall back to matching on the area text field (case-insensitive substring match) against viewer's own area
      if (!itemPin && vArea && itemArea) {
        return itemArea.includes(vArea) || vArea.includes(itemArea);
      }

      // If viewer doesn't have a pincode but has an area:
      if (!vPin && vArea && itemArea) {
        return itemArea.includes(vArea) || vArea.includes(itemArea);
      }

      return false;
    };

    // All India tab: unchanged — show everyone regardless of visibility, pincode, or area.
    const visFilter = (x: {
      pincode?: string | null;
      area?: string | null;
      visibility?: string | null;
    }) => {
      if (visibility === "all_india") return true;
      return matchesLocal(x);
    };

    const w: ListingCardData[] = workers
      .filter(visFilter)
      .filter((x) => !a || (x.area || "").toLowerCase().includes(a))
      .filter(
        (x) =>
          !q ||
          x.name?.toLowerCase().includes(q) ||
          x.job_type?.toLowerCase().includes(q) ||
          x.description?.toLowerCase().includes(q),
      )
      .map((x) => ({
        id: x.id,
        type: "worker",
        name: x.name,
        subtitle: x.job_type,
        area: x.area,
        rating: Number(x.rating ?? 0),
        photo_url: x.photo_url,
      }));

    const s: ListingCardData[] = shops
      .filter(visFilter)
      .filter((x) => !a || (x.area || "").toLowerCase().includes(a))
      .filter(
        (x) =>
          !q ||
          x.shop_name?.toLowerCase().includes(q) ||
          x.category?.toLowerCase().includes(q) ||
          x.description?.toLowerCase().includes(q),
      )
      .map((x) => ({
        id: x.id,
        type: "shop",
        name: x.shop_name,
        subtitle: x.category,
        area: x.area,
        rating: Number(x.rating ?? 0),
        photo_url: x.photo_url,
      }));

    return [...w, ...s];
  }, [workers, shops, query, area, visibility, vPin, vArea, hasViewerLocation]);

  return (
    <div className="space-y-3">
      <SearchBar value={query} onChange={setQuery} placeholder={placeholder} />

      <div className="flex items-center gap-2">
        <div className="inline-flex rounded-lg bg-muted p-1 text-xs font-semibold">
          {VISIBILITY_ALL.map((v) => (
            <button
              key={v}
              onClick={() => setVisibility(v)}
              className={`px-3 py-1.5 rounded-md transition ${
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
        {!loading && !loadingViewer && visibility === "local" && !hasViewerLocation ? (
          <EmptyState
            title="Set your area in your profile to see local results"
            subtitle="Add your PIN code or city in your profile so we can show you verified services near you."
            ctaLabel={profilePath ? "Edit Profile" : registerCtaLabel || "Register"}
            ctaTo={profilePath || registerCtaTo || "/"}
          />
        ) : !loading && items.length === 0 ? (
          <EmptyState
            title={
              query.trim()
                ? `No results found for "${query}"${area.trim() ? ` in ${area}` : ""}`
                : visibility === "local"
                  ? `No local listings found near ${viewerArea || viewerPincode || "your area"}`
                  : "Nothing here yet"
            }
            subtitle={
              query.trim()
                ? "Try a nearby skill, shop category, or area."
                : visibility === "local"
                  ? "Try switching to the 'All India' tab or check back soon."
                  : "Check back soon."
            }
            ctaLabel={registerCtaLabel}
            ctaTo={registerCtaTo}
          />
        ) : (
          items.map((it) => (
            <ListingCard key={`${it.type}-${it.id}`} item={it} hrefPrefix={hrefPrefix} />
          ))
        )}
      </div>
    </div>
  );
}
