import { ImageResponse } from "next/og";

import { KICKLINGO_MARK_DATA_URI } from "@/lib/brand/mark";

export const alt = "KickLingo — Learn football commentary English";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
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
          background: "linear-gradient(135deg, #ffffff 0%, #DCFCE7 100%)",
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 28 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={KICKLINGO_MARK_DATA_URI} width={168} height={168} alt="" />
          <div style={{ display: "flex", fontSize: 128, fontWeight: 800, letterSpacing: -2 }}>
            <span style={{ color: "#0F172A" }}>Kick</span>
            <span style={{ color: "#16A34A" }}>Lingo</span>
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 40, color: "#334155", fontWeight: 500 }}>
          Learn football commentary English.
        </div>
      </div>
    ),
    { ...size }
  );
}
