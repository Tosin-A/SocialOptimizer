// ════════════════════════════════════════════════════════════════════════════
// TikTok Research API — platform adapter
// ════════════════════════════════════════════════════════════════════════════

import type { Post } from "@/types";
import type { ConnectedAccountWithTokens as ConnectedAccount } from "@/lib/platforms/token-refresh";

const TIKTOK_API_BASE = "https://open.tiktokapis.com/v2";

interface TikTokVideo {
  id: string;
  title: string;
  video_description: string;
  create_time: number;
  cover_image_url: string;
  share_url: string;
  duration: number;
  height: number;
  width: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
}

function extractHashtags(text: string, explicit: string[]): string[] {
  const fromText = [...(text?.matchAll(/#[\w]+/g) ?? [])].map((m) =>
    m[0].toLowerCase()
  );
  const fromApi = explicit.map((t) => `#${t}`.toLowerCase());
  return [...new Set([...fromApi, ...fromText])];
}

async function tikTokFetch(
  path: string,
  token: string,
  body?: object
): Promise<any> {
  const res = await fetch(`${TIKTOK_API_BASE}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`TikTok API error: ${err.error?.message ?? res.statusText}`);
  }
  return res.json();
}

export async function fetchTikTokPosts(
  account: ConnectedAccount,
  maxPosts = 50
): Promise<Post[]> {
  const token = account.access_token;

  // TikTok requires "fields" as a query param; only use fields from the Video Object spec (no hashtag_names)
  const fieldsQuery =
    "id,title,video_description,create_time,cover_image_url,share_url,duration,like_count,comment_count,share_count,view_count";

  let posts: Post[] = [];
  let cursor = 0;
  let hasMore = true;

  while (posts.length < maxPosts && hasMore) {
    const data = await tikTokFetch(
      `/video/list/?fields=${encodeURIComponent(fieldsQuery)}`,
      token,
      { max_count: 20, cursor }
    );

    if (data.error && data.error.code !== "ok") {
      console.error("TikTok video/list error:", JSON.stringify(data.error));
      // access_token_invalid or token_expired likely means user needs to reconnect
      if (data.error.code === "access_token_invalid" || data.error.code === "token_expired") {
        throw new Error(
          `TikTok access token is invalid or expired. Please reconnect your TikTok account in Settings.`
        );
      }
      throw new Error(`TikTok API error: ${data.error.message ?? data.error.code}`);
    }

    const videos: TikTokVideo[] = data.data?.videos ?? [];

    if (posts.length === 0 && videos.length === 0) {
      console.error(
        "TikTok video/list returned 0 videos.",
        "cursor:", cursor,
        "has_more:", data.data?.has_more,
        "error:", JSON.stringify(data.error ?? null),
        "full response keys:", Object.keys(data),
        "data keys:", data.data ? Object.keys(data.data) : "no data field"
      );
    }

    for (const video of videos) {
      const caption = `${video.title}\n${video.video_description}`;
      const hashtags = extractHashtags(caption, []);
      const views = video.view_count ?? 0;
      const likes = video.like_count ?? 0;
      const comments = video.comment_count ?? 0;
      const shares = video.share_count ?? 0;

      posts.push({
        id: "",
        account_id: account.id,
        platform_post_id: video.id,
        content_type: "video",
        caption,
        hashtags,
        mentions: [],
        media_url: video.share_url,
        thumbnail_url: video.cover_image_url,
        duration_seconds: video.duration,
        likes,
        comments,
        shares,
        saves: 0,
        views,
        reach: views,
        engagement_rate: views > 0 ? (likes + comments + shares) / views : 0,
        posted_at: video.create_time
          ? new Date(video.create_time * 1000).toISOString()
          : new Date().toISOString(),
      });
    }

    cursor = data.data?.cursor ?? 0;
    hasMore = data.data?.has_more ?? false;
  }

  return posts.slice(0, maxPosts);
}

export async function getTikTokProfile(token: string) {
  // username requires user.info.profile scope
  // follower_count/following_count require user.info.stats scope
  // open_id/union_id/avatar_url/display_name only need user.info.basic
  const data = await tikTokFetch(
    "/user/info/?fields=open_id,union_id,avatar_url,display_name,username,follower_count,following_count",
    token
  );

  const user = data.data?.user;
  if (!user) throw new Error("TikTok API error: no user data returned");

  return {
    platform_user_id: user.open_id,
    username: user.username ?? user.display_name ?? user.open_id,
    display_name: user.display_name ?? user.username ?? user.open_id,
    avatar_url: user.avatar_url ?? null,
    followers: user.follower_count ?? 0,
    following: user.following_count ?? 0,
  };
}
