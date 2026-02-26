// POST /api/analyze — Kick off a new analysis job
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { fetchPostsForPlatform } from "@/lib/platforms";
import { runAnalysisEngine } from "@/lib/analysis/engine";
import { z } from "zod";

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

    // Enforce usage limits
    if (dbUser.plan === "free" && dbUser.analyses_used >= dbUser.analyses_limit) {
      return NextResponse.json(
        { error: "Analysis limit reached. Upgrade to Pro to run unlimited analyses." },
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

    // Check for in-progress job for this account
    const { data: existingJob } = await serviceClient
      .from("analysis_jobs")
      .select("id, status")
      .eq("account_id", account_id)
      .in("status", ["pending", "processing"])
      .single();

    if (existingJob) {
      return NextResponse.json(
        { error: "Analysis already in progress", job_id: existingJob.id },
        { status: 409 }
      );
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
      metadata: { account_id, platform: account.platform, job_id: job.id },
    });

    // ── Run analysis asynchronously ──
    // In production this would be enqueued to BullMQ/Redis.
    // Here we use a non-blocking Promise and return the job_id immediately.
    (async () => {
      try {
        // Fetch posts from the platform
        const posts = await fetchPostsForPlatform(account as any, max_posts);

        // Persist posts to DB (upsert)
        if (posts.length > 0) {
          await serviceClient.from("posts").upsert(
            posts.map((p) => ({ ...p, account_id })),
            { onConflict: "account_id,platform_post_id", ignoreDuplicates: false }
          );
        }

        // Update job with fetched count
        await serviceClient
          .from("analysis_jobs")
          .update({ posts_fetched: posts.length })
          .eq("id", job.id);

        // Fetch full post records (with DB-assigned IDs)
        const { data: dbPosts } = await serviceClient
          .from("posts")
          .select("*")
          .eq("account_id", account_id)
          .order("posted_at", { ascending: false })
          .limit(max_posts);

        // Run analysis engine
        await runAnalysisEngine({
          jobId: job.id,
          account: account as any,
          posts: dbPosts ?? [],
          pythonServiceUrl: process.env.PYTHON_SERVICE_URL ?? "http://localhost:8000",
        });
      } catch (err) {
        console.error(`Analysis job ${job.id} failed:`, err);
      }
    })();

    return NextResponse.json({ job_id: job.id }, { status: 202 });
  } catch (err) {
    console.error("/api/analyze error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
