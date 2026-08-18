import { cronRoute } from "@/lib/blog-ops";
import { stepOnce } from "@/lib/blog-runner";
import { NOTICE_HOUR, kstParts } from "@/lib/blog-schedule";

/**
 * GET /api/blog/generate — 원고를 한 칸씩 만든다. (2026-08-14)
 *
 * cron-job.org 가 5분 간격으로 부른다. 한 번 부를 때마다
 * 조사 → 기획 → 검증 → 집필 → 교정 중 **한 단계**만 밟고 끊는다.
 * 예닐곱 번 부르면 원고가 승인까지 끝나 있다.
 *
 * 한 호출에 다 하지 않는 이유는 `lib/blog-runner.ts` 머리말에 적어 뒀다 —
 * 요약하면 Vercel 함수 300초 제한과, 중간에 죽었을 때 가장 비싼 조사를
 * 다시 태우지 않기 위해서다.
 *
 * ── 잠금을 풀었다 (2026-08-14) ────────────────────────────────────────
 * 이 라우트는 원래 `BLOG_AUTOGEN=on` 이 없으면 아무것도 안 했다. 앤트로픽
 * 크레딧을 쓰지 않기로 했기 때문이고, 원고는 맥에서 도는 Claude Code 가 썼다.
 *
 * 그 방식이 두 가지로 무너졌다. (1) 앤트로픽 크레딧이 바닥나 08-14 새벽에
 * 작업표가 세 번 다 죽었고, (2) 맥이 켜져 있어야 한다는 조건 자체가
 * "사장님이 아무것도 안 하셔도 되는" 자동화와 맞지 않는다.
 *
 * 엔진을 OpenAI 로 바꾸고 잠금을 기본 해제로 뒤집는다. 끄는 스위치는 남긴다 —
 * `BLOG_AUTOGEN=off` 를 넣으면 이 라우트는 즉시 조용해진다.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** 한 단계가 최대 4.5분이라 함수도 그만큼 살아 있어야 한다 */
export const maxDuration = 300;

export const GET = cronRoute("generate", async (now, request) => {
  /**
   * `?force=1` — 15시 제한을 건너뛴다.
   *
   * 서버에서 파이프라인이 실제로 도는지 확인하려면 시각과 무관하게 한 번은
   * 밟아 봐야 한다. 아침에 처음 돌렸다가 조용히 실패하면 그날 하루가 빈다.
   * `CRON_SECRET` 뒤에 있어서 아무나 부를 수 없고, 비용 상한은 그대로 걸린다.
   */
  const force = new URL(request.url).searchParams.get("force") === "1";
  if (process.env.BLOG_AUTOGEN === "off") {
    return { body: { skipped: "BLOG_AUTOGEN=off 로 꺼져 있습니다" } };
  }

  /**
   * 15시가 지나면 새 단계를 시작하지 않는다.
   *
   * 발행이 17시라 그 뒤에 시작해 봐야 제때 못 낸다. 반쯤 만든 원고를 붙들고
   * 돈만 쓰느니 멈추는 게 낫다. 작업표는 남아 있으니 다음 발행일에 이어 간다.
   */
  if (!force && kstParts(now).hour >= NOTICE_HOUR) {
    return { body: { skipped: `${NOTICE_HOUR}시 이후에는 새 단계를 시작하지 않습니다` } };
  }

  const result = await stepOnce(now);

  // "할 일 없음" 은 하루 288번 나온다. 그건 안 적는다
  return {
    note: result.jobId ? `${result.from} → ${result.to} · ${result.note}` : undefined,
    ok: result.ok,
    body: result as unknown as Record<string, unknown>,
  };
});
