// GET /api/connect/[platform]/callback — Handle OAuth callback
import { NextRequest, NextResponse } from "next/server";
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
  const configs: Record<Platform, { client_id: string; client_secret: string }> = {
    tiktok: { client_id: process.env.TIKTOK_CLIENT_KEY!, client_secret: process.env.TIKTOK_CLIENT_SECRET! },
    instagram: { client_id: process.env.FACEBOOK_APP_ID!, client_secret: process.env.FACEBOOK_APP_SECRET! },
    youtube: { client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET! },
    facebook: { client_id: process.env.FACEBOOK_APP_ID!, client_secret: process.env.FACEBOOK_APP_SECRET! },
  };

  const config = configs[platform];
  const body = new URLSearchParams({
    code,
    client_id: config.client_id,
    client_secret: config.client_secret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const res = await fetch(TOKEN_ENDPOINTS[platform], {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Token exchange failed: ${err.error_description ?? err.message ?? res.statusText}`);
  }

  return res.json();
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
    const redirectUri = `${appUrl}/api/connect/${platform}/callback`;

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

    // Clear OAuth cookies
    const response = NextResponse.redirect(
      `${appUrl}/dashboard?connected=${platform}`
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
