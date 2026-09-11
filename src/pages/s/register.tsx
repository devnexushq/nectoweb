import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { CountryCode } from "libphonenumber-js";
import { supabase } from "@/integrations/supabase/client";
import { setRole, setUserId } from "@/lib/role";
import { useSeo } from "@/lib/seo";
import { Field, HoursAndVisibility, TextArea } from "@/components/FormBits";
import { PhoneInputField } from "@/components/PhoneInputField";
import { DuplicateNumberDialog } from "@/components/DuplicateNumberDialog";
import { validatePhoneNumber } from "@/lib/phone";
import RegistrationNav, { ChooseDifferentAccountTypeLink } from "@/components/RegistrationNav";
import { Checkbox } from "@/components/ui/checkbox";
import { consentInsertFields } from "@/lib/legal";

export default function ShopRegister() {
  const navigate = useNavigate();
  useSeo({
    title: "Shop Sign Up | NECTO",
    description: "List your shop on NECTO and reach hyperlocal customers.",
    canonical: "/s/register",
    noindex: true,
  });
  const [form, setForm] = useState({
    owner_name: "",
    shop_name: "",
    category: "",
    phone: "",
    whatsapp: "",
    description: "",
    area: "",
  });
  const [countryCode, setCountryCode] = useState<CountryCode>("IN");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicatePhone, setDuplicatePhone] = useState("");
  const [visibility, setVisibility] = useState<"local" | "all_india">("local");
  const [hours, setHours] = useState({
    from: "09:00",
    to: "21:00",
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
    if (
      !form.owner_name.trim() ||
      !form.shop_name.trim() ||
      !form.category.trim() ||
      !form.phone.trim() ||
      !form.area.trim()
    ) {
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
        return toast.error("Invalid WhatsApp number");
      }
    }

    if (!agreed) return toast.error("Please accept the Terms & Conditions");

    setLoading(true);

    // 1. Direct Duplicate Check on shops table before registering
    const { data: existingShop } = await supabase
      .from("shops")
      .select("id, phone")
      .eq("phone", e164Phone)
      .maybeSingle();

    if (existingShop) {
      setLoading(false);
      setDuplicatePhone(e164Phone);
      setDuplicateOpen(true);
      return toast.error("This number is already registered");
    }

    // 2. Attempt registration via backend edge function (shop-signup)
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke("shop-signup", {
        body: {
          owner_name: form.owner_name.trim(),
          shop_name: form.shop_name.trim(),
          category: form.category.trim(),
          phone: form.phone,
          whatsapp: e164Whatsapp,
          description: form.description.trim(),
          area: form.area.trim(),
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
        setRole("shop");
        setUserId(fnData.data.id);
        toast.success("Successfully Registered! Welcome to Necto.");
        navigate("/s/dashboard", { replace: true });
        return;
      }
    } catch {
      // If edge function is not deployed locally, proceed with direct table insert
    }

    // 3. Fallback direct insert into shops table with E.164 phone
    const { data, error } = await supabase
      .from("shops")
      .insert({
        owner_name: form.owner_name.trim(),
        shop_name: form.shop_name.trim(),
        category: form.category.trim(),
        phone: e164Phone,
        whatsapp: e164Whatsapp,
        description: form.description.trim() || null,
        area: form.area.trim(),
        visibility,
        business_hours: hours,
        approval_status: "approved",
        approval_notes: null,
        ...consentInsertFields(),
      })
      .select("id")
      .maybeSingle();

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

    setRole("shop");
    setUserId(data.id);
    toast.success("Successfully Registered! Welcome to Necto.");
    navigate("/s/dashboard", { replace: true });
  }

  return (
    <div className="min-h-screen bg-white">
      <RegistrationNav />
      <main className="mx-auto w-full max-w-md px-5 py-8 sm:py-10">
        <h1 className="text-2xl font-bold text-primary">Shop Registration</h1>
        <p className="text-sm text-muted-foreground mt-1">List your shop on Necto.</p>
        <ChooseDifferentAccountTypeLink />
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field
            label="Owner Name"
            value={form.owner_name}
            onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
          />
          <Field
            label="Shop Name"
            value={form.shop_name}
            onChange={(e) => setForm({ ...form, shop_name: e.target.value })}
          />
          <Field
            label="Category / Type of Shop"
            placeholder="Grocery, Hardware, Pharmacy..."
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
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
            label="Shop Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
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
        roleLabel="shop"
      />
    </div>
  );
}
