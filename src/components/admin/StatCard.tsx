import { LucideIcon, TrendingUp } from "lucide-react";

export default function StatCard({
  label, value, icon: Icon, hint, accent,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white/85 p-4 shadow-xl shadow-slate-200/70 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-300/70">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-emerald-300 to-indigo-400 opacity-70" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
          <div className="mt-1 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">{value}</div>
          {hint && <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"><TrendingUp className="h-3 w-3" />{hint}</div>}
        </div>
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl shadow-inner ${accent ?? "bg-slate-100 text-slate-600"}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
