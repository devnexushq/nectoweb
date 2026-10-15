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
  "id,name,job_type,description,area,rating,photo_url,visibility,registered_at,pincode,latest_update,latest_update_at";
const PUBLIC_WORKER_COLUMNS_FALLBACK =
  "id,name,job_type,description,area,rating,photo_url,visibility,registered_at,pincode";

const PUBLIC_SHOP_COLUMNS =
  "id,shop_name,category,description,area,rating,photo_url,visibility,registered_at,pincode,latest_update,latest_update_at";
const PUBLIC_SHOP_COLUMNS_FALLBACK =
  "id,shop_name,category,description,area,rating,photo_url,visibility,registered_at,pincode";

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

  // Listen for realtime session updates to user PIN code (e.g. from profile edits or registration)
  useEffect(() => {
    const onPinUpdate = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) {
        setViewerPincode(detail.trim());
      } else {
        const p = getUserPincode();
        if (p) setViewerPincode(p.trim());
      }
    };
    window.addEventListener("necto_pincode_updated", onPinUpdate);
    return () => {
      window.removeEventListener("necto_pincode_updated", onPinUpdate);
    };
  }, []);

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

  const items: ListingCardData[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const a = area.trim().toLowerCase();

    // Strict Role-Based Visibility & Discovery Rules:
    // 1. All India section:
    //    - Shows ONLY workers/shops whose saved visibility explicitly equals "all_india".
    //    - Appears regardless of viewer's PIN code.
    //    - Missing or invalid visibility must NEVER default to All India.
    // 2. Local section:
    //    - Shows ONLY workers/shops whose saved visibility explicitly equals "local".
    //    - Requires the viewer to have a saved PIN code.
    //    - Requires the worker/shop to have a saved PIN code.
    //    - Listing appears ONLY when the worker/shop saved PIN code matches viewer's saved PIN code.
    //    - Never uses device location or inferred location as a substitute for saved PIN code.
    const visFilter = (item: {
      pincode?: string | null;
      area?: string | null;
      visibility?: string | null;
    }) => {
      const itemVis = String(item.visibility ?? "")
        .trim()
        .toLowerCase();

      if (visibility === "all_india") {
        return itemVis === "all_india";
      }

      // Local discovery
      if (itemVis !== "local") {
        return false;
      }

      if (!vPin) {
        return false;
      }

      const itemPin = item.pincode ? String(item.pincode).trim() : "";
      if (!itemPin) {
        return false;
      }

      // Exact match on saved PIN code
      return vPin === itemPin;
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
        latest_update: x.latest_update,
        latest_update_at: x.latest_update_at,
      }));

    return [...w, ...s];
  }, [workers, shops, query, area, visibility, vPin]);

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
        {!loading && !loadingViewer && visibility === "local" && !vPin ? (
          <EmptyState
            title="Set your PIN code in your profile to see local results"
            subtitle="Add your 6-digit PIN code in your profile so we can show you verified local services and shops in your area."
            ctaLabel={profilePath ? "Edit Profile" : registerCtaLabel || "Register"}
            ctaTo={profilePath || registerCtaTo || "/"}
          />
        ) : !loading && items.length === 0 ? (
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
          items.map((it) => (
            <ListingCard key={`${it.type}-${it.id}`} item={it} hrefPrefix={hrefPrefix} />
          ))
        )}
      </div>
    </div>
  );
}
