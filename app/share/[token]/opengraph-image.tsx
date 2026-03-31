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
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#080a0f", color: "white", fontSize: 32, fontFamily: "'Inter', system-ui, sans-serif" }}>
          Report not found
        </div>
      ),
      { ...size }
    );
  }

  const score = report.growth_score as number;
  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);
  const accountArr = report.connected_accounts as unknown as Array<{ username: string }>;
  const account = accountArr?.[0] ?? null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#080a0f",
          fontFamily: "'Inter', system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Ambient glow behind score */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "5%",
            width: 500,
            height: 500,
            background: `radial-gradient(circle, ${scoreColor}15 0%, ${scoreColor}05 40%, transparent 65%)`,
            borderRadius: "50%",
          }}
        />

        {/* Blue glow — right side */}
        <div
          style={{
            position: "absolute",
            bottom: -100,
            right: -50,
            width: 400,
            height: 400,
            background:
              "radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 60%)",
            borderRadius: "50%",
          }}
        />

        {/* Dot grid */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            padding: "50px 70px",
            position: "relative",
          }}
        >
          {/* Left — score visualization */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "40%",
              gap: 16,
            }}
          >
            {/* Score ring */}
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
                background: "rgba(0,0,0,0.35)",
                boxShadow: `0 0 60px ${scoreColor}18`,
              }}
            >
              <span
                style={{
                  fontSize: 76,
                  fontWeight: 800,
                  color: "white",
                  lineHeight: 1,
                  letterSpacing: "-0.04em",
                }}
              >
                {score}
              </span>
              <span
                style={{
                  fontSize: 16,
                  color: "rgba(255,255,255,0.3)",
                  fontWeight: 500,
                }}
              >
                /100
              </span>
            </div>
            <span
              style={{
                color: scoreColor,
                fontSize: 16,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
              }}
            >
              {scoreLabel}
            </span>
          </div>

          {/* Right — details */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              width: "60%",
              paddingLeft: 40,
              gap: 24,
            }}
          >
            {/* Username + niche */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {account && (
                <span
                  style={{
                    color: "white",
                    fontSize: 36,
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                  }}
                >
                  @{account.username}
                </span>
              )}
              {report.detected_niche && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#3b82f6",
                    }}
                  />
                  <span
                    style={{
                      color: "#93c5fd",
                      fontSize: 18,
                      fontWeight: 600,
                    }}
                  >
                    {report.detected_niche as string}
                  </span>
                </div>
              )}
            </div>

            {/* Mini score cards */}
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { label: "Hook", value: report.hook_strength_score },
                { label: "Engagement", value: report.engagement_score },
                { label: "Content", value: report.content_quality_score },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 5,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 14,
                    padding: "14px 20px",
                    minWidth: 100,
                  }}
                >
                  <span
                    style={{
                      color: getScoreColor(item.value as number),
                      fontSize: 28,
                      fontWeight: 800,
                      lineHeight: 1,
                    }}
                  >
                    {item.value}
                  </span>
                  <span
                    style={{
                      color: "rgba(255,255,255,0.35)",
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Branding */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span
                  style={{
                    color: "white",
                    fontSize: 20,
                    fontWeight: 900,
                    letterSpacing: "0.12em",
                  }}
                >
                  CLOUT
                </span>
                <div
                  style={{
                    width: 1,
                    height: 16,
                    background: "rgba(255,255,255,0.15)",
                  }}
                />
                <span
                  style={{
                    color: "rgba(255,255,255,0.3)",
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  Content Analysis Report
                </span>
              </div>
              <span
                style={{
                  color: "rgba(255,255,255,0.2)",
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: "0.03em",
                }}
              >
                cloutai.co.uk
              </span>
            </div>
          </div>
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, transparent, ${scoreColor} 30%, #2563eb 60%, #3b82f6 80%, transparent)`,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
