// ════════════════════════════════════════════════════════════════════════════
// YouTube Data API v3 + YouTube Analytics API — platform adapter
// ════════════════════════════════════════════════════════════════════════════

import type { Post } from "@/types";
import type { ConnectedAccountWithTokens as ConnectedAccount } from "@/lib/platforms/token-refresh";

const YT_API_BASE = "https://www.googleapis.com/youtube/v3";
const YT_ANALYTICS_BASE = "https://youtubeanalytics.googleapis.com/v2";

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

interface VideoAnalytics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  impressionClickThroughRate: number; // 0–1
  estimatedMinutesWatched: number;
  averageViewDuration: number; // seconds
  averageViewPercentage: number; // 0–100
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
    const err = await res.json().catch(() => ({}));
    throw new Error(`YouTube API error: ${err.error?.message ?? res.statusText}`);
  }
  return res.json();
}

async function ytAnalyticsFetch(path: string, token: string): Promise<any> {
  const res = await fetch(`${YT_ANALYTICS_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`YouTube Analytics API error: ${err.error?.message ?? res.statusText}`);
  }
  return res.json();
}

// Fetch analytics for up to 50 video IDs at a time.
// Returns a map of videoId → VideoAnalytics.
async function fetchVideoAnalyticsBatch(
  videoIds: string[],
  token: string,
  startDate: string,
  endDate: string
): Promise<Map<string, VideoAnalytics>> {
  const metrics = [
    "views",
    "likes",
    "comments",
    "shares",
    "impressions",
    "impressionClickThroughRate",
    "estimatedMinutesWatched",
    "averageViewDuration",
    "averageViewPercentage",
  ].join(",");

  const filterIds = videoIds.join(",");
  const params = new URLSearchParams({
    ids: "channel==MINE",
    startDate,
    endDate,
    dimensions: "video",
    metrics,
    filters: `video==${filterIds}`,
  });

  const data = await ytAnalyticsFetch(`/reports?${params.toString()}`, token);

  const result = new Map<string, VideoAnalytics>();
  if (!data.rows || !data.columnHeaders) return result;

  // Build column index from headers
  const colIndex: Record<string, number> = {};
  for (const [i, header] of data.columnHeaders.entries()) {
    colIndex[header.name] = i;
  }

  for (const row of data.rows) {
    const videoId: string = row[colIndex["video"]];
    result.set(videoId, {
      views: row[colIndex["views"]] ?? 0,
      likes: row[colIndex["likes"]] ?? 0,
      comments: row[colIndex["comments"]] ?? 0,
      shares: row[colIndex["shares"]] ?? 0,
      impressions: row[colIndex["impressions"]] ?? 0,
      impressionClickThroughRate: row[colIndex["impressionClickThroughRate"]] ?? 0,
      estimatedMinutesWatched: row[colIndex["estimatedMinutesWatched"]] ?? 0,
      averageViewDuration: row[colIndex["averageViewDuration"]] ?? 0,
      averageViewPercentage: row[colIndex["averageViewPercentage"]] ?? 0,
    });
  }

  return result;
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
  const videoMap = new Map<string, YouTubeVideo>();
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50).join(",");
    const videoData = await ytFetch(
      `/videos?part=snippet,statistics,contentDetails&id=${batch}`,
      token
    );
    for (const video of (videoData.items ?? []) as YouTubeVideo[]) {
      videoMap.set(video.id, video);
    }
  }

  // 4. Fetch Analytics API data in batches of 50
  // Use a wide date range to cover all uploaded videos
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = "2010-01-01"; // YouTube founded 2005, this covers all realistic uploads

  const analyticsMap = new Map<string, VideoAnalytics>();
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    try {
      const batchAnalytics = await fetchVideoAnalyticsBatch(batch, token, startDate, endDate);
      for (const [id, analytics] of batchAnalytics) {
        analyticsMap.set(id, analytics);
      }
    } catch {
      // Analytics API may not be authorized yet — fall back to Data API stats only
    }
  }

  // 5. Merge Data API + Analytics API into Post objects
  const posts: Post[] = [];
  for (const videoId of videoIds) {
    const video = videoMap.get(videoId);
    if (!video) continue;

    const duration = parseISO8601Duration(video.contentDetails.duration);
    const analytics = analyticsMap.get(videoId);

    // Prefer Analytics API data when available; fall back to Data API statistics
    const views = analytics?.views ?? parseInt(video.statistics.viewCount ?? "0");
    const likes = analytics?.likes ?? parseInt(video.statistics.likeCount ?? "0");
    const comments = analytics?.comments ?? parseInt(video.statistics.commentCount ?? "0");
    const shares = analytics?.shares ?? 0;
    // impressions is a better reach proxy than views (counts thumbnail served, not video started)
    const reach = analytics?.impressions ?? views;

    const engagementRate = views > 0 ? (likes + comments + shares) / views : 0;

    const caption = `${video.snippet.title}\n${video.snippet.description}`;
    const hashtags = [
      ...(video.snippet.tags?.map((t) => `#${t}`.toLowerCase()) ?? []),
      ...extractHashtags(video.snippet.description),
    ];

    posts.push({
      id: "",
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
      shares,
      saves: 0,
      views,
      reach,
      engagement_rate: engagementRate,
      posted_at: video.snippet.publishedAt,
    });
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
