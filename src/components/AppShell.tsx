import type { Role } from "@/lib/role";
import { BottomNav } from "./BottomNav";
import { SupportFab } from "./SupportFab";
import { PhoneSupportFab } from "./PhoneSupportFab";
import { WhatsAppSupportFab } from "./WhatsAppSupportFab";
import { InstallBanner } from "./InstallBanner";
import { ActivityBell } from "./ActivityBell";

export function AppShell({ role, title, children }: { role: Role; title?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-20">
      {title && (
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-border">
          <div className="mx-auto max-w-2xl px-4 h-14 flex items-center justify-between gap-3">
            <h1 className="min-w-0 truncate text-lg font-bold text-primary">{title}</h1>
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
