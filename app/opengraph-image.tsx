import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          background: "linear-gradient(135deg, #fdf6e6 0%, #f3c05f 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              display: "flex",
              width: 110,
              height: 110,
              borderRadius: 28,
              background: "#1a1a1a",
              color: "#fdf6e6",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 56,
              fontWeight: 700,
            }}
          >
            T
          </div>
          <div style={{ display: "flex", fontSize: 96, fontWeight: 700, color: "#1a1a1a" }}>
            Trézo
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 36, color: "#3a3a3a" }}>
          Centrale Lille Associations
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#5a5a5a" }}>
          Soldes · Subventions · Notes de frais
        </div>
      </div>
    ),
    { ...size },
  );
}
