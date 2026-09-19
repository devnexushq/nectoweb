import { supabase } from "@/integrations/supabase/client";

export type SupportStatus = "open" | "in_progress" | "resolved";

async function invoke(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("admin-actions", { body });
  if (error) throw new Error(error.message);
  if (data && (data as { error?: string }).error)
    throw new Error((data as { error: string }).error);
  return data;
}

export const adminApi = {
  updateSupport: async (id: string, status: SupportStatus) => {
    try {
      return await invoke({ action: "update_support_status", id, status });
    } catch {
      // Resilient fallback: direct database update
      const { data, error } = await supabase
        .from("support_queries")
        .update({ status })
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    }
  },
  setProductVisibility: async (id: string, visibility: "visible" | "hidden") => {
    try {
      return await invoke({ action: "set_product_visibility", id, visibility });
    } catch {
      // Resilient fallback: direct database update
      const { data, error } = await supabase
        .from("products")
        .update({ visibility })
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    }
  },
};
