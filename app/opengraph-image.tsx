import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CLOUT | Content analytics for serious creators";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  const SCORE = 84;
  const SCORE_COLOR = "#22c55e";

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
        {/* Large blue glow behind score ring */}
        <div
          style={{
            position: "absolute",
            top: "15%",
            right: "12%",
            width: 500,
            height: 500,
            background: "radial-gradient(circle, rgba(37,99,235,0.18) 0%, rgba(37,99,235,0.04) 50%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Faint horizontal lines — data grid feel */}
        {[120, 200, 280, 360, 440, 520].map((y) => (
          <div
            key={y}
            style={{
              position: "absolute",
              top: y,
              left: 0,
              right: 0,
              height: 1,
              background: "rgba(255,255,255,0.02)",
            }}
          />
        ))}

        {/* Left column — text content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 0 0 80px",
            width: "58%",
            height: "100%",
            position: "relative",
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 48,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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
                color: "white",
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: "0.08em",
              }}
            >
              CLOUT
            </span>
          </div>

          {/* Headline */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 0,
              marginBottom: 32,
            }}
          >
            <span
              style={{
                color: "white",
                fontSize: 52,
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
              }}
            >
              Your content,
            </span>
            <span
              style={{
                color: "white",
                fontSize: 52,
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
              }}
            >
              scored &amp; ranked.
            </span>
          </div>

          {/* Platform tags */}
          <div style={{ display: "flex", gap: 8 }}>
            {["TikTok", "Instagram", "YouTube", "Facebook"].map((p) => (
              <div
                key={p}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 6,
                  padding: "6px 14px",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.5)",
                  letterSpacing: "0.01em",
                }}
              >
                {p}
              </div>
            ))}
          </div>

          {/* URL */}
          <span
            style={{
              color: "rgba(255,255,255,0.2)",
              fontSize: 14,
              fontWeight: 500,
              marginTop: 40,
              letterSpacing: "0.02em",
            }}
          >
            getclout.app
          </span>
        </div>

        {/* Right column — score visualization */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "42%",
            height: "100%",
            position: "relative",
          }}
        >
          {/* Score ring */}
          <div
            style={{
              width: 220,
              height: 220,
              borderRadius: "50%",
              border: `7px solid ${SCORE_COLOR}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.4)",
              boxShadow: `0 0 60px rgba(34,197,94,0.15), inset 0 0 40px rgba(0,0,0,0.3)`,
              position: "relative",
            }}
          >
            <span
              style={{
                fontSize: 80,
                fontWeight: 800,
                color: "white",
                lineHeight: 1,
                letterSpacing: "-0.04em",
              }}
            >
              {SCORE}
            </span>
            <span
              style={{
                fontSize: 18,
                color: "rgba(255,255,255,0.35)",
                fontWeight: 500,
                marginTop: 2,
              }}
            >
              /100
            </span>
          </div>

          {/* Score label */}
          <span
            style={{
              color: SCORE_COLOR,
              fontSize: 14,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              marginTop: 20,
            }}
          >
            Growth Score
          </span>

          {/* Mini metrics row */}
          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 32,
            }}
          >
            {[
              { label: "Hook", value: "71", color: "#eab308" },
              { label: "Engage", value: "3.8%", color: "#60a5fa" },
              { label: "CTA", value: "45", color: "#f97316" },
            ].map((m) => (
              <div
                key={m.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 10,
                  padding: "12px 18px",
                  minWidth: 80,
                }}
              >
                <span
                  style={{
                    color: m.color,
                    fontSize: 22,
                    fontWeight: 800,
                    lineHeight: 1,
                  }}
                >
                  {m.value}
                </span>
                <span
                  style={{
                    color: "rgba(255,255,255,0.3)",
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom accent */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "linear-gradient(90deg, #2563eb, #3b82f6 40%, #22c55e 80%, transparent)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
