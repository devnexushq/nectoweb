import { createClient } from "npm:@supabase/supabase-js@2";

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  const allowedList = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const isAllowedOrigin =
    Boolean(origin) &&
    (allowedList.length > 0
      ? allowedList.includes(origin)
      : origin.startsWith("https://") || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin));
  return {
    "Access-Control-Allow-Origin": isAllowedOrigin ? origin : "https://nectoweb.vercel.app",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

const VALID_SUPPORT = ["open", "in_progress", "resolved"];
const VALID_MODERATION_TABLES = ["workers", "shops", "customers"] as const;
const VALID_APPROVAL_STATUSES = ["approved", "rejected", "suspended", "pending"] as const;

function json(body: unknown, status = 200, corsHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, corsHeaders);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401, corsHeaders);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return json({ error: "Unauthorized" }, 401, corsHeaders);

    const userId = claimsData.claims.sub as string;
    const userEmail = (claimsData.claims.email as string) ?? null;

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roleRow, error: roleErr } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleErr) return json({ error: "Role check failed" }, 500, corsHeaders);
    if (!roleRow) return json({ error: "Forbidden" }, 403, corsHeaders);

    const body = await req.json().catch(() => null);
    if (!body || typeof body.action !== "string") {
      return json({ error: "Invalid body" }, 400, corsHeaders);
    }

    const { action } = body;

    if (action === "update_approval_status") {
      const table = body.table as (typeof VALID_MODERATION_TABLES)[number];
      const id = body.id as string;
      const status = body.status as (typeof VALID_APPROVAL_STATUSES)[number];
      if (
        !id ||
        !VALID_MODERATION_TABLES.includes(table) ||
        !VALID_APPROVAL_STATUSES.includes(status)
      ) {
        return json({ error: "Invalid moderation input" }, 400, corsHeaders);
      }

      const { data: updated, error } = await admin
        .from(table)
        .update({ approval_status: status })
        .eq("id", id)
        .select("id, approval_status")
        .maybeSingle();
      if (error) return json({ error: error.message }, 400, corsHeaders);
      if (!updated) return json({ error: "Record not found" }, 404, corsHeaders);

      await admin.from("activity_logs").insert({
        actor_id: userId,
        actor_email: userEmail,
        action: `status_${status}`,
        entity_type: table,
        entity_id: id,
        metadata: { new_status: status },
      });
      return json({ ok: true, data: updated }, 200, corsHeaders);
    }

    if (action === "update_support_status") {
      const id = body.id as string;
      const status = body.status as string;
      if (!id || !VALID_SUPPORT.includes(status)) {
        return json({ error: "Invalid input" }, 400, corsHeaders);
      }
      const { error } = await admin.from("support_queries").update({ status }).eq("id", id);
      if (error) return json({ error: error.message }, 400, corsHeaders);
      await admin.from("activity_logs").insert({
        actor_id: userId,
        actor_email: userEmail,
        action: "support_status_change",
        entity_type: "support_query",
        entity_id: id,
        metadata: { to: status },
      });
      return json({ ok: true }, 200, corsHeaders);
    }

    if (action === "set_product_visibility") {
      const id = body.id as string;
      const visibility = body.visibility as string;
      if (!id || !["visible", "hidden"].includes(visibility)) {
        return json({ error: "Invalid input" }, 400, corsHeaders);
      }
      const { error } = await admin.from("products").update({ visibility }).eq("id", id);
      if (error) return json({ error: error.message }, 400, corsHeaders);
      await admin.from("activity_logs").insert({
        actor_id: userId,
        actor_email: userEmail,
        action: visibility === "hidden" ? "product_hidden" : "product_restored",
        entity_type: "product",
        entity_id: id,
        metadata: { visibility },
      });
      return json({ ok: true }, 200, corsHeaders);
    }

    return json({ error: "Unknown action" }, 400, corsHeaders);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, corsHeaders);
  }
});
