import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { FileText, TrendingUp, ExternalLink, Printer, BarChart3 } from "lucide-react";
import { redirect } from "next/navigation";

const PLATFORM_COLORS: Record<string, string> = {
  tiktok:    "text-[#25F4EE]",
  youtube:   "text-red-400",
  instagram: "text-pink-400",
  facebook:  "text-blue-400",
};

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
    score >= 45 ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" :
                  "text-red-400   bg-red-500/10    border-red-500/20";
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-bold border ${color}`}>
      <TrendingUp className="w-3 h-3" />
      {score}
    </span>
  );
}

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const serviceClient = getSupabaseServiceClient();
  const { data: dbUser } = await serviceClient
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!dbUser) redirect("/login");

  const { data: reports } = await serviceClient
    .from("analysis_reports")
    .select(`
      id, growth_score, engagement_score, content_quality_score,
      detected_niche, avg_engagement_rate, avg_posts_per_week,
      executive_summary, created_at,
      connected_accounts:account_id(id, platform, username, followers)
    `)
    .eq("user_id", dbUser.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const list = (reports ?? []) as any[];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-brand-400" /> Analysis Reports
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {list.length} report{list.length !== 1 ? "s" : ""} across all connected accounts
          </p>
        </div>
        <Link
          href="/dashboard/analyze"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors"
        >
          <BarChart3 className="w-4 h-4" /> Run new analysis
        </Link>
      </div>

      {/* Empty state */}
      {list.length === 0 && (
        <div className="glass rounded-2xl p-16 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No reports yet</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
            Run your first analysis to get a complete breakdown of scores, hashtags, hooks, and a prioritised improvement roadmap.
          </p>
          <Link
            href="/dashboard/analyze"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors"
          >
            <BarChart3 className="w-4 h-4" /> Analyse an account
          </Link>
        </div>
      )}

      {/* Report list */}
      {list.length > 0 && (
        <div className="space-y-3">
          {list.map((r) => {
            const account = r.connected_accounts as any;
            const platformColor = PLATFORM_COLORS[account?.platform ?? ""] ?? "text-muted-foreground";
            const date = new Date(r.created_at);

            return (
              <div key={r.id} className="glass rounded-2xl p-5 hover:bg-white/[0.06] transition-colors">
                <div className="flex items-start justify-between gap-4">
                  {/* Left: account + niche */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-semibold capitalize ${platformColor}`}>
                        {account?.platform ?? "unknown"}
                      </span>
                      <span className="text-muted-foreground text-sm">@{account?.username ?? "—"}</span>
                      {r.detected_niche && (
                        <>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">{r.detected_niche}</span>
                        </>
                      )}
                    </div>

                    {/* Scores row */}
                    <div className="flex items-center gap-3 mb-3">
                      <ScoreBadge score={r.growth_score} />
                      <span className="text-xs text-muted-foreground">
                        {(r.avg_engagement_rate * 100).toFixed(2)}% engagement
                      </span>
                      {account?.followers && (
                        <span className="text-xs text-muted-foreground">
                          {account.followers.toLocaleString()} followers
                        </span>
                      )}
                    </div>

                    {/* Executive summary preview */}
                    {r.executive_summary && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {r.executive_summary}
                      </p>
                    )}
                  </div>

                  {/* Right: date + actions */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/analyze?account=${account?.id}`}
                        className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" /> View
                      </Link>
                      <span className="text-white/10">|</span>
                      <Link
                        href={`/dashboard/reports/${r.id}/print`}
                        target="_blank"
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Printer className="w-3 h-3" /> PDF
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
