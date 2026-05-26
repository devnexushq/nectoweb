import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { setUserId } from "@/lib/role";
import { Field, HoursAndVisibility, TextArea } from "@/components/FormBits";



export default function WorkerRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", job_type: "", experience: "", phone: "", whatsapp: "", description: "", area: "",
  });
  const [visibility, setVisibility] = useState<"local" | "all_india">("local");
  const [hours, setHours] = useState({ from: "09:00", to: "18:00", days: ["Mon","Tue","Wed","Thu","Fri","Sat"] });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.job_type || !form.phone || !form.whatsapp || !form.area) return toast.error("Please fill required fields");
    setLoading(true);
    const { data, error } = await supabase.from("workers").insert({
      ...form,
      experience: Number(form.experience) || 0,
      visibility,
      business_hours: hours,
    }).select("id").maybeSingle();
    setLoading(false);
    if (error || !data) return toast.error("Could not register. Try again.");
    setUserId(data.id);
    toast.success("Successfully Registered! Welcome to Necto.");
    navigate("/w/dashboard" );
  }

  return (
    <div className="min-h-screen bg-white px-5 py-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-primary">Worker Registration</h1>
      <p className="text-sm text-muted-foreground mt-1">Get discovered by local customers.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Field label="Job Type" placeholder="Electrician, Plumber, Doctor..." value={form.job_type} onChange={(e) => setForm({ ...form, job_type: e.target.value })} />
        <Field label="Years of Experience" inputMode="numeric" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
        <Field label="Phone Number" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Field label="WhatsApp Number" inputMode="tel" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
        <TextArea label="Description (what you do)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Field label="Area / City" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
        <HoursAndVisibility hours={hours} setHours={setHours} visibility={visibility} setVisibility={setVisibility} />
        <button disabled={loading} className="w-full h-12 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-60">
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}
