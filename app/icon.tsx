import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000",
          borderRadius: 16,
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <span
          style={{
            color: "#fff",
            fontSize: 38,
            fontWeight: 900,
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          C
        </span>
      </div>
    ),
    { ...size }
  );
}
