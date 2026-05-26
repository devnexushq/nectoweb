import { MessageCircle, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/lib/role";

export function ContactButtons({
  whatsapp,
  phone,
  toId,
  toType,
}: {
  whatsapp: string;
  phone: string;
  toId: string;
  toType: "worker" | "shop";
}) {
  const cleanWa = (whatsapp || "").replace(/\D/g, "");
  const cleanPhone = (phone || "").replace(/\D/g, "");

  async function log(kind: "whatsapp" | "call") {
    try {
      await supabase.from("contacts_log").insert({
        from_phone: getUserId() ?? null,
        to_id: toId,
        to_type: toType,
        contact_type: kind,
      });
    } catch (e) {
      // ignore
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={() => {
          log("whatsapp");
          window.open(`https://wa.me/91${cleanWa}`, "_blank");
        }}
        className="flex items-center justify-center gap-2 h-14 rounded-xl bg-[#25d366] text-white font-semibold text-base shadow-sm hover:bg-[#1fb955] transition"
      >
        <MessageCircle className="h-5 w-5" />
        WhatsApp
      </button>
      <button
        onClick={() => {
          log("call");
          window.location.href = `tel:+91${cleanPhone}`;
        }}
        className="flex items-center justify-center gap-2 h-14 rounded-xl bg-primary text-white font-semibold text-base shadow-sm hover:bg-primary/90 transition"
      >
        <Phone className="h-5 w-5" />
        Call
      </button>
    </div>
  );
}
