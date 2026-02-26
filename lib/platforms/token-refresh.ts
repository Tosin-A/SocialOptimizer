// ════════════════════════════════════════════════════════════════════════════
// Token refresh — checks expiry and silently refreshes before platform calls
// ════════════════════════════════════════════════════════════════════════════

import type { Platform } from "@/types";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

// The DB record includes token fields that aren't on the public ConnectedAccount type
export interface ConnectedAccountWithTokens {
  id: string;
  user_id: string;
  platform: Platform;
  platform_user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  followers: number | null;
  following: number | null;
  is_active: boolean;
  last_synced_at: string | null;
  created_at: string;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
}

// Refresh if token expires within this window
const REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

function isExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return false; // no expiry = long-lived token, skip
  return Date.now() >= new Date(expiresAt).getTime() - REFRESH_BUFFER_MS;
}

// ─── Platform-specific refresh implementations ────────────────────────────────

async function refreshTikTokToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const body = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    client_secret: process.env.TIKTOK_CLIENT_SECRET!,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`TikTok token refresh failed: ${err.error?.message ?? res.statusText}`);
  }

  const data = await res.json();
  return {
    access_token: data.data.access_token,
    refresh_token: data.data.refresh_token,
    expires_in: data.data.expires_in,
  };
}

// Instagram long-lived tokens refresh in-place — no refresh_token needed
async function refreshInstagramToken(accessToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const url = new URL("https://graph.instagram.com/refresh_access_token");
  url.searchParams.set("grant_type", "ig_refresh_token");
  url.searchParams.set("access_token", accessToken);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Instagram token refresh failed: ${err.error?.message ?? res.statusText}`);
  }

  return res.json();
}

async function refreshGoogleToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Google token refresh failed: ${err.error?.message ?? res.statusText}`);
  }

  return res.json();
}

// Facebook short-lived tokens extend to 60-day long-lived tokens
async function refreshFacebookToken(accessToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const url = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", process.env.FACEBOOK_APP_ID!);
  url.searchParams.set("client_secret", process.env.FACEBOOK_APP_SECRET!);
  url.searchParams.set("fb_exchange_token", accessToken);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Facebook token refresh failed: ${err.error?.message ?? res.statusText}`);
  }

  return res.json();
}

// ─── Main refresh orchestrator ────────────────────────────────────────────────

/**
 * Checks if the account's access token is expiring soon or already expired.
 * If so, refreshes it via the platform's API and updates the DB record.
 * Returns the account with an up-to-date access_token (same object if no refresh needed).
 */
export async function refreshTokenIfNeeded(
  account: ConnectedAccountWithTokens
): Promise<ConnectedAccountWithTokens> {
  if (!isExpiringSoon(account.token_expires_at)) {
    return account; // Token is fine
  }

  if (!account.refresh_token && account.platform !== "instagram" && account.platform !== "facebook") {
    // No refresh token and platform requires one — can't refresh
    throw new Error(
      `Access token for ${account.platform} account @${account.username} has expired. Please reconnect the account.`
    );
  }

  let newAccessToken: string;
  let newRefreshToken: string | null = account.refresh_token;
  let newExpiresAt: string | null = null;

  switch (account.platform) {
    case "tiktok": {
      const result = await refreshTikTokToken(account.refresh_token!);
      newAccessToken = result.access_token;
      newRefreshToken = result.refresh_token;
      newExpiresAt = new Date(Date.now() + result.expires_in * 1000).toISOString();
      break;
    }
    case "instagram": {
      const result = await refreshInstagramToken(account.access_token);
      newAccessToken = result.access_token;
      newExpiresAt = new Date(Date.now() + result.expires_in * 1000).toISOString();
      break;
    }
    case "youtube": {
      const result = await refreshGoogleToken(account.refresh_token!);
      newAccessToken = result.access_token;
      // Google refresh tokens don't expire — keep the existing one
      newExpiresAt = new Date(Date.now() + result.expires_in * 1000).toISOString();
      break;
    }
    case "facebook": {
      const result = await refreshFacebookToken(account.access_token);
      newAccessToken = result.access_token;
      newExpiresAt = new Date(Date.now() + result.expires_in * 1000).toISOString();
      break;
    }
    default:
      throw new Error(`Token refresh not implemented for platform: ${account.platform}`);
  }

  // Persist updated tokens to DB
  const supabase = getSupabaseServiceClient();
  await supabase
    .from("connected_accounts")
    .update({
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      token_expires_at: newExpiresAt,
    })
    .eq("id", account.id);

  return {
    ...account,
    access_token: newAccessToken,
    refresh_token: newRefreshToken,
    token_expires_at: newExpiresAt,
  };
}
