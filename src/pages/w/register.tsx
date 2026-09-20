import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { CountryCode } from "libphonenumber-js";
import { supabase } from "@/integrations/supabase/client";
import { setRole, setUserId, setUserPhone, setUserPincode, setUserArea } from "@/lib/role";
import { useSeo } from "@/lib/seo";
import { Field, HoursAndVisibility, TextArea } from "@/components/FormBits";
import { PinCodeField } from "@/components/PinCodeField";
import { PhoneInputField } from "@/components/PhoneInputField";
import { DuplicateNumberDialog } from "@/components/DuplicateNumberDialog";
import { validatePhoneNumber } from "@/lib/phone";
import RegistrationNav, { ChooseDifferentAccountTypeLink } from "@/components/RegistrationNav";
import { Checkbox } from "@/components/ui/checkbox";
import { consentInsertFields } from "@/lib/legal";

export default function WorkerRegister() {
  const navigate = useNavigate();
  useSeo({
    title: "Worker Sign Up | NECTO",
    description: "List yourself on NECTO and get discovered by local customers.",
    canonical: "/w/register",
    noindex: true,
  });
  const [form, setForm] = useState({
    name: "",
    job_type: "",
    experience: "",
    phone: "",
    whatsapp: "",
    description: "",
    area: "",
    pincode: "",
  });
  const [countryCode, setCountryCode] = useState<CountryCode>("IN");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicatePhone, setDuplicatePhone] = useState("");
  const [visibility, setVisibility] = useState<"local" | "all_india">("local");
  const [hours, setHours] = useState({
    from: "09:00",
    to: "18:00",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  function handlePhoneChange(val: string) {
    setForm({ ...form, phone: val });
    if (phoneError) {
      setPhoneError(null);
    }
  }

  function handleCountryChange(code: CountryCode) {
    setCountryCode(code);
    if (form.phone.trim()) {
      const res = validatePhoneNumber(form.phone, code);
      if (!res.isValid) {
        setPhoneError("Invalid number");
      } else {
        setPhoneError(null);
      }
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.job_type.trim() || !form.phone.trim() || !form.area.trim()) {
      return toast.error("Please fill required fields");
    }

    // Phone validation using libphonenumber-js according to selected country format
    const phoneValidation = validatePhoneNumber(form.phone, countryCode);
    if (!phoneValidation.isValid || !phoneValidation.e164) {
      setPhoneError("Invalid number");
      return toast.error("Invalid number");
    }
    setPhoneError(null);

    const e164Phone = phoneValidation.e164;

    // Normalize whatsapp number if provided, otherwise fallback to e164Phone
    let e164Whatsapp = e164Phone;
    if (form.whatsapp.trim()) {
      const waValidation = validatePhoneNumber(form.whatsapp, countryCode);
      if (waValidation.isValid && waValidation.e164) {
        e164Whatsapp = waValidation.e164;
      } else {
        // If invalid format entered for whatsapp, alert user
        return toast.error("Invalid WhatsApp number");
      }
    }

    if (!agreed) return toast.error("Please accept the Terms & Conditions");

    setLoading(true);

    // 1. Direct Duplicate Check on workers table before registering
    const rawDigits = form.phone.replace(/\D/g, "");
    const candidatePhones = Array.from(
      new Set([
        e164Phone,
        rawDigits,
        form.phone.trim(),
        rawDigits.length === 10 ? `+91${rawDigits}` : "",
        rawDigits.length === 10 ? `91${rawDigits}` : "",
      ]),
    ).filter(Boolean);

    const { data: existingWorker } = await supabase
      .from("workers")
      .select("id, phone")
      .in("phone", candidatePhones)
      .limit(1)
      .maybeSingle();

    if (existingWorker) {
      setLoading(false);
      setDuplicatePhone(e164Phone);
      setDuplicateOpen(true);
      return toast.error("This number is already registered");
    }

    // 2. Attempt registration via backend edge function (worker-signup)
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke("worker-signup", {
        body: {
          name: form.name.trim(),
          job_type: form.job_type.trim(),
          experience: Number(form.experience) || 0,
          phone: form.phone,
          whatsapp: e164Whatsapp,
          description: form.description.trim(),
          area: form.area.trim(),
          pincode: form.pincode.trim() || null,
          countryCode,
          visibility,
          business_hours: hours,
          ...consentInsertFields(),
        },
      });

      if (
        fnError?.message?.includes("already registered") ||
        (fnData as { code?: string })?.code === "DUPLICATE_PHONE"
      ) {
        setLoading(false);
        setDuplicatePhone(e164Phone);
        setDuplicateOpen(true);
        return toast.error("This number is already registered");
      }

      if (
        fnError?.message?.includes("Invalid number") ||
        (fnData as { error?: string })?.error === "Invalid number"
      ) {
        setLoading(false);
        setPhoneError("Invalid number");
        return toast.error("Invalid number");
      }

      if (fnData?.ok && fnData.data?.id) {
        setLoading(false);
        setRole("worker");
        setUserId(fnData.data.id);
        setUserPhone(e164Phone);
        if (form.pincode.trim()) setUserPincode(form.pincode.trim());
        if (form.area.trim()) setUserArea(form.area.trim());
        toast.success("Successfully Registered! Welcome to Necto.");
        navigate("/w/dashboard", { replace: true });
        return;
      }
    } catch {
      // If edge function is not deployed locally, proceed with direct table insert
    }

    // 3. Fallback direct insert into workers table with E.164 phone
    const basePayload = {
      name: form.name.trim(),
      job_type: form.job_type.trim(),
      experience: Number(form.experience) || 0,
      phone: e164Phone,
      whatsapp: e164Whatsapp,
      description: form.description.trim() || null,
      area: form.area.trim(),
      visibility,
      business_hours: hours,
      approval_status: "approved",
      approval_notes: null,
      ...consentInsertFields(),
    };

    let insertRes = await supabase
      .from("workers")
      .insert({
        ...basePayload,
        pincode: form.pincode.trim() || null,
      })
      .select("id")
      .maybeSingle();

    if (insertRes.error && insertRes.error.code === "42703") {
      insertRes = await supabase.from("workers").insert(basePayload).select("id").maybeSingle();
    }

    const { data, error } = insertRes;
    setLoading(false);

    if (error) {
      if (
        error.code === "23505" ||
        error.message.toLowerCase().includes("unique") ||
        error.message.toLowerCase().includes("duplicate") ||
        error.message.toLowerCase().includes("already registered")
      ) {
        setDuplicatePhone(e164Phone);
        setDuplicateOpen(true);
        return toast.error("This number is already registered");
      }
      return toast.error("Could not register. Try again.");
    }

    if (!data) return toast.error("Could not register. Try again.");

    setRole("worker");
    setUserId(data.id);
    setUserPhone(e164Phone);
    if (form.pincode.trim()) setUserPincode(form.pincode.trim());
    if (form.area.trim()) setUserArea(form.area.trim());
    toast.success("Successfully Registered! Welcome to Necto.");
    navigate("/w/dashboard", { replace: true });
  }

  return (
    <div className="min-h-screen bg-white">
      <RegistrationNav />
      <main className="mx-auto w-full max-w-md px-5 py-8 sm:py-10">
        <h1 className="text-2xl font-bold text-primary">Worker Registration</h1>
        <p className="text-sm text-muted-foreground mt-1">Get discovered by local customers.</p>
        <ChooseDifferentAccountTypeLink />
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field
            label="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Field
            label="Job Type"
            placeholder="Electrician, Plumber, Doctor..."
            value={form.job_type}
            onChange={(e) => setForm({ ...form, job_type: e.target.value })}
          />
          <Field
            label="Years of Experience"
            inputMode="numeric"
            value={form.experience}
            onChange={(e) => setForm({ ...form, experience: e.target.value })}
          />
          <PhoneInputField
            label="Phone Number"
            countryCode={countryCode}
            onCountryChange={handleCountryChange}
            phone={form.phone}
            onPhoneChange={handlePhoneChange}
            error={phoneError}
          />
          <Field
            label="WhatsApp Number (optional)"
            inputMode="tel"
            placeholder="Defaults to phone number"
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
          />
          <TextArea
            label="Description (what you do)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <PinCodeField
            pincode={form.pincode}
            onPincodeChange={(val) => setForm((prev) => ({ ...prev, pincode: val }))}
            onAreaResolved={(resolvedArea) => setForm((prev) => ({ ...prev, area: resolvedArea }))}
          />
          <Field
            label="Area / City"
            value={form.area}
            onChange={(e) => setForm({ ...form, area: e.target.value })}
          />
          <HoursAndVisibility
            hours={hours}
            setHours={setHours}
            visibility={visibility}
            setVisibility={setVisibility}
          />
          <label className="flex items-start gap-3 text-sm text-foreground cursor-pointer select-none pt-2">
            <Checkbox
              checked={agreed}
              onCheckedChange={(v) => setAgreed(v === true)}
              className="mt-0.5"
            />
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
          <button
            disabled={loading || !agreed}
            className="w-full h-12 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
      </main>

      <DuplicateNumberDialog
        open={duplicateOpen}
        onOpenChange={setDuplicateOpen}
        phoneNumber={duplicatePhone}
        roleLabel="worker"
      />
    </div>
  );
}
