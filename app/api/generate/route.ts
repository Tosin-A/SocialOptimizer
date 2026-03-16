// POST /api/generate — AI content generation
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import {
  generateContent,
  generateScoredHooks,
  generateStructuredCaption,
  generatePersonalizedIdeas,
  generateReplicateWinners,
} from "@/lib/ai/claude";
import { z } from "zod";
import { getFeatureAccess } from "@/lib/plans/feature-gate";
import type { PlanType } from "@/types";

const GenerateSchema = z.object({
  platform: z.enum(["tiktok", "instagram", "youtube", "facebook"]),
  content_type: z.enum(["hook", "caption", "script", "hashtags", "idea", "full_plan", "replicate"]),
  niche: z.string().min(2).max(100),
  topic: z.string().max(200).optional().default(""),
  tone: z.enum(["educational", "entertaining", "inspirational", "controversial", "storytelling"]).optional(),
  target_audience: z.string().max(200).optional(),
  account_id: z.string().uuid().optional(),
  count: z.number().int().min(1).max(10).optional().default(5),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = GenerateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const serviceClient = getSupabaseServiceClient();
    const { data: dbUser } = await serviceClient
      .from("users")
      .select("id, plan, brand_pillars")
      .eq("auth_id", user.id)
      .single();

    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Determine plan access for auto-upgrade
    const access = getFeatureAccess(dbUser.plan as PlanType);

    // Build brand pillar context for Claude prompts
    const brandPillars: string[] = dbUser.brand_pillars ?? [];

    // Get user context from latest report if account_id provided
    let userContext: { niche: string; top_themes: string[]; avg_engagement: number; brand_pillars?: string[] } | undefined;

    if (parsed.data.account_id) {
      const { data: latestReport } = await serviceClient
        .from("analysis_reports")
        .select("detected_niche, content_themes, avg_engagement_rate")
        .eq("account_id", parsed.data.account_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (latestReport) {
        const themes = (latestReport.content_themes as any[]) ?? [];
        userContext = {
          niche: latestReport.detected_niche ?? parsed.data.niche,
          top_themes: themes.slice(0, 5).map((t: any) => t.theme),
          avg_engagement: latestReport.avg_engagement_rate ?? 0,
          brand_pillars: brandPillars.length > 0 ? brandPillars : undefined,
        };
      }
    }

    // If no report-based context but pillars exist, create minimal context
    if (!userContext && brandPillars.length > 0) {
      userContext = {
        niche: parsed.data.niche,
        top_themes: brandPillars,
        avg_engagement: 0,
        brand_pillars: brandPillars,
      };
    }

    // Generate content — dispatch by type, auto-upgrade to enhanced when plan allows
    let output: unknown;
    let actualContentType = parsed.data.content_type;

    if (parsed.data.content_type === "hook" && access.hook_writer) {
      // Auto-upgrade to scored hooks for Starter+
      output = await generateScoredHooks(parsed.data.topic || parsed.data.niche, parsed.data.niche, parsed.data.platform);
      actualContentType = "hook"; // stays "hook" but output is ScoredHook[]
    } else if (parsed.data.content_type === "caption" && access.caption_builder) {
      // Auto-upgrade to structured caption for Starter+
      output = await generateStructuredCaption(parsed.data.topic || parsed.data.niche, parsed.data.niche, parsed.data.platform);
      actualContentType = "caption"; // stays "caption" but output is StructuredCaption
    } else if (parsed.data.content_type === "replicate") {
      // Fetch competitor profiles for context (if user has added any)
      let competitorContext: Array<{ username: string; followers: number | null; avg_engagement_rate: number | null; top_hashtags: string[]; content_formats: string[] }> | undefined;

      const { data: competitors } = await serviceClient
        .from("competitors")
        .select("username, followers, avg_engagement_rate, top_hashtags, content_formats")
        .eq("user_id", dbUser.id)
        .eq("platform", parsed.data.platform)
        .limit(5);

      if (competitors && competitors.length > 0) {
        competitorContext = competitors.map((c) => ({
          username: c.username,
          followers: c.followers,
          avg_engagement_rate: c.avg_engagement_rate,
          top_hashtags: c.top_hashtags ?? [],
          content_formats: c.content_formats ?? [],
        }));
      }

      output = await generateReplicateWinners(
        userContext?.niche ?? parsed.data.niche,
        parsed.data.platform,
        parsed.data.count ?? 3,
        competitorContext
      );
      actualContentType = "replicate";
    } else if (parsed.data.content_type === "idea" && parsed.data.account_id) {
      // Auto-upgrade to personalized ideas when account context is available
      let outlierPatterns: string[] = [];
      let trendNames: string[] = [];
      let topThemes: string[] = userContext?.top_themes ?? [];

      const { data: outliers } = await serviceClient
        .from("outlier_posts")
        .select("pattern_tags")
        .eq("user_id", dbUser.id)
        .limit(10);
      outlierPatterns = (outliers ?? []).flatMap((o: { pattern_tags: string[] | null }) => o.pattern_tags ?? []);

      const { data: trends } = await serviceClient
        .from("trends")
        .select("name")
        .eq("platform", parsed.data.platform)
        .order("velocity_score", { ascending: false })
        .limit(5);
      trendNames = (trends ?? []).map((t: { name: string }) => t.name);

      output = await generatePersonalizedIdeas({
        outlierPatterns: [...new Set(outlierPatterns)].slice(0, 10),
        trendNames,
        niche: parsed.data.niche,
        platform: parsed.data.platform,
        topThemes,
      });
    } else {
      output = await generateContent(parsed.data as Parameters<typeof generateContent>[0], userContext);
    }

    // Save generated content to DB
    const { data: saved } = await serviceClient
      .from("generated_content")
      .insert({
        user_id: dbUser.id,
        account_id: parsed.data.account_id ?? null,
        platform: parsed.data.platform,
        content_type: actualContentType,
        prompt_context: {
          niche: parsed.data.niche,
          topic: parsed.data.topic,
          tone: parsed.data.tone,
          target_audience: parsed.data.target_audience,
          brand_pillars: brandPillars.length > 0 ? brandPillars : undefined,
        },
        output,
      })
      .select("id")
      .single();

    // Log usage
    await serviceClient.from("usage_events").insert({
      user_id: dbUser.id,
      event_type: "content_generated",
      metadata: {
        platform: parsed.data.platform,
        content_type: parsed.data.content_type,
        generated_id: saved?.id,
      },
    });

    return NextResponse.json({ data: output, id: saved?.id });
  } catch (err) {
    console.error("/api/generate error:", err);
    return NextResponse.json({ error: "Content generation failed" }, { status: 500 });
  }
}

// GET /api/generate — List saved generated content
export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform");
  const page = parseInt(searchParams.get("page") ?? "1");
  const perPage = 20;

  const serviceClient = getSupabaseServiceClient();
  const { data: dbUser } = await serviceClient
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let query = serviceClient
    .from("generated_content")
    .select("*", { count: "exact" })
    .eq("user_id", dbUser.id)
    .order("created_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (platform) query = query.eq("platform", platform);

  const { data, count } = await query;

  return NextResponse.json({
    data: data ?? [],
    total: count ?? 0,
    page,
    per_page: perPage,
    has_more: (count ?? 0) > page * perPage,
  });
}
