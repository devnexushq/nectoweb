import { ReactNode, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Hammer, Store, Package,
  LifeBuoy, ScrollText, BarChart3, LogOut, Menu, X
} from "lucide-react";
import { signOutAdmin, useAdminAuth } from "@/lib/admin/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/workers", label: "Workers", icon: Hammer },
  { to: "/admin/shops", label: "Shops", icon: Store },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/support", label: "Support", icon: LifeBuoy },
  { to: "/admin/activity", label: "Activity", icon: ScrollText },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export default function AdminLayout({ children, title }: { children: ReactNode; title: string }) {
  const { user } = useAdminAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOutAdmin();
    navigate("/admin/login", { replace: true });
  };

  const Sidebar = (
    <aside className="w-64 shrink-0 bg-slate-900 text-slate-100 flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="text-lg font-bold tracking-tight">Necto Admin</div>
        <div className="text-xs text-slate-400 mt-0.5">Control Panel</div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-slate-800 text-white"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                )
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="px-3 py-3 border-t border-slate-800">
        <div className="px-2 pb-2 text-xs text-slate-400 truncate">{user?.email}</div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-md"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <div className="hidden md:block">{Sidebar}</div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative">{Sidebar}</div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-4 md:px-6 h-14 flex items-center gap-3 sticky top-0 z-10">
          <button className="md:hidden p-2 -ml-2" onClick={() => setOpen(true)} aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-base md:text-lg font-semibold">{title}</h1>
        </header>
        <main className="flex-1 p-4 md:p-6 max-w-full">{children}</main>
      </div>

      {open && (
        <button
          aria-label="Close"
          className="md:hidden fixed top-3 right-3 z-50 p-2 text-white"
          onClick={() => setOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
