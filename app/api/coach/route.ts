import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { coachChat } from "@/lib/ai/claude";
import { generateIdeas } from "@/lib/ai/openai";
import { z } from "zod";
import type { AnalysisReport, PlanType } from "@/types";
import { canAccess } from "@/lib/plans/feature-gate";

const CoachSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1).max(2000),
    })
  ).min(1).max(50),
  account_id: z.string().uuid().optional(),
  provider: z.enum(["claude", "openai"]).default("claude"),
});

function buildAnalysisContext(report: AnalysisReport): string {
  const sections: string[] = [];

  sections.push(`## Overview
- **Growth Score:** ${report.growth_score}/100
- **Detected Niche:** ${report.detected_niche} (confidence: ${(report.niche_confidence * 100).toFixed(0)}%)
- **Executive Summary:** ${report.executive_summary}`);

  sections.push(`## Scores
- Content Quality: ${report.content_quality_score}/100
- Hook Strength: ${report.hook_strength_score}/100
- CTA Score: ${report.cta_score}/100
- Hashtag Effectiveness: ${report.hashtag_score}/100
- Engagement Score: ${report.engagement_score}/100
- Consistency Score: ${report.consistency_score}/100
- Branding Score: ${report.branding_score}/100`);

  sections.push(`## Engagement Metrics
- Avg Engagement Rate: ${(report.avg_engagement_rate * 100).toFixed(2)}%
- Avg Likes: ${report.avg_likes}
- Avg Comments: ${report.avg_comments}
- Avg Shares: ${report.avg_shares}
- Avg Views: ${report.avg_views}
- Avg Hook Score: ${(report.avg_hook_score * 100).toFixed(0)}/100
- CTA Usage Rate: ${(report.cta_usage_rate * 100).toFixed(0)}%
- Caption Sentiment: ${report.caption_sentiment}
- Avg Caption Length: ${report.avg_caption_length} chars`);

  sections.push(`## Posting Patterns
- Posts Per Week: ${report.avg_posts_per_week}
- Best Days: ${report.best_days.join(", ")}
- Best Hours (UTC): ${report.best_hours.join(", ")}
- Posting Consistency: ${report.posting_consistency}/100
- Top Performing Formats: ${report.top_performing_formats.join(", ")}`);

  if (report.content_themes.length > 0) {
    const themeLines = report.content_themes.map(
      (t) => `- ${t.theme}: ${t.frequency} posts, ${(t.avg_engagement_rate * 100).toFixed(2)}% avg engagement${t.is_dominant ? " (dominant)" : ""}`
    );
    sections.push(`## Content Themes\n${themeLines.join("\n")}`);
  }

  if (report.strengths.length > 0) {
    const lines = report.strengths.map((s) => `- **${s.title}** (${s.impact}): ${s.description}${s.metric ? ` [${s.metric}]` : ""}`);
    sections.push(`## Strengths\n${lines.join("\n")}`);
  }

  if (report.weaknesses.length > 0) {
    const lines = report.weaknesses.map((w) => `- **${w.title}** (${w.impact}): ${w.description}${w.recommendation ? ` → ${w.recommendation}` : ""}`);
    sections.push(`## Weaknesses\n${lines.join("\n")}`);
  }

  if (report.fix_list.length > 0) {
    const lines = report.fix_list.map((f) => `${f.rank}. **${f.problem}** — ${f.action} [${f.metric_reference}]`);
    sections.push(`## Priority Fix List\n${lines.join("\n")}`);
  }

  if (report.improvement_roadmap.length > 0) {
    const lines = report.improvement_roadmap.map(
      (r) => `${r.priority}. **${r.action}** (${r.category}, ${r.timeframe}) — Expected: ${r.expected_impact}`
    );
    sections.push(`## Improvement Roadmap\n${lines.join("\n")}`);
  }

  if (report.hashtag_effectiveness.length > 0) {
    const topHashtags = report.hashtag_effectiveness.slice(0, 10);
    const lines = topHashtags.map(
      (h) => `- ${h.tag}: reach ${h.reach_score}/100, competition ${h.competition}, relevance ${(h.relevance * 100).toFixed(0)}% → ${h.recommendation}`
    );
    sections.push(`## Top Hashtag Analysis\n${lines.join("\n")}`);
  }

  return sections.join("\n\n");
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CoachSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.flatten() }, { status: 400 });
    }

    const serviceClient = getSupabaseServiceClient();
    const { data: dbUser } = await serviceClient
      .from("users")
      .select("id, plan, brand_pillars")
      .eq("auth_id", user.id)
      .single();

    if (!dbUser) {
      return NextResponse.json({ data: null, error: "User not found" }, { status: 404 });
    }

    if (!canAccess(dbUser.plan as PlanType, "coach")) {
      return NextResponse.json(
        { data: null, error: "Content Coach requires Starter plan or above" },
        { status: 403 }
      );
    }

    const { messages, account_id, provider } = parsed.data;

    // OpenAI ideas mode — uses report data when available but doesn't require it
    if (provider === "openai") {
      let platform: string | undefined;

      // Fetch the full report if available (same query as Claude mode)
      let openaiReportQuery = serviceClient
        .from("analysis_reports")
        .select("*")
        .eq("user_id", dbUser.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (account_id) {
        openaiReportQuery = openaiReportQuery.eq("account_id", account_id);
      }

      const { data: openaiReports } = await openaiReportQuery;
      const openaiReport = openaiReports?.[0] as AnalysisReport | undefined;

      const niche = openaiReport?.detected_niche;
      const analysisContext = openaiReport ? buildAnalysisContext(openaiReport) : undefined;

      // Try to get platform from the selected account
      if (account_id) {
        const { data: account } = await serviceClient
          .from("connected_accounts")
          .select("platform")
          .eq("id", account_id)
          .single();
        platform = account?.platform;
      }

      const brandPillars = (dbUser.brand_pillars as string[] | null) ?? [];

      const reply = await generateIdeas(
        messages.map((m) => ({ role: m.role, content: m.content })),
        niche,
        platform,
        brandPillars,
        analysisContext
      );

      return NextResponse.json({ data: { reply, provider: "openai" }, error: null });
    }

    // Claude coach mode — requires analysis report
    let reportQuery = serviceClient
      .from("analysis_reports")
      .select("*")
      .eq("user_id", dbUser.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (account_id) {
      reportQuery = reportQuery.eq("account_id", account_id);
    }

    const { data: reports } = await reportQuery;
    const report = reports?.[0] as AnalysisReport | undefined;

    if (!report) {
      return NextResponse.json(
        { data: null, error: "No analysis report found. Run an analysis first so the coach has data to work with." },
        { status: 404 }
      );
    }

    const analysisContext = buildAnalysisContext(report);
    const reply = await coachChat(messages.map((m) => ({ role: m.role, content: m.content })), analysisContext);

    return NextResponse.json({ data: { reply, provider: "claude" }, error: null });
  } catch (err) {
    console.error("/api/coach error:", err);
    return NextResponse.json(
      { data: null, error: "Coach response failed" },
      { status: 500 }
    );
  }
}
