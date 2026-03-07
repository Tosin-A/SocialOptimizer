import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { extractFormatPatterns } from "@/lib/ai/claude";
import type { ApiResponse, FormatPattern, Platform } from "@/types";

const querySchema = z.object({
  account_id: z.string().uuid(),
});

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<FormatPattern[]>>> {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });

  const parsed = querySchema.safeParse({
    account_id: req.nextUrl.searchParams.get("account_id"),
  });
  if (!parsed.success) return NextResponse.json({ data: null, error: "account_id required" }, { status: 400 });

  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();
  if (!userData) return NextResponse.json({ data: null, error: "User not found" }, { status: 404 });

  const { data: account } = await supabase
    .from("connected_accounts")
    .select("id, platform")
    .eq("id", parsed.data.account_id)
    .eq("user_id", userData.id)
    .single();
  if (!account) return NextResponse.json({ data: null, error: "Account not found" }, { status: 404 });

  const { data: posts } = await supabase
    .from("posts")
    .select("content_type, engagement_rate, caption")
    .eq("account_id", parsed.data.account_id)
    .order("posted_at", { ascending: false })
    .limit(100);

  if (!posts?.length) return NextResponse.json({ data: [], error: null });

  const { data: latestReport } = await supabase
    .from("analysis_reports")
    .select("detected_niche")
    .eq("account_id", parsed.data.account_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const niche = latestReport?.detected_niche ?? "general";

  const patterns = await extractFormatPatterns(
    posts.map((p: any) => ({
      content_type: p.content_type,
      engagement_rate: p.engagement_rate,
      caption: p.caption,
    })),
    niche,
    account.platform as Platform
  );

  return NextResponse.json({
    data: patterns.map((p) => ({
      format: p.format as any,
      count: p.count,
      avg_engagement_rate: p.avg_engagement_rate,
      pct_of_total: p.pct_of_total,
      recommendation: p.recommendation,
    })),
    error: null,
  });
}
