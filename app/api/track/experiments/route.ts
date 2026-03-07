import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getFeatureAccess } from "@/lib/plans/feature-gate";
import type { ApiResponse, Experiment, PlanType } from "@/types";

const CreateSchema = z.object({
  account_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  hypothesis: z.string().min(1).max(500),
  platform: z.enum(["tiktok", "instagram", "youtube", "facebook"]),
  start_date: z.string(),
  end_date: z.string().optional(),
});

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<Experiment[]>>> {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });

  const { data: userData } = await supabase.from("users").select("id, plan").eq("auth_id", user.id).single();
  if (!userData) return NextResponse.json({ data: null, error: "User not found" }, { status: 404 });

  const access = getFeatureAccess((userData.plan ?? "free") as PlanType);
  if (!access.track) {
    return NextResponse.json({ data: null, error: "Track requires a Starter plan or above. Upgrade at /dashboard/settings." }, { status: 403 });
  }

  const { data } = await supabase
    .from("experiments")
    .select("*")
    .eq("user_id", userData.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ data: data ?? [], error: null });
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<Experiment>>> {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ data: null, error: "Invalid input" }, { status: 400 });

  const { data: userData } = await supabase.from("users").select("id").eq("auth_id", user.id).single();
  if (!userData) return NextResponse.json({ data: null, error: "User not found" }, { status: 404 });

  // Get baseline metrics from latest report
  const { data: latestReport } = await supabase
    .from("analysis_reports")
    .select("growth_score, engagement_score, hook_strength_score, cta_score, hashtag_score, consistency_score, avg_engagement_rate")
    .eq("account_id", parsed.data.account_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const baseline = latestReport ? {
    growth_score: latestReport.growth_score,
    engagement_score: latestReport.engagement_score,
    hook_strength_score: latestReport.hook_strength_score,
    cta_score: latestReport.cta_score,
    hashtag_score: latestReport.hashtag_score,
    consistency_score: latestReport.consistency_score,
    avg_engagement_rate: latestReport.avg_engagement_rate,
  } : {};

  const { data: experiment, error } = await supabase
    .from("experiments")
    .insert({
      user_id: userData.id,
      account_id: parsed.data.account_id,
      name: parsed.data.name,
      hypothesis: parsed.data.hypothesis,
      platform: parsed.data.platform,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date ?? null,
      status: "running",
      baseline_metrics: baseline,
      result_metrics: {},
      tagged_post_ids: [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 });

  // Create a score annotation
  await supabase.from("score_annotations").insert({
    user_id: userData.id,
    report_id: latestReport ? (await supabase.from("analysis_reports").select("id").eq("account_id", parsed.data.account_id).order("created_at", { ascending: false }).limit(1).single()).data?.id : null,
    experiment_id: experiment.id,
    annotation_type: "experiment_start",
    label: `Started: ${parsed.data.name}`,
    date: parsed.data.start_date,
  });

  return NextResponse.json({ data: experiment, error: null });
}
