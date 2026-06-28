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
};

type ProfileLocation = {
  area?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
};

const db = supabase as any;

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function hasValue(value: unknown) {
  return normalize(value).length > 0;
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

function locationMatches(item: ActivityFeedItem, profile: ProfileLocation) {
  if (item.visibility_scope === "all_india") return true;

  if (item.visibility_scope === "state") {
    return !hasValue(item.state) || normalize(profile.state) === normalize(item.state);
  }

  if (item.visibility_scope === "district") {
    return !hasValue(item.district) || normalize(profile.district) === normalize(item.district);
  }

  const areaMatch = hasValue(item.area) && normalize(profile.area) === normalize(item.area);
  const cityMatch = hasValue(item.city) && normalize(profile.city) === normalize(item.city);
  const noLocalTarget = !hasValue(item.area) && !hasValue(item.city);
  return noLocalTarget || areaMatch || cityMatch;
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
  const { error } = await db.from("activity_views").upsert(
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
