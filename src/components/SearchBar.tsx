import { Search } from "lucide-react";

export function SearchBar({
  value,
  onChange,
  placeholder = "Search electrician, doctor, tent...",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 h-12 rounded-xl border border-border bg-white text-base placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition"
      />
    </div>
  );
}

export function AreaFilterBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Filter by area... e.g. Koira, Sundargarh"
      className="w-full px-4 h-11 rounded-lg border border-border bg-muted text-sm focus:outline-none focus:border-primary focus:bg-white transition"
    />
  );
}
