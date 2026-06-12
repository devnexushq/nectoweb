import { supabase } from "@/integrations/supabase/client";

export type SupportStatus = "open" | "in_progress" | "resolved";

async function invoke(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("admin-actions", { body });
  if (error) throw new Error(error.message);
  if (data && (data as { error?: string }).error) throw new Error((data as { error: string }).error);
  return data;
}

export const adminApi = {
  updateSupport: (id: string, status: SupportStatus) =>
    invoke({ action: "update_support_status", id, status }),
  setProductVisibility: (id: string, visibility: "visible" | "hidden") =>
    invoke({ action: "set_product_visibility", id, visibility }),
};
