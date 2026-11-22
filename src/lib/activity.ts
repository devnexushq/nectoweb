import { supabase } from "@/integrations/supabase/client";
import type { Role } from "@/lib/role";

export type ActivityTargetRole = Role | "all";
export type ActivityVisibilityScope = "local" | "district" | "state" | "all_india";
export type ActivityStatus = "draft" | "published" | "hidden";

export type ActivityFeedItem = {
  id: string;
  type: "official_update" | "offer" | "new_join" | "trending" | "system" | "emergency";
  title: string;
  message: string;
  target_role: ActivityTargetRole;
  visibility_scope: ActivityVisibilityScope;
  city: string | null;
  area: string | null;
  district: string | null;
  state: string | null;
  status: ActivityStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  linked_shop_id?: string | null;
  offer_start_at?: string | null;
  offer_end_at?: string | null;
  category?: string | null;
  discount_text?: string | null;
  shops?: {
    shop_name: string | null;
    photo_url: string | null;
    category: string | null;
    area: string | null;
  } | null;
};

type ProfileLocation = {
  area?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
};

const db = supabase as any;

function normalize(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export function getActivityPath(role: Role) {
  if (role === "customer") return "/c/activity";
  if (role === "worker") return "/w/activity";
  return "/s/activity";
}

export function getActivityViewerKey(role: Role, userId: string) {
  return `${role}:${userId}`;
}

export async function fetchProfileLocation(role: Role, userId: string): Promise<ProfileLocation> {
  const table = role === "customer" ? "customers" : role === "worker" ? "workers" : "shops";
  const { data, error } = await db.from(table).select("*").eq("id", userId).maybeSingle();
  if (error || !data) return {};
  return {
    area: data.area ?? null,
    city: data.city ?? null,
    district: data.district ?? null,
    state: data.state ?? null,
  };
}

function textContainsToken(haystack: string, needle: string) {
  if (!haystack || !needle) return false;
  if (haystack === needle) return true;
  return haystack.includes(needle) || needle.includes(haystack);
}

function locationMatches(item: ActivityFeedItem, profile: ProfileLocation) {
  if (item.visibility_scope === "all_india") return true;

  const pArea = normalize(profile.area);
  const pCity = normalize(profile.city);
  const pDistrict = normalize(profile.district);
  const pState = normalize(profile.state);

  if (item.visibility_scope === "state") {
    const targetState = normalize(item.state);
    if (!targetState) return true;
    return textContainsToken(pState, targetState) || textContainsToken(pArea, targetState);
  }

  if (item.visibility_scope === "district") {
    const targetDistrict = normalize(item.district);
    if (!targetDistrict) return true;
    return (
      textContainsToken(pDistrict, targetDistrict) ||
      textContainsToken(pCity, targetDistrict) ||
      textContainsToken(pArea, targetDistrict)
    );
  }

  const targetArea = normalize(item.area);
  const targetCity = normalize(item.city);
  if (!targetArea && !targetCity) return true;

  const areaMatch =
    Boolean(targetArea) &&
    (textContainsToken(pArea, targetArea) || textContainsToken(pCity, targetArea));
  const cityMatch =
    Boolean(targetCity) &&
    (textContainsToken(pCity, targetCity) || textContainsToken(pArea, targetCity));
  return areaMatch || cityMatch;
}

function isVisibleForRole(item: ActivityFeedItem, role: Role, profile: ProfileLocation) {
  const targetMatches = item.target_role === "all" || item.target_role === role;
  return targetMatches && locationMatches(item, profile);
}

export async function fetchOfficialUpdates(role: Role, userId: string) {
  const profile = await fetchProfileLocation(role, userId);
  const { data, error } = await db
    .from("activity_feed")
    .select("*")
    .eq("type", "official_update")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[Activity] Could not load official updates", error.message);
    return [] as ActivityFeedItem[];
  }

  const now = Date.now();
  return ((data ?? []) as ActivityFeedItem[]).filter((item) => {
    const notExpired = !item.expires_at || new Date(item.expires_at).getTime() > now;
    return notExpired && isVisibleForRole(item, role, profile);
  });
}

export async function fetchVisibleShopOffers(role: Role, userId: string) {
  const profile = await fetchProfileLocation(role, userId);
  const { data, error } = await db
    .from("activity_feed")
    .select(
      "*, shops!activity_feed_linked_shop_id_fkey(shop_name, photo_url, category, area, approval_status)",
    )
    .eq("type", "offer")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[Activity] Could not load shop offers", error.message);
    return [] as ActivityFeedItem[];
  }

  const now = Date.now();
  return (
    (data ?? []) as Array<ActivityFeedItem & { shops?: { approval_status?: string | null } | null }>
  ).filter((item) => {
    const shopStatus = item.shops?.approval_status;
    if (shopStatus && shopStatus !== "approved") return false;
    const startOk = !item.offer_start_at || new Date(item.offer_start_at).getTime() <= now;
    const expiry = item.offer_end_at ?? item.expires_at;
    const notExpired = !expiry || new Date(expiry).getTime() >= now;
    return startOk && notExpired && isVisibleForRole(item, role, profile);
  });
}

export async function fetchViewedActivityIds(viewerKey: string) {
  const { data, error } = await db
    .from("activity_views")
    .select("activity_id")
    .eq("user_id", viewerKey);

  if (error) {
    console.warn("[Activity] Could not load viewed state", error.message);
    return new Set<string>();
  }

  return new Set(((data ?? []) as { activity_id: string }[]).map((row) => row.activity_id));
}

export async function markActivityViewed(activityId: string, viewerKey: string) {
  const { error } = await db
    .from("activity_views")
    .upsert(
      { activity_id: activityId, user_id: viewerKey, viewed_at: new Date().toISOString() },
      { onConflict: "activity_id,user_id" },
    );

  if (error) {
    console.warn("[Activity] Could not mark update as viewed", error.message);
    return false;
  }

  window.dispatchEvent(new CustomEvent("necto-activity-viewed"));
  return true;
}
