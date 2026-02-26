// ════════════════════════════════════════════════════════════════════════════
// Instagram Graph API — platform adapter
// ════════════════════════════════════════════════════════════════════════════

import type { Post, ConnectedAccount, ContentType } from "@/types";

const IG_API_BASE = "https://graph.instagram.com/v21.0";

interface IGMedia {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_product_type?: "REELS" | "FEED" | "STORY";
  caption?: string;
  timestamp: string;
  permalink?: string;
  thumbnail_url?: string;
  media_url?: string;
  like_count?: number;
  comments_count?: number;
}

interface IGInsights {
  data: Array<{
    name: string;
    values: Array<{ value: number }>;
  }>;
}

function extractHashtags(text: string): string[] {
  return [...(text?.matchAll(/#[\w]+/g) ?? [])].map((m) => m[0].toLowerCase());
}

function extractMentions(text: string): string[] {
  return [...(text?.matchAll(/@[\w.]+/g) ?? [])].map((m) => m[0].toLowerCase());
}

function mapMediaType(media: IGMedia): ContentType {
  if (media.media_product_type === "REELS") return "reel";
  if (media.media_product_type === "STORY") return "story";
  if (media.media_type === "VIDEO") return "video";
  return "post";
}

async function igFetch(path: string, token: string): Promise<any> {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${IG_API_BASE}${path}${sep}access_token=${token}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Instagram API error: ${err.error?.message ?? res.statusText}`);
  }
  return res.json();
}

export async function fetchInstagramPosts(
  account: ConnectedAccount,
  maxPosts = 50
): Promise<Post[]> {
  const token = account.access_token;

  const fields = [
    "id",
    "media_type",
    "media_product_type",
    "caption",
    "timestamp",
    "permalink",
    "thumbnail_url",
    "media_url",
    "like_count",
    "comments_count",
  ].join(",");

  let posts: Post[] = [];
  let cursor = "";

  while (posts.length < maxPosts) {
    const cursorParam = cursor ? `&after=${cursor}` : "";
    const data = await igFetch(
      `/me/media?fields=${fields}&limit=25${cursorParam}`,
      token
    );

    const mediaItems: IGMedia[] = data.data ?? [];

    for (const media of mediaItems) {
      // Fetch insights for reach/saves/shares
      let reach = 0, saves = 0, shares = 0;
      try {
        const insights: IGInsights = await igFetch(
          `/${media.id}/insights?metric=reach,saved,shares`,
          token
        );
        for (const metric of insights.data) {
          const val = metric.values[0]?.value ?? 0;
          if (metric.name === "reach") reach = val;
          if (metric.name === "saved") saves = val;
          if (metric.name === "shares") shares = val;
        }
      } catch {
        reach = (media.like_count ?? 0) * 10; // rough estimate
      }

      const likes = media.like_count ?? 0;
      const comments = media.comments_count ?? 0;
      const caption = media.caption ?? "";

      posts.push({
        id: "",
        account_id: account.id,
        platform_post_id: media.id,
        content_type: mapMediaType(media),
        caption,
        hashtags: extractHashtags(caption),
        mentions: extractMentions(caption),
        media_url: media.media_url ?? null,
        thumbnail_url: media.thumbnail_url ?? null,
        duration_seconds: null,
        likes,
        comments,
        shares,
        saves,
        views: reach,
        reach,
        engagement_rate: reach > 0 ? (likes + comments + shares) / reach : 0,
        posted_at: media.timestamp,
      });
    }

    cursor = data.paging?.cursors?.after ?? "";
    if (!cursor || !data.paging?.next) break;
  }

  return posts.slice(0, maxPosts);
}

export async function getInstagramProfile(token: string) {
  const data = await igFetch(
    "/me?fields=id,username,name,profile_picture_url,followers_count,follows_count",
    token
  );

  return {
    platform_user_id: data.id,
    username: data.username,
    display_name: data.name ?? data.username,
    avatar_url: data.profile_picture_url ?? null,
    followers: data.followers_count ?? 0,
    following: data.follows_count ?? 0,
  };
}
