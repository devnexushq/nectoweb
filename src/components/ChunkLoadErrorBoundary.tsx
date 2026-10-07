import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isChunkLoadError: boolean;
}

const CHUNK_RELOAD_KEY = "necto_chunk_reload_attempted";
const RELOAD_TIMEOUT_MS = 15000; // 15 seconds cooldown between automatic reloads

export function isDynamicImportError(error: unknown): boolean {
  if (!error) return false;
  const msg =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : JSON.stringify(error);

  const lower = msg.toLowerCase();
  return (
    lower.includes("failed to fetch dynamically imported module") ||
    lower.includes("loading chunk") ||
    lower.includes("importing a module script failed") ||
    lower.includes("error loading dynamically imported module") ||
    lower.includes("dynamically imported module") ||
    lower.includes("chunkloaderror")
  );
}

export class ChunkLoadErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    isChunkLoadError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      isChunkLoadError: isDynamicImportError(error),
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ChunkLoadErrorBoundary caught error:", error, errorInfo);

    if (isDynamicImportError(error)) {
      const lastAttempt = sessionStorage.getItem(CHUNK_RELOAD_KEY);
      const now = Date.now();

      // Trigger a one-time automatic page reload to fetch the latest deploy bundle
      if (!lastAttempt || now - parseInt(lastAttempt, 10) > RELOAD_TIMEOUT_MS) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, now.toString());
        window.location.reload();
      }
    }
  }

  private handleManualReload = () => {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.state.isChunkLoadError) {
        return (
          <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md w-full bg-white rounded-2xl border border-border p-6 shadow-sm space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Updating Application...</h2>
              <p className="text-sm text-muted-foreground">
                A new version of NECTO was deployed. Reloading to get the latest features.
              </p>
              <button
                type="button"
                onClick={this.handleManualReload}
                className="w-full h-11 rounded-xl bg-primary text-white font-bold text-sm shadow hover:bg-primary/90 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Tap to Reload Now
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white rounded-2xl border border-border p-6 shadow-sm space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">Please reload the page to continue.</p>
            <button
              type="button"
              onClick={this.handleManualReload}
              className="w-full h-11 rounded-xl bg-primary text-white font-bold text-sm shadow hover:bg-primary/90 transition cursor-pointer"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
