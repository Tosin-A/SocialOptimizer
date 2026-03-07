// ════════════════════════════════════════════════════════════════════════════
// Data import parsers for TikTok and Instagram exports
// Supports CSV, JSON (TikTok data export), and TXT (TikTok data export)
// ════════════════════════════════════════════════════════════════════════════

import type { Platform, ContentType } from "@/types";

export interface ParsedPost {
  platform_post_id: string;
  content_type: ContentType;
  caption: string | null;
  hashtags: string[];
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  views: number;
  reach: number;
  engagement_rate: number | null;
  posted_at: string;
  duration_seconds: number | null;
}

interface CSVRow {
  [key: string]: string;
}

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function parseCSVText(text: string): CSVRow[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: CSVRow = {};
    headers.forEach((h, idx) => {
      row[h.trim().toLowerCase().replace(/\s+/g, "_")] = values[idx]?.trim() ?? "";
    });
    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\w\u00C0-\u024F]+/g);
  return matches ? [...new Set(matches.map((m) => m.toLowerCase()))] : [];
}

function safeInt(val: string | number | undefined | null): number {
  if (val == null) return 0;
  if (typeof val === "number") return Math.floor(val);
  const n = parseInt(val.replace(/,/g, ""), 10);
  return isNaN(n) ? 0 : n;
}

const EMPTY_DATE_VALUES = new Set(["", "n/a", "na", "-", "null", "undefined", "—", "–"]);

/**
 * Parses date strings from various formats used in Instagram/TikTok CSV exports.
 * Handles: ISO strings, Unix timestamps (seconds/ms/float), and common formats.
 * Returns ISO string; uses fallback for unparseable values so no rows are dropped.
 */
function parseFlexibleDate(val: string | undefined | null): string {
  const raw = (val ?? "").trim();
  if (!raw || EMPTY_DATE_VALUES.has(raw.toLowerCase())) return new Date().toISOString();

  // Unix timestamp: 10–13 digits, optionally with decimal (e.g. 1705312200.0)
  const numericMatch = raw.match(/^(\d{10,13})(?:\.\d+)?$/);
  if (numericMatch) {
    const num = parseInt(numericMatch[1], 10);
    const ms = numericMatch[1].length <= 10 ? num * 1000 : num;
    const d = new Date(ms);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }

  // Try native Date parsing (handles ISO, "Jan 15 2024", "2024-01-15", etc.)
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) return d.toISOString();

  // YYYY-MM-DD HH:mm:ss (with or without T, with optional timezone)
  const isoLikeMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?/);
  if (isoLikeMatch) {
    const [, y, mo, day, h, m, s = "0"] = isoLikeMatch;
    const d2 = new Date(parseInt(y, 10), parseInt(mo, 10) - 1, parseInt(day, 10), parseInt(h, 10), parseInt(m, 10), parseInt(s, 10));
    if (!Number.isNaN(d2.getTime())) return d2.toISOString();
  }

  // DD/MM/YYYY or DD-MM-YYYY (common in EU exports)
  const dmyMatch = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (dmyMatch) {
    const [, day, month, year, h = "0", m = "0", s = "0"] = dmyMatch;
    const d2 = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), parseInt(h, 10), parseInt(m, 10), parseInt(s, 10));
    if (!Number.isNaN(d2.getTime())) return d2.toISOString();
  }

  // MM/DD/YYYY (US format) — only if month <= 12 to avoid DD/MM ambiguity
  const mdyMatch = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (mdyMatch) {
    const [, p1, p2, year, h = "0", m = "0", s = "0"] = mdyMatch;
    const [month, day] = parseInt(p1, 10) <= 12 ? [p1, p2] : [p2, p1];
    const d2 = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), parseInt(h, 10), parseInt(m, 10), parseInt(s, 10));
    if (!Number.isNaN(d2.getTime())) return d2.toISOString();
  }

  // Fallback: use current time so the row is still imported
  return new Date().toISOString();
}

/** Instagram/Meta CSV exports use various date column names. */
const INSTAGRAM_DATE_KEYS = [
  "date",
  "posted_at",
  "timestamp",
  "created_at",
  "date_gmt",
  "date_(gmt)",
  "date(gmt)",
  "time",
  "publish_time",
];

function getDateFromRow(row: CSVRow): string | undefined {
  for (const key of INSTAGRAM_DATE_KEYS) {
    const val = row[key];
    if (val != null && String(val).trim() !== "") return String(val).trim();
  }
  // Fallback: any key containing "date" or "timestamp"
  for (const [k, v] of Object.entries(row)) {
    if (v && (k.includes("date") || k.includes("timestamp"))) return String(v).trim();
  }
  return undefined;
}

/** Username-like column names to check in CSV/JSON exports. */
const USERNAME_KEYS = [
  "username",
  "account",
  "account_name",
  "handle",
  "profile_name",
  "profile",
  "user_name",
  "owner",
  "creator",
  "ig_username",
  "instagram_username",
];

/** Reject numeric IDs (e.g. Instagram user_id 17841416905062284) — must look like a real handle. */
function isValidUsername(val: string): boolean {
  const trimmed = val.trim().replace(/^@/, "");
  if (trimmed.length === 0 || trimmed.length > 50) return false;
  if (/^\d+$/.test(trimmed)) return false; // pure numeric = ID, not username
  if (!/^[\w.]+$/.test(trimmed)) return false; // usernames are alphanumeric, underscore, dot
  return true;
}

function extractUsernameFromCSVRows(rows: CSVRow[]): string | undefined {
  if (rows.length === 0) return undefined;
  for (const key of USERNAME_KEYS) {
    const firstVal = rows[0][key];
    if (firstVal != null && String(firstVal).trim() !== "") {
      const val = String(firstVal).trim().replace(/^@/, "");
      if (isValidUsername(val) && !val.includes(",")) {
        const consistent = rows.every((r) => (r[key] ?? "").trim().replace(/^@/, "") === val);
        if (consistent) return val;
      }
    }
  }
  for (const [k, v] of Object.entries(rows[0])) {
    if (v && (k.includes("username") || k.includes("account") || k.includes("handle"))) {
      const val = String(v).trim().replace(/^@/, "");
      if (isValidUsername(val)) return val;
    }
  }
  return undefined;
}

function extractUsernameFromJSON(obj: unknown): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const record = obj as Record<string, unknown>;
  for (const key of ["username", "UserName", "account", "handle", "profile_name", "ProfileName"]) {
    const val = record[key];
    if (typeof val === "string" && isValidUsername(val)) {
      return val.trim().replace(/^@/, "");
    }
  }
  const profile = record.Profile ?? record.profile ?? record.Account ?? record.account;
  if (profile && typeof profile === "object") {
    const p = profile as Record<string, unknown>;
    const u = p.UserName ?? p.username ?? p.handle ?? p.account;
    if (typeof u === "string" && isValidUsername(u)) return u.trim().replace(/^@/, "");
  }
  return undefined;
}

function extractVideoIdFromLink(link: string): string | null {
  const match = link.match(/\/video\/(\d+)/);
  return match ? match[1] : null;
}

// ─── TikTok JSON parser ──────────────────────────────────────────────────────
// TikTok "Download your data" exports a JSON file with this structure:
// { Activity: { Video: { Videos: { VideoList: [ { Date, Likes, Link }, ... ] } } } }
// Some exports also have a flat "Video" or "VideoList" at the top level.

function findVideoList(obj: unknown): unknown[] | null {
  if (!obj || typeof obj !== "object") return null;
  const record = obj as Record<string, unknown>;

  // Direct VideoList array
  if (Array.isArray(record.VideoList)) return record.VideoList;

  // Activity > Video > Videos > VideoList (most common)
  const activity = record.Activity as Record<string, unknown> | undefined;
  if (activity) {
    const video = activity.Video as Record<string, unknown> | undefined;
    if (video) {
      const videos = video.Videos as Record<string, unknown> | undefined;
      if (videos && Array.isArray(videos.VideoList)) return videos.VideoList;
      if (Array.isArray(video.VideoList)) return video.VideoList;
    }
    // Activity > "Like List" or "Favorite Videos" — skip these, not user's own
  }

  // Video > Videos > VideoList
  const video = record.Video as Record<string, unknown> | undefined;
  if (video) {
    const videos = video.Videos as Record<string, unknown> | undefined;
    if (videos && Array.isArray(videos.VideoList)) return videos.VideoList;
    if (Array.isArray(video.VideoList)) return video.VideoList;
  }

  return null;
}

export function parseTikTokJSON(text: string): { posts: ParsedPost[]; errors: string[]; extractedUsername?: string } {
  const posts: ParsedPost[] = [];
  const errors: string[] = [];

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    errors.push("Invalid JSON file. Make sure you uploaded the correct TikTok data export.");
    return { posts, errors };
  }

  const extractedUsername = extractUsernameFromJSON(data);

  const videoList = findVideoList(data);
  if (!videoList || videoList.length === 0) {
    errors.push("No video list found in JSON. Expected TikTok data export with Activity > Video > Videos > VideoList.");
    return { posts, errors, extractedUsername };
  }

  for (let i = 0; i < videoList.length; i++) {
    try {
      const entry = videoList[i] as Record<string, unknown>;
      const link = (entry.Link ?? entry.VideoLink ?? entry.link ?? "") as string;
      const date = (entry.Date ?? entry.date ?? entry.CreateDate ?? "") as string;
      const likes = safeInt(entry.Likes as string | number | undefined);

      const videoId = extractVideoIdFromLink(link) ?? `tiktok_json_${i}`;

      posts.push({
        platform_post_id: videoId,
        content_type: "video",
        caption: null,
        hashtags: [],
        likes,
        comments: 0,
        shares: 0,
        saves: 0,
        views: 0,
        reach: 0,
        engagement_rate: null,
        posted_at: date ? new Date(date).toISOString() : new Date().toISOString(),
        duration_seconds: null,
      });
    } catch (err) {
      errors.push(`Video ${i + 1}: ${err instanceof Error ? err.message : "parse error"}`);
    }
  }

  return { posts, errors, extractedUsername };
}

// ─── TikTok TXT parser ───────────────────────────────────────────────────────
// TikTok TXT export has sections like "Video List:" with entries containing
// Date, Likes, and Link on separate lines.

export function parseTikTokTXT(text: string): { posts: ParsedPost[]; errors: string[] } {
  const posts: ParsedPost[] = [];
  const errors: string[] = [];

  // Try to find video list sections
  // Format is typically:
  //   Date: 2024-01-15 12:30:00
  //   Likes: 142
  //   Link: https://www.tiktokv.com/share/video/1234567890/
  const lines = text.split("\n").map((l) => l.trim());

  let currentEntry: { date?: string; likes?: number; link?: string } = {};
  let entryIndex = 0;
  let inVideoSection = false;

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Detect if we're in a video-related section
    if (lower.includes("video list") || lower.includes("videos:") || lower.includes("your videos")) {
      inVideoSection = true;
      continue;
    }

    // Stop at the next major section
    if (inVideoSection && line.endsWith(":") && !lower.startsWith("date") && !lower.startsWith("likes") && !lower.startsWith("link")) {
      if (!lower.includes("video")) {
        inVideoSection = false;
        continue;
      }
    }

    if (!inVideoSection) continue;

    if (lower.startsWith("date:")) {
      // If we already have a partial entry, save it before starting a new one
      if (currentEntry.date || currentEntry.link) {
        pushTxtEntry(posts, currentEntry, entryIndex, errors);
        entryIndex++;
      }
      currentEntry = { date: line.substring(line.indexOf(":") + 1).trim() };
    } else if (lower.startsWith("likes:")) {
      currentEntry.likes = safeInt(line.substring(line.indexOf(":") + 1).trim());
    } else if (lower.startsWith("link:")) {
      currentEntry.link = line.substring(line.indexOf(":") + 1).trim();
      // In the TXT format, Link typically comes last per entry
      pushTxtEntry(posts, currentEntry, entryIndex, errors);
      entryIndex++;
      currentEntry = {};
    }
  }

  // Push any remaining entry
  if (currentEntry.date || currentEntry.link) {
    pushTxtEntry(posts, currentEntry, entryIndex, errors);
  }

  // If we found nothing via structured parsing, try line-by-line URL extraction
  if (posts.length === 0) {
    const urlPattern = /tiktok(?:v)?\.com\/(?:share\/)?(?:video|@[\w.]+\/video)\/(\d+)/g;
    let match: RegExpExecArray | null;
    let urlIdx = 0;
    while ((match = urlPattern.exec(text)) !== null) {
      posts.push({
        platform_post_id: match[1],
        content_type: "video",
        caption: null,
        hashtags: [],
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        views: 0,
        reach: 0,
        engagement_rate: null,
        posted_at: new Date().toISOString(),
        duration_seconds: null,
      });
      urlIdx++;
    }
    if (urlIdx === 0) {
      errors.push("Could not find any video entries in the TXT file. Make sure this is a TikTok data export.");
    }
  }

  return { posts, errors };
}

function pushTxtEntry(
  posts: ParsedPost[],
  entry: { date?: string; likes?: number; link?: string },
  index: number,
  errors: string[]
): void {
  try {
    const videoId = entry.link ? (extractVideoIdFromLink(entry.link) ?? `tiktok_txt_${index}`) : `tiktok_txt_${index}`;
    posts.push({
      platform_post_id: videoId,
      content_type: "video",
      caption: null,
      hashtags: [],
      likes: entry.likes ?? 0,
      comments: 0,
      shares: 0,
      saves: 0,
      views: 0,
      reach: 0,
      engagement_rate: null,
      posted_at: entry.date ? new Date(entry.date).toISOString() : new Date().toISOString(),
      duration_seconds: null,
    });
  } catch (err) {
    errors.push(`Entry ${index + 1}: ${err instanceof Error ? err.message : "parse error"}`);
  }
}

// ─── TikTok CSV parser ───────────────────────────────────────────────────────

export function parseTikTokCSV(text: string): { posts: ParsedPost[]; errors: string[]; extractedUsername?: string } {
  const rows = parseCSVText(text);
  const posts: ParsedPost[] = [];
  const errors: string[] = [];
  const extractedUsername = extractUsernameFromCSVRows(rows);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const id = row.video_id ?? row.id ?? row.post_id ?? `tiktok_${i}`;
      const caption = row.caption ?? row.description ?? row.video_description ?? null;
      const views = safeInt(row.views ?? row.video_views ?? row.total_views);
      const likes = safeInt(row.likes ?? row.digg_count ?? row.total_likes);
      const comments = safeInt(row.comments ?? row.comment_count ?? row.total_comments);
      const shares = safeInt(row.shares ?? row.share_count ?? row.total_shares);
      const saves = safeInt(row.saves ?? row.collect_count);
      const duration = safeInt(row.duration ?? row.video_duration ?? row.duration_seconds) || null;

      const totalInteractions = likes + comments + shares + saves;
      const engagementRate = views > 0 ? totalInteractions / views : null;

      const postedAtRaw = row.date ?? row.posted_at ?? row.create_time ?? row.created_at;
      const postedAt = parseFlexibleDate(postedAtRaw);

      posts.push({
        platform_post_id: id,
        content_type: "video",
        caption,
        hashtags: extractHashtags(caption ?? ""),
        likes,
        comments,
        shares,
        saves,
        views,
        reach: views,
        engagement_rate: engagementRate,
        posted_at: postedAt,
        duration_seconds: duration,
      });
    } catch (err) {
      errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : "parse error"}`);
    }
  }

  return { posts, errors, extractedUsername };
}

// ─── Instagram CSV parser ────────────────────────────────────────────────────

export function parseInstagramCSV(text: string): { posts: ParsedPost[]; errors: string[]; extractedUsername?: string } {
  const rows = parseCSVText(text);
  const posts: ParsedPost[] = [];
  const errors: string[] = [];
  const extractedUsername = extractUsernameFromCSVRows(rows);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const id = row.post_id ?? row.media_id ?? row.id ?? `ig_${i}`;
      const caption = row.caption ?? row.description ?? null;
      const likes = safeInt(row.likes ?? row.like_count);
      const comments = safeInt(row.comments ?? row.comment_count);
      const shares = safeInt(row.shares ?? row.share_count);
      const saves = safeInt(row.saves ?? row.saved ?? row.save_count);
      const views = safeInt(row.views ?? row.impressions ?? row.reach ?? row.plays);
      const reach = safeInt(row.reach ?? row.impressions) || views;

      const typeRaw = (row.type ?? row.media_type ?? row.content_type ?? "post").toLowerCase();
      let contentType: ContentType = "post";
      if (typeRaw.includes("reel")) contentType = "reel";
      else if (typeRaw.includes("story")) contentType = "story";
      else if (typeRaw.includes("video")) contentType = "video";

      const totalInteractions = likes + comments + shares + saves;
      const engagementRate = reach > 0 ? totalInteractions / reach : null;

      const postedAtRaw = getDateFromRow(row);
      const postedAt = parseFlexibleDate(postedAtRaw);

      posts.push({
        platform_post_id: id,
        content_type: contentType,
        caption,
        hashtags: extractHashtags(caption ?? ""),
        likes,
        comments,
        shares,
        saves,
        views,
        reach,
        engagement_rate: engagementRate,
        posted_at: postedAt,
        duration_seconds: safeInt(row.duration ?? row.video_duration) || null,
      });
    } catch (err) {
      errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : "parse error"}`);
    }
  }

  return { posts, errors, extractedUsername };
}

// ─── Unified parser ──────────────────────────────────────────────────────────

export type FileFormat = "csv" | "json" | "txt";

export function detectFormat(fileName: string): FileFormat {
  const ext = fileName.toLowerCase().split(".").pop();
  if (ext === "json") return "json";
  if (ext === "txt") return "txt";
  return "csv";
}

export function parseImport(
  text: string,
  platform: Platform,
  format: FileFormat
): { posts: ParsedPost[]; errors: string[]; extractedUsername?: string } {
  if (platform === "tiktok") {
    if (format === "json") return parseTikTokJSON(text);
    if (format === "txt") return parseTikTokTXT(text);
    return parseTikTokCSV(text);
  }

  if (platform === "instagram") {
    // Instagram exports are CSV from Meta Business Suite
    if (format === "json") {
      return parseInstagramJSON(text);
    }
    return parseInstagramCSV(text);
  }

  // Fallback for other platforms
  return parseTikTokCSV(text);
}

function parseInstagramJSON(text: string): { posts: ParsedPost[]; errors: string[]; extractedUsername?: string } {
  const posts: ParsedPost[] = [];
  const errors: string[] = [];

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    errors.push("Invalid JSON file.");
    return { posts, errors };
  }

  let extractedUsername = extractUsernameFromJSON(data);

  // Try to find an array of post objects
  const entries = Array.isArray(data) ? data : findPostArray(data);
  if (!entries || entries.length === 0) {
    errors.push("No post data found in JSON. Try exporting as CSV from Meta Business Suite instead.");
    return { posts, errors, extractedUsername };
  }

  if (!extractedUsername && entries[0] && typeof entries[0] === "object") {
    extractedUsername = extractUsernameFromJSON(entries[0]);
  }

  for (let i = 0; i < entries.length; i++) {
    try {
      const entry = entries[i] as Record<string, unknown>;
      const id = String(entry.media_id ?? entry.post_id ?? entry.id ?? `ig_json_${i}`);
      const caption = (entry.caption ?? entry.description ?? null) as string | null;
      const likes = safeInt(entry.likes as string | number | undefined);
      const comments = safeInt(entry.comments as string | number | undefined);
      const shares = safeInt(entry.shares as string | number | undefined);
      const saves = safeInt(entry.saves as string | number | undefined);
      const views = safeInt(entry.views as string | number | undefined ?? entry.impressions as string | number | undefined);
      const reach = safeInt(entry.reach as string | number | undefined) || views;
      const date = (entry.date ?? entry.timestamp ?? entry.posted_at ?? entry.created_at ?? "") as string;

      const totalInteractions = likes + comments + shares + saves;
      const engagementRate = reach > 0 ? totalInteractions / reach : null;

      posts.push({
        platform_post_id: id,
        content_type: "post",
        caption,
        hashtags: extractHashtags(caption ?? ""),
        likes,
        comments,
        shares,
        saves,
        views,
        reach,
        engagement_rate: engagementRate,
        posted_at: date ? new Date(date).toISOString() : new Date().toISOString(),
        duration_seconds: null,
      });
    } catch (err) {
      errors.push(`Entry ${i + 1}: ${err instanceof Error ? err.message : "parse error"}`);
    }
  }

  return { posts, errors, extractedUsername };
}

function findPostArray(obj: unknown): unknown[] | null {
  if (!obj || typeof obj !== "object") return null;
  const record = obj as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (Array.isArray(record[key]) && (record[key] as unknown[]).length > 0) {
      return record[key] as unknown[];
    }
  }
  return null;
}

// Re-export for backward compatibility
export function parseCSV(
  text: string,
  platform: Platform
): { posts: ParsedPost[]; errors: string[]; extractedUsername?: string } {
  return parseImport(text, platform, "csv");
}
