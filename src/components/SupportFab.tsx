import { useEffect, useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { validateFlexiblePhone } from "@/lib/phone";
import { toast } from "sonner";

export function SupportFab() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    if (!form.name.trim() || !form.phone.trim() || !form.message.trim()) {
      toast.error("Please fill all fields");
      return;
    }

    const phoneRes = validateFlexiblePhone(form.phone, "IN");
    if (!phoneRes.isValid || !phoneRes.e164) {
      toast.error("Invalid phone number");
      return;
    }

    setSending(true);
    const { error } = await supabase.from("support_queries").insert({
      name: form.name.trim(),
      phone: phoneRes.e164,
      message: form.message.trim(),
      status: "open",
    });
    setSending(false);
    if (error) return toast.error("Could not send. Please try again.");
    toast.success("We'll get back to you within 24 hours!");
    setForm({ name: "", phone: "", message: "" });
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Support"
        className="fixed bottom-20 right-4 z-30 h-12 w-12 rounded-full bg-accent text-white shadow-lg flex items-center justify-center hover:bg-accent/90 transition"
      >
        <HelpCircle className="h-6 w-6" />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="support-dialog-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 id="support-dialog-title" className="text-lg font-bold">
                Contact Necto
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <label htmlFor="support-name" className="sr-only">
                Your name
              </label>
              <input
                id="support-name"
                className="w-full h-11 px-3 rounded-lg border border-border focus:border-primary outline-none"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <label htmlFor="support-phone" className="sr-only">
                Phone number
              </label>
              <input
                id="support-phone"
                type="tel"
                inputMode="tel"
                className="w-full h-11 px-3 rounded-lg border border-border focus:border-primary outline-none"
                placeholder="Phone number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <label htmlFor="support-message" className="sr-only">
                How can we help?
              </label>
              <textarea
                id="support-message"
                rows={4}
                className="w-full px-3 py-2 rounded-lg border border-border focus:border-primary outline-none"
                placeholder="How can we help?"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
              <button
                type="submit"
                disabled={sending}
                className="w-full h-11 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-60"
              >
                {sending ? "Sending..." : "Submit"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
