import { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-yellow-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 50) return "Average";
  if (score >= 30) return "Needs Work";
  return "Critical";
}

async function getReportByToken(token: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await supabase
    .from("analysis_reports")
    .select("id, growth_score, detected_niche, executive_summary, fix_list, hook_strength_score, engagement_score, content_quality_score, connected_accounts!inner(username, platform)")
    .eq("share_token", token)
    .single();

  return data;
}

export async function generateMetadata(
  { params }: { params: Promise<{ token: string }> }
): Promise<Metadata> {
  const { token } = await params;
  const report = await getReportByToken(token);

  if (!report) {
    return { title: "Report not found | CLOUT" };
  }

  const metaAccountArr = report.connected_accounts as unknown as Array<{ username: string; platform: string }>;
  const metaAccount = metaAccountArr?.[0] ?? null;
  const title = `${metaAccount?.username ?? "Creator"}'s content score: ${report.growth_score}/100 | CLOUT`;
  const description = report.executive_summary?.slice(0, 160) ?? "AI-powered content analysis";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://getclout.app";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: `${baseUrl}/api/reports/${report.id}/card?share_token=${token}`,
          width: 1080,
          height: 1350,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${baseUrl}/api/reports/${report.id}/card?share_token=${token}`],
    },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const report = await getReportByToken(token);

  if (!report) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-bold text-foreground">Report not found</h1>
          <p className="text-sm text-muted-foreground">This share link may have expired or is invalid.</p>
          <Link href="/" className="inline-block text-sm text-brand-400 hover:text-brand-300 mt-4">
            Get your own analysis →
          </Link>
        </div>
      </div>
    );
  }

  const accountArr = report.connected_accounts as unknown as Array<{ username: string; platform: string }>;
  const account = accountArr?.[0] ?? null;
  const fixList = report.fix_list as Array<{ rank: number; problem: string; action: string }> | null;
  const scoreColor = getScoreColor(report.growth_score);
  const scoreLabel = getScoreLabel(report.growth_score);

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="16 7 22 7 22 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-brand-400 font-bold text-sm tracking-wide">CLOUT</span>
          </div>
          {account && (
            <p className="text-muted-foreground text-sm">
              @{account.username} · {account.platform}
            </p>
          )}
        </div>

        {/* Score */}
        <div className="flex flex-col items-center space-y-3">
          <div className="w-32 h-32 rounded-full border-4 border-current flex flex-col items-center justify-center" style={{ borderColor: "currentColor" }}>
            <span className={`text-5xl font-extrabold ${scoreColor}`}>{report.growth_score}</span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
          <span className={`text-lg font-bold ${scoreColor}`}>{scoreLabel}</span>
          <span className="bg-indigo-500/15 text-indigo-400 px-3 py-1 rounded-full text-xs font-medium">
            {report.detected_niche}
          </span>
        </div>

        {/* Executive summary (truncated) */}
        <div className="glass rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-semibold">Summary</h3>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
            {report.executive_summary}
          </p>
        </div>

        {/* Top fixes — show 2, blur the rest */}
        {fixList && fixList.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Top fixes</h3>
            {fixList.slice(0, 2).map((fix, i) => (
              <div key={i} className="glass rounded-xl p-4 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-red-400">#{fix.rank}</span>
                  <span className="text-xs text-foreground font-medium">{fix.problem}</span>
                </div>
                <p className="text-xs text-emerald-400">{fix.action}</p>
              </div>
            ))}
            {fixList.length > 2 && (
              <div className="relative">
                <div className="glass rounded-xl p-4 opacity-30 blur-[2px]">
                  <span className="text-xs text-muted-foreground">
                    {fixList.length - 2} more fixes available...
                  </span>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs text-brand-400 font-medium">Get your own analysis to see all fixes</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mini scores */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Hook", score: report.hook_strength_score },
            { label: "Engagement", score: report.engagement_score },
            { label: "Content", score: report.content_quality_score },
          ].map((item) => (
            <div key={item.label} className="glass rounded-xl p-3 text-center">
              <p className={`text-lg font-bold ${getScoreColor(item.score)}`}>{item.score}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center space-y-3 pt-4">
          <Link
            href="/auth/signup"
            className="inline-block w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm py-3 rounded-xl transition-colors text-center"
          >
            Get your own analysis — it&apos;s free
          </Link>
          <p className="text-xs text-muted-foreground">
            Free analysis for your TikTok, Instagram, YouTube, or Facebook
          </p>
        </div>
      </div>
    </div>
  );
}
