import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { findOutliers } from "@/lib/analysis/outlier-detector";
import { detectOutlierPatterns } from "@/lib/ai/claude";
import { getFeatureAccess } from "@/lib/plans/feature-gate";
import type { ApiResponse, OutlierPost, Platform, PlanType } from "@/types";

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<OutlierPost[]>>> {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });

  const { data: userData } = await supabase
    .from("users")
    .select("id, plan")
    .eq("auth_id", user.id)
    .single();
  if (!userData) return NextResponse.json({ data: null, error: "User not found" }, { status: 404 });

  const access = getFeatureAccess((userData.plan ?? "free") as PlanType);
  if (!access.discover) {
    return NextResponse.json({ data: null, error: "Discover requires a Starter plan or above. Upgrade at /dashboard/settings." }, { status: 403 });
  }

  // Check for saved outliers
  const { data: saved } = await supabase
    .from("outlier_posts")
    .select("*")
    .eq("user_id", userData.id)
    .order("multiplier", { ascending: false })
    .limit(20);

  return NextResponse.json({ data: saved ?? [], error: null });
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<OutlierPost[]>>> {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const accountId = body.account_id;
  if (!accountId) return NextResponse.json({ data: null, error: "account_id required" }, { status: 400 });

  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();
  if (!userData) return NextResponse.json({ data: null, error: "User not found" }, { status: 404 });

  // Get account
  const { data: account } = await supabase
    .from("connected_accounts")
    .select("id, platform, username")
    .eq("id", accountId)
    .eq("user_id", userData.id)
    .single();
  if (!account) return NextResponse.json({ data: null, error: "Account not found" }, { status: 404 });

  // Fetch posts
  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("account_id", accountId)
    .order("posted_at", { ascending: false })
    .limit(100);

  if (!posts?.length) return NextResponse.json({ data: null, error: "No posts found for this account" }, { status: 400 });

  // Detect outliers
  const outliers = findOutliers(posts as any, 3.0);
  if (outliers.length === 0) {
    return NextResponse.json({ data: [], error: null });
  }

  // Get latest report for niche
  const { data: latestReport } = await supabase
    .from("analysis_reports")
    .select("detected_niche")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const niche = latestReport?.detected_niche ?? "general";

  // AI analysis
  const patterns = await detectOutlierPatterns(
    outliers.map((o) => ({
      caption: o.post.caption,
      engagement_rate: o.post.engagement_rate ?? 0,
      multiplier: o.multiplier,
      content_type: o.post.content_type,
    })),
    outliers[0].avg_engagement,
    niche,
    account.platform as Platform
  );

  // Save outliers
  const outlierRecords = outliers.slice(0, 10).map((o, i) => ({
    user_id: userData.id,
    post_id: o.post.id,
    source: "own" as const,
    multiplier: o.multiplier,
    pattern_tags: patterns[i]?.pattern_tags ?? [],
    what_worked: patterns[i]?.what_worked ?? "",
    is_saved: false,
    platform: account.platform,
    caption: o.post.caption,
    engagement_rate: o.post.engagement_rate ?? 0,
    views: o.post.views,
    likes: o.post.likes,
    posted_at: o.post.posted_at,
  }));

  // Delete old outliers for this user, then insert new ones
  await supabase.from("outlier_posts").delete().eq("user_id", userData.id).eq("source", "own");

  const { data: inserted, error } = await supabase
    .from("outlier_posts")
    .insert(outlierRecords)
    .select();

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 });

  return NextResponse.json({ data: inserted ?? [], error: null });
}
