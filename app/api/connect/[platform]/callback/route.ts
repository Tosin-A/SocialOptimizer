// GET /api/connect/[platform]/callback — Handle OAuth callback
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { getProfileForPlatform } from "@/lib/platforms";
import type { Platform } from "@/types";

const TOKEN_ENDPOINTS: Record<Platform, string> = {
  tiktok: "https://open.tiktokapis.com/v2/oauth/token/",
  instagram: "https://api.instagram.com/oauth/access_token",
  youtube: "https://oauth2.googleapis.com/token",
  facebook: "https://graph.facebook.com/v21.0/oauth/access_token",
};

async function exchangeCodeForToken(
  platform: Platform,
  code: string,
  redirectUri: string
): Promise<{ access_token: string; refresh_token?: string; expires_in?: number; token_type: string }> {
  let body: URLSearchParams;

  // TikTok uses client_key/client_secret; others use client_id/client_secret
  if (platform === "tiktok") {
    body = new URLSearchParams({
      code,
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });
  } else {
    const configs: Record<Exclude<Platform, "tiktok">, { client_id: string; client_secret: string }> = {
      instagram: { client_id: process.env.FACEBOOK_APP_ID!, client_secret: process.env.FACEBOOK_APP_SECRET! },
      youtube: { client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET! },
      facebook: { client_id: process.env.FACEBOOK_APP_ID!, client_secret: process.env.FACEBOOK_APP_SECRET! },
    };
    const config = configs[platform as Exclude<Platform, "tiktok">];
    body = new URLSearchParams({
      code,
      client_id: config.client_id,
      client_secret: config.client_secret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });
  }

  const res = await fetch(TOKEN_ENDPOINTS[platform], {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Token exchange failed: ${err.error_description ?? err.message ?? res.statusText}`);
  }

  const raw = await res.json();
  // TikTok may return { data: { access_token, ... } } or top-level { access_token, ... }
  const access_token =
    (raw.data && typeof raw.data.access_token === "string" ? raw.data.access_token : null) ??
    (typeof raw.access_token === "string" ? raw.access_token : null);
  const refresh_token =
    (raw.data && typeof raw.data.refresh_token === "string" ? raw.data.refresh_token : null) ??
    (typeof raw.refresh_token === "string" ? raw.refresh_token : null) ??
    undefined;
  const expires_in =
    typeof raw.data?.expires_in === "number" ? raw.data.expires_in
    : typeof raw.expires_in === "number" ? raw.expires_in
    : undefined;

  if (!access_token) {
    throw new Error("Token exchange failed: no access_token in response");
  }

  return { access_token, refresh_token, expires_in, token_type: "Bearer" };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const { searchParams } = new URL(req.url);

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (error) {
    return NextResponse.redirect(`${appUrl}/dashboard/settings?error=oauth_denied`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/dashboard/settings?error=no_code`);
  }

  // Validate CSRF state
  const storedState = req.cookies.get("oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(`${appUrl}/dashboard/settings?error=invalid_state`);
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${appUrl}/login`);
  }

  try {
    const redirectUri = `${appUrl.replace(/\/$/, "")}/api/connect/${platform}/callback`;

    // Exchange code for access token
    const tokens = await exchangeCodeForToken(platform as Platform, code, redirectUri);

    // Fetch platform profile
    const profile = await getProfileForPlatform(platform as Platform, tokens.access_token);

    const serviceClient = getSupabaseServiceClient();
    const { data: dbUser } = await serviceClient
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (!dbUser) throw new Error("User not found");

    const tokenExpiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

    // Deactivate any existing rows for this user+platform to prevent duplicates
    // (handles reconnect after disconnect, or switching to a different account on the same platform)
    await serviceClient
      .from("connected_accounts")
      .update({ is_active: false })
      .eq("user_id", dbUser.id)
      .eq("platform", platform as Platform);

    // Upsert the connected account
    await serviceClient.from("connected_accounts").upsert(
      {
        user_id: dbUser.id,
        platform: platform as Platform,
        platform_user_id: profile.platform_user_id,
        username: profile.username,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        followers: profile.followers,
        following: profile.following,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        token_expires_at: tokenExpiresAt,
        is_active: true,
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "user_id,platform,platform_user_id" }
    );

    // Invalidate dashboard cache so the UI shows the new account immediately
    revalidateTag(`dashboard:${dbUser.id}`);

    // Clear OAuth cookies
    const response = NextResponse.redirect(
      `${appUrl}/dashboard/settings?connected=${platform}`
    );
    response.cookies.delete("oauth_state");
    response.cookies.delete("oauth_platform");
    return response;
  } catch (err) {
    console.error(`OAuth callback error for ${platform}:`, err);
    return NextResponse.redirect(
      `${appUrl}/dashboard/settings?error=connection_failed`
    );
  }
}
