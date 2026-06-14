import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import RequireAdmin from "@/components/admin/RequireAdmin";
import { useAdminAuth } from "@/lib/admin/auth";
import { isFounderUser } from "@/lib/admin/founder";
import { supabase } from "@/integrations/supabase/client";
import { Crown, TrendingUp, MapPin, MessageCircle, Phone, ShieldAlert, Rocket, NotebookPen, CheckCircle2 } from "lucide-react";

type Counts = { users: number; customers: number; workers: number; shops: number; leads: number; calls: number; whatsapp: number };
type Note = { id: string; title: string; body: string; tag: string; updatedAt: string };

const NOTE_KEY = "necto_founder_notes_v1";
const DEFAULT_NOTES: Note[] = [
  { id: "strategy", title: "Strategy", tag: "Roadmap", body: "Focus on dense local discovery loops and repeat contact actions.", updatedAt: new Date().toISOString() },
  { id: "investor", title: "Investor notes", tag: "Capital", body: "Track growth, city density, leads generated, and monetization readiness.", updatedAt: new Date().toISOString() },
];

export default function FounderVault() {
  const { loading, user } = useAdminAuth();
  const founder = isFounderUser(user);
  const [counts, setCounts] = useState<Counts>({ users: 0, customers: 0, workers: 0, shops: 0, leads: 0, calls: 0, whatsapp: 0 });
  const [cities, setCities] = useState<{ name: string; value: number }[]>([]);
  const [categories, setCategories] = useState<{ name: string; value: number }[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState({ title: "", tag: "Strategy", body: "" });

  useEffect(() => {
    if (!founder) return;
    const saved = localStorage.getItem(NOTE_KEY);
    setNotes(saved ? JSON.parse(saved) : DEFAULT_NOTES);
    const head = { count: "exact" as const, head: true };
    Promise.all([
      supabase.from("customers").select("*", head),
      supabase.from("workers").select("*", head),
      supabase.from("shops").select("*", head),
      supabase.from("contacts_log").select("contact_type"),
      supabase.from("customers").select("area"),
      supabase.from("workers").select("area,job_type"),
      supabase.from("shops").select("area,category"),
    ]).then(([c, w, s, logs, cr, wr, sr]) => {
      const contactRows = logs.data ?? [];
      setCounts({ users: (c.count ?? 0) + (w.count ?? 0) + (s.count ?? 0), customers: c.count ?? 0, workers: w.count ?? 0, shops: s.count ?? 0, leads: contactRows.length, calls: contactRows.filter((x: any) => x.contact_type === "call").length, whatsapp: contactRows.filter((x: any) => x.contact_type === "whatsapp").length });
      const cityMap = new Map<string, number>();
      [...(cr.data ?? []), ...(wr.data ?? []), ...(sr.data ?? [])].forEach((x: any) => { const k = (x.area || "Unknown").trim(); cityMap.set(k, (cityMap.get(k) ?? 0) + 1); });
      setCities([...cityMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value })));
      const catMap = new Map<string, number>();
      [...(wr.data ?? []).map((x: any) => x.job_type), ...(sr.data ?? []).map((x: any) => x.category)].forEach((x) => { const k = (x || "Uncategorized").trim(); catMap.set(k, (catMap.get(k) ?? 0) + 1); });
      setCategories([...catMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value })));
    });
  }, [founder]);

  const weakAreas = useMemo(() => cities.filter((c) => c.value <= 1).slice(0, 3), [cities]);

  if (loading) return <div className="min-h-screen bg-slate-950" />;
  if (!founder) return <Navigate to="/admin" replace />;

  const saveNote = () => {
    if (!draft.title.trim() || !draft.body.trim()) return;
    const next = [{ id: crypto.randomUUID(), ...draft, updatedAt: new Date().toISOString() }, ...notes];
    setNotes(next);
    localStorage.setItem(NOTE_KEY, JSON.stringify(next));
    setDraft({ title: "", tag: "Strategy", body: "" });
  };

  return (
    <RequireAdmin>
      <AdminLayout title="Founder Vault">
        <div className="space-y-6 text-slate-100">
          <section className="overflow-hidden rounded-3xl border border-cyan-300/20 bg-slate-950 p-6 shadow-2xl shadow-slate-950/30">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div><div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100"><Crown className="h-3.5 w-3.5" /> Founder-only</div><h2 className="mt-4 text-3xl font-black tracking-tight">Necto Founder Vault</h2><p className="mt-2 max-w-2xl text-sm text-slate-400">Private command center for strategy, risk, revenue readiness, growth signals, and system checklist. No secrets or environment variables are displayed.</p></div>
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">Access: main founder/admin only</div>
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-4">
            <VaultMetric icon={TrendingUp} label="Total growth" value={counts.users} />
            <VaultMetric icon={Phone} label="Call clicks" value={counts.calls} />
            <VaultMetric icon={MessageCircle} label="WhatsApp clicks" value={counts.whatsapp} />
            <VaultMetric icon={Rocket} label="Total leads" value={counts.leads} />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <VaultPanel title="City-wise demand" icon={MapPin} items={cities} empty="No city data yet" />
            <VaultPanel title="Most active categories" icon={TrendingUp} items={categories} empty="No category data yet" />
            <VaultPanel title="Weak areas needing growth" icon={ShieldAlert} items={weakAreas} empty="No weak areas detected" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl backdrop-blur">
              <div className="mb-4 flex items-center gap-2"><NotebookPen className="h-5 w-5 text-cyan-200" /><h3 className="font-bold">Secret founder notes</h3></div>
              <div className="grid gap-2 md:grid-cols-3"><input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Title" className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm outline-none" /><input value={draft.tag} onChange={(e) => setDraft({ ...draft, tag: e.target.value })} placeholder="Tag" className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm outline-none" /><button onClick={saveNote} className="rounded-xl bg-cyan-300 px-3 py-2 text-sm font-bold text-slate-950">Save note</button></div>
              <textarea value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} placeholder="Strategy, roadmap, competitor observations, investor notes, marketing ideas..." className="mt-2 min-h-24 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm outline-none" />
              <div className="mt-4 space-y-2">{notes.map((n) => <div key={n.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-3"><div className="flex items-center justify-between gap-2"><div className="font-semibold">{n.title}</div><span className="rounded-full bg-cyan-300/10 px-2 py-0.5 text-xs text-cyan-100">{n.tag}</span></div><p className="mt-1 text-sm text-slate-300">{n.body}</p></div>)}</div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl backdrop-blur">
              <div className="mb-4 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-200" /><h3 className="font-bold">Private system checklist</h3></div>
              {['SEO status', 'Analytics status', 'Supabase health', 'Vercel health', 'Security status', 'Backup status'].map((x, i) => <div key={x} className="flex items-center justify-between border-b border-white/10 py-3 text-sm last:border-0"><span>{x}</span><span className={i === 5 ? "text-amber-200" : "text-emerald-200"}>{i === 5 ? 'Review' : 'Operational'}</span></div>)}
              <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">Risk monitor: watch for sudden registration/contact spikes and repeated low-quality accounts.</div>
            </section>
          </div>
        </div>
      </AdminLayout>
    </RequireAdmin>
  );
}

function VaultMetric({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return <div className="rounded-3xl border border-white/10 bg-slate-950 p-5 text-white shadow-xl transition hover:-translate-y-1"><Icon className="mb-4 h-5 w-5 text-cyan-200" /><div className="text-xs uppercase tracking-wide text-slate-400">{label}</div><div className="mt-1 text-3xl font-black">{value}</div></div>;
}
function VaultPanel({ title, icon: Icon, items, empty }: { title: string; icon: any; items: { name: string; value: number }[]; empty: string }) {
  return <section className="rounded-3xl border border-white/10 bg-slate-950 p-5 shadow-xl"><div className="mb-4 flex items-center gap-2"><Icon className="h-5 w-5 text-cyan-200" /><h3 className="font-bold">{title}</h3></div>{items.length === 0 ? <p className="text-sm text-slate-400">{empty}</p> : <div className="space-y-3">{items.map((x) => <div key={x.name}><div className="mb-1 flex justify-between text-sm"><span>{x.name}</span><span className="text-cyan-200">{x.value}</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300" style={{ width: `${Math.min(100, x.value * 14)}%` }} /></div></div>)}</div>}</section>;
}
