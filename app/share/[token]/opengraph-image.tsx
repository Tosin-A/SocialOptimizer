import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";
export const alt = "Content Analysis Score | CLOUT";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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

export default async function OGImage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: report } = await supabase
    .from("analysis_reports")
    .select("growth_score, detected_niche, hook_strength_score, engagement_score, content_quality_score, connected_accounts!inner(username)")
    .eq("share_token", token)
    .single();

  if (!report) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "white", fontSize: 32 }}>
          Report not found
        </div>
      ),
      { ...size }
    );
  }

  const score = report.growth_score as number;
  const scoreColor = getScoreColor(score);
  const accountArr = report.connected_accounts as unknown as Array<{ username: string }>;
  const account = accountArr?.[0] ?? null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 80,
          padding: "60px 80px",
          background: "linear-gradient(145deg, #0a0c12 0%, #0d1420 40%, #111827 100%)",
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

        {/* Score circle */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 180,
              height: 180,
              borderRadius: "50%",
              border: `6px solid ${scoreColor}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.3)",
            }}
          >
            <span style={{ fontSize: 72, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{score}</span>
            <span style={{ fontSize: 16, color: "rgba(255,255,255,0.4)" }}>/100</span>
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, color: scoreColor }}>{getScoreLabel(score)}</span>
        </div>

        {/* Right side info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {account && (
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 24 }}>@{account.username}</span>
          )}
          <span style={{ color: "#60a5fa", fontSize: 18, fontWeight: 600 }}>{report.detected_niche}</span>

          {/* Mini scores */}
          <div style={{ display: "flex", gap: 16 }}>
            {[
              { label: "Hook", value: report.hook_strength_score },
              { label: "Engagement", value: report.engagement_score },
              { label: "Content", value: report.content_quality_score },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  padding: "12px 16px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  minWidth: 90,
                }}
              >
                <span style={{ color: getScoreColor(item.value as number), fontSize: 24, fontWeight: 800 }}>
                  {item.value}
                </span>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Branding */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="16 7 22 7 22 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, fontWeight: 600 }}>Analyzed by CLOUT</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
