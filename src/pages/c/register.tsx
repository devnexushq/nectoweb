import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { setUserId } from "@/lib/role";
import { Field } from "@/components/FormBits";



export default function CustomerRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", area: "", phone: "" });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.area || !form.phone) return toast.error("Please fill all fields");
    setLoading(true);
    const { data, error } = await supabase.from("customers").insert(form).select("id").maybeSingle();
    setLoading(false);
    if (error || !data) return toast.error("Could not register. Try again.");
    setUserId(data.id);
    toast.success("Welcome to Necto!");
    navigate("/c/home" );
  }

  return (
    <div className="min-h-screen bg-white px-5 py-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-primary">Customer Registration</h1>
      <p className="text-sm text-muted-foreground mt-1">Tell us a bit about yourself.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Field label="Area / City" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
        <Field label="Phone Number" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <button disabled={loading} className="w-full h-12 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-60">
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}
