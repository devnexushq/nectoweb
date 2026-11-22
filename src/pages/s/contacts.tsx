import { useEffect, useState } from "react";
import { MessageCircle, Phone } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/lib/role";
import { withTimeout } from "@/lib/safeAsync";

export default function ShopContacts() {
  const ready = useRoleGuard("shop");
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  useEffect(() => {
    const id = getUserId();
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    withTimeout(
      supabase
        .from("contacts_log")
        .select("*")
        .eq("to_id", id)
        .eq("to_type", "shop")
        .order("timestamp", { ascending: false }),
    ).then((result) => {
      if (cancelled) return;
      if (!result || result.error) {
        setLoadError("Could not load contacts. Please check your connection.");
        setLoading(false);
        return;
      }
      setLogs(result.data ?? []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [reloadTick]);
  if (!ready) return null;
  return (
    <AppShell role="shop" title="Contacts">
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : loadError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-center space-y-3">
          <p className="text-sm font-medium text-destructive">{loadError}</p>
          <button
            type="button"
            onClick={() => setReloadTick((t) => t + 1)}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-white hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          title="No contacts yet"
          subtitle="When customers reach out, you'll see them here."
        />
      ) : (
        <ul className="space-y-2">
          {logs.map((l) => (
            <li
              key={l.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-white border border-border"
            >
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center ${l.contact_type === "whatsapp" ? "bg-[#25d366]/15 text-[#25d366]" : "bg-primary/10 text-primary"}`}
              >
                {l.contact_type === "whatsapp" ? (
                  <MessageCircle className="h-5 w-5" />
                ) : (
                  <Phone className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">
                  {l.contact_type === "whatsapp" ? "WhatsApp contact" : "Call contact"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(l.timestamp).toLocaleString()}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
