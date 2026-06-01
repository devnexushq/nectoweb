// PWA install + analytics helpers

export type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "necto_pwa_dismissed_at";
const DISMISS_DAYS = 3;
const ANALYTICS_KEY = "necto_pwa_analytics";

type Analytics = {
  prompt_impressions: number;
  install_button_clicks: number;
  installs: number;
  dismissals: number;
};

export function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS
    (window.navigator as any).standalone === true
  );
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
}

export function isAndroid(): boolean {
  return /Android/i.test(navigator.userAgent);
}

export function getBrowserName(): "chrome" | "samsung" | "safari" | "firefox" | "edge" | "other" {
  const ua = navigator.userAgent;
  if (/SamsungBrowser/i.test(ua)) return "samsung";
  if (/Edg\//i.test(ua)) return "edge";
  if (/Firefox/i.test(ua)) return "firefox";
  if (/Chrome/i.test(ua)) return "chrome";
  if (/Safari/i.test(ua)) return "safari";
  return "other";
}

export function recentlyDismissed(): boolean {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const at = Number(raw);
  if (Number.isNaN(at)) return false;
  return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

export function markDismissed() {
  localStorage.setItem(DISMISS_KEY, String(Date.now()));
  bumpAnalytics("dismissals");
}

function readAnalytics(): Analytics {
  try {
    const raw = localStorage.getItem(ANALYTICS_KEY);
    if (!raw) return { prompt_impressions: 0, install_button_clicks: 0, installs: 0, dismissals: 0 };
    return JSON.parse(raw);
  } catch {
    return { prompt_impressions: 0, install_button_clicks: 0, installs: 0, dismissals: 0 };
  }
}

export function bumpAnalytics(key: keyof Analytics) {
  const a = readAnalytics();
  a[key] = (a[key] ?? 0) + 1;
  localStorage.setItem(ANALYTICS_KEY, JSON.stringify(a));
  // hook for any external analytics
  try {
    (window as any).dataLayer?.push?.({ event: `pwa_${key}` });
  } catch {}
}

export function getAnalytics(): Analytics {
  return readAnalytics();
}
