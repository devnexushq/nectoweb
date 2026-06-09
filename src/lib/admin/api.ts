import { supabase } from "@/integrations/supabase/client";

export type EntityType = "customer" | "worker" | "shop";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "suspended";
export type SupportStatus = "open" | "in_progress" | "resolved";

async function invoke(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("admin-actions", { body });
  if (error) throw new Error(error.message);
  if (data && (data as { error?: string }).error) throw new Error((data as { error: string }).error);
  return data;
}

export const adminApi = {
  setApproval: (entity_type: EntityType, entity_id: string, status: ApprovalStatus, notes?: string) =>
    invoke({ action: "set_status", entity_type, entity_id, status, notes: notes ?? null }),
  approve: (entity_type: EntityType, entity_id: string) =>
    invoke({ action: "approve", entity_type, entity_id }),
  reject: (entity_type: EntityType, entity_id: string, notes?: string) =>
    invoke({ action: "reject", entity_type, entity_id, notes }),
  suspend: (entity_type: EntityType, entity_id: string, notes?: string) =>
    invoke({ action: "suspend", entity_type, entity_id, notes }),
  updateSupport: (id: string, status: SupportStatus) =>
    invoke({ action: "update_support_status", id, status }),
  setProductVisibility: (id: string, visibility: "visible" | "hidden") =>
    invoke({ action: "set_product_visibility", id, visibility }),
};
