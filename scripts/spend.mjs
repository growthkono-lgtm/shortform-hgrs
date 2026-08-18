/**
 * 유료 호출 한 줄을 장부에 적는다. (2026-08-18)
 *
 * 사장님 지시: *"다 계산해야지 앞으로는."*
 *
 * 블로그는 `blog_job.cost_usd` 에 편당 원가가 실측으로 쌓여 있었는데, 영상·
 * 이미지는 어디에도 안 적혔다. 그래서 8/15~8/16 사흘에 두 계정이 마이너스로
 * 갈 때까지 아무도 몰랐다(OpenAI -$13.70 / fal -$7.10).
 *
 * 적는 규칙은 하나다 — **실측만 적는다.** fal 은 호출 전후 잔액 차분이고,
 * OpenAI 는 공시 단가에 실사용량을 곱한 값이다. 모르면 안 적는 게 아니라
 * `meta` 에 모른다고 적는다. [[feedback_no_fabricated_metrics]]
 *
 * 장부에 적다가 생성을 죽이지 않는다. 실패하면 경고만 찍고 넘어간다 —
 * 이미 돈은 나갔고, 그걸 못 적었다고 결과물까지 버리면 손해가 두 배다.
 */
const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * @param {"openai"|"fal"|"anthropic"} service 어느 계정에서 나갔나
 * @param {"blog"|"video"|"image"|"audio"|"vision"} kind 무엇에 썼나
 * @param {string} ref 무엇을 만들었나 (예: "feliway/scene07")
 * @param {number} usd 실제 차감액
 * @param {Record<string, unknown>} [meta] 재현·검증용 원재료
 */
export async function recordSpend(service, kind, ref, usd, meta = {}) {
  if (!URL_BASE || !KEY) {
    console.warn("  [장부] Supabase 환경변수가 없어 못 적었습니다");
    return;
  }
  try {
    const r = await fetch(`${URL_BASE}/rest/v1/spend_log`, {
      method: "POST",
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        service,
        kind,
        ref,
        usd: Number(usd.toFixed(4)),
        meta,
      }),
    });
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
    console.log(`  [장부] ${service}/${kind} ${ref} $${usd.toFixed(3)}`);
  } catch (e) {
    // 돈은 이미 나갔다. 장부를 못 적었다고 결과물까지 버리지 않는다
    console.warn(`  [장부] 기록 실패 — ${String(e).slice(0, 120)}`);
  }
}
