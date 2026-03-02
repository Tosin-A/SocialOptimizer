// GET /api/reports/[id]/posts — fetch posts for the account in a given report
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reportId } = await params;

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = getSupabaseServiceClient();

  const { data: dbUser } = await serviceClient
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!dbUser) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Verify user owns this report and get the account_id
  const { data: report } = await serviceClient
    .from("analysis_reports")
    .select("account_id, top_posts, worst_posts")
    .eq("id", reportId)
    .eq("user_id", dbUser.id)
    .single();

  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  const { data: posts } = await serviceClient
    .from("posts")
    .select(
      "id, platform_post_id, content_type, caption, hashtags, likes, comments, shares, saves, views, reach, engagement_rate, posted_at, thumbnail_url, media_url, duration_seconds"
    )
    .eq("account_id", report.account_id)
    .order("engagement_rate", { ascending: false })
    .limit(50);

  // Build a set of top/worst post IDs from the report for quick badge lookup
  const topIds = new Set<string>((report.top_posts ?? []).map((p: any) => p.post_id));
  const worstIds = new Set<string>((report.worst_posts ?? []).map((p: any) => p.post_id));

  const enriched = (posts ?? []).map((p) => ({
    ...p,
    performance: topIds.has(p.id) ? "top" : worstIds.has(p.id) ? "worst" : "average",
  }));

  return NextResponse.json({ data: enriched });
}
