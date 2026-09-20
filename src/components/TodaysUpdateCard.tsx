import { useState, useEffect } from "react";
import { Radio } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isUpdateFresh, formatDashboardPostedTime } from "@/lib/freshness";

type Props = {
  table: "workers" | "shops";
  id?: string;
  initialUpdate?: string | null;
  initialUpdateAt?: string | null;
  onUpdateChanged?: (update: string | null, updateAt: string | null) => void;
};

export function TodaysUpdateCard({
  table,
  id,
  initialUpdate,
  initialUpdateAt,
  onUpdateChanged,
}: Props) {
  const [text, setText] = useState("");
  const [activeUpdate, setActiveUpdate] = useState<string | null>(initialUpdate ?? null);
  const [activeUpdateAt, setActiveUpdateAt] = useState<string | null>(initialUpdateAt ?? null);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    setActiveUpdate(initialUpdate ?? null);
    setActiveUpdateAt(initialUpdateAt ?? null);
  }, [initialUpdate, initialUpdateAt]);

  const isFresh = isUpdateFresh(activeUpdate, activeUpdateAt);

  const handlePost = async () => {
    const trimmed = text.trim();
    if (!trimmed || !id) return;

    setSaving(true);
    const nowIso = new Date().toISOString();

    const { error } = await supabase
      .from(table)
      .update({
        latest_update: trimmed,
        latest_update_at: nowIso,
      })
      .eq("id", id);

    setSaving(false);
    if (error) {
      toast.error("Could not post update");
      return;
    }

    setActiveUpdate(trimmed);
    setActiveUpdateAt(nowIso);
    setText("");
    toast.success("Today's update posted!");
    onUpdateChanged?.(trimmed, nowIso);
  };

  const handleClear = async () => {
    if (!id) return;

    setClearing(true);
    const { error } = await supabase
      .from(table)
      .update({
        latest_update: null,
      })
      .eq("id", id);

    setClearing(false);
    if (error) {
      toast.error("Could not clear update");
      return;
    }

    setActiveUpdate(null);
    setActiveUpdateAt(null);
    toast.success("Update cleared");
    onUpdateChanged?.(null, null);
  };

  return (
    <section className="mt-6 rounded-2xl border border-primary/15 bg-gradient-to-br from-white to-primary/5 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-white shadow-sm">
          <Radio className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-black text-primary">Today's Update</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Post a quick daily status visible to nearby customers for 48 hours.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="relative">
          <input
            type="text"
            maxLength={150}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && text.trim()) {
                e.preventDefault();
                handlePost();
              }
            }}
            placeholder="What's new today? e.g. Fresh stock arrived, available now..."
            className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary pr-14"
            disabled={saving}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground font-mono">
            {text.length}/150
          </span>
        </div>

        <button
          type="button"
          onClick={handlePost}
          disabled={saving || !text.trim()}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {saving ? "Posting..." : "Post Update"}
        </button>
      </div>

      {isFresh && activeUpdate && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/90 p-3 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 min-w-0">
            <span className="text-xs shrink-0 mt-0.5">🔴</span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-amber-950 break-words">{activeUpdate}</p>
              <p className="text-xs text-amber-700 mt-0.5 font-normal">
                {formatDashboardPostedTime(activeUpdateAt!)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            disabled={clearing}
            className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100 border border-amber-200 transition-colors"
          >
            {clearing ? "Clearing..." : "Clear"}
          </button>
        </div>
      )}
    </section>
  );
}
