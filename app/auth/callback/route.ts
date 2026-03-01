import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
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

  // Collect cookies that Supabase sets during session exchange so we can
  // explicitly attach them to the redirect response.
  const cookiesToSet: { name: string; value: string; options: CookieOptions }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookies: { name: string; value: string; options: CookieOptions }[]) {
          cookies.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
          cookiesToSet.push(...cookies);
        },
      },
    }
  );

  let authenticated = false;

  // ── PKCE OAuth / email-confirmation code ─────────────────────────────────
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) authenticated = true;
  }

  // ── Magic-link / OTP token hash ──────────────────────────────────────────
  if (!authenticated && tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) authenticated = true;
  }

  // Build redirect response
  const redirectUrl = authenticated
    ? `${origin}${next}`
    : `${origin}/login?error=auth_callback_failed`;

  const response = NextResponse.redirect(redirectUrl);

  // Explicitly set session cookies on the redirect response so the browser
  // stores them before hitting the destination (middleware will then see the user).
  for (const { name, value, options } of cookiesToSet) {
    response.cookies.set(name, value, options);
  }

  return response;
}
