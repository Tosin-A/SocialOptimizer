// POST /api/notifications/weekly — send weekly digest emails
// Triggered by Vercel Cron (every Monday 9am UTC) or manually
//
// vercel.json cron config:
// { "crons": [{ "path": "/api/notifications/weekly", "schedule": "0 9 * * 1" }] }

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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

      // Fetch recent reports per account (enough to get at least 2 per account for delta)
      const { data: reports } = await supabase
        .from("analysis_reports")
        .select(`
          account_id, growth_score, avg_engagement_rate, improvement_roadmap,
          connected_accounts:account_id(platform, username)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!reports || reports.length === 0) continue;

      interface ReportRow {
        account_id: string;
        growth_score: number | null;
        avg_engagement_rate: number | null;
        improvement_roadmap: unknown[] | null;
        connected_accounts: { platform: string; username: string }[];
      }

      // Group reports by account, keeping chronological order (newest first)
      const reportsByAccount = new Map<string, ReportRow[]>();
      for (const r of reports as ReportRow[]) {
        const key = r.account_id;
        if (!reportsByAccount.has(key)) {
          reportsByAccount.set(key, []);
        }
        reportsByAccount.get(key)!.push(r);
      }

      // Build summaries with delta from the two most recent reports per account
      const accountSummaries = [];
      for (const [, accountReports] of reportsByAccount) {
        const latest = accountReports[0];
        const previous = accountReports[1];
        const account = latest.connected_accounts?.[0];

        const latestScore = latest.growth_score ?? 0;
        const growthScoreDelta = previous
          ? latestScore - (previous.growth_score ?? 0)
          : 0;

        accountSummaries.push({
          platform: account?.platform ?? "unknown",
          username: account?.username ?? "unknown",
          growthScore: latestScore,
          growthScoreDelta,
          avgEngagementRate: latest.avg_engagement_rate ?? 0,
          pendingActions: Array.isArray(latest.improvement_roadmap)
            ? latest.improvement_roadmap.length
            : 0,
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
