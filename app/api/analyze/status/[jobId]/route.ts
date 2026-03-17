// GET /api/analyze/status/[jobId] — Poll job status
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = getSupabaseServiceClient();

  const { data: dbUser } = await serviceClient
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { data: job, error } = await serviceClient
    .from("analysis_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", dbUser.id)
    .single();

  if (error || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.status === "pending" || job.status === "processing") {
    const startedAt = job.started_at ?? job.created_at;
    const ageMs = startedAt ? Date.now() - new Date(startedAt).getTime() : 0;
    const DEAD_JOB_MS = 2 * 60 * 1000;

    if (ageMs > DEAD_JOB_MS) {
      await serviceClient
        .from("analysis_jobs")
        .update({
          status: "failed",
          error_message:
            "Analysis job exceeded server runtime budget. Please retry. If this keeps happening, reconnect account and ensure Python service is configured.",
          completed_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      return NextResponse.json({
        job_id: job.id,
        status: "failed",
        progress: job.progress,
        current_step: job.current_step,
        posts_fetched: job.posts_fetched,
        posts_analyzed: job.posts_analyzed,
        error_message:
          "Analysis job exceeded server runtime budget. Please retry. If this keeps happening, reconnect account and ensure Python service is configured.",
        report_id: null,
        started_at: job.started_at,
        completed_at: new Date().toISOString(),
      });
    }
  }

  // If completed, include the report ID
  let report_id: string | null = null;
  if (job.status === "completed") {
    const { data: report } = await serviceClient
      .from("analysis_reports")
      .select("id")
      .eq("job_id", jobId)
      .single();
    report_id = report?.id ?? null;
  }

  return NextResponse.json({
    job_id: job.id,
    status: job.status,
    progress: job.progress,
    current_step: job.current_step,
    posts_fetched: job.posts_fetched,
    posts_analyzed: job.posts_analyzed,
    error_message: job.error_message,
    report_id,
    started_at: job.started_at,
    completed_at: job.completed_at,
  });
}
