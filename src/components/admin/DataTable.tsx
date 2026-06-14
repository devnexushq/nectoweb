import { ReactNode, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, Database } from "lucide-react";

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

export default function DataTable<T extends { id: string }>({
  rows, columns, loading, searchPlaceholder, searchFields, filters, pageSize = 20,
}: {
  rows: T[];
  columns: Column<T>[];
  loading?: boolean;
  searchPlaceholder?: string;
  searchFields?: (row: T) => string;
  filters?: ReactNode;
  pageSize?: number;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!search.trim() || !searchFields) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter((r) => searchFields(r).toLowerCase().includes(q));
  }, [rows, search, searchFields]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages - 1);
  const paged = filtered.slice(current * pageSize, current * pageSize + pageSize);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-xl shadow-slate-200/70 backdrop-blur">
      <div className="flex flex-col gap-3 border-b border-slate-200/80 p-3 md:flex-row md:items-center md:p-4">
        {searchFields && (
          <div className="relative md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} placeholder={searchPlaceholder ?? "Search..."} className="h-10 rounded-xl border-slate-200 bg-slate-50/80 pl-9" />
          </div>
        )}
        <div className="flex flex-wrap gap-2 md:ml-auto">{filters}</div>
      </div>

      <div className="max-h-[62vh] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50/95 text-slate-600 backdrop-blur">
            <tr>{columns.map((c) => <th key={c.key} className={`whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide ${c.className ?? ""}`}>{c.header}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <tr key={i} className="border-t border-slate-100"><td colSpan={columns.length} className="px-4 py-3"><div className="h-4 w-full animate-pulse rounded bg-slate-100" /></td></tr>)
            ) : paged.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-14 text-center text-slate-500"><Database className="mx-auto mb-2 h-6 w-6 text-slate-300" />No records</td></tr>
            ) : (
              paged.map((row) => <tr key={row.id} className="border-t border-slate-100 transition hover:bg-cyan-50/40">{columns.map((c) => <td key={c.key} className={`px-4 py-3 align-middle ${c.className ?? ""}`}>{c.render(row)}</td>)}</tr>)
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200/80 px-4 py-3 text-xs text-slate-600">
        <div>{filtered.length === 0 ? "0 records" : `Showing ${current * pageSize + 1}-${Math.min((current + 1) * pageSize, filtered.length)} of ${filtered.length}`}</div>
        <div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={current === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}><ChevronLeft className="h-4 w-4" /></Button><span>Page {current + 1} / {pages}</span><Button variant="outline" size="sm" disabled={current >= pages - 1} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button></div>
      </div>
    </div>
  );
}
