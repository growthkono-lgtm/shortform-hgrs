import { collectTrends } from "@/lib/blog-trends";
import { cronRoute } from "@/lib/blog-ops";

/**
 * GET /api/blog/trends — 이번 주 시의성 복합키워드를 모은다. (2026-08-18)
 *
 * 주 1회(일요일 아침)만 돈다. 사장님 지시 —
 * *"편성표도 주 단위로 한번씩 업데이트해야겠네. 그래야 진짜 시즌성이겠지."*
 *
 * 매일 돌리지 않는 이유는 둘이다. 소식은 하루 만에 안 바뀌고, 웹검색이
 * 붙은 호출이라 매일이면 편당 원가보다 수집비가 커진다. 주 1회 약 $0.3 이다.
 *
 * 여기서 모은 후보는 **월·목 두 슬롯**에서만 꺼내 쓴다(`SEASONAL_WEEKDAYS`).
 * 나머지 닷새는 지금처럼 니치 자산을 쌓는다.
 *
 * 실패해도 편성은 안 멈춘다 — 후보가 없으면 평소 니치 풀로 돈다.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** 웹검색이 붙어 있어 조사 단계만큼 시간이 걸린다 */
export const maxDuration = 300;

export const GET = cronRoute("trends", async (now) => {
  const result = await collectTrends(now);
  return {
    // 0건은 고장이 아니다. 쓸 만한 소식이 없는 주도 있다
    note: result.added ? `시의성 후보 ${result.added}건 — ${result.note}` : undefined,
    body: result as unknown as Record<string, unknown>,
  };
});
