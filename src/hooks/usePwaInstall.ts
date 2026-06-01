import { useCallback, useEffect, useState } from "react";
import { BIPEvent, bumpAnalytics, isStandalone } from "@/lib/pwa";

let deferredPrompt: BIPEvent | null = null;

export function usePwaInstall() {
  const [canInstall, setCanInstall] = useState<boolean>(!!deferredPrompt);
  const [installed, setInstalled] = useState<boolean>(isStandalone());

  useEffect(() => {
    function onBIP(e: Event) {
      e.preventDefault();
      deferredPrompt = e as BIPEvent;
      setCanInstall(true);
    }
    function onInstalled() {
      deferredPrompt = null;
      setCanInstall(false);
      setInstalled(true);
      bumpAnalytics("installs");
    }
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<"accepted" | "dismissed" | "unavailable"> => {
    bumpAnalytics("install_button_clicks");
    if (!deferredPrompt) return "unavailable";
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      setCanInstall(false);
      return outcome;
    } catch {
      return "unavailable";
    }
  }, []);

  return { canInstall, installed, promptInstall };
}
