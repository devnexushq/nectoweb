import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { CountryCode } from "libphonenumber-js";
import { supabase } from "@/integrations/supabase/client";
import { setRole, setUserId, setUserPhone, setUserPincode, setUserArea } from "@/lib/role";
import { useSeo } from "@/lib/seo";
import { Field } from "@/components/FormBits";
import { PinCodeField } from "@/components/PinCodeField";
import { PhoneInputField } from "@/components/PhoneInputField";
import { DuplicateNumberDialog } from "@/components/DuplicateNumberDialog";
import { validatePhoneNumber, cleanPhoneNumber } from "@/lib/phone";
import RegistrationNav, { ChooseDifferentAccountTypeLink } from "@/components/RegistrationNav";
import { Checkbox } from "@/components/ui/checkbox";
import { consentInsertFields } from "@/lib/legal";

export default function CustomerRegister() {
  const navigate = useNavigate();
  useSeo({
    title: "Customer Sign Up | NECTO",
    description: "Join NECTO as a customer to find trusted local workers and shops.",
    canonical: "/c/register",
    noindex: true,
  });
  const [form, setForm] = useState({ name: "", area: "", phone: "", pincode: "" });
  const [countryCode, setCountryCode] = useState<CountryCode>("IN");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicatePhone, setDuplicatePhone] = useState("");
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
    if (!form.name.trim() || !form.area.trim() || !form.phone.trim()) {
      return toast.error("Please fill all fields");
    }

    // Validate phone number format using libphonenumber-js for selected country
    const phoneValidation = validatePhoneNumber(form.phone, countryCode);
    if (!phoneValidation.isValid || !phoneValidation.e164) {
      setPhoneError("Invalid number");
      return toast.error("Invalid number");
    }
    setPhoneError(null);

    const e164Phone = phoneValidation.e164;

    if (!agreed) return toast.error("Please accept the Terms & Conditions");

    setLoading(true);

    // 1. Direct Duplicate Check on customers table before registration
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id, phone")
      .eq("phone", e164Phone)
      .maybeSingle();

    if (existingCustomer) {
      setLoading(false);
      setDuplicatePhone(e164Phone);
      setDuplicateOpen(true);
      return toast.error("This number is already registered");
    }

    // 2. Attempt registration via backend edge function (customer-signup)
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke("customer-signup", {
        body: {
          name: form.name.trim(),
          area: form.area.trim(),
          pincode: form.pincode.trim() || null,
          phone: form.phone,
          countryCode,
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
        setRole("customer");
        setUserId(fnData.data.id);
        setUserPhone(e164Phone);
        if (form.pincode.trim()) setUserPincode(form.pincode.trim());
        if (form.area.trim()) setUserArea(form.area.trim());
        toast.success("Welcome to Necto!");
        navigate("/c/home", { replace: true });
        return;
      }
    } catch {
      // If edge function is not deployed locally, continue with direct database insert
    }

    // 3. Fallback direct insert into customers table with E.164 phone
    const basePayload = {
      name: form.name.trim(),
      area: form.area.trim(),
      phone: e164Phone,
      approval_status: "approved",
      approval_notes: null,
      ...consentInsertFields(),
    };

    let insertRes = await supabase
      .from("customers")
      .insert({
        ...basePayload,
        pincode: form.pincode.trim() || null,
      })
      .select("id")
      .maybeSingle();

    // If pincode column doesn't exist yet on remote schema, retry without it
    if (insertRes.error && insertRes.error.code === "42703") {
      insertRes = await supabase.from("customers").insert(basePayload).select("id").maybeSingle();
    }

    const { data, error } = insertRes;
    setLoading(false);

    if (error) {
      // Catch duplicate constraint violations (23505)
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

    setRole("customer");
    setUserId(data.id);
    setUserPhone(e164Phone);
    if (form.pincode.trim()) setUserPincode(form.pincode.trim());
    if (form.area.trim()) setUserArea(form.area.trim());
    toast.success("Welcome to Necto!");
    navigate("/c/home", { replace: true });
  }

  return (
    <div className="min-h-screen bg-white">
      <RegistrationNav />
      <main className="mx-auto w-full max-w-md px-5 py-8 sm:py-10">
        <h1 className="text-2xl font-bold text-primary">Customer Registration</h1>
        <p className="text-sm text-muted-foreground mt-1">Tell us a bit about yourself.</p>
        <ChooseDifferentAccountTypeLink />
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field
            label="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
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
          <PhoneInputField
            label="Phone Number"
            countryCode={countryCode}
            onCountryChange={handleCountryChange}
            phone={form.phone}
            onPhoneChange={handlePhoneChange}
            error={phoneError}
          />
          <ConsentRow agreed={agreed} setAgreed={setAgreed} />
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
        roleLabel="customer"
      />
    </div>
  );
}

function ConsentRow({ agreed, setAgreed }: { agreed: boolean; setAgreed: (v: boolean) => void }) {
  return (
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
  );
}
