import { ImageResponse } from "next/og";

// Home-screen icon (iOS doesn't use SVG favicons): same mark as app/icon.svg.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff" }}>
        <svg width="180" height="180" viewBox="0 0 64 64">
          <path d="M17 32 L32 18 L47 32 M21 28.5 V46 H28.5 V37 H35.5 V46 H43 V28.5" fill="none" stroke="#3b73c5" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    size,
  );
}
