import "server-only";

import { monthlySpend } from "@/lib/blog-runner";
import { WEEKLY_SLOTS, kstAddDays, kstMoment, kstParts } from "@/lib/blog-schedule";
import { mailShell, sendMail } from "@/lib/mail";
import { recordSearchSnapshot, searchSummary } from "@/lib/search-console";
import { createAdminClient } from "@/lib/supabase/server";
import { SERVICE } from "@/lib/constants";

/**
 * 저녁 리포트 — 사장님께 가는 **유일한** 블로그 메일. (2026-08-14)
 *
 * 사장님 지시 그대로다: "그저 돈 얼마 나가고 발행이 됐고 조회수 나오고
 * 이런 거 메일 리포트만 오는."
 *
 * 그래서 이 메일에는 **누를 것이 없다.** 링크는 글을 읽으러 가는 것 하나뿐이고,
 * 승인·검수·확인 버튼은 없다. 읽고 덮으면 끝나야 한다.
 *
 * 담는 것은 넷이다.
 *   1. 오늘 나갔나 — 제목·회차·주소
 *   2. 얼마 들었나 — 이번 편 실측, 이번 달 누적
 *   3. 얼마나 읽혔나 — 실제로 센 조회수 (추정치 아님)
 *   4. 걸린 것 — 규격 미달로 보류됐거나 cron 이 실패한 것
 *
 * 3번이 이 리포트에서 제일 조심스러운 자리다. 숫자가 없으면 **없다고 적는다.**
 * "예상 노출" 같은 것을 지어내지 않는다. [[feedback_no_fabricated_metrics]]
 */

const ADMIN = process.env.ADMIN_EMAIL ?? "ceo@h-grs.com";

/** 한국 날짜 문자열 (YYYY-MM-DD) */
function kstDay(at: Date): string {
  const { year, month, day } = kstParts(at);
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** 메일 본문에 원문을 그대로 싣기 전에. 오류 메시지엔 따옴표·꺾쇠가 섞여 있다 */
const escapeHtml = (t: string) =>
  t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);

/** 사장님이 읽는 말로. `research` 라고 적으면 어디서 멈췄는지 안 보인다 */
const STAGE_LABEL: Record<string, string> = {
  research: "조사",
  plan: "기획",
  verify: "자료 검증",
  write: "집필",
  polish: "교정",
  done: "완료",
  failed: "실패",
};

export type ReportResult = { sent: boolean; reason: string };

/**
 * 오늘치 리포트를 보낸다. 이미 보냈으면 다시 보내지 않는다.
 *
 * cron 이 5분마다 부르는데 이력을 안 남기면 저녁에 열 통이 간다.
 * 이력 삽입이 곧 자물쇠다 — `blog_report_log.day` 가 기본키라 두 번째
 * 삽입은 반드시 실패한다. 그 실패가 중복 발송을 막는다.
 */
export async function sendDailyReport(now = new Date()): Promise<ReportResult> {
  const supabase = createAdminClient();
  const day = kstDay(now);

  const { error: claimError } = await supabase
    .from("blog_report_log")
    .insert({ day });
  // 이미 있는 날짜 = 오늘 몫은 나갔다
  if (claimError) return { sent: false, reason: "오늘 리포트는 이미 나갔습니다" };

  const dayStart = kstMoment(now, 0, 0).toISOString();

  /* ── 1. 오늘 나간 글 ─────────────────────────────────────────────── */
  const { data: published } = await supabase
    .from("blog_post")
    .select("title, slug, seq, published_at")
    .eq("status", "published")
    .gte("published_at", dayStart)
    .order("published_at", { ascending: true });

  /* ── 2. 오늘 작업표 ──────────────────────────────────────────────── */
  const { data: job } = await supabase
    .from("blog_job")
    .select("stage, topic, cost_usd, revisions, last_error, audit, post_id")
    .eq("scheduled_for", day)
    .maybeSingle();

  const monthly = await monthlySpend(now);
  const { year, month } = kstParts(now);
  const monthFrom = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const { count: monthlyPosts } = await supabase
    .from("blog_post")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .gte("published_at", `${monthFrom}T00:00:00+09:00`);

  /* ── 3. 조회수 (실측) ────────────────────────────────────────────── */
  const weekAgo = kstDay(kstAddDays(now, -6));
  const { data: views } = await supabase
    .from("blog_view")
    .select("slug, day, views");

  const totalBySlug = new Map<string, number>();
  let weekTotal = 0;
  for (const row of views ?? []) {
    totalBySlug.set(row.slug, (totalBySlug.get(row.slug) ?? 0) + row.views);
    if (row.day >= weekAgo) weekTotal += row.views;
  }

  // 최근에 나간 글 위주로 보여 준다. 전체 목록은 어드민에 있다
  const { data: recent } = await supabase
    .from("blog_post")
    .select("title, slug, seq, published_at")
    .eq("status", "published")
    .eq("kind", "insight")
    .order("published_at", { ascending: false })
    .limit(5);

  /* ── 3-B. 검색 성과 — 이게 이 사업의 진짜 계기판이다 ─────────────── */
  const search = await searchSummary(now);

  /**
   * 읽은 김에 **적어 둔다.** (2026-08-16)
   *
   * 그동안 노출·순위는 화면을 열 때마다 구글에 물어보고 그대로 버렸다.
   * 그래서 "지난주보다 올랐나" 를 아무도 답할 수 없었다 — SEO 는 추이가
   * 전부인데 우리는 매번 스냅숏만 보고 있었다. 하루 한 줄씩 쌓아 둔다.
   */
  await recordSearchSnapshot(search, now);

  /* ── 4. 걸린 것 ─────────────────────────────────────────────────── */
  const { data: fails } = await supabase
    .from("blog_ops_log")
    .select("route, note, at")
    .eq("ok", false)
    .gte("at", new Date(now.getTime() - 24 * 3600 * 1000).toISOString())
    .order("at", { ascending: false })
    .limit(5);

  /* ── 조립 ───────────────────────────────────────────────────────── */
  const auditFailures =
    (job?.audit as { ok?: boolean; failures?: string[] } | null)?.failures ?? [];
  const held =
    job?.stage === "done" && !published?.length && auditFailures.length > 0;

  const row = (label: string, value: string) =>
    `<tr><td style="padding:7px 0;font-size:13px;color:#8a8a8a;width:96px;vertical-align:top">${label}</td>
     <td style="padding:7px 0;font-size:14px;color:#030303">${value}</td></tr>`;

  const publishedBlock = published?.length
    ? published
        .map(
          (p) => `
      <p style="margin:0 0 4px;font-size:12px;color:#8a8a8a">${p.seq ? `#${p.seq}편` : "고객 이야기"}</p>
      <p style="margin:0 0 10px;font-size:17px;font-weight:700;line-height:1.5">${p.title}</p>
      <a href="${SERVICE.url}/blog/${p.slug}" style="font-size:13px;color:#030303">${SERVICE.url.replace("https://", "")}/blog/${p.slug}</a>`,
        )
        .join('<hr style="border:0;border-top:1px solid #eee;margin:16px 0">')
    : held
      ? `<p style="margin:0;font-size:14px;line-height:1.7">오늘은 <b>발행하지 않았습니다.</b><br>
         원고가 규격 검사를 통과하지 못해 자동 승인이 보류됐습니다.</p>
         <p style="margin:10px 0 0;font-size:13px;color:#6b7280;line-height:1.7">${auditFailures.slice(0, 4).map((f) => `· ${f}`).join("<br>")}</p>`
      : /**
         * 왜 안 나갔는지를 여기 적는다. (2026-08-18)
         *
         * 08-17 에 이 칸이 *"오늘 발행 예정 원고가 없습니다"* 한 줄이었다.
         * 그날 원고는 **크레딧이 바닥나 조사에서 죽어 있었는데** 메일 어디에도
         * 그 말이 없었다. 사장님은 이틀 뒤 어드민 표에서 직접 발견하셨다.
         * 이유 없는 "없음" 은 알림이 아니라 소음이다.
         */
        `<p style="margin:0;font-size:14px;line-height:1.7">오늘은 <b>발행하지 않았습니다.</b></p>
         ${
           job
             ? `<table style="margin:12px 0 0;border-collapse:collapse">
                  ${row("멈춘 단계", `${STAGE_LABEL[job.stage] ?? job.stage}${job.stage === "failed" ? " (더 안 돌아감 — 사람이 열어야 함)" : ""}`)}
                  ${row("주제", job.topic ?? "—")}
                  ${job.last_error ? row("원인", `<span style="color:#991b1b">${escapeHtml(String(job.last_error).split("\n")[0].slice(0, 220))}</span>`) : ""}
                </table>
                ${
                  /credit|quota|insufficient|billing/i.test(String(job.last_error ?? ""))
                    ? `<a href="https://platform.openai.com/settings/organization/billing/overview"
                          style="display:inline-block;margin:14px 0 0;background:#0a0a0c;color:#fff;text-decoration:none;padding:11px 22px;border-radius:999px;font-size:13px;font-weight:700">OpenAI 크레딧 충전하기</a>`
                    : ""
                }`
             : `<p style="margin:10px 0 0;font-size:13px;color:#6b7280">오늘 작업표 자체가 만들어지지 않았습니다. 크론이 안 돌았는지 확인이 필요합니다.</p>`
         }`;

  const viewBlock = totalBySlug.size
    ? `<table style="width:100%;border-collapse:collapse">${(recent ?? [])
        .map(
          (p) =>
            `<tr><td style="padding:6px 0;font-size:13px;line-height:1.5">${p.seq ? `#${p.seq} ` : ""}${p.title.slice(0, 34)}${p.title.length > 34 ? "…" : ""}</td>
             <td style="padding:6px 0;font-size:14px;font-weight:700;text-align:right;white-space:nowrap">${(totalBySlug.get(p.slug) ?? 0).toLocaleString()}</td></tr>`,
        )
        .join("")}</table>
       <p style="margin:10px 0 0;font-size:12px;color:#8a8a8a">최근 7일 합계 ${weekTotal.toLocaleString()}회 · 우리 사이트에서 직접 센 값입니다(봇 제외).</p>`
    : `<p style="margin:0;font-size:14px;color:#6b7280">아직 집계된 조회가 없습니다. 지어낸 수치를 대신 적지 않습니다.</p>`;

  /**
   * 검색 성과 — 조회수보다 이쪽이 먼저다.
   *
   * 조회수는 "누가 왔나" 이고 이건 "검색에서 우리가 몇 위인가" 다.
   * SEO 로 리드를 받겠다는 계획에서 판단 근거는 후자뿐이다.
   * 연결 전이면 그 사실을 그대로 적는다 — 0 으로 찍으면 성과가 없는 것처럼 읽힌다.
   */
  const searchBlock = search.ok
    ? `<table style="width:100%;border-collapse:collapse">
         ${row("노출", `${search.impressions.toLocaleString()}회`)}
         ${row("클릭", `${search.clicks.toLocaleString()}회`)}
         ${row("평균 순위", search.position ? `${search.position.toFixed(1)}위` : "—")}
       </table>
       ${
         search.risen.length
           ? `<p style="margin:14px 0 6px;font-size:12px;color:#8a8a8a">순위가 오른 검색어</p>
              <p style="margin:0;font-size:13px;line-height:1.9">${search.risen
                .map((r) => `${r.key} <b style="color:#059669">${r.from}위 → ${r.to}위</b>`)
                .join("<br>")}</p>`
           : ""
       }
       ${
         search.queries.length
           ? `<p style="margin:16px 0 6px;font-size:12px;color:#8a8a8a">노출 상위 검색어</p>
              <table style="width:100%;border-collapse:collapse">${search.queries
                .map(
                  (q) =>
                    `<tr><td style="padding:5px 0;font-size:13px">${q.key}</td>
                     <td style="padding:5px 0;font-size:13px;text-align:right;white-space:nowrap;color:#6b7280">${q.impressions.toLocaleString()}회 · ${Math.round(q.position)}위</td></tr>`,
                )
                .join("")}</table>`
           : ""
       }
       <p style="margin:12px 0 0;font-size:12px;color:#8a8a8a">최근 7일 · Search Console 실측(데이터는 2~3일 지연됩니다)</p>`
    : `<p style="margin:0;font-size:14px;line-height:1.7;color:#6b7280">
         아직 검색 성과를 못 읽고 있습니다 — <b>${search.reason ?? "연결 전"}</b>.<br>
         Search Console → 설정 → 사용자 및 권한에서
         <code style="font-size:12px">${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? "서비스 계정"}</code>
         을 추가하시면 다음 리포트부터 노출·클릭·순위가 여기 찍힙니다.
       </p>`;

  /**
   * 시스템 점검 — 조용한 고장을 잡는 자리. (2026-08-16)
   *
   * `docs/BLOG_CHECKLIST.md` 의 항목 중 **서버가 스스로 셀 수 있는 것**을 매일
   * 여기서 확인한다. 자동화의 위험은 고장이 아니라 조용한 고장이다. 매일 한 편이
   * 나가는 시스템이 멈추면 화면상으로는 아무 일도 안 일어난 것처럼 보인다.
   *
   * 방아쇠(pg_cron) 자체는 여기서 못 센다 — 그건 이 메일이 도착했다는 사실이
   * 곧 증거다. **이 메일이 안 오는 것**이 방아쇠 고장의 신호다.
   */
  const { count: keywordsLeft } = await supabase
    .from("blog_keyword")
    .select("id", { count: "exact", head: true })
    .eq("status", "idle");

  const { count: opsFails } = await supabase
    .from("blog_ops_log")
    .select("id", { count: "exact", head: true })
    .eq("ok", false)
    .gte("at", dayStart);

  const healthLines: [string, boolean, string][] = [
    [
      "규격 검사",
      auditFailures.length === 0,
      auditFailures.length === 0 ? "통과" : `미달 ${auditFailures.length}건`,
    ],
    [
      "성과 측정",
      search.ok,
      search.ok ? "구글 서치콘솔 연결됨 · 오늘치 기록함" : "못 읽는 중",
    ],
    [
      "남은 주제",
      (keywordsLeft ?? 0) > 30,
      `${(keywordsLeft ?? 0).toLocaleString()}개`,
    ],
    [
      "이번 달 예산",
      monthly < 64,
      `$${monthly.toFixed(2)} / $80`,
    ],
    ["오늘 오류", (opsFails ?? 0) === 0, `${opsFails ?? 0}건`],
  ];

  const healthBlock = `<table style="width:100%;border-collapse:collapse">${healthLines
    .map(
      ([label, ok, value]) =>
        `<tr><td style="padding:6px 0;font-size:13px;color:#8a8a8a;width:96px">${label}</td>
         <td style="padding:6px 0;font-size:13px;color:${ok ? "#030303" : "#b45309"}">${ok ? "✓" : "⚠"} ${value}</td></tr>`,
    )
    .join("")}</table>`;

  const failBlock = fails?.length
    ? `<p style="margin:0 0 8px;font-size:13px;color:#8a8a8a">최근 24시간 자동화 오류 ${fails.length}건</p>
       <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.7">${fails
         .map((f) => `· [${f.route}] ${String(f.note ?? "").slice(0, 120)}`)
         .join("<br>")}</p>`
    : "";

  const section = (title: string, body: string) => `
    <p style="margin:28px 0 10px;font-size:12px;color:#8a8a8a;letter-spacing:0.06em">${title}</p>
    ${body}`;

  const html = mailShell(`
    <p style="margin:0 0 4px;font-size:12px;color:#8a8a8a;letter-spacing:0.04em">해그로시 블로그 · 자동 운영 리포트</p>
    <p style="margin:0 0 8px;font-size:20px;font-weight:800">${day}</p>
    <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.7">
      원고 작성 · 규격 검사 · 발행까지 사람 손이 닿지 않았습니다.<br>이 메일에 하실 일은 없습니다.
    </p>

    ${section("발행", publishedBlock)}

    ${section(
      "비용",
      `<table style="width:100%;border-collapse:collapse">
        ${row("이번 편", job?.cost_usd != null ? `$${Number(job.cost_usd).toFixed(2)}${job.revisions ? ` (교정 ${job.revisions}회 포함)` : ""}` : "—")}
        ${row("이번 달", `$${monthly.toFixed(2)} · ${monthlyPosts ?? 0}편 발행`)}
        ${row("편당 평균", monthlyPosts ? `$${(monthly / monthlyPosts).toFixed(2)}` : "—")}
      </table>`,
    )}

    ${section("검색 성과", searchBlock)}

    ${section("조회수", viewBlock)}

    ${section("시스템 점검", healthBlock)}

    ${failBlock ? section("걸린 것", failBlock) : ""}

    <p style="margin:32px 0 0;font-size:12px;color:#9ca3af;line-height:1.7">
      비용은 OpenAI 공시 단가에 실사용 토큰을 곱한 값입니다.<br>
      전체 편성표와 원고는 <a href="${SERVICE.url}/admin/blog" style="color:#9ca3af">어드민</a>에 있습니다.
    </p>
  `);

  /**
   * **제목은 앞 8자로 판단이 끝나야 한다.** (2026-08-21)
   *
   * 사장님: *"그것들이 다 쌓이니까 정신이 없네 메일함이. … 차라리 메일제목이라도
   * 아주 짧게 해서 정리할까? 빠르게 읽고 그러려니 하게."*
   *
   * 그래서 `블로그 ✅` / `블로그 ⚠️` / `블로그 🚨` 세 가지로 앞을 고정한다.
   * 날짜는 `8/20` 처럼 줄이고(연도는 메일 목록에 이미 있다), 뒤에 한 마디만.
   * 모바일 메일함은 제목을 30자쯤에서 자른다 — 그 안에 판단이 끝나야 한다.
   *
   *   블로그 ✅ 8/20 #6편
   *   블로그 ⚠️ 8/20 발행 없음
   *   블로그 🚨 8/20 크레딧 소진
   */
  const md = day.slice(5).replace(/^0/, "").replace("-0", "-").replace("-", "/");
  const subject = published?.length
    ? `블로그 ✅ ${md}${published[0].seq ? ` #${published[0].seq}편` : ""}`
    : held
      ? `블로그 ⚠️ ${md} 규격 미달`
      : /credit|quota|insufficient|billing/i.test(String(job?.last_error ?? ""))
          ? `블로그 🚨 ${md} 크레딧 소진`
          : job?.stage === "failed"
            ? `블로그 🚨 ${md} 생성 실패`
            : `블로그 ⚠️ ${md} 발행 없음`;

  const result = await sendMail({ kind: "other", to: ADMIN, subject, html });

  if (!result.ok) {
    // 자물쇠를 도로 푼다. 안 그러면 발송이 한 번 실패했을 때 그날 리포트가
    // 영영 안 간다 — 자물쇠는 중복을 막으라고 둔 것이지 침묵하라고 둔 게 아니다
    await supabase.from("blog_report_log").delete().eq("day", day);
    return { sent: false, reason: result.error ?? "발송 실패" };
  }

  await supabase
    .from("blog_report_log")
    .update({ summary: subject })
    .eq("day", day);

  return { sent: true, reason: subject };
}

/** 오늘이 리포트를 보낼 날인가 — 편성일(월·수·목)만 */
export function isReportDay(now: Date): boolean {
  return WEEKLY_SLOTS.some((s) => s.weekday === kstParts(now).weekday);
}
