"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[auth] error boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative">
      <div className="w-full max-w-sm text-center">
        <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground text-sm mb-6">
          {error.message || "An unexpected error occurred."}
        </p>
        <Button onClick={reset} variant="outline" className="border-white/[0.1]">
          Try again
        </Button>
      </div>
    </div>
  );
}
