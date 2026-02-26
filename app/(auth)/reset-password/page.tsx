"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BarChart3, Lock, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  const router   = useRouter();
  const supabase = getSupabaseBrowserClient();

  // Supabase sends the user to this page with tokens in the URL hash.
  // The SDK exchanges the hash into a session automatically via onAuthStateChange.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setSessionReady(true);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => router.push("/dashboard"), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Request a new reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[240px] bg-brand-500/6 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-md bg-brand-500 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-base">SocialOptimizer</span>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Must be at least 8 characters
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#0d1526] p-8">
          {done ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="font-semibold text-lg">Password updated</h3>
              <p className="text-sm text-muted-foreground">Redirecting to your dashboard…</p>
            </div>
          ) : !sessionReady ? (
            <div className="text-center space-y-4 py-4">
              <Loader2 className="w-8 h-8 animate-spin text-brand-400 mx-auto" />
              <p className="text-sm text-muted-foreground">Verifying reset link…</p>
              <p className="text-xs text-muted-foreground">
                Link invalid or expired?{" "}
                <Link href="/forgot-password" className="text-brand-400 hover:text-brand-300 underline">
                  Request a new one
                </Link>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs text-muted-foreground">New password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 bg-white/[0.03] border-white/[0.09] focus:border-brand-500/60"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm" className="text-xs text-muted-foreground">Confirm password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 bg-white/[0.03] border-white/[0.09] focus:border-brand-500/60"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <Button
                type="submit"
                className="w-full h-11 gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold"
                disabled={loading}
              >
                {loading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <>Update password <ArrowRight className="w-4 h-4" /></>
                }
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
