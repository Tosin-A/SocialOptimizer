"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

/**
 * Client-side OAuth callback handler.
 *
 * Supabase PKCE flow stores the code_verifier in the browser (cookie/localStorage).
 * A server-side Route Handler can't access it, so we handle the code exchange
 * client-side where the verifier is available.
 *
 * Flow: Google → Supabase → /auth/callback?code=XXX → this page exchanges the
 * code for a session → redirects to /dashboard.
 */
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = getSupabaseBrowserClient();
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const next = params.get("next") ?? "/dashboard";

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          router.replace(next);
          return;
        }
        console.error("Auth callback failed:", error.message);
      }

      // Also handle hash fragments (implicit flow fallback)
      // Supabase client auto-detects tokens in the URL hash on init
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace(next);
        return;
      }

      // Nothing worked — send to login
      router.replace("/login?error=auth_callback_failed");
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400 mx-auto" />
        <p className="text-sm text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
}
