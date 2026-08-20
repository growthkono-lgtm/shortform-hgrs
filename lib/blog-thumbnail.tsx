import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { getPost } from "@/lib/blog-posts";
import { editorFor, pillar } from "@/lib/blog-spec";

/**
 * 글마다 자동 생성되는 썸네일. (2026-08-13)
 *
 * 이 한 장이 세 곳에서 동시에 쓰인다 —
 *  · `/blog` 목록 카드
 *  · 구글 검색의 이미지 탭
 *  · 카카오·슬랙·링크드인에 링크를 붙였을 때의 미리보기
 *
 * 그래서 **제목이 크게 읽히는 것**이 제일 중요하다. 예쁜 그래픽보다
 * 작은 썸네일로 줄었을 때 제목 글자가 살아 있느냐가 클릭을 만든다.
 *
 * 디자이너가 매번 만들지 않아도 되게 코드로 그린다. 글이 늘어도 손이 안 간다.
 *
 * 폰트를 직접 실어 나르는 이유: 이 그림을 그리는 satori 는 woff2 를 못 읽고,
 * 기본 내장 폰트에는 한글이 없다. 폰트를 안 주면 제목이 통째로 두부(□□□)가 된다.
 * `app/fonts/og-bold.ttf` 는 본문 폰트에서 한글·라틴만 남긴 판이다.
 */
export const THUMBNAIL_SIZE = { width: 1200, height: 630 };

/**
 * 같은 그림을 두 곳이 부른다 —
 *  · `opengraph-image` (공유 미리보기·검색 이미지). Next 가 파일명에 해시를
 *    붙이기 때문에 URL 을 손으로 적을 수 없다.
 *  · `/api/blog/thumbnail/[slug]` (목록 카드). 이쪽은 주소가 고정이라야 한다.
 *
 * 그래서 그리는 코드는 여기 한 벌만 둔다. 두 벌로 두면 목록 썸네일과
 * 공유 미리보기가 서로 다른 그림이 되는 순간이 반드시 온다.
 */
export async function renderThumbnail(slug: string) {
  const post = await getPost(slug);

  const font = await readFile(
    join(process.cwd(), "app/fonts/og-bold.ttf"),
  );

  const title = post?.title ?? "해그로시 인사이트";
  const label = post ? pillar(post.pillar).label : "인사이트";
  const editor = editorFor(slug);

  // 제목이 길면 글자를 줄인다. 1200px 안에서 3줄을 넘기면 읽히지 않는다
  const titleSize =
    title.length > 58 ? 52 : title.length > 44 ? 60 : title.length > 30 ? 70 : 82;

  const size = THUMBNAIL_SIZE;

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
        {/* 에디터 색 — 글마다 다른 인상을 준다 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 10,
            background: editor.tone,
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
            background: editor.tone,
            opacity: 0.22,
            display: "flex",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              display: "flex",
              background: editor.tone,
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
            fontSize: titleSize,
            fontWeight: 800,
            color: "#fff",
            lineHeight: 1.28,
            letterSpacing: "-0.035em",
            maxWidth: 1000,
            // satori 는 app/globals.css 를 읽지 않아 keep-all 을 인라인으로 줘야 한다.
            // 없으면 제목 어절이 한가운데서 끊긴다
            wordBreak: "keep-all",
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 28,
            color: "rgba(255,255,255,0.6)",
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ display: "flex", color: "#fff", fontWeight: 700 }}>
              해그로시
            </div>
            <div style={{ display: "flex" }}>hgrs.io</div>
          </div>
          <div style={{ display: "flex" }}>{editor.name}</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Pyeojin", data: font, style: "normal", weight: 700 }],
    },
  );
}
