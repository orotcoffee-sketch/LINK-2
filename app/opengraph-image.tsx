import { ImageResponse } from "next/og";

export const alt = "링크 - 북마크 서비스";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 공유 썸네일. 한글 폰트를 번들하지 않으려고 라틴 글자와 도형만 사용한다.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
          background: "#17958f",
        }}
      >
        <div style={{ width: 72, height: 72, borderRadius: 36, background: "#ffd600" }} />
        <div style={{ fontSize: 200, fontWeight: 700, color: "#ffffff", letterSpacing: -6 }}>LINK</div>
      </div>
    ),
    size,
  );
}
