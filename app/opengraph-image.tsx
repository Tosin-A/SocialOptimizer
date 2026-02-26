import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "SocialOptimizer — Content analytics for serious creators";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #080f1e 0%, #0f1a35 50%, #1e1b4b 100%)",
          fontFamily: "'Inter', system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Grid dot pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Glow */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            right: "10%",
            width: 500,
            height: 300,
            background: "rgba(99,102,241,0.15)",
            borderRadius: "50%",
            filter: "blur(80px)",
          }}
        />

        {/* Score cards decorative row */}
        <div
          style={{
            position: "absolute",
            top: 56,
            right: 80,
            display: "flex",
            gap: 12,
          }}
        >
          {[
            { label: "Growth Score", value: "84", color: "#22c55e" },
            { label: "Engagement",   value: "3.8%", color: "#818cf8" },
            { label: "Hook Strength", value: "71", color: "#f59e0b" },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                padding: "16px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                minWidth: 120,
              }}
            >
              <span style={{ color: card.color, fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
                {card.value}
              </span>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {card.label}
              </span>
            </div>
          ))}
        </div>

        {/* Logo mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="16 7 22 7 22 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={{ color: "#818cf8", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>
            SocialOptimizer
          </span>
        </div>

        {/* Headline */}
        <h1
          style={{
            color: "#f1f5f9",
            fontSize: 56,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            margin: 0,
            marginBottom: 20,
            maxWidth: 720,
          }}
        >
          Stop guessing.<br />Start growing.
        </h1>

        {/* Sub */}
        <p
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 22,
            margin: 0,
            maxWidth: 600,
            lineHeight: 1.5,
          }}
        >
          AI-powered analysis of your TikTok, Instagram, YouTube, and Facebook content — with a ranked fix list, not a generic report.
        </p>
      </div>
    ),
    { ...size }
  );
}
