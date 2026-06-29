import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import type { Role } from "@/lib/role";
import { getActivityPath, fetchOfficialUpdates, fetchViewedActivityIds, getActivityViewerKey, fetchVisibleShopOffers } from "@/lib/activity";
import { getUserId } from "@/lib/role";

export function ActivityBell({ role }: { role: Role }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const userId = getUserId();
      if (!userId) {
        if (!cancelled) setUnreadCount(0);
        return;
      }

      const viewerKey = getActivityViewerKey(role, userId);
      const [updates, viewedIds] = await Promise.all([
        Promise.all([fetchOfficialUpdates(role, userId), fetchVisibleShopOffers(role, userId)]).then(([official, offers]) => [...official, ...offers]),
        fetchViewedActivityIds(viewerKey),
      ]);

      if (!cancelled) {
        setUnreadCount(updates.filter((item) => !viewedIds.has(item.id)).length);
      }
    };

    load();
    window.addEventListener("necto-activity-viewed", load);
    return () => {
      cancelled = true;
      window.removeEventListener("necto-activity-viewed", load);
    };
  }, [role]);

  return (
    <Link
      to={getActivityPath(role)}
      title="Activity"
      aria-label="Activity"
      className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-white text-primary shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />
      )}
    </Link>
  );
}
