import { Link } from "@tanstack/react-router";
import { MapPin, Star, Store, User } from "lucide-react";

export type ListingCardData = {
  id: string;
  type: "worker" | "shop";
  name: string;
  subtitle: string;
  area: string;
  rating: number;
  photo_url?: string | null;
};

export function ListingCard({ item, hrefPrefix }: { item: ListingCardData; hrefPrefix: string }) {
  const href = `${hrefPrefix}/${item.type === "worker" ? "worker" : "shop"}/${item.id}`;
  return (
    <Link
      to={href}
      className="flex gap-3 p-3 rounded-xl border border-border bg-white hover:border-primary/40 hover:shadow-sm transition-all"
    >
      <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
        {item.photo_url ? (
          <img src={item.photo_url} alt={item.name} className="h-full w-full object-cover" />
        ) : item.type === "worker" ? (
          <User className="h-8 w-8 text-muted-foreground" />
        ) : (
          <Store className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
          <span
            className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              item.type === "worker"
                ? "bg-primary/10 text-primary"
                : "bg-accent/15 text-accent"
            }`}
          >
            {item.type === "worker" ? "Worker" : "Shop"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{item.subtitle}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {item.area}
          </span>
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-accent text-accent" />
            {item.rating?.toFixed(1) ?? "0.0"}
          </span>
        </div>
      </div>
    </Link>
  );
}
