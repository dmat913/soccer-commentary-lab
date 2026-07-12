import { ImageResponse } from "next/og";

import { KICKLINGO_MARK_DATA_URI } from "@/lib/brand/mark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={KICKLINGO_MARK_DATA_URI} width={140} height={140} alt="" />
      </div>
    ),
    { ...size }
  );
}
