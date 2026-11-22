import { ReactNode, useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Hammer,
  Store,
  Package,
  LifeBuoy,
  ScrollText,
  BarChart3,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  ShieldCheck,
  Server,
  Globe2,
  Crown,
  Zap,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowRight,
  Megaphone,
  Tag,
} from "lucide-react";
import { signOutAdmin, useAdminAuth } from "@/lib/admin/auth";
import { isFounderUser, maskEmail } from "@/lib/admin/founder";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type AdminNavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
};

const NAV: AdminNavItem[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/workers", label: "Workers", icon: Hammer },
  { to: "/admin/shops", label: "Shops", icon: Store },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/support", label: "Support", icon: LifeBuoy },
  { to: "/admin/official-updates", label: "Official Updates", icon: Megaphone },
  { to: "/admin/shop-offers", label: "Shop Offers", icon: Tag },
  { to: "/admin/activity", label: "Audit Logs", icon: ScrollText },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/security", label: "Security", icon: ShieldCheck },
  { to: "/admin/health", label: "System Health", icon: Server },
  { to: "/admin/seo", label: "SEO Center", icon: Globe2 },
];
const FOUNDER_NAV: AdminNavItem = {
  to: "/admin/founder-vault",
  label: "Founder Vault",
  icon: Crown,
};

export default function AdminLayout({ children, title }: { children: ReactNode; title: string }) {
  const { user } = useAdminAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [headerQuery, setHeaderQuery] = useState("");
  const [openSupportCount, setOpenSupportCount] = useState<number>(0);
  const founder = isFounderUser(user);
  const navItems = useMemo(() => (founder ? [...NAV, FOUNDER_NAV] : NAV), [founder]);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("support_queries")
      .select("*", { count: "exact", head: true })
      .eq("status", "open")
      .then(({ count }) => {
        if (!cancelled && typeof count === "number") {
          setOpenSupportCount(count);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const searchMatches = useMemo(() => {
    const q = headerQuery.trim().toLowerCase();
    if (!q) return [];
    return navItems
      .filter((item) => item.label.toLowerCase().includes(q) || item.to.toLowerCase().includes(q))
      .slice(0, 6);
  }, [headerQuery, navItems]);
  const quickActions = useMemo(
    () => [
      {
        to: "/admin/customers",
        label: "Open users",
        description: "Review customers, workers, and shops",
        icon: Users,
      },
      {
        to: "/admin/official-updates",
        label: "Official updates",
        description: "Publish Necto announcements",
        icon: Megaphone,
      },
      {
        to: "/admin/shop-offers",
        label: "Shop offers",
        description: "Review and manage shop promotions",
        icon: Tag,
      },
      {
        to: "/admin/support",
        label: "Support center",
        description: "Check open support requests",
        icon: LifeBuoy,
      },
      {
        to: "/admin/analytics",
        label: "Analytics",
        description: "View growth and platform trends",
        icon: BarChart3,
      },
      {
        to: "/admin/health",
        label: "System health",
        description: "Check deployment and database status",
        icon: Server,
      },
      ...(founder
        ? [
            {
              to: "/admin/founder-vault",
              label: "Founder Vault",
              description: "Open founder-only command center",
              icon: Crown,
            },
          ]
        : []),
    ],
    [founder],
  );

  const handleSignOut = async () => {
    await signOutAdmin();
    navigate("/admin/login", { replace: true });
  };

  const openQuickAction = (to: string) => {
    setQuickActionsOpen(false);
    navigate(to);
  };

  const Sidebar = (
    <aside
      className={cn(
        "h-screen shrink-0 p-3 sticky top-0 transition-all duration-300",
        collapsed ? "w-20" : "w-72",
      )}
    >
      <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-slate-950 text-slate-100 shadow-2xl shadow-slate-950/25">
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 to-emerald-300 text-slate-950 font-black shadow-lg shadow-cyan-400/20">
            N
          </div>
          {!collapsed && (
            <div>
              <div className="font-bold">Necto Admin</div>
              <div className="text-xs text-cyan-100/60">Command Center</div>
            </div>
          )}
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                    isActive
                      ? "bg-white text-slate-950 shadow-lg"
                      : "text-slate-300 hover:bg-white/10 hover:text-white hover:translate-x-0.5",
                    item.to === FOUNDER_NAV.to && "border border-cyan-300/20 bg-cyan-300/5",
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
        <div className="space-y-2 border-t border-white/10 p-3">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="hidden md:flex w-full items-center justify-center rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/10"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <>
                <PanelLeftClose className="mr-2 h-4 w-4" /> Collapse
              </>
            )}
          </button>
          {!collapsed && (
            <div className="rounded-xl bg-white/5 px-3 py-2">
              <div className="text-[11px] text-slate-400">Signed in</div>
              <div className="truncate text-xs">{maskEmail(user?.email)}</div>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-rose-500/15 hover:text-rose-100"
          >
            <LogOut className="h-4 w-4" /> {!collapsed && "Sign out"}
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_left,#dff7ff_0,#f8fafc_30%,#eef2ff_62%,#f8fafc_100%)] text-slate-900">
      <div className="hidden md:block">{Sidebar}</div>
      {open && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative">{Sidebar}</div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 h-16 border-b border-white/60 bg-white/75 px-4 shadow-sm shadow-slate-200/60 backdrop-blur-xl md:px-6">
          <div className="flex h-full items-center gap-3">
            <button className="-ml-2 p-2 md:hidden" onClick={() => setOpen(true)} aria-label="Menu">
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">
                Command Center
              </div>
              <h1 className="truncate text-base font-semibold md:text-xl">{title}</h1>
            </div>
            <div className="relative ml-auto hidden w-80 lg:block">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={headerQuery}
                  onChange={(e) => setHeaderQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchMatches[0]) {
                      navigate(searchMatches[0].to);
                      setHeaderQuery("");
                    } else if (e.key === "Escape") {
                      setHeaderQuery("");
                    }
                  }}
                  className="w-full bg-transparent text-sm outline-none"
                  placeholder="Jump to admin section..."
                />
              </div>
              {searchMatches.length > 0 && (
                <div className="absolute right-0 z-30 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  {searchMatches.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.to}
                        type="button"
                        onClick={() => {
                          navigate(item.to);
                          setHeaderQuery("");
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Icon className="h-4 w-4 text-slate-400" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="relative ml-auto lg:ml-0">
              <button
                type="button"
                onClick={() => {
                  setQuickActionsOpen(false);
                  setNotifOpen((v) => !v);
                }}
                className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white/80 text-slate-600 shadow-sm transition hover:-translate-y-0.5"
                aria-label="Notifications"
                aria-expanded={notifOpen}
              >
                <Bell className="h-4 w-4" />
                {openSupportCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                    {openSupportCount > 99 ? "99+" : openSupportCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <>
                  <button
                    className="fixed inset-0 z-10 cursor-default"
                    aria-label="Close notifications"
                    onClick={() => setNotifOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-3 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <div className="text-sm font-semibold text-slate-950">Admin Alerts</div>
                      <div className="text-xs text-slate-500">Live platform status summary</div>
                    </div>
                    <div className="p-2 space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setNotifOpen(false);
                          navigate("/admin/support");
                        }}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm hover:bg-slate-50"
                      >
                        <span className="font-medium text-slate-800">Open support tickets</span>
                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700">
                          {openSupportCount}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNotifOpen(false);
                          navigate("/admin/activity");
                        }}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm hover:bg-slate-50"
                      >
                        <span className="font-medium text-slate-800">View audit logs</span>
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setQuickActionsOpen((value) => !value)}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-medium text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5"
                aria-expanded={quickActionsOpen}
                aria-haspopup="menu"
              >
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Quick actions</span>
              </button>
              {quickActionsOpen && (
                <>
                  <button
                    className="fixed inset-0 z-10 cursor-default"
                    aria-label="Close quick actions"
                    onClick={() => setQuickActionsOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <div className="text-sm font-semibold text-slate-950">Quick actions</div>
                      <div className="text-xs text-slate-500">
                        Jump to important admin work instantly.
                      </div>
                    </div>
                    <div className="p-2" role="menu">
                      {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                          <button
                            key={action.to}
                            type="button"
                            role="menuitem"
                            onClick={() => openQuickAction(action.to)}
                            className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-slate-50"
                          >
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-950 text-white shadow-sm">
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold text-slate-900">
                                {action.label}
                              </span>
                              <span className="block truncate text-xs text-slate-500">
                                {action.description}
                              </span>
                            </span>
                            <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
      {open && (
        <button
          aria-label="Close"
          className="fixed right-3 top-3 z-50 p-2 text-white md:hidden"
          onClick={() => setOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
