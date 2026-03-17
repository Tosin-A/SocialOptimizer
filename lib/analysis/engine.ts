// ════════════════════════════════════════════════════════════════════════════
// Core Analysis Engine — orchestrates all analysis steps
// ════════════════════════════════════════════════════════════════════════════

import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import {
  analyzeNicheAndThemes,
  analyzeHashtags,
  generateInsightsAndRoadmap,
  generateFixList,
} from "@/lib/ai/claude";
import { sendAnalysisReady } from "@/lib/email";
import type {
  Post,
  Platform,
  ConnectedAccount,
  PlatformSignalWeight,
  HashtagAnalysis,
  Insight,
  RoadmapAction,
  FixListItem,
} from "@/types";

interface EngineOptions {
  jobId: string;
  account: ConnectedAccount;
  posts: Post[];
  pythonServiceUrl: string;
}

const PYTHON_ANALYSIS_TIMEOUT_MS = 12_000;
const CLAUDE_RETRY_DELAYS_MS = [800, 1800];
const ENGINE_RUNTIME_BUDGET_MS = 50_000;
const FAST_FALLBACK_TRIGGER_MS = 36_000;

// ─── Progress reporter ────────────────────────────────────────────────────────

async function updateJobProgress(
  jobId: string,
  progress: number,
  step: string
) {
  const supabase = getSupabaseServiceClient();
  await supabase
    .from("analysis_jobs")
    .update({ progress, current_step: step })
    .eq("id", jobId);
}

function isRetryableClaudeError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const maybeStatus = (error as Error & { status?: number }).status;
  if (maybeStatus && [408, 429, 500, 502, 503, 504].includes(maybeStatus)) return true;

  const message = error.message.toLowerCase();
  return (
    message.includes("\"type\":\"api_error\"") ||
    message.includes("internal server error") ||
    message.includes("overloaded") ||
    message.includes("rate limit")
  );
}

async function retryClaudeCall<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= CLAUDE_RETRY_DELAYS_MS.length; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isRetryableClaudeError(error) || attempt === CLAUDE_RETRY_DELAYS_MS.length) {
        throw error;
      }

      const waitMs = CLAUDE_RETRY_DELAYS_MS[attempt];
      console.warn(`[analysis:${label}] transient Claude error, retrying in ${waitMs}ms`, error);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Unknown Claude error in ${label}`);
}

function shouldUseFastFallback(engineStartedAtMs: number): boolean {
  return Date.now() - engineStartedAtMs > FAST_FALLBACK_TRIGGER_MS;
}

function ensureArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function buildFallbackInsightsAndRoadmap(input: {
  platform: Platform;
  niche: string;
  growthScore: number;
  avgEngagementRate: number;
  hookStrengthScore: number;
  ctaScore: number;
  consistencyScore: number;
  hashtagScore: number;
  bestDays: string[];
  avgPostsPerWeek: number;
}): {
  strengths: Insight[];
  weaknesses: Insight[];
  opportunities: Insight[];
  roadmap: RoadmapAction[];
  executive_summary: string;
} {
  const {
    platform,
    niche,
    growthScore,
    avgEngagementRate,
    hookStrengthScore,
    ctaScore,
    consistencyScore,
    hashtagScore,
    bestDays,
    avgPostsPerWeek,
  } = input;

  const engagementPct = (avgEngagementRate * 100).toFixed(2);
  const strongestMetric = [
    { key: "engagement", value: Math.round(avgEngagementRate * 100) },
    { key: "hashtags", value: hashtagScore },
    { key: "hooks", value: hookStrengthScore },
    { key: "consistency", value: consistencyScore },
    { key: "cta", value: ctaScore },
  ].sort((a, b) => b.value - a.value)[0];

  return {
    strengths: [
      {
        title: `Strongest signal: ${strongestMetric.key}`,
        description: `Your ${strongestMetric.key} signal is currently the strongest lever in this ${platform} profile, supported by recent post-level metrics.`,
        impact: "high",
        metric: `${strongestMetric.key} score ${strongestMetric.value}/100`,
      },
      {
        title: "Audience response is measurable",
        description: `Average engagement is ${engagementPct}%, which gives enough signal to optimize with clear before/after experiments.`,
        impact: "medium",
        metric: `Avg engagement ${engagementPct}%`,
      },
    ],
    weaknesses: [
      {
        title: "Hook and CTA execution gap",
        description: "Hook quality and CTA usage are not consistently strong enough to maximize distribution and conversion.",
        impact: "high",
        metric: `Hook ${hookStrengthScore}/100, CTA ${ctaScore}/100`,
        recommendation: "Standardize first-line hooks and add a clear CTA to every post for the next 2 weeks.",
      },
      {
        title: "Inconsistent publishing rhythm",
        description: "Posting cadence is not yet stable, reducing repeat distribution momentum.",
        impact: "medium",
        metric: `Consistency ${consistencyScore}/100, ${avgPostsPerWeek.toFixed(2)} posts/week`,
        recommendation: "Lock a fixed weekly schedule and publish on your best-performing days.",
      },
    ],
    opportunities: [
      {
        title: `${niche} positioning can compound`,
        description: `Doubling down on repeatable ${niche} formats and timing around ${bestDays.slice(0, 2).join(", ")} can improve consistency and reach.`,
        impact: "high",
      },
    ],
    roadmap: [
      {
        priority: 1,
        action: "Rewrite opening line templates for your next 10 posts using question/stat hooks.",
        expected_impact: "10-20 point hook score improvement",
        timeframe: "7 days",
        category: "content",
      },
      {
        priority: 2,
        action: "Add one explicit CTA (comment/save/share/follow) to every caption.",
        expected_impact: "15-30% increase in CTA interaction rate",
        timeframe: "7 days",
        category: "engagement",
      },
      {
        priority: 3,
        action: "Publish on a fixed weekly calendar aligned to your best-performing days.",
        expected_impact: "Higher consistency score and steadier reach",
        timeframe: "14 days",
        category: "posting",
      },
      {
        priority: 4,
        action: "Keep high-performing hashtag clusters and remove broad low-intent tags.",
        expected_impact: "5-10 point hashtag score improvement",
        timeframe: "14 days",
        category: "hashtags",
      },
    ],
    executive_summary: `Growth score is ${growthScore}/100. Engagement is currently ${engagementPct}% with the biggest upside in stronger hooks, explicit CTAs, and a stable posting cadence.`,
  };
}

function buildFallbackFixList(input: {
  hookStrengthScore: number;
  ctaScore: number;
  consistencyScore: number;
  hashtagScore: number;
  avgPostsPerWeek: number;
}): FixListItem[] {
  const { hookStrengthScore, ctaScore, consistencyScore, hashtagScore, avgPostsPerWeek } = input;

  return [
    {
      rank: 1,
      problem: "Hook quality is below growth potential.",
      why_it_matters: "Weak openings lower watch retention and suppress distribution.",
      action: "Start each post with a question, contrarian claim, or specific number in the first line.",
      impact: "high",
      metric_reference: `hook score ${hookStrengthScore}/100`,
    },
    {
      rank: 2,
      problem: "CTA usage is inconsistent.",
      why_it_matters: "Without explicit prompts, fewer users take engagement actions.",
      action: "Add exactly one CTA in every caption (comment/save/share/follow) for the next 10 posts.",
      impact: "high",
      metric_reference: `cta score ${ctaScore}/100`,
    },
    {
      rank: 3,
      problem: "Posting rhythm is not stable.",
      why_it_matters: "Irregular cadence weakens repeat distribution patterns.",
      action: "Commit to a fixed weekly publishing schedule and keep it for 4 weeks.",
      impact: "medium",
      metric_reference: `consistency ${consistencyScore}/100, ${avgPostsPerWeek.toFixed(2)} posts/week`,
    },
    {
      rank: 4,
      problem: "Hashtag mix still has optimization headroom.",
      why_it_matters: "Tag quality influences discoverability and audience fit.",
      action: "Retain top-performing tags and rotate out low-relevance broad tags weekly.",
      impact: "medium",
      metric_reference: `hashtag score ${hashtagScore}/100`,
    },
  ];
}

function estimateHookScore(caption: string | null): number {
  const text = (caption ?? "").trim();
  if (!text) return 0.35;

  const opening = text.slice(0, 120).toLowerCase();
  let score = 0.45;

  if (opening.includes("?")) score += 0.15;
  if (/\b(why|how|stop|don['’]t|mistake|secret|truth)\b/.test(opening)) score += 0.15;
  if (/\d/.test(opening)) score += 0.08;
  if (text.length > 80) score += 0.05;
  if (text.length < 20) score -= 0.08;

  return Math.max(0.2, Math.min(0.92, score));
}

// ─── Score calculators ────────────────────────────────────────────────────────

function calcEngagementScore(avgEngagementRate: number, platform: Platform): number {
  // Platform-specific benchmarks (industry averages)
  const benchmarks: Record<Platform, number> = {
    tiktok: 0.06,      // 6% is considered good on TikTok
    instagram: 0.035,  // 3.5% on Instagram Reels
    youtube: 0.04,     // 4% for YouTube Shorts
    facebook: 0.008,   // 0.8% on Facebook (much lower organic reach)
  };
  const benchmark = benchmarks[platform];
  const ratio = avgEngagementRate / benchmark;
  return Math.min(100, Math.round(ratio * 60 + 20)); // 20-100 scale
}

function calcConsistencyScore(posts: Post[]): number {
  if (posts.length < 4) return 0;

  const sorted = [...posts].sort(
    (a, b) => new Date(a.posted_at).getTime() - new Date(b.posted_at).getTime()
  );

  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const gapDays =
      (new Date(sorted[i].posted_at).getTime() -
        new Date(sorted[i - 1].posted_at).getTime()) /
      (1000 * 60 * 60 * 24);
    gaps.push(gapDays);
  }

  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const variance =
    gaps.reduce((sum, gap) => sum + Math.pow(gap - avgGap, 2), 0) / gaps.length;
  const stdDev = Math.sqrt(variance);

  // Low std dev relative to avg gap = high consistency
  const cv = stdDev / avgGap; // coefficient of variation
  return Math.max(0, Math.min(100, Math.round((1 - Math.min(cv, 1)) * 100)));
}

function calcPostingFrequency(posts: Post[]): {
  avg_posts_per_week: number;
  best_days: string[];
  best_hours: number[];
} {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayEngagement: Record<number, number[]> = {};
  const hourEngagement: Record<number, number[]> = {};

  for (const post of posts) {
    const date = new Date(post.posted_at);
    const day = date.getDay();
    const hour = date.getUTCHours();
    const eng = post.engagement_rate ?? 0;

    dayEngagement[day] = [...(dayEngagement[day] ?? []), eng];
    hourEngagement[hour] = [...(hourEngagement[hour] ?? []), eng];
  }

  // Best days = top 2 by avg engagement
  const dayAvgs = Object.entries(dayEngagement).map(([d, engs]) => ({
    day: parseInt(d),
    avg: engs.reduce((a, b) => a + b, 0) / engs.length,
  }));
  const best_days = dayAvgs
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 3)
    .map((d) => dayNames[d.day]);

  // Best hours = top 3 by avg engagement
  const hourAvgs = Object.entries(hourEngagement).map(([h, engs]) => ({
    hour: parseInt(h),
    avg: engs.reduce((a, b) => a + b, 0) / engs.length,
  }));
  const best_hours = hourAvgs
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 3)
    .map((h) => h.hour);

  // Posts per week over last 90 days
  const now = Date.now();
  const last90Days = posts.filter(
    (p) => now - new Date(p.posted_at).getTime() < 90 * 24 * 60 * 60 * 1000
  );
  const avg_posts_per_week = parseFloat((last90Days.length / 13).toFixed(2));

  return { avg_posts_per_week, best_days, best_hours };
}

function calcHashtagScore(hashtags: string[], postCount: number): number {
  if (postCount === 0) return 0;

  const uniqueHashtags = new Set(hashtags).size;
  const avgPerPost = hashtags.length / postCount;

  let score = 50; // baseline

  // Variety: using a range of hashtags is good
  if (uniqueHashtags > 30) score += 15;
  else if (uniqueHashtags > 15) score += 8;

  // Volume per post: 5-15 is optimal for most platforms
  if (avgPerPost >= 5 && avgPerPost <= 15) score += 20;
  else if (avgPerPost >= 3 && avgPerPost < 5) score += 10;
  else if (avgPerPost > 15) score -= 5;

  // Consistency: using hashtags at all
  if (hashtags.length > 0) score += 15;

  return Math.min(100, Math.max(0, score));
}

// ─── Platform-specific signal weights ─────────────────────────────────────────

interface SignalConfig {
  signal: string;
  weight: number;
  benchmark: number;
}

const PLATFORM_SIGNAL_CONFIGS: Record<Platform, SignalConfig[]> = {
  tiktok: [
    { signal: "Hook strength",     weight: 0.30, benchmark: 55 },
    { signal: "Sound/trend align", weight: 0.20, benchmark: 50 },
    { signal: "Posting window",    weight: 0.20, benchmark: 60 },
    { signal: "Duet/stitch rate",  weight: 0.15, benchmark: 40 },
    { signal: "Caption CTA",       weight: 0.15, benchmark: 45 },
  ],
  instagram: [
    { signal: "Caption hook",         weight: 0.25, benchmark: 50 },
    { signal: "Hashtag specificity",  weight: 0.25, benchmark: 55 },
    { signal: "Reel vs static",       weight: 0.20, benchmark: 60 },
    { signal: "Save-rate proxy",      weight: 0.15, benchmark: 35 },
    { signal: "Story vs feed",        weight: 0.15, benchmark: 50 },
  ],
  youtube: [
    { signal: "Title CTR pattern", weight: 0.25, benchmark: 55 },
    { signal: "First-30s retention", weight: 0.25, benchmark: 50 },
    { signal: "Thumbnail quality", weight: 0.20, benchmark: 50 },
    { signal: "Description CTA",   weight: 0.15, benchmark: 40 },
    { signal: "Upload cadence",    weight: 0.15, benchmark: 55 },
  ],
  facebook: [
    { signal: "Post format mix",     weight: 0.25, benchmark: 50 },
    { signal: "Caption length",      weight: 0.20, benchmark: 50 },
    { signal: "Peak timing",         weight: 0.20, benchmark: 55 },
    { signal: "Group vs page delta", weight: 0.20, benchmark: 45 },
    { signal: "CTA effectiveness",   weight: 0.15, benchmark: 40 },
  ],
};

function calcPlatformSignalWeights(
  platform: Platform,
  scores: {
    hookStrength: number;
    ctaScore: number;
    hashtagScore: number;
    consistencyScore: number;
    engagementScore: number;
    brandingScore: number;
  }
): PlatformSignalWeight[] {
  const configs = PLATFORM_SIGNAL_CONFIGS[platform];

  // Map signal names to appropriate scores
  const scoreMapping: Record<string, number> = {
    "Hook strength": scores.hookStrength,
    "Sound/trend align": scores.engagementScore,
    "Posting window": scores.consistencyScore,
    "Duet/stitch rate": scores.engagementScore,
    "Caption CTA": scores.ctaScore,
    "Caption hook": scores.hookStrength,
    "Hashtag specificity": scores.hashtagScore,
    "Reel vs static": scores.engagementScore,
    "Save-rate proxy": scores.engagementScore,
    "Story vs feed": scores.brandingScore,
    "Title CTR pattern": scores.hookStrength,
    "First-30s retention": scores.hookStrength,
    "Thumbnail quality": scores.brandingScore,
    "Description CTA": scores.ctaScore,
    "Upload cadence": scores.consistencyScore,
    "Post format mix": scores.brandingScore,
    "Caption length": scores.hookStrength,
    "Peak timing": scores.consistencyScore,
    "Group vs page delta": scores.engagementScore,
    "CTA effectiveness": scores.ctaScore,
  };

  return configs.map((cfg) => ({
    signal: cfg.signal,
    weight: cfg.weight,
    current_score: scoreMapping[cfg.signal] ?? 50,
    benchmark: cfg.benchmark,
  }));
}

function calcWeightedGrowthScore(signalWeights: PlatformSignalWeight[]): number {
  const weighted = signalWeights.reduce(
    (sum, sw) => sum + sw.current_score * sw.weight,
    0
  );
  return Math.round(Math.max(0, Math.min(100, weighted)));
}

// ─── Main engine ──────────────────────────────────────────────────────────────

export async function runAnalysisEngine(options: EngineOptions): Promise<string> {
  const { jobId, account, pythonServiceUrl } = options;
  const engineStartedAtMs = Date.now();
  // Filter out posts with invalid dates to prevent "Invalid time value" errors
  const rawPosts = ensureArray<Post>(options.posts);
  const posts = rawPosts.filter((p) => !isNaN(new Date(p.posted_at).getTime()));
  const supabase = getSupabaseServiceClient();

  try {
    // ── Step 1: Mark job as processing ──────────────────────────────────────
    await supabase
      .from("analysis_jobs")
      .update({ status: "processing", started_at: new Date().toISOString(), progress: 5 })
      .eq("id", jobId);

    // ── Step 2: Niche & theme detection ──────────────────────────────────────
    await updateJobProgress(jobId, 15, "Detecting niche and content themes...");

    const nicheResult = await retryClaudeCall(
      () =>
        analyzeNicheAndThemes(
          posts.map((p) => ({
            caption: p.caption,
            hashtags: ensureArray<string>(p.hashtags),
            engagement_rate: p.engagement_rate,
            content_type: p.content_type,
          }))
        ),
      "analyzeNicheAndThemes"
    );
    const nicheThemes = ensureArray<{ theme: string; frequency: number; avg_engagement_rate: number; is_dominant: boolean }>(
      nicheResult.themes
    );

    // ── Step 3: Hashtag analysis ──────────────────────────────────────────────
    await updateJobProgress(jobId, 30, "Analyzing hashtag effectiveness...");

    const allHashtags = posts.flatMap((p) => ensureArray<string>(p.hashtags));
    const hashtagAnalysisRaw = await retryClaudeCall(
      () =>
        analyzeHashtags(
          allHashtags,
          nicheResult.niche,
          account.platform
        ),
      "analyzeHashtags"
    );
    const hashtagAnalysis = ensureArray<HashtagAnalysis>(hashtagAnalysisRaw);

    // ── Step 4: Hook + CTA analysis (via Python service) ─────────────────────
    await updateJobProgress(jobId, 45, "Analyzing content hooks and CTAs...");

    let hookScores: number[] = [];
    let ctaDetected = 0;
    let sentimentScores: number[] = [];
    let postAnalyses: Array<{
      post_id: string;
      transcript: string;
      hook_score: number;
      hook_text: string;
      hook_type: string;
      cta_detected: boolean;
      sentiment_score: number;
      keywords: string[];
    }> = [];

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), PYTHON_ANALYSIS_TIMEOUT_MS);

      // Call Python service for transcript-based analysis
      try {
        const pyResponse = await fetch(`${pythonServiceUrl}/analyze/posts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Service-Secret": process.env.PYTHON_SERVICE_SECRET!,
          },
          body: JSON.stringify({
            platform: account.platform,
            posts: posts.slice(0, 30).map((p) => ({
              id: p.id,
              caption: p.caption,
              media_url: p.media_url,
              platform: account.platform,
            })),
          }),
          signal: controller.signal,
        });

        if (!pyResponse.ok) {
          throw new Error(`Python service returned ${pyResponse.status}`);
        }

        const pyData = await pyResponse.json();
        hookScores = ensureArray<number>(pyData.hook_scores).filter((n) => Number.isFinite(n));
        ctaDetected = Number.isFinite(pyData.cta_count) ? Number(pyData.cta_count) : 0;
        sentimentScores = ensureArray<number>(pyData.sentiment_scores).filter((n) => Number.isFinite(n));
        postAnalyses = ensureArray<{
          post_id: string;
          transcript: string;
          hook_score: number;
          hook_text: string;
          hook_type: string;
          cta_detected: boolean;
          sentiment_score: number;
          keywords: string[];
        }>(pyData.post_analyses);
      } finally {
        clearTimeout(timeout);
      }
    } catch {
      // Python service unavailable — use deterministic local scoring to avoid
      // long serverless runtimes and keep the job moving.
      const sampledPosts = posts.slice(0, 30);
      for (const post of sampledPosts) {
        hookScores.push(estimateHookScore(post.caption ?? ""));
      }
      ctaDetected = sampledPosts.filter((post) =>
        /\b(comment|save|share|follow|dm|link in bio|subscribe|tag)\b/i.test(post.caption ?? "")
      ).length;
    }

    const postsTranscribed = postAnalyses.filter((pa) => pa.transcript && pa.transcript.length > 0).length;

    // ── Step 5: Compute aggregate metrics ─────────────────────────────────────
    await updateJobProgress(jobId, 60, "Computing engagement metrics...");

    const avgEngagementRate =
      posts.reduce((sum, p) => sum + (p.engagement_rate ?? 0), 0) / posts.length;

    const avgLikes = Math.round(posts.reduce((s, p) => s + p.likes, 0) / posts.length);
    const avgComments = Math.round(posts.reduce((s, p) => s + p.comments, 0) / posts.length);
    const avgShares = Math.round(posts.reduce((s, p) => s + p.shares, 0) / posts.length);
    const avgViews = Math.round(posts.reduce((s, p) => s + p.views, 0) / posts.length);

    const avgHookScore = hookScores.length > 0
      ? hookScores.reduce((a, b) => a + b, 0) / hookScores.length
      : 0.5;

    const ctaUsageRate = posts.length > 0 ? ctaDetected / posts.length : 0;

    const avgSentiment = sentimentScores.length > 0
      ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length
      : 0;
    const captionSentiment =
      avgSentiment > 0.2 ? "positive" : avgSentiment < -0.2 ? "negative" : "neutral";

    const avgCaptionLength = Math.round(
      posts.reduce((s, p) => s + (p.caption?.length ?? 0), 0) / posts.length
    );

    // Format analysis
    const formatCounts = posts.reduce((acc, p) => {
      acc[p.content_type] = (acc[p.content_type] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topPerformingFormats = posts
      .reduce((acc, p) => {
        const key = p.content_type;
        const existing = acc.find((a) => a.type === key);
        if (existing) {
          existing.total += p.engagement_rate ?? 0;
          existing.count += 1;
        } else {
          acc.push({ type: key, total: p.engagement_rate ?? 0, count: 1 });
        }
        return acc;
      }, [] as Array<{ type: string; total: number; count: number }>)
      .sort((a, b) => b.total / b.count - a.total / a.count)
      .slice(0, 3)
      .map((f) => f.type as any);

    // ── Step 6: Compute scores ─────────────────────────────────────────────────
    const engagementScore = calcEngagementScore(avgEngagementRate, account.platform);
    const consistencyScore = calcConsistencyScore(posts);
    const { avg_posts_per_week, best_days, best_hours } = calcPostingFrequency(posts);
    const hashtagScore = calcHashtagScore(allHashtags, posts.length);

    const contentQualityScore = Math.round(
      avgHookScore * 40 + ctaUsageRate * 30 + (consistencyScore / 100) * 30
    );
    const brandingScore = Math.round(consistencyScore * 0.6 + (nicheResult.confidence * 100) * 0.4);
    const hookStrengthScore = Math.round(avgHookScore * 100);
    const ctaScore = Math.round(ctaUsageRate * 100);

    // Platform-specific signal weights
    const platformSignalWeights = calcPlatformSignalWeights(account.platform, {
      hookStrength: hookStrengthScore,
      ctaScore: ctaScore,
      hashtagScore,
      consistencyScore,
      engagementScore,
      brandingScore,
    });

    const growthScore = calcWeightedGrowthScore(platformSignalWeights);

    // ── Step 7: Top/worst posts ────────────────────────────────────────────────
    const sortedByEng = [...posts].sort(
      (a, b) => (b.engagement_rate ?? 0) - (a.engagement_rate ?? 0)
    );
    const topPosts = sortedByEng.slice(0, 5).map((p) => ({
      post_id: p.id,
      reason: `Top engagement rate of ${((p.engagement_rate ?? 0) * 100).toFixed(2)}%`,
      metric: `${p.engagement_rate?.toFixed(4)}`,
    }));
    const worstPosts = sortedByEng.slice(-3).map((p) => ({
      post_id: p.id,
      reason: `Low engagement rate of ${((p.engagement_rate ?? 0) * 100).toFixed(2)}%`,
      metric: `${p.engagement_rate?.toFixed(4)}`,
    }));

    // ── Step 8: AI-generated insights ─────────────────────────────────────────
    await updateJobProgress(jobId, 75, "Generating strategic insights...");

    const aiBudgetExceeded =
      Date.now() - engineStartedAtMs > ENGINE_RUNTIME_BUDGET_MS || shouldUseFastFallback(engineStartedAtMs);

    const aiInsightsPromise = aiBudgetExceeded
      ? Promise.resolve(
          buildFallbackInsightsAndRoadmap({
            platform: account.platform,
            niche: nicheResult.niche,
            growthScore,
            avgEngagementRate,
            hookStrengthScore,
            ctaScore,
            consistencyScore,
            hashtagScore,
            bestDays: best_days,
            avgPostsPerWeek: avg_posts_per_week,
          })
        )
      : retryClaudeCall(
          () =>
            generateInsightsAndRoadmap({
              platform: account.platform,
              niche: nicheResult.niche,
              avg_engagement_rate: avgEngagementRate,
              avg_hook_score: avgHookScore,
              cta_usage_rate: ctaUsageRate,
              posting_consistency: consistencyScore / 100,
              hashtag_score: hashtagScore,
              branding_score: brandingScore,
              content_themes: nicheThemes,
              top_performing_formats: topPerformingFormats.map(String),
              best_days,
              best_hours,
              avg_posts_per_week,
            }),
          "generateInsightsAndRoadmap"
        );

    const fixListPromise = aiBudgetExceeded
      ? Promise.resolve(
          buildFallbackFixList({
            hookStrengthScore,
            ctaScore,
            consistencyScore,
            hashtagScore,
            avgPostsPerWeek: avg_posts_per_week,
          })
        )
      : retryClaudeCall(
          () =>
            generateFixList({
              platform: account.platform,
              niche: nicheResult.niche,
              growth_score: growthScore,
              hook_strength_score: hookStrengthScore,
              cta_score: ctaScore,
              hashtag_score: hashtagScore,
              engagement_score: engagementScore,
              consistency_score: consistencyScore,
              branding_score: brandingScore,
              avg_engagement_rate: avgEngagementRate,
              avg_hook_score: avgHookScore,
              cta_usage_rate: ctaUsageRate,
              avg_posts_per_week,
              platform_signal_weights: platformSignalWeights,
            }),
          "generateFixList"
        );

    const [aiInsights, fixList] = await Promise.all([aiInsightsPromise, fixListPromise]);

    // Hashtag breakdown
    const recommendedHashtags = hashtagAnalysis
      .filter((h) => h.recommendation === "add")
      .map((h) => h.tag);
    const overusedHashtags = allHashtags
      .reduce((acc: Record<string, number>, tag) => {
        acc[tag] = (acc[tag] ?? 0) + 1;
        return acc;
      }, {});
    const overused = Object.entries(overusedHashtags)
      .filter(([, count]) => count > posts.length * 0.8)
      .map(([tag]) => tag);

    // ── Step 9: Save report ────────────────────────────────────────────────────
    await updateJobProgress(jobId, 90, "Saving analysis report...");

    const { data: report, error: reportError } = await supabase
      .from("analysis_reports")
      .insert({
        job_id: jobId,
        account_id: account.id,
        user_id: account.user_id,
        growth_score: growthScore,
        content_quality_score: contentQualityScore,
        hashtag_score: hashtagScore,
        engagement_score: engagementScore,
        consistency_score: consistencyScore,
        branding_score: brandingScore,
        hook_strength_score: hookStrengthScore,
        cta_score: ctaScore,
        detected_niche: nicheResult.niche,
        niche_confidence: nicheResult.confidence,
        niche_keywords: nicheResult.keywords,
        content_themes: nicheThemes,
        hashtag_effectiveness: hashtagAnalysis,
        recommended_hashtags: recommendedHashtags,
        overused_hashtags: overused,
        underused_hashtags: [],
        avg_posts_per_week,
        best_days,
        best_hours,
        posting_consistency: consistencyScore / 100,
        avg_engagement_rate: avgEngagementRate,
        avg_likes: avgLikes,
        avg_comments: avgComments,
        avg_shares: avgShares,
        avg_views: avgViews,
        top_performing_formats: topPerformingFormats,
        avg_hook_score: avgHookScore,
        cta_usage_rate: ctaUsageRate,
        caption_sentiment: captionSentiment,
        avg_caption_length: avgCaptionLength,
        strengths: aiInsights.strengths,
        weaknesses: aiInsights.weaknesses,
        opportunities: aiInsights.opportunities,
        improvement_roadmap: aiInsights.roadmap,
        executive_summary: aiInsights.executive_summary,
        top_posts: topPosts,
        worst_posts: worstPosts,
        fix_list: fixList,
        platform_signal_weights: platformSignalWeights,
        posts_transcribed: postsTranscribed,
      })
      .select()
      .single();

    if (reportError) throw reportError;

    // ── Step 9a: Save per-post analysis data (transcripts, hooks, etc.) ────
    if (postAnalyses.length > 0 && report) {
      const postAnalysisRows = postAnalyses.map((pa) => ({
        post_id: pa.post_id,
        report_id: report.id,
        hook_score: pa.hook_score,
        hook_text: pa.hook_text,
        hook_type: pa.hook_type,
        cta_detected: pa.cta_detected,
        sentiment_score: pa.sentiment_score,
        keywords: pa.keywords,
        transcript: pa.transcript || null,
      }));

      const { error: paError } = await supabase
        .from("post_analyses")
        .insert(postAnalysisRows);

      if (paError) {
        // Post-level analysis save is best-effort — don't fail the report
        console.error("Failed to save post analyses:", paError.message);
      }
    }

    // ── Step 9b: Auto-populate brand pillars if empty ──────────────────────────
    try {
      const { data: userData } = await supabase
        .from("users")
        .select("brand_pillars")
        .eq("id", account.user_id)
        .single();

      if (userData && (!userData.brand_pillars || userData.brand_pillars.length === 0)) {
        const dominantThemes = nicheThemes
          .filter((t: { is_dominant: boolean }) => t.is_dominant)
          .slice(0, 4)
          .map((t: { theme: string }) => t.theme);

        const autoPillars = [nicheResult.niche, ...dominantThemes].slice(0, 5);

        if (autoPillars.length > 0) {
          await supabase
            .from("users")
            .update({ brand_pillars: autoPillars })
            .eq("id", account.user_id);
        }
      }
    } catch {
      // Brand pillar auto-population is best-effort — never fail the analysis
    }

    // ── Step 10: Mark job complete ─────────────────────────────────────────────
    await supabase
      .from("analysis_jobs")
      .update({
        status: "completed",
        progress: 100,
        current_step: "Analysis complete",
        posts_analyzed: posts.length,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    // ── Send analysis-ready email (non-blocking, best-effort) ──────────────────
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error("Missing Supabase env for auth lookup");
      }

      const { data: userData } = await supabase
        .from("users")
        .select("auth_id")
        .eq("id", account.user_id)
        .single();

      if (userData) {
        const authClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const { data: authUser } = await authClient.auth.admin.getUserById(userData.auth_id);
        const email = authUser?.user?.email;

        if (email) {
          const topInsight =
            aiInsights.weaknesses?.[0]?.description ??
            aiInsights.opportunities?.[0]?.description ??
            "Review your full report for actionable next steps.";

          await sendAnalysisReady({
            to: email,
            username: account.username,
            platform: account.platform,
            growthScore,
            niche: nicheResult.niche,
            topInsight,
            reportId: report!.id,
          });
        }
      }
    } catch (emailError) {
      // Email failure must never fail the analysis job
      console.error(
        `Analysis ready email failed for job ${jobId}:`,
        emailError instanceof Error ? emailError.message : emailError
      );
    }

    return report!.id;
  } catch (error) {
    await supabase
      .from("analysis_jobs")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
      })
      .eq("id", jobId);

    throw error;
  }
}
