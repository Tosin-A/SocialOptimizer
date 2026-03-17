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
  brand_pillars: string[];
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

// ─── Platform Signal Weights ──────────────────────────────────────────────────

export interface PlatformSignalWeight {
  signal: string;
  weight: number;           // 0–1, sums to 1.0 for a platform
  current_score: number;    // 0–100
  benchmark: number;        // platform median 0–100
}

export interface FixListItem {
  rank: number;             // 1–6
  problem: string;
  why_it_matters: string;
  action: string;
  impact: ImpactLevel;
  metric_reference: string;
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

  // Platform-specific signal weights and ranked fix list
  fix_list: FixListItem[];
  platform_signal_weights: PlatformSignalWeight[];

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

// ─── Competitor Expansion ─────────────────────────────────────────────────────

export interface CompetitorOutlier {
  username: string;
  caption: string | null;
  engagement_rate: number;
  multiplier: number;
  what_worked: string;
}

export interface HashtagGapAnalysis {
  hashtag: string;
  competitor_uses: boolean;
  user_uses: boolean;
  recommendation: "adopt" | "ignore" | "already_using";
  rationale: string;
}

export interface CadenceComparison {
  metric: string;
  user_value: number;
  competitor_value: number;
  gap: number;
  recommendation: string;
}

// ─── Content Generation ───────────────────────────────────────────────────────

export interface GenerateRequest {
  platform: Platform;
  content_type: "hook" | "caption" | "script" | "hashtags" | "idea" | "full_plan" | "replicate";
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

// ─── Discover Module ─────────────────────────────────────────────────────────

export interface OutlierPost {
  id: string;
  user_id: string;
  post_id: string | null;
  competitor_post_id: string | null;
  source: "own" | "competitor";
  multiplier: number;           // e.g. 3.5x avg engagement
  pattern_tags: string[];
  what_worked: string;
  is_saved: boolean;
  platform: Platform;
  caption: string | null;
  engagement_rate: number;
  views: number;
  likes: number;
  posted_at: string;
  created_at: string;
}

export interface TrendItem {
  id: string;
  platform: Platform;
  trend_type: "sound" | "hashtag" | "format" | "topic";
  name: string;
  velocity_score: number;       // 0–100
  saturation: "low" | "medium" | "high";
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface NicheSaturation {
  id: string;
  platform: Platform;
  niche: string;
  active_creators: number;
  avg_engagement_rate: number;
  trend_direction: "growing" | "stable" | "declining";
  verdict: string;
  created_at: string;
}

export interface FormatPattern {
  format: ContentType;
  count: number;
  avg_engagement_rate: number;
  pct_of_total: number;
  recommendation: string;
}

// ─── Track Module ────────────────────────────────────────────────────────────

export type ExperimentStatus = "draft" | "running" | "completed" | "cancelled";

export interface Experiment {
  id: string;
  user_id: string;
  account_id: string;
  name: string;
  hypothesis: string;
  platform: Platform;
  start_date: string;
  end_date: string | null;
  status: ExperimentStatus;
  baseline_metrics: Record<string, number>;
  result_metrics: Record<string, number>;
  tagged_post_ids: string[];
  outcome: string | null;
  created_at: string;
}

export interface WinLibraryEntry {
  id: string;
  user_id: string;
  outlier_post_id: string | null;
  source: string;
  platform: Platform;
  tag: string;
  notes: string;
  created_at: string;
}

export interface SavedIdea {
  id: string;
  user_id: string;
  content: string;
  provider: "claude" | "openai";
  platform: string | null;
  niche: string | null;
  source_prompt: string | null;
  created_at: string;
}

export interface ScoreAnnotation {
  id: string;
  user_id: string;
  report_id: string;
  experiment_id: string | null;
  annotation_type: "analysis" | "experiment_start" | "experiment_end";
  label: string;
  date: string;
  created_at: string;
}

// ─── Generate Enhancements ───────────────────────────────────────────────────

export interface PersonalizedIdea {
  title: string;
  angle: string;
  source: "outlier" | "trend" | "niche_gap";
  source_reference: string;
  why_it_works: string;
  format: ContentType;
  estimated_engagement: "high" | "medium" | "low";
}

export interface ScoredHook {
  text: string;
  score: number;             // 0–100
  type: "question" | "statement" | "stat" | "story" | "controversial";
  pattern_interrupt_score: number;  // 0–100
  ab_recommended: boolean;
  psychology: string;
}

export interface CaptionSection {
  label: "hook" | "body" | "cta";
  text: string;
  score: number;             // 0–100
  feedback: string;
}

export interface StructuredCaption {
  sections: CaptionSection[];
  overall_score: number;
  hashtags: string[];
  character_count: number;
}

export interface PostingTimeRecommendation {
  day: string;               // "Monday", "Tuesday", etc.
  hour: number;              // 0–23 UTC
  score: number;             // 0–100 engagement prediction
  label: string;             // "Best", "Good", "OK"
}

// ─── CSV Import ──────────────────────────────────────────────────────────────

export interface CSVImportResult {
  posts_imported: number;
  posts_skipped: number;
  errors: string[];
  account_id: string;
}

// ─── Replicate Winners ──────────────────────────────────────────────────────

export interface ReplicateWinnerOutput {
  original_post: {
    caption_preview: string;
    engagement_rate: string;
    why_it_worked: string;
  };
  replicated_content: {
    hook: string;
    caption: string;
    script_outline: string;
    hashtags: string[];
    format: string;
    expected_engagement: "high" | "medium" | "low";
  };
  adaptation_notes: string;
}

// ─── Content Coach ───────────────────────────────────────────────────────

export type CoachMessageRole = "user" | "assistant";

export interface CoachMessage {
  role: CoachMessageRole;
  content: string;
  timestamp: string;
  provider?: "claude" | "openai";
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
