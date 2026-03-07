// POST /api/generate — AI content generation
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import {
  generateContent,
  generateScoredHooks,
  generateStructuredCaption,
  generatePersonalizedIdeas,
} from "@/lib/ai/claude";
import { z } from "zod";
import { getFeatureAccess } from "@/lib/plans/feature-gate";
import type { PlanType } from "@/types";

const GenerateSchema = z.object({
  platform: z.enum(["tiktok", "instagram", "youtube", "facebook"]),
  content_type: z.enum(["hook", "caption", "script", "hashtags", "idea", "full_plan", "scored_hook", "structured_caption", "personalized_idea"]),
  niche: z.string().min(2).max(100),
  topic: z.string().min(3).max(200),
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
      .select("id, plan")
      .eq("auth_id", user.id)
      .single();

    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Feature gating for enhanced generators
    const access = getFeatureAccess(dbUser.plan as PlanType);
    if (parsed.data.content_type === "scored_hook" && !access.hook_writer) {
      return NextResponse.json({ error: "Hook writer requires a Starter plan or above. Upgrade at /dashboard/settings." }, { status: 403 });
    }
    if (parsed.data.content_type === "structured_caption" && !access.caption_builder) {
      return NextResponse.json({ error: "Caption builder requires a Starter plan or above. Upgrade at /dashboard/settings." }, { status: 403 });
    }

    // Get user context from latest report if account_id provided
    let userContext: { niche: string; top_themes: string[]; avg_engagement: number } | undefined;

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
        };
      }
    }

    // Generate content — dispatch by type
    let output: any;

    if (parsed.data.content_type === "scored_hook") {
      output = await generateScoredHooks(parsed.data.topic, parsed.data.niche, parsed.data.platform);
    } else if (parsed.data.content_type === "structured_caption") {
      output = await generateStructuredCaption(parsed.data.topic, parsed.data.niche, parsed.data.platform);
    } else if (parsed.data.content_type === "personalized_idea") {
      // Get outlier patterns and trends for context
      let outlierPatterns: string[] = [];
      let trendNames: string[] = [];
      let topThemes: string[] = userContext?.top_themes ?? [];

      if (parsed.data.account_id) {
        const { data: outliers } = await serviceClient
          .from("outlier_posts")
          .select("pattern_tags")
          .eq("user_id", dbUser.id)
          .limit(10);
        outlierPatterns = (outliers ?? []).flatMap((o: any) => o.pattern_tags ?? []);

        const { data: trends } = await serviceClient
          .from("trends")
          .select("name")
          .eq("platform", parsed.data.platform)
          .order("velocity_score", { ascending: false })
          .limit(5);
        trendNames = (trends ?? []).map((t: any) => t.name);
      }

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
        content_type: parsed.data.content_type,
        prompt_context: {
          niche: parsed.data.niche,
          topic: parsed.data.topic,
          tone: parsed.data.tone,
          target_audience: parsed.data.target_audience,
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
