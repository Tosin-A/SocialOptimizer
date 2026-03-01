import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code      = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type      = searchParams.get("type") as "email" | "recovery" | "invite" | null;
  const next      = searchParams.get("next") ?? "/dashboard";

  const cookieStore = await cookies();

  // Log all Supabase-related cookies to diagnose PKCE verifier issues
  const allCookies = cookieStore.getAll();
  const sbCookies = allCookies.filter(c => c.name.includes("sb-"));
  console.log("[auth/callback] code present:", !!code);
  console.log("[auth/callback] supabase cookies:", sbCookies.map(c => c.name));

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

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth/callback] exchangeCodeForSession error:", error.message, error.status);
    } else {
      console.log("[auth/callback] session exchange succeeded");
      authenticated = true;
    }
  }

  if (!authenticated && tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      console.error("[auth/callback] verifyOtp error:", error.message);
    } else {
      authenticated = true;
    }
  }

  const redirectUrl = authenticated
    ? `${origin}${next}`
    : `${origin}/login?error=auth_callback_failed`;

  const response = NextResponse.redirect(redirectUrl);

  for (const { name, value, options } of cookiesToSet) {
    response.cookies.set(name, value, options);
  }

  return response;
}
