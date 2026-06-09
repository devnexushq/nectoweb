import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ENTITY_TABLE: Record<string, string> = {
  customer: "customers",
  worker: "workers",
  shop: "shops",
};

const VALID_STATUSES = ["pending", "approved", "rejected", "suspended"];
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

    // approval actions
    if (["approve", "reject", "suspend", "set_status"].includes(action)) {
      const entityType = body.entity_type as string;
      const entityId = body.entity_id as string;
      const status =
        action === "approve" ? "approved" :
        action === "reject" ? "rejected" :
        action === "suspend" ? "suspended" :
        body.status as string;
      const notes = (body.notes as string) ?? null;

      const table = ENTITY_TABLE[entityType];
      if (!table) return json({ error: "Invalid entity_type" }, 400);
      if (!entityId) return json({ error: "Missing entity_id" }, 400);
      if (!VALID_STATUSES.includes(status)) return json({ error: "Invalid status" }, 400);

      // Set auth.uid() context for the trigger by using a user-scoped client when possible.
      // Service-role client doesn't expose auth.uid(); set actor explicitly via post-update log.
      const { data: prev } = await admin.from(table).select("approval_status").eq("id", entityId).maybeSingle();
      const { error: updErr } = await admin
        .from(table)
        .update({ approval_status: status, approval_notes: notes })
        .eq("id", entityId);
      if (updErr) return json({ error: updErr.message }, 400);

      // Trigger writes approval_history + activity_logs but actor_id will be null (service role).
      // Overwrite the most recent rows with the real actor.
      await admin
        .from("approval_history")
        .update({ changed_by: userId })
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .is("changed_by", null);

      await admin.from("activity_logs").insert({
        actor_id: userId,
        actor_email: userEmail,
        action: action,
        entity_type: entityType,
        entity_id: entityId,
        metadata: { from: prev?.approval_status ?? null, to: status, notes },
      });

      return json({ ok: true });
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
