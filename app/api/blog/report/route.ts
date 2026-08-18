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

  /**
   * 성적 측정은 **조기 반환보다 위**에 둔다. (2026-08-18)
   *
   * 처음에 리포트 발송 직전에 뒀다가 한 번도 안 돌았다 — 이 라우트는 하루
   * 대부분 "18시 전" 으로 즉시 빠져나가기 때문이다. 리포트는 하루 한 통이면
   * 되지만 측정은 **그날 안에** 돌아야 하고, 놓친 측정은 영영 못 되살린다.
   *
   * 잴 차례인 글이 없으면 DB 조회 두 번으로 끝난다. 매 틱 불려도 싸다.
   */
  const metrics = await recordDueMetrics(now);
  const metricNote = metrics.measured
    ? `성적 측정 ${metrics.measured}건 — ${metrics.note}`
    : undefined;

  if (!force && !isReportDay(now)) {
    return { note: metricNote, body: { skipped: "편성일이 아닙니다", metrics } };
  }
  if (!force && kstParts(now).hour < REPORT_HOUR) {
    return { note: metricNote, body: { skipped: `${REPORT_HOUR}시 전`, metrics } };
  }

  const result = await sendDailyReport(now);
  return {
    note: [result.sent ? result.reason : null, metricNote]
      .filter(Boolean)
      .join(" · ") || undefined,
    body: { ...result, metrics } as unknown as Record<string, unknown>,
  };
});
