import { FormEvent, useEffect, useMemo, useState, type ReactNode } from "react";
import { Edit3, EyeOff, Megaphone, Plus, Save, Send, Trash2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import RequireAdmin from "@/components/admin/RequireAdmin";
import StatusBadge from "@/components/admin/StatusBadge";
import { useAdminAuth } from "@/lib/admin/auth";
import { supabase } from "@/integrations/supabase/client";
import type { ActivityFeedItem, ActivityStatus, ActivityTargetRole, ActivityVisibilityScope } from "@/lib/activity";

const db = supabase as any;
const CONTROL_CLASS = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200";
const ACTION_CLASS = "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50";

type FormState = {
  id?: string;
  title: string;
  message: string;
  target_role: ActivityTargetRole;
  visibility_scope: ActivityVisibilityScope;
  city: string;
  area: string;
  district: string;
  state: string;
  status: ActivityStatus;
  expires_at: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  message: "",
  target_role: "all",
  visibility_scope: "all_india",
  city: "",
  area: "",
  district: "",
  state: "",
  status: "draft",
  expires_at: "",
};

function toLocalInputDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

function toForm(row: ActivityFeedItem): FormState {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    target_role: row.target_role,
    visibility_scope: row.visibility_scope,
    city: row.city ?? "",
    area: row.area ?? "",
    district: row.district ?? "",
    state: row.state ?? "",
    status: row.status,
    expires_at: toLocalInputDate(row.expires_at),
  };
}

export default function OfficialUpdatesManager() {
  const { user } = useAdminAuth();
  const [rows, setRows] = useState<ActivityFeedItem[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const editing = Boolean(form.id);

  const stats = useMemo(() => ({
    published: rows.filter((row) => row.status === "published").length,
    draft: rows.filter((row) => row.status === "draft").length,
    hidden: rows.filter((row) => row.status === "hidden").length,
  }), [rows]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await db
      .from("activity_feed")
      .select("*")
      .eq("type", "official_update")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Could not load official updates: ${error.message}`);
      setRows([]);
    } else {
      setRows((data ?? []) as ActivityFeedItem[]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setMessage(null);
  };

  const save = async (statusOverride: ActivityStatus) => {
    if (!form.title.trim() || !form.message.trim()) {
      setMessage("Title and message are required.");
      return;
    }

    setSaving(true);
    const payload = {
      type: "official_update",
      title: form.title.trim(),
      message: form.message.trim(),
      target_role: form.target_role,
      visibility_scope: form.visibility_scope,
      city: form.city.trim() || null,
      area: form.area.trim() || null,
      district: form.district.trim() || null,
      state: form.state.trim() || null,
      status: statusOverride,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      created_by: user?.id ?? null,
    };

    const result = form.id
      ? await db.from("activity_feed").update(payload).eq("id", form.id)
      : await db.from("activity_feed").insert(payload);

    if (result.error) {
      setMessage(`Save failed: ${result.error.message}`);
    } else {
      setMessage(statusOverride === "published" ? "Official update published." : "Official update saved as draft.");
      setForm(EMPTY_FORM);
      await load();
    }
    setSaving(false);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    save("draft");
  };

  const changeStatus = async (row: ActivityFeedItem, status: ActivityStatus) => {
    const { error } = await db.from("activity_feed").update({ status }).eq("id", row.id);
    if (error) setMessage(`Status update failed: ${error.message}`);
    else {
      setMessage(`Update moved to ${status}.`);
      await load();
    }
  };

  const deleteRow = async (row: ActivityFeedItem) => {
    const ok = window.confirm(`Delete official update: ${row.title}?`);
    if (!ok) return;
    const { error } = await db.from("activity_feed").delete().eq("id", row.id);
    if (error) setMessage(`Delete failed: ${error.message}`);
    else {
      setMessage("Official update deleted.");
      if (form.id === row.id) resetForm();
      await load();
    }
  };

  return (
    <RequireAdmin>
      <AdminLayout title="Official Updates Manager">
        <div className="mb-6 rounded-3xl border border-white/70 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300/70">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Activity Center</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">Official Necto Updates</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">Publish admin-approved announcements to Customer, Worker, and Shop Activity Centers.</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3"><div className="text-2xl font-black">{stats.published}</div><div>Published</div></div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3"><div className="text-2xl font-black">{stats.draft}</div><div>Drafts</div></div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3"><div className="text-2xl font-black">{stats.hidden}</div><div>Hidden</div></div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(22rem,0.8fr)_1.2fr]">
          <form onSubmit={onSubmit} className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-xl shadow-slate-200/70 backdrop-blur">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold">{editing ? "Edit update" : "Create update"}</h3>
                <p className="text-xs text-slate-500">Official updates only for Phase 1.</p>
              </div>
              <button type="button" onClick={resetForm} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50"><Plus className="h-4 w-4" />New</button>
            </div>

            <div className="space-y-3">
              <Field label="Title"><input value={form.title} onChange={(e) => updateField("title", e.target.value)} className={CONTROL_CLASS} placeholder="Short official title" /></Field>
              <Field label="Message"><textarea value={form.message} onChange={(e) => updateField("message", e.target.value)} className={`${CONTROL_CLASS} min-h-36 resize-y`} placeholder="Full official message" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Target role"><select value={form.target_role} onChange={(e) => updateField("target_role", e.target.value as ActivityTargetRole)} className={CONTROL_CLASS}><option value="all">All</option><option value="customer">Customer</option><option value="worker">Worker</option><option value="shop">Shop</option></select></Field>
                <Field label="Visibility"><select value={form.visibility_scope} onChange={(e) => updateField("visibility_scope", e.target.value as ActivityVisibilityScope)} className={CONTROL_CLASS}><option value="all_india">All India</option><option value="local">Local</option><option value="district">District</option><option value="state">State</option></select></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="City"><input value={form.city} onChange={(e) => updateField("city", e.target.value)} className={CONTROL_CLASS} /></Field>
                <Field label="Area"><input value={form.area} onChange={(e) => updateField("area", e.target.value)} className={CONTROL_CLASS} /></Field>
                <Field label="District"><input value={form.district} onChange={(e) => updateField("district", e.target.value)} className={CONTROL_CLASS} /></Field>
                <Field label="State"><input value={form.state} onChange={(e) => updateField("state", e.target.value)} className={CONTROL_CLASS} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Current status"><select value={form.status} onChange={(e) => updateField("status", e.target.value as ActivityStatus)} className={CONTROL_CLASS}><option value="draft">Draft</option><option value="published">Published</option><option value="hidden">Hidden</option></select></Field>
                <Field label="Expiry date"><input type="datetime-local" value={form.expires_at} onChange={(e) => updateField("expires_at", e.target.value)} className={CONTROL_CLASS} /></Field>
              </div>
            </div>

            {message && <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{message}</div>}

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button disabled={saving} type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 hover:bg-slate-50 disabled:opacity-60"><Save className="h-4 w-4" />Save Draft</button>
              <button disabled={saving} type="button" onClick={() => save("published")} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 font-bold text-white hover:bg-slate-800 disabled:opacity-60"><Send className="h-4 w-4" />Publish</button>
            </div>
          </form>

          <section className="rounded-2xl border border-white/70 bg-white/90 shadow-xl shadow-slate-200/70 backdrop-blur">
            <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3"><Megaphone className="h-4 w-4 text-slate-500" /><h3 className="font-bold">Official updates</h3></div>
            <div className="divide-y divide-slate-100">
              {loading ? <div className="p-8 text-center text-sm text-slate-500">Loading official updates...</div> : rows.length === 0 ? <div className="p-8 text-center text-sm text-slate-500">No official updates yet.</div> : rows.map((row) => (
                <article key={row.id} className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={row.status} />
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{row.target_role}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{row.visibility_scope}</span>
                    <time className="ml-auto text-xs text-slate-500">{new Date(row.created_at).toLocaleString()}</time>
                  </div>
                  <h4 className="mt-3 text-base font-bold text-slate-950">{row.title}</h4>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{row.message}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => setForm(toForm(row))} className={ACTION_CLASS}><Edit3 className="h-4 w-4" />Edit</button>
                    <button type="button" onClick={() => changeStatus(row, "published")} className={ACTION_CLASS}><Send className="h-4 w-4" />Publish</button>
                    <button type="button" onClick={() => changeStatus(row, "draft")} className={ACTION_CLASS}><Save className="h-4 w-4" />Draft</button>
                    <button type="button" onClick={() => changeStatus(row, "hidden")} className={ACTION_CLASS}><EyeOff className="h-4 w-4" />Hide</button>
                    <button type="button" onClick={() => deleteRow(row)} className={`${ACTION_CLASS} text-rose-600 hover:border-rose-200 hover:bg-rose-50`}><Trash2 className="h-4 w-4" />Delete</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </AdminLayout>
    </RequireAdmin>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-xs font-bold uppercase tracking-wide text-slate-500"><span className="mb-1 block">{label}</span>{children}</label>;
}
