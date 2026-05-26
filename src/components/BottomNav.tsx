import { Link, useLocation } from "react-router-dom";
import { Home, Users, Store, User, Phone, LayoutDashboard, Package } from "lucide-react";
import type { Role } from "@/lib/role";
import { cn } from "@/lib/utils";

type Item = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };

const ITEMS: Record<Role, Item[]> = {
  customer: [
    { to: "/c/home", label: "Home", icon: Home },
    { to: "/c/workers", label: "Workers", icon: Users },
    { to: "/c/shops", label: "Shops", icon: Store },
    { to: "/c/profile", label: "Profile", icon: User },
  ],
  worker: [
    { to: "/w/dashboard", label: "Home", icon: LayoutDashboard },
    { to: "/w/contacts", label: "Contacts", icon: Phone },
    { to: "/w/shops", label: "Shops", icon: Store },
    { to: "/w/profile", label: "Profile", icon: User },
  ],
  shop: [
    { to: "/s/dashboard", label: "Home", icon: LayoutDashboard },
    { to: "/s/contacts", label: "Contacts", icon: Phone },
    { to: "/s/workers", label: "Workers", icon: Users },
    { to: "/s/products", label: "Products", icon: Package },
    { to: "/s/profile", label: "Profile", icon: User },
  ],
};

export function BottomNav({ role }: { role: Role }) {
  const pathname = useLocation().pathname;
  const items = ITEMS[role];
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-border shadow-[0_-2px_12px_rgba(0,0,0,0.04)]">
      <ul className="mx-auto max-w-2xl flex items-stretch justify-around">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || pathname.startsWith(to + "/");
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
