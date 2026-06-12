import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VALID_SUPPORT = ["open", "in_progress", "resolved"];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);

    const userId = claimsData.claims.sub as string;
    const userEmail = (claimsData.claims.email as string) ?? null;

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roleRow, error: roleErr } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleErr) return json({ error: "Role check failed" }, 500);
    if (!roleRow) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => null);
    if (!body || typeof body.action !== "string") return json({ error: "Invalid body" }, 400);

    const { action } = body;

    if (["approve", "reject", "suspend", "set_status"].includes(action)) {
      return json({ error: "Manual approval workflow is disabled" }, 410);
    }

    if (action === "update_support_status") {
      const id = body.id as string;
      const status = body.status as string;
      if (!id || !VALID_SUPPORT.includes(status)) return json({ error: "Invalid input" }, 400);
      const { error } = await admin.from("support_queries").update({ status }).eq("id", id);
      if (error) return json({ error: error.message }, 400);
      await admin.from("activity_logs").insert({
        actor_id: userId,
        actor_email: userEmail,
        action: "support_status_change",
        entity_type: "support_query",
        entity_id: id,
        metadata: { to: status },
      });
      return json({ ok: true });
    }

    if (action === "set_product_visibility") {
      const id = body.id as string;
      const visibility = body.visibility as string;
      if (!id || !["visible", "hidden"].includes(visibility)) return json({ error: "Invalid input" }, 400);
      const { error } = await admin.from("products").update({ visibility }).eq("id", id);
      if (error) return json({ error: error.message }, 400);
      await admin.from("activity_logs").insert({
        actor_id: userId,
        actor_email: userEmail,
        action: visibility === "hidden" ? "product_hidden" : "product_restored",
        entity_type: "product",
        entity_id: id,
        metadata: { visibility },
      });
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
