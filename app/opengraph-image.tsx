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
          background: "#080a0f",
          fontFamily: "'Inter', system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Ambient blue glow — top right */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -80,
            width: 600,
            height: 600,
            background:
              "radial-gradient(circle, rgba(37,99,235,0.15) 0%, rgba(37,99,235,0.05) 40%, transparent 65%)",
            borderRadius: "50%",
          }}
        />

        {/* Ambient blue glow — bottom left */}
        <div
          style={{
            position: "absolute",
            bottom: -200,
            left: -100,
            width: 500,
            height: 500,
            background:
              "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 60%)",
            borderRadius: "50%",
          }}
        />

        {/* Dot grid pattern */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Content container */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            padding: "60px 80px",
            position: "relative",
          }}
        >
          {/* Top row — logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                color: "white",
                fontSize: 38,
                fontWeight: 900,
                letterSpacing: "0.12em",
              }}
            >
              CLOUT
            </span>

            {/* Pill badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(37,99,235,0.12)",
                border: "1px solid rgba(59,130,246,0.25)",
                borderRadius: 999,
                padding: "8px 20px",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#3b82f6",
                }}
              />
              <span
                style={{
                  color: "#93c5fd",
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                }}
              >
                AI-Powered Analytics
              </span>
            </div>
          </div>

          {/* Middle — headline + metrics preview */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 60,
            }}
          >
            {/* Left — headline */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 0,
                flex: 1,
              }}
            >
              <span
                style={{
                  color: "white",
                  fontSize: 60,
                  fontWeight: 800,
                  lineHeight: 1.05,
                  letterSpacing: "-0.03em",
                }}
              >
                Your content,
              </span>
              <span
                style={{
                  fontSize: 60,
                  fontWeight: 800,
                  lineHeight: 1.05,
                  letterSpacing: "-0.03em",
                  background:
                    "linear-gradient(135deg, #3b82f6, #60a5fa, #93c5fd)",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                scored & ranked.
              </span>
              <span
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 20,
                  fontWeight: 400,
                  marginTop: 20,
                  lineHeight: 1.4,
                }}
              >
                Data-backed growth recommendations across
                <br />
                TikTok, Instagram, YouTube & Facebook.
              </span>
            </div>

            {/* Right — score card preview */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 20,
                padding: "32px 36px 28px",
              }}
            >
              {/* Score ring */}
              <div
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: "50%",
                  border: "5px solid #22c55e",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(0,0,0,0.3)",
                  boxShadow: "0 0 50px rgba(34,197,94,0.12)",
                }}
              >
                <span
                  style={{
                    fontSize: 56,
                    fontWeight: 800,
                    color: "white",
                    lineHeight: 1,
                    letterSpacing: "-0.04em",
                  }}
                >
                  84
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.3)",
                    fontWeight: 500,
                  }}
                >
                  /100
                </span>
              </div>
              <span
                style={{
                  color: "#22c55e",
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                }}
              >
                Growth Score
              </span>

              {/* Mini metrics */}
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
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
                      gap: 3,
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: 8,
                      padding: "8px 14px",
                      minWidth: 64,
                    }}
                  >
                    <span
                      style={{
                        color: m.color,
                        fontSize: 18,
                        fontWeight: 800,
                        lineHeight: 1,
                      }}
                    >
                      {m.value}
                    </span>
                    <span
                      style={{
                        color: "rgba(255,255,255,0.25)",
                        fontSize: 9,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom row — URL + platform tags */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                color: "rgba(255,255,255,0.25)",
                fontSize: 16,
                fontWeight: 500,
                letterSpacing: "0.04em",
              }}
            >
              cloutai.co.uk
            </span>

            <div style={{ display: "flex", gap: 8 }}>
              {["TikTok", "Instagram", "YouTube", "Facebook"].map((p) => (
                <div
                  key={p}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 6,
                    padding: "5px 12px",
                    fontSize: 12,
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.4)",
                  }}
                >
                  {p}
                </div>
              ))}
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
            background:
              "linear-gradient(90deg, transparent, #2563eb 20%, #3b82f6 50%, #22c55e 80%, transparent)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
