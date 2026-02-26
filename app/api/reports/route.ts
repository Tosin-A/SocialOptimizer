// GET /api/reports — List analysis reports
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("account_id");
  const reportId = searchParams.get("id");

  const serviceClient = getSupabaseServiceClient();
  const { data: dbUser } = await serviceClient
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!dbUser) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (reportId) {
    const { data, error } = await serviceClient
      .from("analysis_reports")
      .select("*")
      .eq("id", reportId)
      .eq("user_id", dbUser.id)
      .single();

    if (error || !data) return NextResponse.json({ error: "Report not found" }, { status: 404 });
    return NextResponse.json({ data });
  }

  let query = serviceClient
    .from("analysis_reports")
    .select(`
      id, growth_score, content_quality_score, hashtag_score, engagement_score,
      consistency_score, branding_score, hook_strength_score, cta_score,
      detected_niche, avg_engagement_rate, avg_posts_per_week,
      executive_summary, created_at,
      connected_accounts:account_id(id, platform, username, avatar_url, followers)
    `)
    .eq("user_id", dbUser.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (accountId) query = query.eq("account_id", accountId);

  const { data, error } = await query;
  if (error) throw error;

  return NextResponse.json({ data: data ?? [] });
}
