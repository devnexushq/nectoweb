import { useEffect, useState } from "react";
import { MessageCircle, Phone } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/lib/role";



export default function ShopContacts() {
  const ready = useRoleGuard("shop");
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const id = getUserId();
    if (!id) return;
    supabase.from("contacts_log").select("*").eq("to_id", id).eq("to_type", "shop").order("timestamp", { ascending: false }).then(({ data }) => {
      setLogs(data ?? []);
      setLoading(false);
    });
  }, []);
  if (!ready) return null;
  return (
    <AppShell role="shop" title="Contacts">
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : logs.length === 0 ? (
        <EmptyState title="No contacts yet" subtitle="When customers reach out, you'll see them here." />
      ) : (
        <ul className="space-y-2">
          {logs.map((l) => (
            <li key={l.id} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-border">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${l.contact_type === "whatsapp" ? "bg-[#25d366]/15 text-[#25d366]" : "bg-primary/10 text-primary"}`}>
                {l.contact_type === "whatsapp" ? <MessageCircle className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{l.contact_type === "whatsapp" ? "WhatsApp contact" : "Call contact"}</div>
                <div className="text-xs text-muted-foreground">{new Date(l.timestamp).toLocaleString()}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
