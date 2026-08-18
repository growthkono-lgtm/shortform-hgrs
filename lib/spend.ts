import "server-only";

import { createAdminClient } from "@/lib/supabase/server";

/**
 * 유료 호출 한 줄을 장부에 적는다 — 서버(Next) 쪽. (2026-08-18)
 *
 * `scripts/spend.mjs` 의 짝이다. 스크립트는 맥에서 손으로 돌리는 것이고,
 * 이건 크론·라우트처럼 **사람 없이 도는 것**을 위한 것이다.
 *
 * ── 왜 뒤늦게 만들었나 ────────────────────────────────────────────────
 * 낮에 "돈 나가는 자리를 다 센다" 고 해놓고 영상·이미지만 배선했다. 정작
 * **자동으로 매주 도는 시의성 수집**을 빠뜨렸다. 그날 저녁 사장님이 "20달러
 * 충전했는데 그새 어디서 나가냐" 고 물으셨고, 답은 그 수집이었다 — 장부에
 * 없으니 `cost-doctor` 도 못 봤고 나도 세션 기억으로 복원해야 했다.
 *
 * 사람 없이 도는 것일수록 먼저 적어야 한다. 손으로 돌리는 건 최소한 누가
 * 돌렸는지는 알지만, 크론은 아무도 안 본다.
 */
export async function recordSpend(input: {
  service: "openai" | "fal" | "anthropic";
  kind: "blog" | "trend" | "video" | "image" | "audio" | "vision";
  /** 무엇을 만들었나 (예: "trends/2026-08-18") */
  ref: string;
  usd: number;
  meta?: Record<string, unknown>;
}): Promise<void> {
  // 0원이어도 적는다. "돌았는데 0" 과 "안 돌았다" 는 다르다
  if (!Number.isFinite(input.usd)) return;
  try {
    await createAdminClient()
      .from("spend_log")
      .insert({
        service: input.service,
        kind: input.kind,
        ref: input.ref.slice(0, 200),
        usd: Number(input.usd.toFixed(4)),
        meta: (input.meta ?? {}) as never,
      });
  } catch {
    // 장부를 못 적었다고 본 작업을 죽이지 않는다. 돈은 이미 나갔다
  }
}
