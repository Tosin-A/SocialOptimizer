// POST /api/notifications/weekly — send weekly digest emails
// Triggered by Vercel Cron (every Monday 9am UTC) or manually
//
// vercel.json cron config:
// { "crons": [{ "path": "/api/notifications/weekly", "schedule": "0 9 * * 1" }] }

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { sendWeeklyDigest } from "@/lib/email";

// Vercel Cron authenticates with CRON_SECRET in the Authorization header
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServiceClient();

  // Fetch all users who have at least one analysis report
  const { data: users } = await supabase
    .from("users")
    .select("id, auth_id")
    .gt("analyses_used", 0);

  if (!users || users.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const { createClient } = require("@supabase/supabase-js");
  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let sent = 0;
  let failed = 0;

  for (const user of users) {
    try {
      // Get email from Supabase Auth
      const { data: authUser } = await authClient.auth.admin.getUserById(user.auth_id);
      const email = authUser?.user?.email;
      if (!email) continue;

      // Fetch latest report per account for this user
      const { data: reports } = await supabase
        .from("analysis_reports")
        .select(`
          growth_score, avg_engagement_rate, improvement_roadmap,
          connected_accounts:account_id(platform, username)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!reports || reports.length === 0) continue;

      // Deduplicate to one report per account (take the most recent)
      const seen = new Set<string>();
      const accountSummaries = [];

      for (const r of reports as any[]) {
        const key = `${r.connected_accounts?.platform}-${r.connected_accounts?.username}`;
        if (seen.has(key)) continue;
        seen.add(key);

        accountSummaries.push({
          platform: r.connected_accounts?.platform ?? "unknown",
          username: r.connected_accounts?.username ?? "unknown",
          growthScore: r.growth_score ?? 0,
          growthScoreDelta: 0, // delta calculation would need previous report — simplified for now
          avgEngagementRate: r.avg_engagement_rate ?? 0,
          pendingActions: r.improvement_roadmap?.length ?? 0,
        });
      }

      if (accountSummaries.length === 0) continue;

      await sendWeeklyDigest({ to: email, accounts: accountSummaries });
      sent++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ sent, failed, total: users.length });
}
