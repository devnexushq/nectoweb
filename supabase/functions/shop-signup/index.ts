import { createClient } from "npm:@supabase/supabase-js@2";
import {
  CountryCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
} from "npm:libphonenumber-js@1.11.20";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function cleanPhone(raw: string): string {
  if (!raw) return "";
  return raw.trim().replace(/[\s\-().]/g, "");
}

function validateAndFormat(raw: string, country: CountryCode): { valid: boolean; e164?: string } {
  const cleaned = cleanPhone(raw);
  if (!cleaned) return { valid: false };
  try {
    if (!isValidPhoneNumber(cleaned, country)) return { valid: false };
    const parsed = parsePhoneNumberFromString(cleaned, country);
    if (!parsed || !parsed.isValid()) return { valid: false };
    return { valid: true, e164: parsed.format("E.164") };
  } catch {
    return { valid: false };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => null);
    if (!body) return json({ error: "Invalid request payload" }, 400);

    const {
      owner_name,
      shop_name,
      category,
      phone,
      whatsapp,
      description,
      area,
      visibility = "local",
      business_hours,
      countryCode = "IN",
      whatsappCountryCode,
      terms_accepted,
    } = body;

    if (!owner_name || !shop_name || !category || !phone || !area) {
      return json(
        { error: "Missing required fields: owner_name, shop_name, category, phone, area" },
        400,
      );
    }

    const country = (countryCode || "IN") as CountryCode;
    const phoneResult = validateAndFormat(phone, country);

    if (!phoneResult.valid || !phoneResult.e164) {
      return json({ error: "Invalid number" }, 400);
    }

    const e164Phone = phoneResult.e164;

    // Optional WhatsApp normalization
    let e164Whatsapp = cleanPhone(whatsapp);
    if (whatsapp) {
      const waCountry = (whatsappCountryCode || country) as CountryCode;
      const waResult = validateAndFormat(whatsapp, waCountry);
      if (waResult.valid && waResult.e164) {
        e164Whatsapp = waResult.e164;
      }
    } else {
      e164Whatsapp = e164Phone;
    }

    // Backend Duplicate Check in shops table
    const { data: existing, error: dupCheckErr } = await supabase
      .from("shops")
      .select("id")
      .eq("phone", e164Phone)
      .maybeSingle();

    if (dupCheckErr) {
      console.error("[shop-signup] Error checking duplicate phone:", dupCheckErr);
    }

    if (existing) {
      return json(
        {
          error: "This number is already registered",
          code: "DUPLICATE_PHONE",
          phone: e164Phone,
        },
        409,
      );
    }

    // Insert shop record with E.164 phone
    const { data, error } = await supabase
      .from("shops")
      .insert({
        owner_name: String(owner_name).trim(),
        shop_name: String(shop_name).trim(),
        category: String(category).trim(),
        phone: e164Phone,
        whatsapp: e164Whatsapp,
        description: description ? String(description).trim() : null,
        area: String(area).trim(),
        visibility: visibility === "all_india" ? "all_india" : "local",
        business_hours: business_hours || null,
        approval_status: "approved",
        approval_notes: null,
        terms_accepted: terms_accepted !== false,
        terms_accepted_at: new Date().toISOString(),
        terms_version: "2026-06-07",
      })
      .select("id, shop_name, owner_name, phone, area, registered_at")
      .maybeSingle();

    if (error || !data) {
      return json({ error: error?.message || "Could not register shop" }, 500);
    }

    return json({ ok: true, data }, 201);
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
