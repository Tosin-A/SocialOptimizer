import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase auth callback handler.
 *
 * Handles two flows:
 *  1. OAuth (Google) — Supabase redirects here with ?code= after the user
 *     approves on the provider's consent screen.
 *  2. Email confirmation — the link in the confirmation email lands here
 *     with ?code= (PKCE) or ?token_hash= + ?type=email (magic link).
 *
 * On success  → redirect to /dashboard (or ?next= if supplied)
 * On failure  → redirect to /login?error=auth_callback_failed
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code       = searchParams.get("code");
  const tokenHash  = searchParams.get("token_hash");
  const type       = searchParams.get("type") as "email" | "recovery" | "invite" | null;
  const next       = searchParams.get("next") ?? "/dashboard";

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll()               { return cookieStore.getAll(); },
        setAll(cookiesToSet)   {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  // ── PKCE OAuth / email-confirmation code ─────────────────────────────────
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // ── Magic-link / OTP token hash ──────────────────────────────────────────
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // ── Fallback — something went wrong ──────────────────────────────────────
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
