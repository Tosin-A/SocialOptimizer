import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ── IP rate limiting ──────────────────────────────────────────────────────────
// In-memory sliding window. Best-effort in edge/serverless (no shared state
// across instances). Upgrade to Upstash Redis for production multi-instance.
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX       = 60;     // requests per window per IP

const ipWindows = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now   = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const hits  = (ipWindows.get(ip) ?? []).filter((t) => t > cutoff);
  hits.push(now);
  ipWindows.set(ip, hits);

  // Prune stale entries periodically (every ~1000 unique IPs seen)
  if (ipWindows.size > 1000) {
    for (const [key, times] of ipWindows.entries()) {
      if (times.every((t) => t <= cutoff)) ipWindows.delete(key);
    }
  }

  return hits.length > RATE_LIMIT_MAX;
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Rate-limit all /api/ routes except Supabase auth callbacks
  if (path.startsWith("/api/") && !path.startsWith("/api/auth/")) {
    const ip = getClientIp(request);
    if (isRateLimited(ip)) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests. Please slow down." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After":  "60",
          },
        }
      );
    }
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Protect dashboard routes
  if (path.startsWith("/dashboard") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect logged-in users away from auth pages
  if ((path === "/login" || path === "/signup") && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup", "/api/:path*"],
};
