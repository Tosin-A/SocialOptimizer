import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const runtime = "edge";

function getScoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#eab308";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 50) return "Average";
  if (score >= 30) return "Needs Work";
  return "Critical";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reportId } = await params;
  const { searchParams } = new URL(req.url);
  const shareToken = searchParams.get("share_token");

  const serviceClient = getSupabaseServiceClient();

  // Auth: share_token for public access, or verify ownership
  let report: Record<string, unknown> | null = null;

  if (shareToken) {
    const { data } = await serviceClient
      .from("analysis_reports")
      .select("*, connected_accounts!inner(username, platform)")
      .eq("share_token", shareToken)
      .single();
    report = data;
  } else {
    // No public access without share_token for the card
    return new Response("Missing share_token", { status: 400 });
  }

  if (!report) {
    return new Response("Report not found", { status: 404 });
  }

  const score = report.growth_score as number;
  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);
  const niche = report.detected_niche as string;
  const fixList = report.fix_list as Array<{ rank: number; problem: string; action: string }> | null;
  const topFix = fixList?.[0];
  const hookScore = report.hook_strength_score as number;
  const engagementScore = report.engagement_score as number;
  const contentScore = report.content_quality_score as number;
  const accountArr = report.connected_accounts as unknown as Array<{ username: string; platform: string }>;
  const account = accountArr?.[0] ?? null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "60px 56px",
          background: "linear-gradient(160deg, #080f1e 0%, #0f172a 40%, #1e1b4b 100%)",
          fontFamily: "'Inter', system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Grid dots */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Glow behind score */}
        <div
          style={{
            position: "absolute",
            top: 120,
            left: "50%",
            transform: "translateX(-50%)",
            width: 400,
            height: 400,
            background: `radial-gradient(circle, ${scoreColor}15 0%, transparent 70%)`,
            borderRadius: "50%",
          }}
        />

        {/* Header: platform + username + niche */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {account && (
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 22 }}>
                @{account.username}
              </span>
            )}
          </div>
          <div
            style={{
              background: "rgba(99,102,241,0.15)",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: 999,
              padding: "8px 20px",
              color: "#818cf8",
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            {niche}
          </div>
        </div>

        {/* Big score */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 40 }}>
          <div
            style={{
              width: 200,
              height: 200,
              borderRadius: "50%",
              border: `6px solid ${scoreColor}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.3)",
            }}
          >
            <span style={{ fontSize: 80, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
              {score}
            </span>
            <span style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>/100</span>
          </div>
          <span style={{ fontSize: 24, fontWeight: 700, color: scoreColor, marginTop: 16 }}>
            {scoreLabel}
          </span>
        </div>

        {/* Top fix */}
        {topFix && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: "24px 28px",
              marginBottom: 32,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#ef4444", fontSize: 16, fontWeight: 700 }}>#1 Issue</span>
            </div>
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 20, lineHeight: 1.4 }}>
              {topFix.problem.length > 90 ? topFix.problem.slice(0, 90) + "..." : topFix.problem}
            </span>
            <span style={{ color: "#22c55e", fontSize: 18, lineHeight: 1.4 }}>
              {topFix.action.length > 90 ? topFix.action.slice(0, 90) + "..." : topFix.action}
            </span>
          </div>
        )}

        {/* Mini score bars */}
        <div style={{ display: "flex", gap: 16, marginBottom: 40 }}>
          {[
            { label: "Hook", score: hookScore },
            { label: "Engagement", score: engagementScore },
            { label: "Content", score: contentScore },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span style={{ color: "rgba(255,255,255,0.4)" }}>{item.label}</span>
                <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{item.score}</span>
              </div>
              <div
                style={{
                  height: 6,
                  borderRadius: 3,
                  background: "rgba(255,255,255,0.06)",
                  overflow: "hidden",
                  display: "flex",
                }}
              >
                <div
                  style={{
                    width: `${item.score}%`,
                    height: "100%",
                    borderRadius: 3,
                    background: getScoreColor(item.score),
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Footer: branding + CTA */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="16 7 22 7 22 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 16, fontWeight: 600 }}>
              Analyzed by CLOUT
            </span>
          </div>
          <span style={{ color: "rgba(99,102,241,0.7)", fontSize: 16, fontWeight: 500 }}>
            See your full breakdown →
          </span>
        </div>
      </div>
    ),
    { width: 1080, height: 1350 }
  );
}
