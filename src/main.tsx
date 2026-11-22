import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { ChunkLoadErrorBoundary } from "@/components/ChunkLoadErrorBoundary";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChunkLoadErrorBoundary>
      <BrowserRouter>
        <App />
        <Toaster position="top-center" richColors />
      </BrowserRouter>
    </ChunkLoadErrorBoundary>
  </React.StrictMode>,
);

// Global handler for Vite dynamic module preload failures (deploy chunk mismatch)
if (typeof window !== "undefined") {
  window.addEventListener("vite:preloadError", () => {
    // Never reload repeatedly while offline; ChunkLoadErrorBoundary renders offline guidance
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;

    const CHUNK_RELOAD_KEY = "necto_chunk_reload_attempted";
    const lastAttempt = sessionStorage.getItem(CHUNK_RELOAD_KEY);
    const now = Date.now();
    if (!lastAttempt || now - parseInt(lastAttempt, 10) > 15000) {
      sessionStorage.setItem(CHUNK_RELOAD_KEY, now.toString());
      window.location.reload();
    }
  });
}

// PWA service worker registration — guarded against iframes / Lovable preview
(async () => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const isInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();
  const host = window.location.hostname;
  const isPreviewHost =
    host.includes("id-preview--") ||
    host.includes("lovableproject.com") ||
    host.includes("lovable.app") ||
    host === "localhost" ||
    host === "127.0.0.1";

  if (isInIframe || isPreviewHost) {
    const regs = await navigator.serviceWorker.getRegistrations().catch(() => []);
    regs.forEach((r) => r.unregister());
    return;
  }

  try {
    const { registerSW } = await import("virtual:pwa-register");
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        // Activate waiting service worker on new deploy only when online
        if (navigator.onLine !== false) {
          updateSW(true);
        }
      },
      onRegisteredSW(_swScriptUrl, registration) {
        if (registration) {
          // Check for service worker updates periodically (every 60 mins) when online
          setInterval(
            () => {
              if (navigator.onLine !== false) {
                registration.update().catch(() => {});
              }
            },
            60 * 60 * 1000,
          );
        }
      },
    });

    // Auto-reload the page when a new service worker takes control online
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (navigator.onLine !== false && !refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  } catch {
    // pwa virtual module unavailable (e.g. dev) — ignore
  }
})();
