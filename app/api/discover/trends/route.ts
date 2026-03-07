import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ApiResponse, TrendItem, Platform } from "@/types";

const querySchema = z.object({
  platform: z.enum(["tiktok", "instagram", "youtube", "facebook"]),
});

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<TrendItem[]>>> {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });

  const parsed = querySchema.safeParse({
    platform: req.nextUrl.searchParams.get("platform"),
  });
  if (!parsed.success) return NextResponse.json({ data: null, error: "platform query param required" }, { status: 400 });

  // Return cached trends (populated by background jobs or manual refresh)
  const { data: trends } = await supabase
    .from("trends")
    .select("*")
    .eq("platform", parsed.data.platform)
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order("velocity_score", { ascending: false })
    .limit(20);

  return NextResponse.json({ data: trends ?? [], error: null });
}
