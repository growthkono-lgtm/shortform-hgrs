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
/**
 * 입력 길이 상한. (2026-08-20 과금 점검에서 나옴)
 *
 * 이 라우트는 `claude-opus-5` 를 `max_tokens: 16000` 으로 부르는데, 가드가
 * `requireProfile()` 하나뿐이라 **로그인만 하면 아무나 무제한으로** 부를 수
 * 있었다. 입력 하한(50자)만 있고 상한이 없어 한 번에 수십만 자를 밀어 넣는
 * 것도 막히지 않았다. 돈 쓰는 라우트 중 유일하게 상한 밖에 있던 곳이다.
 */
const MAX_INPUT_CHARS = 20_000;
/** 사용자당 하루 호출 수. 인스턴스 메모리라 완벽하진 않지만 폭주는 막는다 */
const MAX_CALLS_PER_DAY = 20;
const calls = new Map<string, { day: string; n: number }>();

function overQuota(userId: string): boolean {
  const day = new Date().toISOString().slice(0, 10);
  const cur = calls.get(userId);
  if (!cur || cur.day !== day) {
    calls.set(userId, { day, n: 1 });
    return false;
  }
  cur.n += 1;
  return cur.n > MAX_CALLS_PER_DAY;
}

export async function POST(request: NextRequest) {
  const profile = await requireProfile();

  if (overQuota(String(profile?.id ?? "anon"))) {
    return NextResponse.json(
      { error: "오늘 분석 횟수를 모두 쓰셨습니다. 내일 다시 시도해 주세요." },
      { status: 429 },
    );
  }

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
      const pageText = (await fetchPageText(body.url.trim())).slice(0, MAX_INPUT_CHARS);
      const profile = await analyzeBrand({
        kind: "url",
        url: body.url.trim(),
        pageText,
      });
      return NextResponse.json({ profile });
    }

    if (body.kind === "text") {
      const text = (body.text?.trim() ?? "").slice(0, MAX_INPUT_CHARS);
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
