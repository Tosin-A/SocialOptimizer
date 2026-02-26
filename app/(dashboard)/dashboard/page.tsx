import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import GrowthScoreCard from "@/components/dashboard/GrowthScoreCard";
import MetricsGrid from "@/components/dashboard/MetricsGrid";
import PlatformConnect from "@/components/dashboard/PlatformConnect";
import RecentReports from "@/components/dashboard/RecentReports";
import ImprovementRoadmap from "@/components/dashboard/ImprovementRoadmap";
import QuickActions from "@/components/dashboard/QuickActions";
import OnboardingSteps from "@/components/dashboard/OnboardingSteps";
import FirstAnalysisPrompt from "@/components/dashboard/FirstAnalysisPrompt";
import type { DashboardStats } from "@/types";

async function getDashboardData(userId: string) {
  const serviceClient = getSupabaseServiceClient();

  const [accountsResult, latestReportResult] = await Promise.all([
    serviceClient
      .from("connected_accounts")
      .select("id, platform, username, avatar_url, followers, is_active")
      .eq("user_id", userId)
      .eq("is_active", true),
    serviceClient
      .from("analysis_reports")
      .select(`
        id, growth_score, avg_engagement_rate, detected_niche,
        improvement_roadmap, created_at,
        connected_accounts:account_id(platform, username)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const accounts = accountsResult.data ?? [];
  const reports = latestReportResult.data ?? [];
  const latest = reports[0] as any;

  const stats: DashboardStats = {
    growth_score: latest?.growth_score ?? 0,
    growth_score_delta: reports.length > 1 ? (latest?.growth_score ?? 0) - ((reports[1] as any)?.growth_score ?? 0) : 0,
    avg_engagement_rate: latest?.avg_engagement_rate ?? 0,
    total_followers: accounts.reduce((sum: number, a: any) => sum + (a.followers ?? 0), 0),
    total_posts_analyzed: 0,
    top_platform: accounts[0]?.platform ?? null,
    niche: latest?.detected_niche ?? null,
    connected_accounts: accounts.length,
    pending_actions: latest?.improvement_roadmap?.length ?? 0,
    last_analysis_at: latest?.created_at ?? null,
  };

  return { accounts, reports, stats, latestReport: latest };
}

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const serviceClient = getSupabaseServiceClient();
  const { data: dbUser } = await serviceClient
    .from("users")
    .select("id")
    .eq("auth_id", user!.id)
    .single();

  if (!dbUser) return null;

  const { accounts, reports, stats, latestReport } = await getDashboardData(dbUser.id);
  const hasAccounts = accounts.length > 0;
  const hasReports = reports.length > 0;
  const isOnboarding = !hasAccounts || !hasReports;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {hasReports
              ? `Last analyzed: ${new Date(stats.last_analysis_at!).toLocaleDateString()}`
              : "Connect a platform to get started"}
          </p>
        </div>
        <QuickActions hasAccounts={hasAccounts} />
      </div>

      {/* Onboarding progress — shown until first report exists */}
      {isOnboarding && (
        <OnboardingSteps hasAccounts={hasAccounts} hasReports={hasReports} />
      )}

      {/* Step 1: No platforms connected */}
      {!hasAccounts && <PlatformConnect />}

      {/* Step 2: Connected but no analysis yet */}
      {hasAccounts && !hasReports && (
        <FirstAnalysisPrompt accounts={accounts as any[]} />
      )}

      {/* Step 3: Has reports — full dashboard */}
      {hasAccounts && hasReports && (
        <>
          {/* Top row: Growth score + metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <GrowthScoreCard
              score={stats.growth_score}
              delta={stats.growth_score_delta}
              niche={stats.niche}
              lastAnalyzedAt={stats.last_analysis_at}
              accountId={accounts[0]?.id}
              className="lg:col-span-1"
            />
            <MetricsGrid stats={stats} accounts={accounts as any[]} className="lg:col-span-3" />
          </div>

          {/* Bottom row: Roadmap + Recent reports */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ImprovementRoadmap
              roadmap={latestReport?.improvement_roadmap ?? []}
              className="lg:col-span-2"
            />
            <RecentReports reports={reports as any[]} />
          </div>
        </>
      )}
    </div>
  );
}
