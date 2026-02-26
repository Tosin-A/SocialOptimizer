"use client";
import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to Sentry or console
    console.error("[Dashboard error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
        <AlertTriangle className="w-6 h-6 text-red-400" />
      </div>

      <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
      <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-sm">
        {error.message ?? "An unexpected error occurred loading this page."}
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Try again
        </button>
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 hover:border-white/20 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to dashboard
        </a>
      </div>

      {error.digest && (
        <p className="mt-6 text-xs font-mono text-muted-foreground/40">
          Error ID: {error.digest}
        </p>
      )}
    </div>
  );
}
