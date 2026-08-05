import { NextResponse, type NextRequest } from "next/server";
import { requireProfile } from "@/lib/supabase/auth";
import { analyzeBrand } from "@/lib/growth-ai";
import { fetchPageText } from "@/lib/fetch-page";

/** 분석은 수 초~수십 초 걸린다 */
export const maxDuration = 300;

/**
 * 브랜드 프로필 자동 분석 (PART F9 용도 ①).
 * 로그인 사용자만. 결과는 저장하지 않고 돌려주기만 한다 — 검수 후 확정은 별도 액션.
 */
export async function POST(request: NextRequest) {
  await requireProfile();

  let body: { kind?: string; url?: string; text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  try {
    if (body.kind === "url") {
      if (!body.url?.trim()) {
        return NextResponse.json({ error: "주소를 입력해 주세요." }, { status: 400 });
      }
      const pageText = await fetchPageText(body.url.trim());
      const profile = await analyzeBrand({
        kind: "url",
        url: body.url.trim(),
        pageText,
      });
      return NextResponse.json({ profile });
    }

    if (body.kind === "text") {
      const text = body.text?.trim() ?? "";
      if (text.length < 50) {
        return NextResponse.json(
          { error: "분석하려면 최소 50자 이상 입력해 주세요." },
          { status: 400 },
        );
      }
      const profile = await analyzeBrand({ kind: "text", text });
      return NextResponse.json({ profile });
    }

    return NextResponse.json({ error: "지원하지 않는 입력입니다." }, { status: 400 });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "분석 중 문제가 발생했습니다.";
    console.error("[growth-ai]", e);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
