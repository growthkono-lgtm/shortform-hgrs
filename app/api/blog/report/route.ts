import { recordDueMetrics } from "@/lib/blog-metrics";
import { cronRoute } from "@/lib/blog-ops";
import { isReportDay, sendDailyReport } from "@/lib/blog-report";
import { kstParts } from "@/lib/blog-schedule";

/**
 * GET /api/blog/report — 저녁 리포트 한 통. (2026-08-14)
 *
 * 이 자동화에서 사장님께 가는 **유일한 메일**이다. cron-job.org 가 5분마다
 * 부르고, 편성일 저녁 18시가 지나면 그날 몫 한 통을 보낸다.
 *
 * 왜 18시인가: 발행이 17시라 그 결과를 담아야 하고, 조용시간(20시)이 오기
 * 전에 나가야 한다. 그 사이 두 시간이 리포트 자리다.
 *
 * 중복 발송은 `blog_report_log` 가 막는다 — 자세한 건 `lib/blog-report.ts`.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 발행(17시)이 끝난 뒤 */
const REPORT_HOUR = 18;

export const GET = cronRoute("report", async (now, request) => {
  /**
   * `?force=1` — 시각·요일 조건을 건너뛰고 지금 한 통 보낸다.
   *
   * 두 가지로 쓴다. (1) 리포트 서식을 고친 뒤 실제로 어떻게 도착하는지 확인,
   * (2) "오늘 어떻게 됐는지 지금 보고 싶다" 는 요청. `CRON_SECRET` 뒤에 있어서
   * 아무나 부를 수 없고, 하루 한 통 제한은 그대로 걸린다.
   */
  const force = new URL(request.url).searchParams.get("force") === "1";

  if (!force && !isReportDay(now)) {
    return { body: { skipped: "편성일이 아닙니다" } };
  }
  if (!force && kstParts(now).hour < REPORT_HOUR) {
    return { body: { skipped: `${REPORT_HOUR}시 전` } };
  }

  /**
   * 성적 측정을 리포트보다 **먼저** 돌린다. (2026-08-18)
   *
   * 순서가 중요하다 — 오늘 D+7·21·60 을 맞은 글이 있으면 그 값이 오늘 리포트에
   * 실려야 한다. 뒤에 두면 하루 늦게 보고된다.
   *
   * 리포트 발송 자물쇠 **바깥**에 둔 것도 일부러다. 리포트가 이미 나갔거나
   * 발송에 실패해도 측정은 돌아야 한다 — 놓친 측정은 영영 못 되살린다.
   */
  const metrics = await recordDueMetrics(now);

  const result = await sendDailyReport(now);
  return {
    note: [
      result.sent ? result.reason : null,
      metrics.measured ? `성적 측정 ${metrics.measured}건 — ${metrics.note}` : null,
    ]
      .filter(Boolean)
      .join(" · ") || undefined,
    body: { ...result, metrics } as unknown as Record<string, unknown>,
  };
});
