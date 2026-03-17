// POST /api/analyze          — Kick off a new analysis job (returns 202 + job_id)
// GET  /api/analyze?job_id=  — Poll job status
import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { fetchPostsForPlatform } from "@/lib/platforms";
import { refreshTokenIfNeeded } from "@/lib/platforms/token-refresh";
import { runAnalysisEngine } from "@/lib/analysis/engine";
import { z } from "zod";

// Allow up to 60s on Vercel serverless (default is 10s on Hobby, 60s on Pro)
export const maxDuration = 60;

const AnalyzeSchema = z.object({
  account_id: z.string().uuid(),
  max_posts: z.number().int().min(10).max(100).optional().default(50),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = AnalyzeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { account_id, max_posts } = parsed.data;
    const serviceClient = getSupabaseServiceClient();

    // Verify the user owns this account
    const { data: dbUser } = await serviceClient
      .from("users")
      .select("id, plan, analyses_used, analyses_limit")
      .eq("auth_id", user.id)
      .single();

    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const FREE_PLAN_MAX_POSTS = 10;
    const effectiveMaxPosts = dbUser.plan === "free" ? FREE_PLAN_MAX_POSTS : max_posts;

    if (dbUser.plan === "free" && max_posts > FREE_PLAN_MAX_POSTS) {
      return NextResponse.json(
        {
          error: `Free plan can analyze up to the last ${FREE_PLAN_MAX_POSTS} posts. Upgrade in Settings to analyze more posts.`,
        },
        { status: 403 }
      );
    }

    // Enforce usage limits (all plans have limits)
    if (dbUser.analyses_used >= dbUser.analyses_limit) {
      return NextResponse.json(
        {
          error:
            dbUser.plan === "free"
              ? "Analysis limit reached. Upgrade to run more analyses."
              : `You've used all ${dbUser.analyses_limit} analyses this month. Upgrade for more or wait until next billing cycle.`,
        },
        { status: 402 }
      );
    }

    // Fetch connected account
    const { data: account } = await serviceClient
      .from("connected_accounts")
      .select("*")
      .eq("id", account_id)
      .eq("user_id", dbUser.id)
      .eq("is_active", true)
      .single();

    if (!account) {
      return NextResponse.json({ error: "Account not found or not connected" }, { status: 404 });
    }

    // Preflight server config checks before creating a job / consuming usage.
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        {
          error:
            "Server misconfiguration: ANTHROPIC_API_KEY is not set. Add it in your deployment environment and redeploy.",
        },
        { status: 500 }
      );
    }

    // Check for in-progress job for this account
    const { data: existingJob } = await serviceClient
      .from("analysis_jobs")
      .select("id, status, started_at, created_at")
      .eq("account_id", account_id)
      .in("status", ["pending", "processing"])
      .single();

    if (existingJob) {
      const startedAt = existingJob.started_at ?? existingJob.created_at;
      const ageMs = startedAt ? Date.now() - new Date(startedAt).getTime() : 0;
      const STALE_MS = 15 * 60 * 1000; // 15 minutes

      if (ageMs > STALE_MS) {
        await serviceClient
          .from("analysis_jobs")
          .update({
            status: "failed",
            error_message: "Job timed out or was superseded",
            completed_at: new Date().toISOString(),
          })
          .eq("id", existingJob.id);
      } else {
        return NextResponse.json(
          { error: "Analysis already in progress", job_id: existingJob.id },
          { status: 409 }
        );
      }
    }

    // Create job record
    const { data: job, error: jobError } = await serviceClient
      .from("analysis_jobs")
      .insert({
        user_id: dbUser.id,
        account_id,
        status: "pending",
        progress: 0,
        current_step: "Initializing...",
      })
      .select()
      .single();

    if (jobError || !job) {
      throw new Error("Failed to create analysis job");
    }

    // Increment usage counter
    await serviceClient
      .from("users")
      .update({ analyses_used: dbUser.analyses_used + 1 })
      .eq("id", dbUser.id);

    // Log usage event
    await serviceClient.from("usage_events").insert({
      user_id: dbUser.id,
      event_type: "analysis_run",
      metadata: { account_id, platform: account.platform, job_id: job.id, max_posts: effectiveMaxPosts },
    });

    // ── Run analysis after response ──
    // next/server `after()` keeps the serverless function alive after the
    // response is sent, unlike fire-and-forget promises which get killed
    // when Vercel terminates the function.
    after(async () => {
      try {
        const isCsvImport = account.access_token === "csv_import" || account.platform_user_id?.startsWith("csv_");
        let dbPosts: any[] = [];
        let fetchedPostsCount = 0;
        let upsertErrorMessage: string | null = null;

        if (isCsvImport) {
          // CSV imports: posts already in DB, skip platform fetch
          const { data } = await serviceClient
            .from("posts")
            .select("*")
            .eq("account_id", account_id)
            .order("posted_at", { ascending: false })
            .limit(effectiveMaxPosts);
          dbPosts = data ?? [];
        } else {
          // OAuth accounts: refresh token and fetch from platform
          const freshAccount = await refreshTokenIfNeeded(account as any);
          let posts: any[] = [];
          try {
            posts = await fetchPostsForPlatform(freshAccount as any, effectiveMaxPosts);
            fetchedPostsCount = posts.length;
          } catch (fetchErr) {
            throw new Error(
              `Platform fetch failed for ${account.platform} @${account.username}: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`
            );
          }

          if (posts.length > 0) {
            const { error: upsertError } = await serviceClient.from("posts").upsert(
              posts.map(({ id: _unusedId, ...postWithoutId }) => ({ ...postWithoutId, account_id })),
              { onConflict: "account_id,platform_post_id", ignoreDuplicates: false }
            );
            if (upsertError) {
              upsertErrorMessage = upsertError.message;
              throw new Error(
                `Failed to persist fetched posts for ${account.platform} @${account.username}: ${upsertError.message}`
              );
            }
          }

          const { data } = await serviceClient
            .from("posts")
            .select("*")
            .eq("account_id", account_id)
            .order("posted_at", { ascending: false })
            .limit(effectiveMaxPosts);
          dbPosts = data ?? [];
        }

        await serviceClient
          .from("analysis_jobs")
          .update({ posts_fetched: dbPosts.length })
          .eq("id", job.id);

        if (dbPosts.length === 0) {
          throw new Error(
            isCsvImport
              ? "No posts found. Import more data via CSV."
              : `0 posts in DB after fetch. Platform: ${account.platform}, @${account.username}. ` +
                `isCsvImport: ${isCsvImport}, access_token prefix: ${account.access_token?.slice(0, 10)}..., ` +
                `platform_user_id: ${account.platform_user_id}, fetched_posts: ${fetchedPostsCount}, ` +
                `upsert_error: ${upsertErrorMessage ?? "none"}. ` +
                `Reconnect your account in Settings.`
          );
        }

        const freshAccount = isCsvImport ? account : await refreshTokenIfNeeded(account as any);
        await runAnalysisEngine({
          jobId: job.id,
          account: freshAccount as any,
          posts: dbPosts,
          pythonServiceUrl: process.env.PYTHON_SERVICE_URL ?? "http://localhost:8000",
        });
      } catch (err) {
        console.error(`Analysis job ${job.id} failed:`, err);
        await serviceClient
          .from("analysis_jobs")
          .update({
            status: "failed",
            error_message: err instanceof Error ? err.message : "Analysis failed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", job.id);
      }
    });

    return NextResponse.json({ job_id: job.id }, { status: 202 });
  } catch (err) {
    console.error("/api/analyze error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── GET /api/analyze?job_id=<id> — Poll job status ───────────────────────────
export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const jobId = new URL(req.url).searchParams.get("job_id");
  if (!jobId) return NextResponse.json({ error: "Missing job_id" }, { status: 400 });

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

  if (error || !job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  if (job.status === "pending" || job.status === "processing") {
    const startedAt = job.started_at ?? job.created_at;
    const ageMs = startedAt ? Date.now() - new Date(startedAt).getTime() : 0;
    const DEAD_JOB_MS = 2 * 60 * 1000; // serverless tasks should finish within this window

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
