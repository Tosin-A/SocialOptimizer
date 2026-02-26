// POST /api/generate — AI content generation
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { generateContent } from "@/lib/ai/claude";
import { z } from "zod";

const GenerateSchema = z.object({
  platform: z.enum(["tiktok", "instagram", "youtube", "facebook"]),
  content_type: z.enum(["hook", "caption", "script", "hashtags", "idea", "full_plan"]),
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

    // Generate content
    const output = await generateContent(parsed.data, userContext);

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
