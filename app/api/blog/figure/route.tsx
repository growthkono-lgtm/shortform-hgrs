import { NextResponse } from "next/server";

import { renderFigure, type FigureSpec } from "@/lib/blog-figure";

/**
 * GET /api/blog/figure?s=<base64url(JSON)> — 본문 도해 PNG. (2026-08-22)
 *
 * 사양을 URL 에 실어 보내는 이유: 도해는 글마다 내용이 다르고, 미리 파일로
 * 구워 두면 원고를 고칠 때마다 그림이 어긋난다. 주소가 곧 사양이라
 * **본문과 그림이 갈라질 수 없다.**
 *
 * 이미지 검색에 걸려야 하므로 캐시를 길게 준다. 같은 주소면 같은 그림이다.
 */
export const runtime = "nodejs";

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("s");
  if (!raw) return NextResponse.json({ error: "s 파라미터가 없습니다" }, { status: 400 });

  let spec: FigureSpec;
  try {
    spec = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as FigureSpec;
  } catch {
    return NextResponse.json({ error: "사양을 읽지 못했습니다" }, { status: 400 });
  }
  if (!spec?.kind || !spec?.title) {
    return NextResponse.json({ error: "kind·title 이 필요합니다" }, { status: 400 });
  }

  const res = await renderFigure(spec);
  res.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return res;
}
