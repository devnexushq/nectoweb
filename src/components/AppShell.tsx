import type { Role } from "@/lib/role";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { SupportFab } from "./SupportFab";
import { PhoneSupportFab } from "./PhoneSupportFab";
import { WhatsAppSupportFab } from "./WhatsAppSupportFab";
import { InstallBanner } from "./InstallBanner";
import { ActivityBell } from "./ActivityBell";

export function AppShell({
  role,
  title,
  backTo,
  backLabel = "Go back",
  children,
}: {
  role: Role;
  title?: string;
  backTo?: string;
  backLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background pb-20">
      {title && (
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-border">
          <div className="mx-auto max-w-2xl px-4 h-14 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              {backTo && (
                <Link
                  to={backTo}
                  aria-label={backLabel}
                  title={backLabel}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-white text-foreground shadow-sm transition hover:bg-muted active:scale-95"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              )}
              <h1 className="min-w-0 truncate text-lg font-bold text-primary">{title}</h1>
            </div>
            <ActivityBell role={role} />
          </div>
        </header>
      )}
      <main className="mx-auto max-w-2xl px-4 pt-4">{children}</main>
      <SupportFab />
      <PhoneSupportFab />
      <WhatsAppSupportFab />
      <InstallBanner />
      <BottomNav role={role} />
    </div>
  );
}
