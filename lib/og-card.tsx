import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

/**
 * 서비스 페이지용 공유 카드. (2026-08-20)
 *
 * 왜 만들었나: 홈과 `/shortform` 은 사이트맵 우선순위 1인데 **공유 이미지가
 * 아예 없었다.** 카카오·슬랙·X 에 링크를 붙이면 그림 없는 맨 카드가 떴고,
 * 루트 레이아웃이 `twitter: summary_large_image` 를 선언해 둔 탓에 그
 * 빈 자리가 더 크게 났다. `/sns-brand` 와 `/portfolio` 만 사진을 갖고 있었다.
 *
 * 블로그 썸네일({@link ./blog-thumbnail.tsx})과 같은 문법으로 그린다 —
 * 검은 지면, 라벨 칩, 큰 제목, 하단에 hgrs.io. 두 그림이 한 브랜드로 보여야 한다.
 * 폰트를 직접 싣는 이유도 같다: satori 는 woff2 를 못 읽고 기본 폰트에 한글이
 * 없어서, 안 주면 제목이 통째로 두부(□□□)가 된다.
 */
export const OG_SIZE = { width: 1200, height: 630 };

/** hgrs.io 브랜드 인디고 */
const ACCENT = "#4F46E5";

export async function renderOgCard({
  label,
  title,
  sub,
}: {
  /** 좌상단 칩 — 어떤 페이지인지 */
  label: string;
  /** 큰 글씨. 페이지 h1 과 같은 말을 쓴다 */
  title: string;
  /** 한 줄 보조 설명 */
  sub: string;
}) {
  const font = await readFile(join(process.cwd(), "app/fonts/og-bold.ttf"));

  // 제목이 길면 줄인다. 1200px 안에서 세 줄을 넘기면 작은 카드에서 안 읽힌다
  const titleSize =
    title.length > 40 ? 58 : title.length > 28 ? 68 : title.length > 18 ? 78 : 88;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a0c",
          padding: "72px 76px",
          position: "relative",
          fontFamily: "Pyeojin",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 10,
            background: ACCENT,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -140,
            bottom: -180,
            width: 520,
            height: 520,
            borderRadius: 999,
            background: ACCENT,
            opacity: 0.22,
            display: "flex",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              display: "flex",
              background: ACCENT,
              color: "#fff",
              fontSize: 26,
              fontWeight: 700,
              padding: "8px 20px",
              borderRadius: 999,
            }}
          >
            {label}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 22,
            maxWidth: 1000,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: titleSize,
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.26,
              letterSpacing: "-0.035em",
              // satori 는 app/globals.css 를 읽지 않는다. 안 주면 "숏폼 부 / 스팅"
              // 처럼 어절 한가운데가 끊긴다
              wordBreak: "keep-all",
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              color: "rgba(255,255,255,0.62)",
              lineHeight: 1.5,
              wordBreak: "keep-all",
            }}
          >
            {sub}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 28,
            color: "rgba(255,255,255,0.6)",
          }}
        >
          <div style={{ display: "flex", color: "#fff", fontWeight: 700 }}>
            해그로시
          </div>
          <div style={{ display: "flex" }}>hgrs.io</div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [{ name: "Pyeojin", data: font, style: "normal", weight: 700 }],
    },
  );
}
