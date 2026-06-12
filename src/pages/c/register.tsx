import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { setUserId } from "@/lib/role";
import { useSeo } from "@/lib/seo";
import { Field } from "@/components/FormBits";
import RegistrationNav, { ChooseDifferentAccountTypeLink } from "@/components/RegistrationNav";
import { Checkbox } from "@/components/ui/checkbox";
import { consentInsertFields } from "@/lib/legal";

export default function CustomerRegister() {
  const navigate = useNavigate();
  useSeo({ title: "Customer Sign Up — NECTO", description: "Join NECTO as a customer to find trusted local workers and shops.", canonical: "/c/register" });
  const [form, setForm] = useState({ name: "", area: "", phone: "" });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.area || !form.phone) return toast.error("Please fill all fields");
    if (!agreed) return toast.error("Please accept the Terms & Conditions");
    setLoading(true);
    const { data, error } = await supabase
      .from("customers")
      .insert({ ...form, ...consentInsertFields() })
      .select("id")
      .maybeSingle();
    setLoading(false);
    if (error || !data) return toast.error("Could not register. Try again.");
    setUserId(data.id);
    toast.success("Welcome to Necto!");
    navigate("/c/home" );
  }

  return (
    <div className="min-h-screen bg-white">
      <RegistrationNav />
      <main className="mx-auto w-full max-w-md px-5 py-8 sm:py-10">
        <h1 className="text-2xl font-bold text-primary">Customer Registration</h1>
        <p className="text-sm text-muted-foreground mt-1">Tell us a bit about yourself.</p>
        <ChooseDifferentAccountTypeLink />
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Field label="Area / City" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
          <Field label="Phone Number" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <ConsentRow agreed={agreed} setAgreed={setAgreed} />
          <button disabled={loading || !agreed} className="w-full h-12 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-60">
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
      </main>
    </div>
  );
}

function ConsentRow({ agreed, setAgreed }: { agreed: boolean; setAgreed: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-3 text-sm text-foreground cursor-pointer select-none pt-2">
      <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
      <span className="leading-snug">
        I have read and agree to the{" "}
        <Link to="/terms-and-conditions" className="text-primary underline">
          Terms &amp; Conditions
        </Link>{" "}
        and{" "}
        <Link to="/privacy-policy" className="text-primary underline">
          Privacy Policy
        </Link>{" "}
        of Necto.
      </span>
    </label>
  );
}
