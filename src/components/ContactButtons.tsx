import { MessageCircle, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getUserPhone } from "@/lib/role";

function formatTelUri(phone: string): string {
  if (!phone) return "";
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) {
    return `tel:${trimmed.replace(/[^\d+]/g, "")}`;
  }
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `tel:+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `tel:+${digits}`;
  return `tel:+${digits}`;
}

function formatWaUri(phone: string): string {
  if (!phone) return "";
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `https://wa.me/91${digits}`;
  return `https://wa.me/${digits}`;
}

export function ContactButtons({
  whatsapp,
  phone,
  toId,
  toType,
  onContactLogged,
}: {
  whatsapp: string;
  phone: string;
  toId: string;
  toType: "worker" | "shop";
  onContactLogged?: () => void;
}) {
  const targetWa = whatsapp || phone || "";
  const targetPhone = phone || whatsapp || "";

  async function log(kind: "whatsapp" | "call") {
    try {
      const fromPhone = getUserPhone();
      await supabase.from("contacts_log").insert({
        from_phone: fromPhone || null,
        to_id: toId,
        to_type: toType,
        contact_type: kind,
      });
      onContactLogged?.();
    } catch {
      // Silently continue so contact action is never blocked
    }
  }

  const waUrl = formatWaUri(targetWa);
  const telUrl = formatTelUri(targetPhone);

  return (
    <div className="grid grid-cols-2 gap-3">
      {waUrl ? (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => log("whatsapp")}
          className="flex items-center justify-center gap-2 h-14 rounded-xl bg-[#25d366] text-white font-semibold text-base shadow-sm hover:bg-[#1fb955] transition"
        >
          <MessageCircle className="h-5 w-5" />
          WhatsApp
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="flex items-center justify-center gap-2 h-14 rounded-xl bg-[#25d366]/60 text-white font-semibold text-base opacity-60"
        >
          <MessageCircle className="h-5 w-5" />
          WhatsApp
        </button>
      )}
      {telUrl ? (
        <a
          href={telUrl}
          onClick={() => log("call")}
          className="flex items-center justify-center gap-2 h-14 rounded-xl bg-primary text-white font-semibold text-base shadow-sm hover:bg-primary/90 transition"
        >
          <Phone className="h-5 w-5" />
          Call
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="flex items-center justify-center gap-2 h-14 rounded-xl bg-primary/60 text-white font-semibold text-base opacity-60"
        >
          <Phone className="h-5 w-5" />
          Call
        </button>
      )}
    </div>
  );
}
