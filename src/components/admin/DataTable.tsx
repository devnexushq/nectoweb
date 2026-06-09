import { ReactNode, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="p-3 md:p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center gap-3">
        {searchFields && (
          <div className="relative md:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder={searchPlaceholder ?? "Search..."}
              className="pl-8 h-9"
            />
          </div>
        )}
        <div className="flex flex-wrap gap-2 md:ml-auto">{filters}</div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={`text-left font-medium px-4 py-2.5 whitespace-nowrap ${c.className ?? ""}`}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-slate-500">Loading…</td></tr>
            ) : paged.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-slate-500">No records</td></tr>
            ) : (
              paged.map((row) => (
                <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                  {columns.map((c) => (
                    <td key={c.key} className={`px-4 py-3 align-middle ${c.className ?? ""}`}>
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
        <div>
          {filtered.length === 0
            ? "0 records"
            : `Showing ${current * pageSize + 1}–${Math.min((current + 1) * pageSize, filtered.length)} of ${filtered.length}`}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={current === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span>Page {current + 1} / {pages}</span>
          <Button variant="outline" size="sm" disabled={current >= pages - 1} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
