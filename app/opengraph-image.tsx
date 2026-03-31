import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CLOUT | Content analytics for serious creators";
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
          background: "linear-gradient(145deg, #0a0c12 0%, #0d1420 40%, #111827 100%)",
          fontFamily: "'Inter', system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Blue glow — top right */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            right: "5%",
            width: 480,
            height: 320,
            background: "rgba(37,99,235,0.12)",
            borderRadius: "50%",
            filter: "blur(100px)",
          }}
        />

        {/* Secondary glow — bottom left */}
        <div
          style={{
            position: "absolute",
            bottom: "5%",
            left: "0%",
            width: 400,
            height: 250,
            background: "rgba(59,130,246,0.06)",
            borderRadius: "50%",
            filter: "blur(80px)",
          }}
        />

        {/* Score cards */}
        <div
          style={{
            position: "absolute",
            top: 56,
            right: 80,
            display: "flex",
            gap: 14,
          }}
        >
          {[
            { label: "Growth Score", value: "84", color: "#22c55e" },
            { label: "Engagement", value: "3.8%", color: "#60a5fa" },
            { label: "Hook Strength", value: "71", color: "#eab308" },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "18px 22px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                minWidth: 125,
              }}
            >
              <span
                style={{
                  color: card.color,
                  fontSize: 30,
                  fontWeight: 800,
                  lineHeight: 1,
                }}
              >
                {card.value}
              </span>
              <span
                style={{
                  color: "rgba(255,255,255,0.35)",
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                {card.label}
              </span>
            </div>
          ))}
        </div>

        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 36,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "linear-gradient(135deg, #2563eb, #3b82f6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <polyline
                points="22 7 13.5 15.5 8.5 10.5 2 17"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="16 7 22 7 22 13"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span
            style={{
              color: "#60a5fa",
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "0.04em",
            }}
          >
            CLOUT
          </span>
        </div>

        {/* Headline */}
        <h1
          style={{
            color: "#ffffff",
            fontSize: 58,
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            margin: 0,
            marginBottom: 20,
            maxWidth: 700,
          }}
        >
          Content analytics for serious creators.
        </h1>

        {/* Sub */}
        <p
          style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: 22,
            margin: 0,
            maxWidth: 580,
            lineHeight: 1.5,
          }}
        >
          Analyze 90 days of TikTok, Instagram, YouTube, and Facebook posts.
          Get a ranked fix list, not a generic report.
        </p>

        {/* Bottom edge accent line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "linear-gradient(90deg, transparent, #2563eb 30%, #3b82f6 70%, transparent)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
