// ════════════════════════════════════════════════════════════════════════════
// YouTube Data API v3 — platform adapter
// ════════════════════════════════════════════════════════════════════════════

import type { Post, ConnectedAccount } from "@/types";

const YT_API_BASE = "https://www.googleapis.com/youtube/v3";

interface YouTubeVideo {
  id: string;
  snippet: {
    title: string;
    description: string;
    tags?: string[];
    publishedAt: string;
    thumbnails: { high?: { url: string } };
  };
  statistics: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
    favoriteCount?: string;
  };
  contentDetails: {
    duration: string; // ISO 8601: PT1M30S
  };
}

function parseISO8601Duration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] ?? "0");
  const minutes = parseInt(match[2] ?? "0");
  const seconds = parseInt(match[3] ?? "0");
  return hours * 3600 + minutes * 60 + seconds;
}

function extractHashtags(text: string): string[] {
  return [...text.matchAll(/#[\w]+/g)].map((m) => m[0].toLowerCase());
}

async function ytFetch(path: string, token: string): Promise<any> {
  const res = await fetch(`${YT_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`YouTube API error: ${err.error?.message ?? res.statusText}`);
  }
  return res.json();
}

export async function fetchYouTubePosts(
  account: ConnectedAccount,
  maxPosts = 50
): Promise<Post[]> {
  const token = account.access_token;

  // 1. Get channel ID
  const channelData = await ytFetch(
    "/channels?part=id,statistics&mine=true",
    token
  );
  const channelId = channelData.items?.[0]?.id;
  if (!channelId) throw new Error("Could not retrieve YouTube channel");

  // 2. Fetch video IDs from uploads playlist
  const playlistData = await ytFetch(
    `/channels?part=contentDetails&id=${channelId}`,
    token
  );
  const uploadsPlaylistId =
    playlistData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

  if (!uploadsPlaylistId) throw new Error("Could not find uploads playlist");

  let videoIds: string[] = [];
  let pageToken = "";

  while (videoIds.length < maxPosts) {
    const ptParam = pageToken ? `&pageToken=${pageToken}` : "";
    const playlistItems = await ytFetch(
      `/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50${ptParam}`,
      token
    );

    const ids = playlistItems.items?.map(
      (item: any) => item.contentDetails.videoId
    ) ?? [];
    videoIds = [...videoIds, ...ids];
    pageToken = playlistItems.nextPageToken ?? "";
    if (!pageToken) break;
  }

  videoIds = videoIds.slice(0, maxPosts);

  // 3. Fetch video details in batches of 50
  const posts: Post[] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50).join(",");
    const videoData = await ytFetch(
      `/videos?part=snippet,statistics,contentDetails&id=${batch}`,
      token
    );

    for (const video of (videoData.items ?? []) as YouTubeVideo[]) {
      const duration = parseISO8601Duration(video.contentDetails.duration);
      const views = parseInt(video.statistics.viewCount ?? "0");
      const likes = parseInt(video.statistics.likeCount ?? "0");
      const comments = parseInt(video.statistics.commentCount ?? "0");

      const caption = `${video.snippet.title}\n${video.snippet.description}`;
      const hashtags = [
        ...(video.snippet.tags?.map((t) => `#${t}`.toLowerCase()) ?? []),
        ...extractHashtags(video.snippet.description),
      ];

      posts.push({
        id: "", // Will be set by DB
        account_id: account.id,
        platform_post_id: video.id,
        content_type: duration < 60 ? "short" : "video",
        caption,
        hashtags: [...new Set(hashtags)],
        mentions: [],
        media_url: `https://www.youtube.com/watch?v=${video.id}`,
        thumbnail_url: video.snippet.thumbnails.high?.url ?? null,
        duration_seconds: duration,
        likes,
        comments,
        shares: 0, // YouTube API doesn't expose shares
        saves: 0,
        views,
        reach: views,
        engagement_rate: views > 0 ? (likes + comments) / views : 0,
        posted_at: video.snippet.publishedAt,
      });
    }
  }

  return posts;
}

export async function getYouTubeProfile(token: string) {
  const data = await ytFetch("/channels?part=snippet,statistics&mine=true", token);
  const channel = data.items?.[0];
  if (!channel) throw new Error("Could not retrieve YouTube channel");

  return {
    platform_user_id: channel.id,
    username: channel.snippet.customUrl ?? channel.id,
    display_name: channel.snippet.title,
    avatar_url: channel.snippet.thumbnails?.high?.url ?? null,
    followers: parseInt(channel.statistics.subscriberCount ?? "0"),
    following: 0,
  };
}
