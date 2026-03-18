import { redirect } from "next/navigation";
import Link from "next/link";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { Map, BarChart3, ChevronRight, Calendar } from "lucide-react";
import type { RoadmapAction } from "@/types";
import SavedIdeasSection from "@/components/dashboard/SavedIdeasSection";

const CATEGORY_CONFIG: Record<string, { color: string; label: string }> = {
  content: { color: "bg-brand-600/20 text-brand-300 border-brand-600/30", label: "Content" },
  hashtags: { color: "bg-neon-purple/20 text-neon-purple border-neon-purple/30", label: "Hashtags" },
  posting: { color: "bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30", label: "Posting" },
  engagement: { color: "bg-neon-green/20 text-neon-green border-neon-green/30", label: "Engagement" },
  branding: { color: "bg-neon-pink/20 text-neon-pink border-neon-pink/30", label: "Branding" },
};

export const metadata = { title: "Roadmap" };

export default async function RoadmapPage() {
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

  const { data: latestReport } = await serviceClient
    .from("analysis_reports")
    .select(`
      id, improvement_roadmap, created_at,
      connected_accounts:account_id(platform, username)
    `)
    .eq("user_id", dbUser.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const roadmap = (latestReport as any)?.improvement_roadmap ?? [];
  const account = (latestReport as any)?.connected_accounts;
  const reportDate = latestReport?.created_at
    ? new Date(latestReport.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Map className="w-6 h-6 text-brand-400" /> Growth Roadmap
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Your prioritized actions — what to do and when
        </p>
      </div>

      {roadmap.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <Map className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No roadmap yet</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
            Run your first analysis to get a prioritized list of actions tailored to your content performance.
          </p>
          <Link
            href="/dashboard/analyze"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors"
          >
            <BarChart3 className="w-4 h-4" /> Run analysis
          </Link>
        </div>
      ) : (
        <>
          {/* Report context */}
          <div className="glass rounded-xl px-4 py-3 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              {account && (
                <span className="capitalize font-medium text-foreground">
                  {account.platform} @{account.username}
                </span>
              )}
              {reportDate && (
                <>
                  <span className="text-white/20">·</span>
                  <span>From analysis {reportDate}</span>
                </>
              )}
            </div>
            <Link
              href={`/dashboard/reports/${latestReport?.id}`}
              className="text-brand-400 hover:text-brand-300 text-xs flex items-center gap-1"
            >
              View full report <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Roadmap list */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-white/5">
              <h2 className="font-semibold text-sm text-muted-foreground">
                {roadmap.length} actions · ordered by priority
              </h2>
            </div>
            <div className="divide-y divide-white/5">
              {roadmap.map((action: RoadmapAction, i: number) => {
                const cc = CATEGORY_CONFIG[action.category] ?? {
                  color: "bg-white/10 text-foreground border-white/20",
                  label: action.category,
                };
                return (
                  <div key={i} className="p-4 sm:p-5 flex gap-3 sm:gap-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-9 h-9 rounded-full border bg-brand-600/10 flex items-center justify-center text-sm font-bold text-brand-400">
                        {i + 1}
                      </div>
                      {i < roadmap.length - 1 && (
                        <div className="w-px flex-1 min-h-[20px] bg-white/5 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pb-2">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full border capitalize ${cc.color}`}
                        >
                          {cc.label}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {action.timeframe}
                        </span>
                      </div>
                      <p className="text-sm font-medium leading-snug mb-1">{action.action}</p>
                      <p className="text-xs text-neon-green">{action.expected_impact}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Run a new analysis to refresh your roadmap as your content evolves.
          </p>
        </>
      )}

      <SavedIdeasSection />
    </div>
  );
}
