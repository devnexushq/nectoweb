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

    const { name, area, phone, countryCode = "IN", terms_accepted } = body;

    if (!name || !area || !phone) {
      return json({ error: "Missing required fields: name, area, phone" }, 400);
    }

    // Backend Phone Validation via libphonenumber-js
    const country = (countryCode || "IN") as CountryCode;
    const cleaned = cleanPhone(phone);

    let isValid = false;
    let e164Phone: string | null = null;

    try {
      isValid = isValidPhoneNumber(cleaned, country);
      if (isValid) {
        const parsed = parsePhoneNumberFromString(cleaned, country);
        if (parsed && parsed.isValid()) {
          e164Phone = parsed.format("E.164");
        } else {
          isValid = false;
        }
      }
    } catch {
      isValid = false;
    }

    if (!isValid || !e164Phone) {
      return json({ error: "Invalid number" }, 400);
    }

    // Backend Duplicate Check in customers table
    const { data: existing, error: dupCheckErr } = await supabase
      .from("customers")
      .select("id")
      .eq("phone", e164Phone)
      .maybeSingle();

    if (dupCheckErr) {
      console.error("[customer-signup] Error checking duplicate phone:", dupCheckErr);
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

    // Insert customer record with E.164 phone
    const { data, error } = await supabase
      .from("customers")
      .insert({
        name: String(name).trim(),
        area: String(area).trim(),
        phone: e164Phone,
        approval_status: "approved",
        approval_notes: null,
        terms_accepted: terms_accepted !== false,
        terms_accepted_at: new Date().toISOString(),
        terms_version: "2026-06-07",
      })
      .select("id, name, area, phone, created_at")
      .maybeSingle();

    if (error || !data) {
      return json({ error: error?.message || "Could not register customer" }, 500);
    }

    return json({ ok: true, data }, 201);
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
