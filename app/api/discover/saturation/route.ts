import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { analyzeNicheSaturation } from "@/lib/ai/claude";
import type { ApiResponse, NicheSaturation, Platform } from "@/types";

const querySchema = z.object({
  niche: z.string().min(1),
  platform: z.enum(["tiktok", "instagram", "youtube", "facebook"]),
});

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<NicheSaturation>>> {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const parsed = querySchema.safeParse({
    niche: searchParams.get("niche"),
    platform: searchParams.get("platform"),
  });
  if (!parsed.success) {
    return NextResponse.json({ data: null, error: "niche and platform query params required" }, { status: 400 });
  }

  const { niche, platform } = parsed.data;

  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();
  if (!userData) return NextResponse.json({ data: null, error: "User not found" }, { status: 404 });

  // Check cache (24h)
  const { data: cached } = await supabase
    .from("niche_saturation")
    .select("*")
    .eq("platform", platform)
    .eq("niche", niche)
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (cached) return NextResponse.json({ data: cached, error: null });

  // Compute fresh
  const result = await analyzeNicheSaturation(niche, platform as Platform);

  const { data: inserted, error } = await supabase
    .from("niche_saturation")
    .insert({
      platform,
      niche,
      active_creators: result.active_creators,
      avg_engagement_rate: result.avg_engagement_rate,
      trend_direction: result.trend_direction,
      verdict: result.verdict,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 });

  return NextResponse.json({ data: inserted, error: null });
}
