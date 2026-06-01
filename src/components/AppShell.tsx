import type { Role } from "@/lib/role";
import { BottomNav } from "./BottomNav";
import { SupportFab } from "./SupportFab";
import { InstallBanner } from "./InstallBanner";

export function AppShell({ role, title, children }: { role: Role; title?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-20">
      {title && (
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-border">
          <div className="mx-auto max-w-2xl px-4 h-14 flex items-center">
            <h1 className="text-lg font-bold text-primary">{title}</h1>
          </div>
        </header>
      )}
      <main className="mx-auto max-w-2xl px-4 pt-4">{children}</main>
      <SupportFab />
      <InstallBanner />
      <BottomNav role={role} />
    </div>
  );
}
