import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import App from "./App";
import "./styles.css";

const qc = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <App />
        <Toaster position="top-center" richColors />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);

// PWA service worker registration — guarded against iframes / Lovable preview
(async () => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const isInIframe = (() => {
    try { return window.self !== window.top; } catch { return true; }
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
    registerSW({ immediate: true });
  } catch {
    // pwa virtual module unavailable (e.g. dev) — ignore
  }
})();
