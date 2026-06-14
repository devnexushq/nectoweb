import AdminLayout from "@/components/admin/AdminLayout";
import RequireAdmin from "@/components/admin/RequireAdmin";
import { AlertTriangle, CheckCircle2, Globe2, SearchCheck } from "lucide-react";

const checks = [
  { label: "Sitemap status", status: "Available", detail: "Build generates sitemap before production build.", ok: true },
  { label: "robots.txt status", status: "Review", detail: "Keep admin and auth pages out of public indexing rules.", ok: false },
  { label: "Admin pages indexable", status: "Blocked by auth", detail: "Admin routes require admin role. Add robots hardening if public crawlers are detected.", ok: true },
  { label: "Login pages indexable", status: "Warning", detail: "Login pages should stay noindex in a future SEO hardening pass.", ok: false },
  { label: "Registration pages indexable", status: "Warning", detail: "Registration pages may be useful for onboarding but should be reviewed for search strategy.", ok: false },
];

export default function AdminSeoCenter() {
  return (
    <RequireAdmin>
      <AdminLayout title="SEO Center">
        <div className="mb-5 rounded-2xl border border-cyan-200/60 bg-cyan-50/80 p-5 shadow-xl shadow-cyan-100/60">
          <div className="flex items-center gap-3"><Globe2 className="h-5 w-5 text-cyan-700" /><div><h2 className="font-semibold text-slate-950">Search visibility command panel</h2><p className="text-sm text-slate-600">Safe SEO signals only. No tokens, environment variables, or indexing credentials are displayed.</p></div></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {checks.map((c) => (
            <div key={c.label} className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-200/70 transition hover:-translate-y-1">
              <div className="flex items-start gap-3">
                <div className={`grid h-11 w-11 place-items-center rounded-2xl ${c.ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{c.ok ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}</div>
                <div><div className="font-semibold">{c.label}</div><div className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-slate-700"><SearchCheck className="h-3.5 w-3.5" />{c.status}</div><p className="mt-2 text-sm text-slate-500">{c.detail}</p></div>
              </div>
            </div>
          ))}
        </div>
      </AdminLayout>
    </RequireAdmin>
  );
}
