// ════════════════════════════════════════════════════════════════════════════
// Shared TypeScript types for SocialOptimizer
// ════════════════════════════════════════════════════════════════════════════

export type Platform = "tiktok" | "instagram" | "youtube" | "facebook";
export type ContentType = "video" | "reel" | "short" | "post" | "story" | "live";
export type JobStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";
export type PlanType = "free" | "starter" | "pro" | "agency";
export type InsightType = "strength" | "weakness" | "opportunity" | "threat";
export type Sentiment = "positive" | "neutral" | "negative";
export type ImpactLevel = "high" | "medium" | "low";

// ─── User & Account ───────────────────────────────────────────────────────────

export interface User {
  id: string;
  auth_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: PlanType;
  stripe_customer_id: string | null;
  analyses_used: number;
  analyses_limit: number;
  created_at: string;
  updated_at: string;
}

export interface ConnectedAccount {
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
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export interface Post {
  id: string;
  account_id: string;
  platform_post_id: string;
  content_type: ContentType;
  caption: string | null;
  hashtags: string[];
  mentions: string[];
  media_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  views: number;
  reach: number;
  engagement_rate: number | null;
  posted_at: string;
}

// ─── Analysis ─────────────────────────────────────────────────────────────────

export interface AnalysisJob {
  id: string;
  user_id: string;
  account_id: string;
  status: JobStatus;
  progress: number;
  current_step: string | null;
  posts_fetched: number;
  posts_analyzed: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Insight {
  title: string;
  description: string;
  impact: ImpactLevel;
  metric?: string;
  recommendation?: string;
}

export interface RoadmapAction {
  priority: number;
  action: string;
  expected_impact: string;
  timeframe: string;
  category: "content" | "hashtags" | "posting" | "engagement" | "branding";
}

export interface HashtagAnalysis {
  tag: string;
  reach_score: number;       // 0–100
  competition: "low" | "medium" | "high";
  relevance: number;          // 0–1
  recommendation: "keep" | "replace" | "add";
  suggested_alternative?: string;
}

export interface ContentTheme {
  theme: string;
  frequency: number;
  avg_engagement_rate: number;
  is_dominant: boolean;
}

export interface AnalysisReport {
  id: string;
  job_id: string;
  account_id: string;
  user_id: string;

  // Scores
  growth_score: number;
  content_quality_score: number;
  hashtag_score: number;
  engagement_score: number;
  consistency_score: number;
  branding_score: number;
  hook_strength_score: number;
  cta_score: number;

  // Niche
  detected_niche: string;
  niche_confidence: number;
  niche_keywords: string[];
  content_themes: ContentTheme[];

  // Hashtags
  hashtag_effectiveness: HashtagAnalysis[];
  recommended_hashtags: string[];
  overused_hashtags: string[];
  underused_hashtags: string[];

  // Posting
  avg_posts_per_week: number;
  best_days: string[];
  best_hours: number[];
  posting_consistency: number;

  // Engagement
  avg_engagement_rate: number;
  avg_likes: number;
  avg_comments: number;
  avg_shares: number;
  avg_views: number;
  top_performing_formats: ContentType[];

  // Content quality
  avg_hook_score: number;
  cta_usage_rate: number;
  caption_sentiment: Sentiment;
  avg_caption_length: number;

  // AI insights
  strengths: Insight[];
  weaknesses: Insight[];
  opportunities: Insight[];
  improvement_roadmap: RoadmapAction[];
  executive_summary: string;

  top_posts: Array<{ post_id: string; reason: string; metric: string }>;
  worst_posts: Array<{ post_id: string; reason: string; metric: string }>;

  created_at: string;
}

// ─── Competitors ──────────────────────────────────────────────────────────────

export interface Competitor {
  id: string;
  user_id: string;
  platform: Platform;
  platform_user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  followers: number | null;
  niche: string | null;
  avg_engagement_rate: number | null;
  posts_per_week: number | null;
  top_hashtags: string[];
  content_formats: ContentType[];
  last_analyzed_at: string | null;
}

export interface CompetitorComparison {
  id: string;
  competitor: Competitor;
  engagement_gap: number;
  follower_gap: number;
  posting_frequency_gap: number;
  hashtag_differences: Array<{
    hashtag: string;
    competitor_uses: boolean;
    user_uses: boolean;
  }>;
  format_differences: Array<{ format: ContentType; competitor_freq: number; user_freq: number }>;
  hook_style_differences: string;
  caption_length_diff: number;
  tactical_actions: Array<{ action: string; priority: ImpactLevel; rationale: string }>;
}

// ─── Content Generation ───────────────────────────────────────────────────────

export interface GenerateRequest {
  platform: Platform;
  content_type: "hook" | "caption" | "script" | "hashtags" | "idea" | "full_plan";
  niche: string;
  topic: string;
  tone?: "educational" | "entertaining" | "inspirational" | "controversial" | "storytelling";
  target_audience?: string;
  account_id?: string;
  count?: number;
}

export interface GeneratedHook {
  text: string;
  type: "question" | "statement" | "stat" | "story" | "controversial";
  psychology: string;  // why this hook works
  expected_retention: "high" | "medium" | "low";
}

export interface GeneratedCaption {
  caption: string;
  hashtags: string[];
  cta: string;
  character_count: number;
}

export interface GeneratedScript {
  hook: string;
  hook_duration: string;
  body_points: Array<{ timestamp: string; content: string }>;
  cta: string;
  total_duration: string;
}

export interface GeneratedContentOutput {
  hooks?: GeneratedHook[];
  captions?: GeneratedCaption[];
  scripts?: GeneratedScript[];
  video_ideas?: Array<{ title: string; angle: string; why_it_works: string; format: ContentType }>;
  hashtag_sets?: Array<{ name: string; tags: string[]; strategy: string }>;
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  growth_score: number;
  growth_score_delta: number;          // change since last report
  avg_engagement_rate: number;
  total_followers: number;
  total_posts_analyzed: number;
  top_platform: Platform | null;
  niche: string | null;
  connected_accounts: number;
  pending_actions: number;
  last_analysis_at: string | null;
}
