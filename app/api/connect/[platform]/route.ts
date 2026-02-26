// GET /api/connect/[platform] — Initiate OAuth flow
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { PLATFORM_OAUTH_URLS } from "@/lib/platforms";
import type { Platform } from "@/types";
import crypto from "crypto";

const SUPPORTED_PLATFORMS: Platform[] = ["tiktok", "instagram", "youtube", "facebook"];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;

  if (!SUPPORTED_PLATFORMS.includes(platform as Platform)) {
    return NextResponse.json({ error: "Unsupported platform" }, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Generate state token to prevent CSRF
  const state = crypto
    .createHmac("sha256", process.env.PYTHON_SERVICE_SECRET!)
    .update(`${user.id}:${platform}:${Date.now()}`)
    .digest("hex");

  // Store state in a short-lived cookie
  const response = NextResponse.redirect(
    PLATFORM_OAUTH_URLS[platform as Platform](state)
  );
  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600, // 10 minutes
    sameSite: "lax",
  });
  response.cookies.set("oauth_platform", platform, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    sameSite: "lax",
  });

  return response;
}
