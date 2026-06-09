import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-rose-100 text-rose-800 border-rose-200",
  suspended: "bg-slate-200 text-slate-700 border-slate-300",
  open: "bg-sky-100 text-sky-800 border-sky-200",
  in_progress: "bg-amber-100 text-amber-800 border-amber-200",
  resolved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  visible: "bg-emerald-100 text-emerald-800 border-emerald-200",
  hidden: "bg-slate-200 text-slate-700 border-slate-300",
};

export default function StatusBadge({ status }: { status?: string | null }) {
  const s = (status ?? "pending").toLowerCase();
  const cls = STYLES[s] ?? "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize", cls)}>
      {s.replace("_", " ")}
    </span>
  );
}
