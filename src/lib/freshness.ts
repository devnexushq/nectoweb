const EXPIRY_HOURS = 48;
const EXPIRY_MS = EXPIRY_HOURS * 60 * 60 * 1000;

/**
 * 48-Hour Expiry Rule:
 * isFresh = latest_update_at is not null AND (now - latest_update_at) <= 48 hours
 */
export function isUpdateFresh(
  latest_update?: string | null,
  latest_update_at?: string | null,
): boolean {
  if (!latest_update || !latest_update.trim()) return false;
  if (!latest_update_at) return false;

  const timestamp = new Date(latest_update_at).getTime();
  if (isNaN(timestamp)) return false;

  const diff = Date.now() - timestamp;
  return diff >= 0 && diff <= EXPIRY_MS;
}

/**
 * Short relative time format for cards and profiles:
 * e.g. "just now", "15m ago", "2h ago", "1d ago"
 */
export function formatShortRelativeTime(dateString: string): string {
  const timestamp = new Date(dateString).getTime();
  if (isNaN(timestamp)) return "";

  const diffMs = Math.max(0, Date.now() - timestamp);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

/**
 * Detailed relative time format for dashboard display:
 * e.g. "Posted just now", "Posted 3 hours ago", "Posted 1 day ago"
 */
export function formatDashboardPostedTime(dateString: string): string {
  const timestamp = new Date(dateString).getTime();
  if (isNaN(timestamp)) return "";

  const diffMs = Math.max(0, Date.now() - timestamp);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffMinutes < 1) return "Posted just now";
  if (diffMinutes < 60) {
    return `Posted ${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"} ago`;
  }
  if (diffHours < 24) {
    return `Posted ${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `Posted ${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
}
