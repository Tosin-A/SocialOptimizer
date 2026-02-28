// Print-optimised report view — open in new tab → Cmd+P → Save as PDF
import { notFound, redirect } from "next/navigation";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import PrintTrigger from "./PrintTrigger";

interface Props {
  params: Promise<{ id: string }>;
}

function ScoreRow({ label, score }: { label: string; score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 70 ? "#22c55e" : pct >= 45 ? "#facc15" : "#f87171";
  return (
    <div style={{ marginBottom: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
        <span style={{ color: "#94a3b8" }}>{label}</span>
        <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{pct}/100</span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "4px" }} />
      </div>
    </div>
  );
}

export default async function PrintReportPage({ params }: Props) {
  const { id: reportId } = await params;

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const serviceClient = getSupabaseServiceClient();

  const { data: dbUser } = await serviceClient
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!dbUser) notFound();

  const { data: report } = await serviceClient
    .from("analysis_reports")
    .select("*, connected_accounts:account_id(platform, username, followers)")
    .eq("id", reportId)
    .eq("user_id", dbUser.id)
    .single();

  if (!report) notFound();

  const account = (report as any).connected_accounts;
  const generatedAt = new Date(report.created_at).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const scores = [
    { label: "Content Quality",   score: report.content_quality_score },
    { label: "Hook Strength",     score: report.hook_strength_score },
    { label: "Hashtag Strategy",  score: report.hashtag_score },
    { label: "Engagement",        score: report.engagement_score },
    { label: "Consistency",       score: report.consistency_score },
    { label: "Branding",          score: report.branding_score },
    { label: "CTA Usage",         score: report.cta_score },
  ];

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
          background: #fff !important;
          color: #0f172a !important;
          font-size: 13px;
          line-height: 1.5;
        }
        .page { max-width: 800px; margin: 0 auto; padding: 40px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0; }
        .logo { font-weight: 800; font-size: 18px; color: #4f46e5; }
        .section { margin-bottom: 28px; }
        .section-title { font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 12px; }
        .summary-box { background: #f8fafc; border-radius: 8px; padding: 16px; font-size: 13px; color: #334155; line-height: 1.6; }
        .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 16px; }
        .metric-box { background: #f8fafc; border-radius: 8px; padding: 12px; text-align: center; }
        .metric-value { font-size: 18px; font-weight: 700; color: #0f172a; }
        .metric-label { font-size: 11px; color: #94a3b8; margin-top: 2px; }
        .growth-score { font-size: 56px; font-weight: 800; color: #4f46e5; }
        .score-section { display: grid; grid-template-columns: 200px 1fr; gap: 32px; align-items: center; }
        .insight { border-left: 3px solid; padding: 10px 12px; margin-bottom: 8px; border-radius: 0 6px 6px 0; }
        .insight-strength { border-color: #22c55e; background: #f0fdf4; }
        .insight-weakness { border-color: #f87171; background: #fef2f2; }
        .insight-opportunity { border-color: #facc15; background: #fefce8; }
        .insight-title { font-weight: 600; font-size: 12px; margin-bottom: 4px; }
        .insight-desc { font-size: 11px; color: #64748b; }
        .roadmap-item { display: flex; gap: 12px; margin-bottom: 12px; }
        .roadmap-num { width: 24px; height: 24px; border-radius: 50%; background: #4f46e5; color: white; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
        .roadmap-action { font-size: 12px; font-weight: 600; margin-bottom: 2px; }
        .roadmap-impact { font-size: 11px; color: #22c55e; }
        .tag { display: inline-block; padding: 3px 8px; border-radius: 100px; font-size: 11px; margin: 2px; }
        .tag-green { background: #dcfce7; color: #16a34a; }
        .tag-red { background: #fee2e2; color: #dc2626; }
        .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      `}</style>

      <PrintTrigger />

      <div className="page">
        {/* Header */}
        <div className="header">
          <div>
            <div className="logo">SocialOptimizer</div>
            <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>Growth Analysis Report</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 600 }}>
              {account?.platform ? account.platform.charAt(0).toUpperCase() + account.platform.slice(1) : ""} · @{account?.username ?? "—"}
            </div>
            {account?.followers && (
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                {Number(account.followers).toLocaleString()} followers
              </div>
            )}
            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
              Generated {generatedAt}
            </div>
          </div>
        </div>

        {/* Growth score + key metrics */}
        <div className="section">
          <div className="score-section">
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", marginBottom: "8px" }}>Growth Score</div>
              <div className="growth-score">{report.growth_score}</div>
              <div style={{ fontSize: "12px", color: "#94a3b8" }}>out of 100</div>
              <div style={{ fontSize: "12px", fontWeight: 600, marginTop: "8px", color: "#4f46e5" }}>{report.detected_niche}</div>
            </div>
            <div>
              {scores.map(({ label, score }) => (
                <ScoreRow key={label} label={label} score={score ?? 0} />
              ))}
            </div>
          </div>
        </div>

        {/* Key metrics */}
        <div className="section">
          <div className="section-title">Key Metrics</div>
          <div className="grid-4">
            {[
              { label: "Avg Engagement", value: `${((report.avg_engagement_rate ?? 0) * 100).toFixed(2)}%` },
              { label: "Posts / Week", value: (report.avg_posts_per_week ?? 0).toFixed(1) },
              { label: "Avg Views", value: (report.avg_views ?? 0).toLocaleString() },
              { label: "Best Days", value: (report.best_days ?? []).slice(0, 2).join(", ") || "—" },
            ].map((m) => (
              <div key={m.label} className="metric-box">
                <div className="metric-value">{m.value}</div>
                <div className="metric-label">{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Executive summary */}
        <div className="section">
          <div className="section-title">Executive Summary</div>
          <div className="summary-box">{report.executive_summary}</div>
        </div>

        {/* Strengths & weaknesses */}
        <div className="section">
          <div className="section-title">Strengths</div>
          {(report.strengths ?? []).map((s: any, i: number) => (
            <div key={i} className="insight insight-strength">
              <div className="insight-title">{s.title} <span style={{ fontWeight: 400, color: "#94a3b8" }}>({s.impact} impact)</span></div>
              <div className="insight-desc">{s.description}</div>
            </div>
          ))}
        </div>

        <div className="section">
          <div className="section-title">Weaknesses to Fix</div>
          {(report.weaknesses ?? []).map((w: any, i: number) => (
            <div key={i} className="insight insight-weakness">
              <div className="insight-title">{w.title}</div>
              <div className="insight-desc">{w.description}</div>
              {w.recommendation && (
                <div style={{ fontSize: "11px", color: "#4f46e5", marginTop: "4px" }}>
                  Fix: {w.recommendation}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Roadmap */}
        <div className="section">
          <div className="section-title">Prioritized Growth Roadmap</div>
          {(report.improvement_roadmap ?? []).map((action: any, i: number) => (
            <div key={i} className="roadmap-item">
              <div className="roadmap-num">{i + 1}</div>
              <div>
                <div className="roadmap-action">{action.action}</div>
                <div className="roadmap-impact">{action.expected_impact}</div>
                <div style={{ fontSize: "11px", color: "#94a3b8" }}>{action.timeframe} · {action.category}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Hashtags */}
        {(report.recommended_hashtags ?? []).length > 0 && (
          <div className="section">
            <div className="section-title">Recommended Hashtags</div>
            <div>
              {(report.recommended_hashtags ?? []).map((h: string) => (
                <span key={h} className="tag tag-green">{h}</span>
              ))}
            </div>
          </div>
        )}

        {(report.overused_hashtags ?? []).length > 0 && (
          <div className="section">
            <div className="section-title">Overused Hashtags (Reduce)</div>
            <div>
              {(report.overused_hashtags ?? []).slice(0, 15).map((h: string) => (
                <span key={h} className="tag tag-red">{h}</span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="footer">
          <span>Generated by SocialOptimizer · socialoptimizer.com</span>
          <span>Report ID: {report.id.slice(0, 8)}</span>
        </div>
      </div>
    </>
  );
}
