import { LucideIcon } from "lucide-react";

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
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
          {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
        </div>
        <div className={`shrink-0 h-9 w-9 rounded-lg grid place-items-center ${accent ?? "bg-slate-100 text-slate-600"}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
    </div>
  );
}
