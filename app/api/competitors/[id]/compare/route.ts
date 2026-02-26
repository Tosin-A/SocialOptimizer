// POST /api/competitors/[id]/compare
// Runs a gap analysis between the authenticated user's latest report
// and the specified competitor's profile data.

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: competitorId } = await params;
  const serviceClient = getSupabaseServiceClient();

  // Resolve internal user id
  const { data: dbUser } = await serviceClient
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!dbUser) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Load competitor — must belong to this user
  const { data: competitor } = await serviceClient
    .from("competitors")
    .select("*")
    .eq("id", competitorId)
    .eq("user_id", dbUser.id)
    .single();

  if (!competitor) return NextResponse.json({ error: "Competitor not found" }, { status: 404 });

  // Load user's latest analysis report for the same platform
  const { data: latestReport } = await serviceClient
    .from("analysis_reports")
    .select(`
      id, avg_engagement_rate, avg_posts_per_week, recommended_hashtags,
      overused_hashtags, top_performing_formats, avg_caption_length,
      connected_accounts:account_id(followers)
    `)
    .eq("user_id", dbUser.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // ── Compute gaps locally ─────────────────────────────────────────────────────
  const userEngagement = latestReport?.avg_engagement_rate ?? 0;
  const userPostsPerWeek = latestReport?.avg_posts_per_week ?? 0;
  const userFollowers = (latestReport?.connected_accounts as any)?.followers ?? 0;
  const userHashtags: string[] = (latestReport?.recommended_hashtags as string[]) ?? [];
  const userFormats: string[] = (latestReport?.top_performing_formats as string[]) ?? [];
  const userCaptionLen: number = latestReport?.avg_caption_length ?? 0;

  const competitorEngagement = competitor.avg_engagement_rate ?? 0;
  const competitorPostsPerWeek = competitor.posts_per_week ?? 0;
  const competitorFollowers = competitor.followers ?? 0;
  const competitorHashtags: string[] = competitor.top_hashtags ?? [];
  const competitorFormats: string[] = competitor.content_formats ?? [];

  // Positive gap means competitor is ahead
  const engagementGap = parseFloat(
    ((competitorEngagement - userEngagement) * 100).toFixed(4)
  );
  const followerGap = competitorFollowers - userFollowers;
  const postingFrequencyGap = parseFloat(
    (competitorPostsPerWeek - userPostsPerWeek).toFixed(2)
  );

  // Hashtag differences
  const allTags = new Set([...userHashtags, ...competitorHashtags]);
  const hashtagDifferences = Array.from(allTags).map((tag) => ({
    hashtag: tag,
    competitor_uses: competitorHashtags.includes(tag),
    user_uses: userHashtags.includes(tag),
  }));

  // Format differences (normalised frequency, sum = 1 per side)
  const allFormats = new Set([...userFormats, ...competitorFormats]);
  const formatDifferences = Array.from(allFormats).map((fmt) => {
    const compIdx = competitorFormats.indexOf(fmt);
    const userIdx = userFormats.indexOf(fmt);
    return {
      format: fmt,
      competitor_freq: compIdx === -1 ? 0 : 1 - compIdx / Math.max(1, competitorFormats.length - 1),
      user_freq:       userIdx === -1    ? 0 : 1 - userIdx    / Math.max(1, userFormats.length - 1),
    };
  });

  // Try enriching tactical actions via Python service
  let tacticalActions: Array<{ action: string; priority: "high" | "medium" | "low"; rationale: string }> = [];

  try {
    const pyRes = await fetch(
      `${process.env.PYTHON_SERVICE_URL}/analyze/competitor`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Service-Secret": process.env.PYTHON_SERVICE_SECRET!,
        },
        body: JSON.stringify({
          user: {
            avg_engagement_rate: userEngagement,
            posts_per_week: userPostsPerWeek,
            followers: userFollowers,
            top_hashtags: userHashtags,
            top_formats: userFormats,
            avg_caption_length: userCaptionLen,
          },
          competitor: {
            username: competitor.username,
            platform: competitor.platform,
            avg_engagement_rate: competitorEngagement,
            posts_per_week: competitorPostsPerWeek,
            followers: competitorFollowers,
            top_hashtags: competitorHashtags,
            content_formats: competitorFormats,
            niche: competitor.niche,
          },
        }),
      }
    );
    if (pyRes.ok) {
      const pyData = await pyRes.json();
      if (pyData.tactical_actions?.length) {
        tacticalActions = pyData.tactical_actions;
      }
    }
  } catch {
    // Python service unavailable — fall back to rule-based tactics below
  }

  // Rule-based fallback if Python didn't provide actions
  if (tacticalActions.length === 0) {
    if (engagementGap > 0.01) {
      tacticalActions.push({
        action: `Study @${competitor.username}'s top posts — their engagement rate of ${(competitorEngagement * 100).toFixed(2)}% is ${(engagementGap * 100).toFixed(2)}pp above yours. Identify hook and CTA patterns.`,
        priority: "high",
        rationale: "Engagement rate gap is the single highest-leverage metric to close.",
      });
    }
    if (postingFrequencyGap > 1) {
      tacticalActions.push({
        action: `Increase posting cadence. @${competitor.username} posts ${competitorPostsPerWeek.toFixed(1)}x/week vs your ${userPostsPerWeek.toFixed(1)}x/week — ${postingFrequencyGap.toFixed(1)} extra posts/week of additional surface area.`,
        priority: "medium",
        rationale: "Consistent volume compounds algorithmic reach over time.",
      });
    }
    const theirUniqueHashtags = hashtagDifferences
      .filter((h) => h.competitor_uses && !h.user_uses)
      .slice(0, 5)
      .map((h) => `#${h.hashtag}`)
      .join(", ");
    if (theirUniqueHashtags) {
      tacticalActions.push({
        action: `Test competitor hashtags you're not using: ${theirUniqueHashtags}`,
        priority: "medium",
        rationale: "These tags already drive reach for a comparable account in your niche.",
      });
    }
    if (tacticalActions.length === 0) {
      tacticalActions.push({
        action: "Monitor @" + competitor.username + "'s next 10 posts and record which content formats and topics generate their highest engagement.",
        priority: "low",
        rationale: "Baseline observation before making optimisation decisions.",
      });
    }
  }

  // Persist to competitor_comparisons table
  const comparisonPayload = {
    user_id: dbUser.id,
    report_id: latestReport?.id ?? null,
    competitor_id: competitorId,
    engagement_gap: engagementGap,
    follower_gap: followerGap,
    posting_frequency_gap: postingFrequencyGap,
    hashtag_differences: hashtagDifferences,
    format_differences: formatDifferences,
    hook_style_differences: "",
    caption_length_diff: userCaptionLen ? (latestReport?.avg_caption_length ?? 0) - userCaptionLen : 0,
    tactical_actions: tacticalActions,
  };

  const { data: saved, error } = await serviceClient
    .from("competitor_comparisons")
    .upsert(comparisonPayload, { onConflict: "user_id,competitor_id" })
    .select()
    .single();

  if (error) {
    console.error("competitor_comparisons upsert error:", error);
    // Return the data even if we couldn't persist
    return NextResponse.json({ data: { ...comparisonPayload, competitor } });
  }

  return NextResponse.json({ data: { ...saved, competitor } });
}

// GET /api/competitors/[id]/compare — fetch existing comparison
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: competitorId } = await params;
  const serviceClient = getSupabaseServiceClient();

  const { data: dbUser } = await serviceClient
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!dbUser) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data } = await serviceClient
    .from("competitor_comparisons")
    .select("*")
    .eq("user_id", dbUser.id)
    .eq("competitor_id", competitorId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ data: data ?? null });
}
