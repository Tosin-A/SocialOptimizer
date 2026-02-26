import type { Platform, Post } from "@/types";
import type { ConnectedAccountWithTokens } from "@/lib/platforms/token-refresh";
import { fetchTikTokPosts, getTikTokProfile } from "./tiktok";
import { fetchInstagramPosts, getInstagramProfile } from "./instagram";
import { fetchYouTubePosts, getYouTubeProfile } from "./youtube";

export async function fetchPostsForPlatform(
  account: ConnectedAccountWithTokens,
  maxPosts = 50
): Promise<Post[]> {
  switch (account.platform) {
    case "tiktok":
      return fetchTikTokPosts(account, maxPosts);
    case "instagram":
    case "facebook":
      return fetchInstagramPosts(account, maxPosts);
    case "youtube":
      return fetchYouTubePosts(account, maxPosts);
    default:
      throw new Error(`Unsupported platform: ${account.platform}`);
  }
}

export async function getProfileForPlatform(platform: Platform, token: string) {
  switch (platform) {
    case "tiktok":
      return getTikTokProfile(token);
    case "instagram":
    case "facebook":
      return getInstagramProfile(token);
    case "youtube":
      return getYouTubeProfile(token);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

export const PLATFORM_OAUTH_URLS: Record<Platform, (state: string) => string> = {
  tiktok: (state) =>
    `https://www.tiktok.com/v2/auth/authorize?client_key=${process.env.TIKTOK_CLIENT_KEY}&response_type=code&scope=user.info.basic,video.list&redirect_uri=${process.env.NEXT_PUBLIC_APP_URL}/api/connect/tiktok/callback&state=${state}`,

  instagram: (state) =>
    `https://api.instagram.com/oauth/authorize?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${process.env.NEXT_PUBLIC_APP_URL}/api/connect/instagram/callback&scope=instagram_basic,instagram_manage_insights&response_type=code&state=${state}`,

  youtube: (state) =>
    `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_APP_URL}/api/connect/youtube/callback&response_type=code&scope=https://www.googleapis.com/auth/youtube.readonly&access_type=offline&state=${state}`,

  facebook: (state) =>
    `https://www.facebook.com/v21.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${process.env.NEXT_PUBLIC_APP_URL}/api/connect/facebook/callback&scope=pages_read_engagement,pages_read_user_content&state=${state}`,
};
