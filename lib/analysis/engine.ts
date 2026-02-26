// ════════════════════════════════════════════════════════════════════════════
// Core Analysis Engine — orchestrates all analysis steps
// ════════════════════════════════════════════════════════════════════════════

import { getSupabaseServiceClient } from "@/lib/supabase/server";
import {
  analyzeNicheAndThemes,
  analyzeHashtags,
  generateInsightsAndRoadmap,
  analyzeHookStrength,
} from "@/lib/ai/claude";
import { sendAnalysisReady } from "@/lib/email";
import type { Post, Platform, ConnectedAccount } from "@/types";

interface EngineOptions {
  jobId: string;
  account: ConnectedAccount;
  posts: Post[];
  pythonServiceUrl: string;
}

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

// ─── Main engine ──────────────────────────────────────────────────────────────

export async function runAnalysisEngine(options: EngineOptions): Promise<string> {
  const { jobId, account, posts, pythonServiceUrl } = options;
  const supabase = getSupabaseServiceClient();

  try {
    // ── Step 1: Mark job as processing ──────────────────────────────────────
    await supabase
      .from("analysis_jobs")
      .update({ status: "processing", started_at: new Date().toISOString(), progress: 5 })
      .eq("id", jobId);

    // ── Step 2: Niche & theme detection ──────────────────────────────────────
    await updateJobProgress(jobId, 15, "Detecting niche and content themes...");

    const nicheResult = await analyzeNicheAndThemes(
      posts.map((p) => ({
        caption: p.caption,
        hashtags: p.hashtags,
        engagement_rate: p.engagement_rate,
        content_type: p.content_type,
      }))
    );

    // ── Step 3: Hashtag analysis ──────────────────────────────────────────────
    await updateJobProgress(jobId, 30, "Analyzing hashtag effectiveness...");

    const allHashtags = posts.flatMap((p) => p.hashtags);
    const hashtagAnalysis = await analyzeHashtags(
      allHashtags,
      nicheResult.niche,
      account.platform
    );

    // ── Step 4: Hook + CTA analysis (via Python service) ─────────────────────
    await updateJobProgress(jobId, 45, "Analyzing content hooks and CTAs...");

    let hookScores: number[] = [];
    let ctaDetected = 0;
    let sentimentScores: number[] = [];

    try {
      // Call Python service for transcript-based analysis
      const pyResponse = await fetch(`${pythonServiceUrl}/analyze/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Service-Secret": process.env.PYTHON_SERVICE_SECRET!,
        },
        body: JSON.stringify({
          posts: posts.slice(0, 30).map((p) => ({
            id: p.id,
            caption: p.caption,
            media_url: p.media_url,
            platform: account.platform,
          })),
        }),
      });

      if (pyResponse.ok) {
        const pyData = await pyResponse.json();
        hookScores = pyData.hook_scores ?? [];
        ctaDetected = pyData.cta_count ?? 0;
        sentimentScores = pyData.sentiment_scores ?? [];
      }
    } catch {
      // Python service unavailable — use fallback Claude-based hook analysis
      for (const post of posts.slice(0, 10)) {
        const hookResult = await analyzeHookStrength(
          "",
          post.caption ?? ""
        );
        hookScores.push(hookResult.score);
      }
    }

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

    const growthScore = Math.round(
      engagementScore * 0.3 +
      contentQualityScore * 0.25 +
      hashtagScore * 0.15 +
      consistencyScore * 0.15 +
      brandingScore * 0.15
    );

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

    const aiInsights = await generateInsightsAndRoadmap({
      platform: account.platform,
      niche: nicheResult.niche,
      avg_engagement_rate: avgEngagementRate,
      avg_hook_score: avgHookScore,
      cta_usage_rate: ctaUsageRate,
      posting_consistency: consistencyScore / 100,
      hashtag_score: hashtagScore,
      branding_score: brandingScore,
      content_themes: nicheResult.themes,
      top_performing_formats: topPerformingFormats.map(String),
      best_days,
      best_hours,
      avg_posts_per_week,
    });

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
        content_themes: nicheResult.themes,
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
      })
      .select()
      .single();

    if (reportError) throw reportError;

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
      const { data: userData } = await supabase
        .from("users")
        .select("auth_id")
        .eq("id", account.user_id)
        .single();

      if (userData) {
        const { createClient } = require("@supabase/supabase-js");
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
    } catch {
      // Email failure must never fail the analysis job
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
