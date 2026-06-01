import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { bumpAnalytics, isStandalone, markDismissed, recentlyDismissed } from "@/lib/pwa";
import { InstallInstructionsDialog } from "./InstallInstructionsDialog";

export function InstallBanner() {
  const { canInstall, installed, promptInstall } = usePwaInstall();
  const [hidden, setHidden] = useState<boolean>(true);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (isStandalone() || installed) {
      setHidden(true);
      return;
    }
    if (recentlyDismissed()) {
      setHidden(true);
      return;
    }
    // delay so it doesn't show instantly on first paint
    const t = setTimeout(() => {
      setHidden(false);
      bumpAnalytics("prompt_impressions");
    }, 4000);
    return () => clearTimeout(t);
  }, [installed]);

  if (hidden || installed || isStandalone()) return null;

  async function onInstall() {
    const result = await promptInstall();
    if (result === "unavailable") setShowInstructions(true);
    if (result === "accepted") setHidden(true);
  }

  function onDismiss() {
    markDismissed();
    setHidden(true);
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-20 z-50 px-3 pointer-events-none">
        <div className="mx-auto max-w-2xl pointer-events-auto">
          <div className="rounded-2xl bg-primary text-white shadow-2xl border border-primary/30 px-4 py-3 flex items-center gap-3 animate-in slide-in-from-bottom-4">
            <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Download className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">Install Necto App</div>
              <div className="text-xs text-white/80 truncate">Faster access. Works like a native app.</div>
            </div>
            <button
              onClick={onInstall}
              className="px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors"
            >
              Install
            </button>
            <button
              onClick={onDismiss}
              aria-label="Dismiss"
              className="h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <InstallInstructionsDialog open={showInstructions} onOpenChange={setShowInstructions} />
    </>
  );
}
