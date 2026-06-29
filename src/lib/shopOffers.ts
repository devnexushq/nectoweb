import { supabase } from "@/integrations/supabase/client";

export type OfferStatus = "draft" | "published" | "hidden";
export type OfferVisibilityScope = "local" | "district" | "state" | "all_india";

export type ShopOffer = {
  id: string;
  type: "offer";
  title: string;
  message: string;
  target_role: "all";
  visibility_scope: OfferVisibilityScope;
  city: string | null;
  area: string | null;
  district: string | null;
  state: string | null;
  status: OfferStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  linked_shop_id: string | null;
  offer_start_at: string | null;
  offer_end_at: string | null;
  category: string | null;
  discount_text: string | null;
  shops?: {
    shop_name: string | null;
    photo_url: string | null;
    category: string | null;
    area: string | null;
  } | null;
};

export type ShopOfferInput = {
  title: string;
  message: string;
  category: string;
  discount_text: string;
  offer_start_at: string;
  offer_end_at: string;
  city: string;
  area: string;
  district: string;
  state: string;
  visibility_scope: OfferVisibilityScope;
  status: OfferStatus;
};

const db = supabase as any;

export const EMPTY_OFFER_FORM: ShopOfferInput = {
  title: "",
  message: "",
  category: "",
  discount_text: "",
  offer_start_at: "",
  offer_end_at: "",
  city: "",
  area: "",
  district: "",
  state: "",
  visibility_scope: "local",
  status: "draft",
};

export function toInputDate(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function offerToForm(offer: ShopOffer): ShopOfferInput {
  return {
    title: offer.title ?? "",
    message: offer.message ?? "",
    category: offer.category ?? "",
    discount_text: offer.discount_text ?? "",
    offer_start_at: toInputDate(offer.offer_start_at),
    offer_end_at: toInputDate(offer.offer_end_at ?? offer.expires_at),
    city: offer.city ?? "",
    area: offer.area ?? "",
    district: offer.district ?? "",
    state: offer.state ?? "",
    visibility_scope: offer.visibility_scope,
    status: offer.status,
  };
}

export function validateOffer(form: ShopOfferInput) {
  if (!form.title.trim()) return "Offer title is required.";
  if (!form.message.trim()) return "Offer description is required.";
  if (!form.category.trim()) return "Offer category is required.";
  if (!form.offer_start_at) return "Start date is required.";
  if (!form.offer_end_at) return "End date is required.";
  if (!form.city.trim()) return "City is required.";
  if (!form.area.trim()) return "Area is required.";
  const start = new Date(form.offer_start_at);
  const end = new Date(form.offer_end_at);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "Please enter valid dates.";
  if (end < start) return "End date must be after the start date.";
  return null;
}

export async function fetchShopProfile(shopId: string) {
  const { data, error } = await db.from("shops").select("*").eq("id", shopId).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchShopOffers(shopId: string) {
  const { data, error } = await db
    .from("activity_feed")
    .select("*")
    .eq("type", "offer")
    .eq("linked_shop_id", shopId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ShopOffer[];
}

export async function fetchShopOffer(shopId: string, offerId: string) {
  const { data, error } = await db
    .from("activity_feed")
    .select("*")
    .eq("type", "offer")
    .eq("linked_shop_id", shopId)
    .eq("id", offerId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as ShopOffer | null;
}

export async function saveShopOffer(shopId: string, form: ShopOfferInput, offerId?: string) {
  const start = new Date(form.offer_start_at).toISOString();
  const end = new Date(form.offer_end_at).toISOString();
  const payload = {
    type: "offer",
    title: form.title.trim(),
    message: form.message.trim(),
    target_role: "all",
    visibility_scope: form.visibility_scope,
    city: form.city.trim(),
    area: form.area.trim(),
    district: form.district.trim() || null,
    state: form.state.trim() || null,
    status: form.status,
    created_by: shopId,
    linked_shop_id: shopId,
    offer_start_at: start,
    offer_end_at: end,
    expires_at: end,
    category: form.category.trim(),
    discount_text: form.discount_text.trim() || null,
    updated_at: new Date().toISOString(),
  };

  const result = offerId
    ? await db.from("activity_feed").update(payload).eq("id", offerId).eq("linked_shop_id", shopId).eq("type", "offer").select("*").maybeSingle()
    : await db.from("activity_feed").insert(payload).select("*").maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data as ShopOffer;
}

export async function updateOfferStatus(shopId: string, offerId: string, status: OfferStatus) {
  const { error } = await db
    .from("activity_feed")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", offerId)
    .eq("linked_shop_id", shopId)
    .eq("type", "offer");
  if (error) throw new Error(error.message);
}

export async function deleteShopOffer(shopId: string, offerId: string) {
  const { error } = await db
    .from("activity_feed")
    .delete()
    .eq("id", offerId)
    .eq("linked_shop_id", shopId)
    .eq("type", "offer");
  if (error) throw new Error(error.message);
}
