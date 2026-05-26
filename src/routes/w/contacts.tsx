import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageCircle, Phone } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/lib/role";

export const Route = createFileRoute("/w/contacts")({ component: WorkerContacts });

function WorkerContacts() {
  const ready = useRoleGuard("worker");
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const id = getUserId();
    if (!id) return;
    supabase.from("contacts_log").select("*").eq("to_id", id).eq("to_type", "worker").order("timestamp", { ascending: false }).then(({ data }) => {
      setLogs(data ?? []);
      setLoading(false);
    });
  }, []);
  if (!ready) return null;
  return (
    <AppShell role="worker" title="Contacts">
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : logs.length === 0 ? (
        <EmptyState title="No contacts yet" subtitle="When customers reach out, you'll see them here." />
      ) : (
        <ul className="space-y-2">
          {logs.map((l) => <ContactRow key={l.id} l={l} />)}
        </ul>
      )}
    </AppShell>
  );
}

function ContactRow({ l }: { l: any }) {
  const wa = l.contact_type === "whatsapp";
  return (
    <li className="flex items-center gap-3 p-3 rounded-xl bg-white border border-border">
      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${wa ? "bg-[#25d366]/15 text-[#25d366]" : "bg-primary/10 text-primary"}`}>
        {wa ? <MessageCircle className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">{wa ? "WhatsApp contact" : "Call contact"}</div>
        <div className="text-xs text-muted-foreground">{new Date(l.timestamp).toLocaleString()}</div>
      </div>
    </li>
  );
}
