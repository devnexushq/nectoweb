import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { setUserId } from "@/lib/role";
import { useSeo } from "@/lib/seo";
import { Field, HoursAndVisibility, TextArea } from "@/components/FormBits";



export default function ShopRegister() {
  const navigate = useNavigate();
  useSeo({ title: "Shop Sign Up — NECTO", description: "List your shop on NECTO and reach hyperlocal customers.", canonical: "/s/register" });
  const [form, setForm] = useState({
    owner_name: "", shop_name: "", category: "", phone: "", whatsapp: "", description: "", area: "",
  });
  const [visibility, setVisibility] = useState<"local" | "all_india">("local");
  const [hours, setHours] = useState({ from: "09:00", to: "21:00", days: ["Mon","Tue","Wed","Thu","Fri","Sat"] });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.owner_name || !form.shop_name || !form.category || !form.phone || !form.whatsapp || !form.area)
      return toast.error("Please fill required fields");
    setLoading(true);
    const { data, error } = await supabase.from("shops").insert({
      ...form, visibility, business_hours: hours,
    }).select("id").maybeSingle();
    setLoading(false);
    if (error || !data) return toast.error("Could not register. Try again.");
    setUserId(data.id);
    toast.success("Successfully Registered! Welcome to Necto.");
    navigate("/s/dashboard" );
  }

  return (
    <div className="min-h-screen bg-white px-5 py-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-primary">Shop Registration</h1>
      <p className="text-sm text-muted-foreground mt-1">List your shop on Necto.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="Owner Name" value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} />
        <Field label="Shop Name" value={form.shop_name} onChange={(e) => setForm({ ...form, shop_name: e.target.value })} />
        <Field label="Category / Type of Shop" placeholder="Grocery, Hardware, Pharmacy..." value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <Field label="Phone Number" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Field label="WhatsApp Number" inputMode="tel" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
        <TextArea label="Shop Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Field label="Area / City" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
        <HoursAndVisibility hours={hours} setHours={setHours} visibility={visibility} setVisibility={setVisibility} />
        <button disabled={loading} className="w-full h-12 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-60">
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}
