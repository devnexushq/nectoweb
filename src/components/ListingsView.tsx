import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SearchBar, AreaFilterBar } from "@/components/SearchBar";
import { ListingCard, type ListingCardData } from "@/components/ListingCard";
import { EmptyState } from "@/components/EmptyState";
import { withTimeout } from "@/lib/safeAsync";

type Mode = "workers" | "shops" | "mixed";

const VISIBILITY_ALL: ("local" | "all_india")[] = ["local", "all_india"];
const PUBLIC_WORKER_COLUMNS = "id,name,job_type,description,area,rating,photo_url,visibility,registered_at";
const PUBLIC_SHOP_COLUMNS = "id,shop_name,category,description,area,rating,photo_url,visibility,registered_at";

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const wPromise = mode !== "shops"
        ? supabase.from("workers").select(PUBLIC_WORKER_COLUMNS).order("registered_at", { ascending: false })
        : Promise.resolve({ data: [] as any[] });
      const sPromise = mode !== "workers"
        ? supabase.from("shops").select(PUBLIC_SHOP_COLUMNS).order("registered_at", { ascending: false })
        : Promise.resolve({ data: [] as any[] });
      const result = await withTimeout(Promise.all([wPromise, sPromise]));
      if (cancelled) return;
      const [w, s] = result ?? [{ data: [] as any[] }, { data: [] as any[] }];
      setWorkers((w as any).data ?? []);
      setShops((s as any).data ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [mode]);


  const items: ListingCardData[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const a = area.trim().toLowerCase();
    const visFilter = (v: string) => (visibility === "all_india" ? true : v === "local");

    const w: ListingCardData[] = workers
      .filter((x) => visFilter(x.visibility))
      .filter((x) =>
        !q ||
        x.name?.toLowerCase().includes(q) ||
        x.job_type?.toLowerCase().includes(q) ||
        x.description?.toLowerCase().includes(q),
      )
      .filter((x) => !a || x.area?.toLowerCase().includes(a))
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
      .filter((x) => visFilter(x.visibility))
      .filter((x) =>
        !q ||
        x.shop_name?.toLowerCase().includes(q) ||
        x.category?.toLowerCase().includes(q) ||
        x.description?.toLowerCase().includes(q),
      )
      .filter((x) => !a || x.area?.toLowerCase().includes(a))
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
  }, [workers, shops, query, area, visibility]);

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
        <span className="text-xs text-muted-foreground ml-auto">{loading ? "Loading..." : `${items.length} results`}</span>
      </div>

      {query.trim() && <AreaFilterBar value={area} onChange={setArea} />}

      <div className="space-y-2 pt-1">
        {!loading && items.length === 0 ? (
          <EmptyState
            title={
              query.trim()
                ? `No results found for "${query}"${area.trim() ? ` in ${area}` : ""}`
                : "Nothing here yet"
            }
            subtitle={query.trim() ? "Try a nearby skill, shop category, or area." : "Check back soon."}
            ctaLabel={registerCtaLabel}
            ctaTo={registerCtaTo}
          />
        ) : (
          items.map((it) => <ListingCard key={`${it.type}-${it.id}`} item={it} hrefPrefix={hrefPrefix} />)
        )}
      </div>
    </div>
  );
}
