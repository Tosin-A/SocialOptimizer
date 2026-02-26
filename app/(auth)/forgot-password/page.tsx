"use client";
import { useState } from "react";
import Link from "next/link";
import { BarChart3, Mail, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const supabase = getSupabaseBrowserClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
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
          <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Enter your email and we'll send a reset link
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#0d1526] p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="font-semibold text-lg">Check your email</h3>
              <p className="text-sm text-muted-foreground">
                We sent a password reset link to <strong className="text-foreground">{email}</strong>.
                The link expires in 1 hour.
              </p>
              <p className="text-xs text-muted-foreground">
                Didn't get it? Check your spam folder or{" "}
                <button
                  className="text-brand-400 hover:text-brand-300 underline"
                  onClick={() => setSent(false)}
                >
                  try again
                </button>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10 bg-white/[0.03] border-white/[0.09] focus:border-brand-500/60"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full h-11 gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold"
                disabled={loading}
              >
                {loading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <>Send reset link <ArrowRight className="w-4 h-4" /></>
                }
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Remember it?{" "}
          <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
