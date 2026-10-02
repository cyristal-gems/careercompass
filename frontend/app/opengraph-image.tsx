import { BrandMark } from "@/components/brand-mark";
import { ImageResponse } from "next/og";
export const alt = "CareerCompass — Your job search, in focus.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 80,
        background: "#080A08",
        color: "#F4F8EE",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <span
          style={{
            display: "flex",
            background: "#C5F467",
            color: "#080A08",
            borderRadius: 20,
            padding: 20,
            fontSize: 56,
          }}
        >
          <BrandMark />
        </span>
        <span style={{ fontSize: 64 }}>CareerCompass</span>
      </div>
      <div style={{ fontSize: 64, marginTop: 52 }}>
        Your job search, in focus.
      </div>
      <div style={{ fontSize: 26, marginTop: 28, color: "#B9C3B3" }}>
        Applications. Interviews. Follow-ups. Clarity.
      </div>
    </div>,
    size,
  );
}
