import Link from "next/link";

import { keywordSummary, listKeywords, scheduleBoard } from "@/lib/blog-admin";
import { MAX_COST_PER_MONTH_USD, monthlySpend } from "@/lib/blog-runner";
import { PILLARS, leadTargetOf, segment } from "@/lib/blog-spec";
import { PUBLISH_HOUR, kstParts } from "@/lib/blog-schedule";
import { TRACK_BY_WEEKDAY } from "@/lib/keyword-filter";
import { dropKeyword } from "./actions";
import { searchConsoleConfigured } from "@/lib/search-console";
import { searchSummary } from "@/lib/search-console";

/**
 * /admin/blog — 발행 예정표 + 키워드 보드.
 *
 * 이 화면이 답해야 하는 질문 두 개:
 *  · "다음에 뭘 쓸까" → **니치 점수**로 정렬된 키워드 (검색량순이 아니다)
 *  · "언제 뭐가 나가나" → 월·수·목 슬롯에 회차가 붙었는지
 *
 * 08-13 첫 판은 검색량 상위 60개만 보여 줬다. 그러면 큰 키워드만 보이고
 * 정작 지금 이길 수 있는 니치가 안 보인다(사장님 지적). 전체를 쪽으로 넘기고,
 * 기본 정렬을 니치 점수로 바꿨다.
 *
 * 수치는 네이버 검색광고 키워드도구 실측이다(scripts/keyword-sync.mjs).
 */
export const metadata = { title: "블로그" };

/**
 * 체류 초를 사람 말로. (2026-08-22)
 * 60초 미만은 초로, 그 위는 분·초로 적는다 — "185초" 는 읽고 나서
 * 다시 계산해야 하지만 "3분 5초" 는 그대로 감이 온다.
 */
function dwellText(sec: number): string {
  if (sec < 60) return `${sec}초`;
  const m = Math.floor(sec / 60);
  const r = sec % 60;
  return r ? `${m}분 ${r}초` : `${m}분`;
}

const nf = new Intl.NumberFormat("ko-KR");

const compTone: Record<string, string> = {
  낮음: "text-emerald-700 bg-emerald-50",
  중간: "text-amber-700 bg-amber-50",
  높음: "text-muted bg-ink/[0.04]",
};

/**
 * 트랙 배지 — 그날 편성이 무엇을 노리는가. (2026-08-19)
 *
 * 예전엔 요일별 난이도("니치"/"빅")를 찍었다. 난이도는 이길 수 있는지만
 * 말하고 **왜 그 검색어를 먹어야 하는지**는 말하지 않는다. 그래서 실제로
 * `포장지제작`(월 540) 이 1순위로 뽑히고 있었다.
 */
const TRACK_LABEL: Record<string, string> = {
  core: "코어 반복",
  niche: "니치 확보",
  big: "빅 장기전",
  convert: "전환 직결",
};

const diffTone: Record<string, string> = {
  core: "text-rose-700 bg-rose-50",
  niche: "text-emerald-700 bg-emerald-50",
  convert: "text-amber-700 bg-amber-50",
  big: "text-violet-700 bg-violet-50",
};

function Delta({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted/40">—</span>;
  if (value === 0) return <span className="text-muted/50">0</span>;
  const up = value > 0;
  return (
    <span className={up ? "text-emerald-600" : "text-rose-600"}>
      {up ? "▲" : "▼"}
      {nf.format(Math.abs(value))}
    </span>
  );
}

/** 쪽번호 — 앞뒤 2쪽씩과 처음·끝만 보여 준다. 538개를 다 찍으면 화면이 깨진다 */
function pageNumbers(page: number, pages: number): (number | "…")[] {
  const out: (number | "…")[] = [];
  for (let i = 1; i <= pages; i += 1) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 2) out.push(i);
    else if (out[out.length - 1] !== "…") out.push("…");
  }
  return out;
}

export default async function AdminBlogPage(props: PageProps<"/admin/blog">) {
  const sp = await props.searchParams;
  const page = Number(sp.page ?? 1) || 1;
  const difficulty =
    typeof sp.difficulty === "string" ? sp.difficulty : undefined;
  const sort = sp.sort === "volume" ? "volume" : "niche";

  const [summary, board, keywords, spend, search] = await Promise.all([
    keywordSummary(),
    scheduleBoard(3),
    listKeywords({ page, difficulty, sort, perPage: 50 }),
    monthlySpend(),
    searchSummary(),
  ]);

  /**
   * 이번 주 깔때기 합계. (2026-08-19)
   *
   * 편성표 행이 이미 글별 값을 들고 있으므로 여기서 더하기만 한다. 한 글도
   * 집계되지 않았으면 `weekStart` 가 null 이고, 화면은 0 대신 "아직 안 쟀다"
   * 를 적는다 — 둘은 다른 말이다.
   */
  const funnel = board.reduce(
    (acc, r) => {
      if (!r.funnel) return acc;
      acc.weekStart ??= r.funnel.weekStart;
      acc.impressions += r.funnel.impressions;
      acc.clicks += r.funnel.clicks;
      acc.views += r.funnel.views;
      acc.visitors += r.funnel.visitors;
      if (r.funnel.dwellSec !== null) acc.dwells.push(r.funnel.dwellSec);
      acc.inquiries += r.funnel.inquiries;
      acc.assists += r.funnel.assists;
      acc.lastTouch += r.funnel.lastTouch;
      if (r.funnel.position !== null) acc.ranked.push(r.funnel.position);
      return acc;
    },
    {
      weekStart: null as string | null,
      impressions: 0,
      clicks: 0,
      views: 0,
      visitors: 0,
      dwells: [] as number[],
      inquiries: 0,
      assists: 0,
      lastTouch: 0,
      ranked: [] as number[],
    },
  );

  /**
   * 전체 체류 중앙값 — 글별 중앙값들의 중앙값이다. 정확히는 표본 전체의
   * 중앙값과 다르지만, 글마다 표본이 한두 개인 지금은 이게 덜 흔들린다.
   * 표본이 쌓이면 원자료에서 다시 재는 쪽으로 옮긴다.
   */
  const medianDwell = (() => {
    if (!funnel.dwells.length) return null;
    const sorted = [...funnel.dwells].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2
      ? sorted[mid]
      : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  })();

  const qs = (over: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const merged = { difficulty, sort, page, ...over };
    for (const [k, v] of Object.entries(merged)) {
      if (v !== undefined && v !== "" && !(k === "page" && v === 1)) {
        p.set(k, String(v));
      }
    }
    const s = p.toString();
    return s ? `/admin/blog?${s}` : "/admin/blog";
  };

  return (
    <div className="flex flex-col gap-10">
      <header>
        <h1 className="text-xl font-bold">블로그</h1>
        <p className="mt-2 text-sm text-muted">
          키워드 {nf.format(summary.total)}개 · 필러 배정{" "}
          {nf.format(summary.assigned)} · 발행 완료 {nf.format(summary.used)}
          {summary.refreshedAt && (
            <>
              {" · "}지표 갱신{" "}
              {new Date(summary.refreshedAt).toLocaleDateString("ko-KR", {
                timeZone: "Asia/Seoul",
                month: "2-digit",
                day: "2-digit",
              })}
            </>
          )}
        </p>
        <p className="mt-1 text-xs text-muted/70">
          난이도 —{" "}
          {Object.entries(summary.byDifficulty)
            .map(([k, v]) => `${k} ${v}`)
            .join(" · ")}
        </p>

        {/**
         * CSV 내려받기. (2026-08-19 사장님 지시)
         *
         * 화면 표는 쪽당 50개로 잘려 있어 "검색량 500 미만 전부" 같은 판단을
         * 못 한다. 전체를 받아 엑셀에서 필터를 거는 게 맞다.
         * 링크 한 줄이면 되므로 버튼 컴포넌트를 따로 두지 않는다.
         */}
        <p className="mt-3 flex flex-wrap gap-2">
          <a
            href="/api/blog/export?kind=keywords"
            className="rounded-lg border border-line px-3.5 py-2 text-xs font-bold hover:border-ink"
          >
            키워드 전체 CSV ({nf.format(summary.total)}개)
          </a>
          <a
            href="/api/blog/export?kind=schedule"
            className="rounded-lg border border-line px-3.5 py-2 text-xs font-bold hover:border-ink"
          >
            편성표 전체 CSV
          </a>
        </p>
      </header>

      {/**
       * Search Console 연결 상태.
       *
       * 순위·노출 열이 비어 있으면 사장님은 "성과가 없다" 로 읽는다. 실제로는
       * **권한이 없어서 못 읽는 것**이라 그 차이를 화면에 적어 둔다.
       * 서비스 계정 주소도 여기 띄운다 — 그 값은 Vercel 에서 Sensitive 로
       * 잠겨 있어 대시보드에서도 다시 볼 수 없다. 서버만 알고 있다.
       */}
      {!search.ok && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <h2 className="text-sm font-bold text-amber-900">
            검색 순위를 아직 못 읽고 있습니다
          </h2>
          <p className="mt-2 text-xs leading-[1.8] text-amber-900">
            {search.reason ?? "연결 전"} — 그래서 아래 표의 <b>노출·순위</b> 칸이
            비어 있습니다. 성과가 없는 게 아니라 <b>측정이 안 되는</b> 상태입니다.
          </p>
          <ol className="mt-3 space-y-1.5 text-xs leading-[1.8] text-amber-900">
            <li>
              1.{" "}
              <a
                href="https://search.google.com/search-console"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                Search Console
              </a>{" "}
              → 좌측 하단 <b>설정</b> → <b>사용자 및 권한</b> → <b>사용자 추가</b>
            </li>
            <li>2. 아래 주소를 붙여넣고 권한은 <b>전체</b>로</li>
          </ol>
          <p className="mt-3 rounded-lg border border-amber-300 bg-white px-4 py-3 font-mono text-xs break-all">
            {process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "(서비스 계정이 설정되지 않았습니다)"}
          </p>
          <p className="mt-2 text-[0.6875rem] text-amber-800">
            {searchConsoleConfigured()
              ? "추가하시면 다음 새로고침부터 노출·순위가 찍힙니다."
              : "서비스 계정 환경변수부터 넣어야 합니다."}
          </p>
        </section>
      )}

      {/**
       * ── 이번 주 깔때기 ──────────────────────────────────────────────
       *
       * 사장님 지시(08-19): *"컨텐츠를 통한 타겟 상위노출과 도달유입 >
       * 전환성공의 각 모수와 전환율, 그리고 노출순위를 보는 게 중요하다."*
       *
       * 네 단을 한 줄로 세운다. 단 사이의 비율을 같이 적어야 **어디가
       * 막혔는지**가 보인다 — 노출은 나오는데 클릭이 없으면 제목 문제고,
       * 유입은 있는데 전환이 없으면 글 끝의 다음 행동이 약한 것이다.
       */}
      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-bold">
            이번 주 깔때기{" "}
            {funnel.weekStart && (
              <span className="font-normal text-muted">
                {funnel.weekStart.slice(5).replace("-", "/")} 월요일부터
              </span>
            )}
          </h2>
          <span className="text-xs text-muted">
            7일 구간 · 매일 갱신 · 검색 지표는 2~3일 늦게 들어옵니다
          </span>
        </div>

        {funnel.weekStart === null ? (
          <p className="mt-4 rounded-xl border border-line bg-paper-alt px-5 py-6 text-sm text-muted">
            아직 이번 주 집계가 돌지 않았습니다. 리포트 크론이 하루 한 번
            채웁니다 — 값이 없는 것과 0 은 다르므로 비워 둡니다.
          </p>
        ) : (
          // 08-22 에 전환이 셋으로 갈리며 카드가 4 → 6 개가 됐다.
          // 4열에 6개를 두면 둘째 줄이 반만 차서 표가 어색해진다
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {[
              {
                label: "노출",
                sub: "검색 결과에 뜬 횟수",
                value: nf.format(funnel.impressions),
                rate: null as string | null,
              },
              {
                label: "검색 클릭",
                sub: "거기서 눌린 횟수",
                value: nf.format(funnel.clicks),
                rate: funnel.impressions
                  ? `CTR ${((funnel.clicks / funnel.impressions) * 100).toFixed(1)}%`
                  : null,
              },
              {
                label: "유입",
                sub: "글이 실제로 열린 횟수",
                value: nf.format(funnel.views),
                rate: funnel.clicks
                  ? `검색 밖 ${nf.format(Math.max(0, funnel.views - funnel.clicks))}`
                  : `검색 밖 ${nf.format(funnel.views)}`,
              },
              {
                label: "순방문자",
                sub: "사람 수 (유입은 열린 횟수)",
                value: `${nf.format(funnel.visitors)}명`,
                rate: null,
              },
              {
                label: "체류",
                sub: "중앙값 · 탭이 보이는 동안만",
                value: medianDwell === null ? "—" : dwellText(medianDwell),
                rate: null,
              },
              {
                label: "데려옴",
                sub: "그 글로 처음 들어와 신청 (first)",
                value: `${funnel.inquiries}건`,
                rate: funnel.views
                  ? `전환율 ${((funnel.inquiries / funnel.views) * 100).toFixed(1)}%`
                  : null,
              },
              /**
               * 거듦·마지막을 **전환과 따로** 세운다. (2026-08-22)
               * 합치면 한 건이 두 번 세어져 전환 수가 부풀려진다.
               * 전환율의 분자는 first 만 쓴다 — 그래야 합이 100%를 안 넘는다.
               */
              {
                label: "거듦",
                sub: "첫 착지는 아니지만 읽고 신청 (assist)",
                value: `${funnel.assists}건`,
                rate: null,
              },
              {
                label: "마지막",
                sub: "신청 직전 마지막 진입 (last)",
                value: `${funnel.lastTouch}건`,
                rate: null,
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-line bg-paper px-5 py-4"
              >
                <p className="text-xs font-bold text-muted">{s.label}</p>
                <p className="mt-1.5 text-2xl font-bold tabular-nums">
                  {s.value}
                </p>
                <p className="mt-1 text-[0.6875rem] text-muted/70">{s.sub}</p>
                {s.rate && (
                  <p className="mt-1.5 text-xs font-medium text-accent-deep">
                    {s.rate}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 노출순위 — 깔때기 맨 위의 품질이다. 상위 10위 안에 몇 편인가 */}
        {funnel.ranked.length > 0 && (
          <p className="mt-3 text-xs text-muted">
            순위가 잡힌 글 {funnel.ranked.length}편 · 10위 이내{" "}
            <b className="text-ink">
              {funnel.ranked.filter((p) => p <= 10).length}편
            </b>{" "}
            · 30위 이내 {funnel.ranked.filter((p) => p <= 30).length}편 · 평균{" "}
            {Math.round(
              funnel.ranked.reduce((a, b) => a + b, 0) / funnel.ranked.length,
            )}
            위
          </p>
        )}
      </section>

      {/* ── 편성표 ── */}
      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-bold">발행 예정표</h2>
          <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
            <span>
              매일 1편 · 자동 생성 → 규격 검사 통과 시 자동 승인 → 당일 17시
              발행
            </span>
            <span aria-hidden="true">·</span>
            {/* 돈은 눈에 보여야 통제된다. 지난번에 $22 가 조용히 나갔다 */}
            <span
              className="tabular-nums"
              title="원고 자동 생성에 쓴 OpenAI 실측 비용"
            >
              이번 달 생성비{" "}
              <b className={spend >= 40 ? "text-rose-700" : "text-ink"}>
                ${spend.toFixed(2)}
              </b>{" "}
              / 상한 ${MAX_COST_PER_MONTH_USD}
            </span>
          </span>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-line">
          {/* 열이 13 → 17개로 늘었다(유입·전환·타겟). 1,080px 로는 글자가 세로로
              깨져 표를 읽을 수가 없다 — 화면에서 직접 보고 알았다 (08-19) */}
          <table className="w-full min-w-[1560px] text-sm">
            <thead className="bg-paper-alt text-left text-xs text-muted">
              <tr>
                <th className="px-3 py-2.5 font-medium">No.</th>
                <th className="px-3 py-2.5 font-medium">노리는 검색어</th>
                <th className="px-3 py-2.5 text-right font-medium">검색량</th>
                <th className="px-3 py-2.5 text-right font-medium">CTR</th>
                <th className="px-3 py-2.5 text-right font-medium">노출</th>
                <th className="px-3 py-2.5 text-right font-medium">순위</th>
                {/* 사장님 지시(08-19) — 콘텐츠 한 편이 데려온 사람과 그중
                    신청까지 간 건수를 같은 줄에서 본다. 7일 구간이라 매주 바뀐다 */}
                <th className="px-3 py-2.5 text-right font-medium">
                  유입 <span className="font-normal text-muted/60">7일</span>
                </th>
                {/* 사장님 지시(08-22) — "노출-클릭-순방문자수-체류시간".
                    유입은 열린 횟수, 순방문자는 사람 수다. 다른 값이라 나란히 둔다 */}
                <th className="px-3 py-2.5 text-right font-medium">
                  순방문자 <span className="font-normal text-muted/60">명</span>
                </th>
                <th className="px-3 py-2.5 text-right font-medium">
                  체류 <span className="font-normal text-muted/60">중앙값</span>
                </th>
                {/**
                 * 전환을 **세 갈래로** 나눈다. (2026-08-22 사장님: *"first last"*)
                 *
                 *   데려옴  이 글로 처음 들어와 신청 (first touch)
                 *   거듦    첫 착지는 아니지만 이 글도 읽고 신청 (assist)
                 *   마지막  신청 직전 마지막 진입이 이 글 (last touch)
                 *
                 * ⚠️ 셋을 더하지 않는다. 한 건이 데려옴이면서 마지막일 수 있다.
                 */}
                <th className="px-3 py-2.5 text-right font-medium">
                  데려옴 <span className="font-normal text-muted/60">first</span>
                </th>
                <th className="px-3 py-2.5 text-right font-medium">
                  거듦 <span className="font-normal text-muted/60">assist</span>
                </th>
                <th className="px-3 py-2.5 text-right font-medium">
                  마지막 <span className="font-normal text-muted/60">last</span>
                </th>
                <th className="px-3 py-2.5 font-medium">타겟</th>
                <th className="px-3 py-2.5 font-medium">세부타겟</th>
                <th className="px-3 py-2.5 font-medium">주제</th>
                <th className="px-3 py-2.5 font-medium">훅 제목</th>
                <th className="px-3 py-2.5 font-medium">발행 예정</th>
                <th className="px-3 py-2.5 text-right font-medium">생성비</th>
                <th className="px-3 py-2.5 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {board.map((row) => {
                const want = TRACK_BY_WEEKDAY[kstParts(row.date).weekday];
                /**
                 * 세부타겟 — 앞으로의 슬롯은 편성 큐에서, 이미 만든 회차는
                 * **작업표에서** 가져온다. (2026-08-18)
                 *
                 * 그동안 `row.planned` 만 봤다. 그건 아직 원고가 없는 슬롯에만
                 * 있는 값이라, 이미 발행된 회차는 전부 "—" 로 비어 있었다.
                 * 작업표에는 편성이 검색어에서 추정한 업종이 처음부터 있었다.
                 */
                const seg = row.planned
                  ? segment(row.planned.segment)
                  : row.job?.segment
                    ? segment(row.job.segment as Parameters<typeof segment>[0])
                    : null;
                // 원고가 있으면 그 상태가 우선이고, 없으면 자동 생성이
                // 어디까지 왔는지를 보여 준다. 아무것도 없어야 "미착수" 다
                const state = row.post
                  ? row.post.publishedAt
                    ? "발행됨"
                    : row.post.approvedAt
                      ? "발행 대기"
                      : row.post.status === "planned"
                        ? "기획됨"
                        : // 승인 도장이 없는 원고. 자동 운영에서는 두 경우뿐이다 —
                          // 아직 검사 중이거나, 두 번 고쳐도 규격을 못 넘겨 보류됐거나
                          row.job?.stage === "polish"
                          ? "규격 검사 중"
                          : row.job?.stage === "done"
                            ? "규격 미달 보류"
                            : "검수 대기"
                  : (row.job?.stage ?? "미착수");

                return (
                  <tr
                    key={row.date.toISOString()}
                    className="border-t border-line align-top"
                  >
                    {/**
                     * 회차 번호는 **배포된 글로 가는 문**이다. (2026-08-19)
                     *
                     * 훅 제목은 어드민 상세(검수 화면)로 간다. 그런데 실적을
                     * 볼 때 확인하고 싶은 건 손님이 실제로 보는 화면이라,
                     * 지금까지는 주소를 손으로 쳐서 열어야 했다.
                     */}
                    <td className="px-3 py-3 tabular-nums">
                      {row.liveUrl ? (
                        <a
                          href={row.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold underline decoration-line underline-offset-4 hover:decoration-ink"
                          title="배포된 글 열기"
                        >
                          #{row.no}
                        </a>
                      ) : (
                        <span className={row.fixed ? "font-bold" : "text-muted"}>
                          {row.no}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {/* 슬러그(영문 주소)가 아니라 **노리는 검색어**다.
                          발행 전이면 편성 큐의 term, 발행됐으면 기획안의 head_keyword */}
                      <span className="font-medium">
                        {row.keyword.term ?? row.planned?.term ?? "—"}
                      </span>
                      {want && (
                        <span
                          className={`ml-1.5 rounded px-1.5 py-0.5 text-[0.625rem] font-bold ${diffTone[want]}`}
                        >
                          {TRACK_LABEL[want] ?? want}
                        </span>
                      )}
                      {row.post?.slug && (
                        <span className="mt-0.5 block text-[0.6875rem] text-muted/60">
                          /{row.post.slug}
                        </span>
                      )}
                    </td>
                    {/* 검색량·CTR — 키워드 보드와 같은 실측값(네이버 검색광고).
                        수집 안 된 검색어는 "—" 다. 지어내지 않는다 */}
                    <td className="px-3 py-3 text-right tabular-nums">
                      {row.keyword.volume === null ? (
                        <span className="text-muted/40">—</span>
                      ) : (
                        <>
                          <span className="font-medium">
                            {nf.format(row.keyword.volume)}
                          </span>
                          {/**
                           * ⚠️ 이건 **경쟁도**다(네이버 광고 입찰 경쟁).
                           * 라벨 없이 "중간" 만 찍으니 옆의 난이도로 읽혔다 —
                           * 사장님이 검색량 510 에 "중간" 이 붙은 걸 보고
                           * 난이도가 틀린 것으로 읽으신 게 당연하다. (08-19)
                           */}
                          {row.keyword.competition && (
                            <span
                              className={`mt-0.5 block rounded px-1 py-0.5 text-[0.625rem] font-bold ${compTone[row.keyword.competition] ?? ""}`}
                            >
                              경쟁 {row.keyword.competition}
                            </span>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {row.keyword.ctr === null ? (
                        <span className="text-muted/40">—</span>
                      ) : (
                        `${row.keyword.ctr.toFixed(2)}%`
                      )}
                    </td>
                    {/* 우리 실제 성적 — Search Console 실측.
                        검색량이 '시장' 이면 이건 '성적표' 다.

                        2026-08-18: 검색어 차원에서 **글 차원**으로 바꿨다.
                        발행 후 D+7·21·60 세 시점에만 재고, 여기엔 가장 나중
                        시점을 세운다. 몇 일째 값인지 같이 보여 주지 않으면
                        "노출 0" 이 실패인지 아직 이른 건지 구분이 안 된다 */}
                    <td className="px-3 py-3 text-right tabular-nums">
                      {row.performance.impressions === null ? (
                        row.performance.daysUntilFirst === null ? (
                          <span className="text-muted/40">—</span>
                        ) : (
                          <span className="text-[0.6875rem] text-muted/60">
                            {row.performance.daysUntilFirst === 0
                              ? "오늘 측정"
                              : `D+7까지 ${row.performance.daysUntilFirst}일`}
                          </span>
                        )
                      ) : (
                        <>
                          <span className="font-medium">
                            {nf.format(row.performance.impressions)}
                          </span>
                          {row.performance.clicks ? (
                            <span className="mt-0.5 block text-[0.6875rem] text-emerald-700">
                              클릭 {row.performance.clicks}
                            </span>
                          ) : null}
                          {row.performance.offsetDays ? (
                            <span className="mt-0.5 block text-[0.6875rem] text-muted/60">
                              D+{row.performance.offsetDays} 기준
                            </span>
                          ) : null}
                        </>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {row.performance.position === null ? (
                        <span className="text-muted/40">—</span>
                      ) : (
                        <span
                          className={
                            row.performance.position <= 10
                              ? "font-bold text-emerald-700"
                              : row.performance.position <= 30
                                ? "text-amber-700"
                                : "text-muted"
                          }
                        >
                          {Math.round(row.performance.position)}위
                        </span>
                      )}
                    </td>
                    {/**
                     * 유입 — 이번 주 우리 페이지가 열린 횟수(실측). 그 아래
                     * 검색 클릭 수를 같이 둔다. 조회가 클릭보다 크면 검색 밖
                     * 경로(인스타·직접·타사이트)가 일하고 있다는 뜻이다.
                     */}
                    <td className="px-3 py-3 text-right tabular-nums">
                      {row.funnel === null ? (
                        <span className="text-muted/40">—</span>
                      ) : (
                        <>
                          <span
                            className={
                              row.funnel.views ? "font-medium" : "text-muted/50"
                            }
                          >
                            {nf.format(row.funnel.views)}
                          </span>
                          <span className="mt-0.5 block text-[0.6875rem] text-muted/60">
                            검색 클릭 {nf.format(row.funnel.clicks)}
                          </span>
                        </>
                      )}
                    </td>
                    {/**
                     * 순방문자 — **사람 수**. 유입(열린 횟수)과 다른 값이다.
                     * 한 사람이 세 번 열면 유입 3 · 순방문자 1 이다.
                     */}
                    <td className="px-3 py-3 text-right tabular-nums">
                      {row.funnel === null ? (
                        <span className="text-muted/40">—</span>
                      ) : (
                        <span
                          className={
                            row.funnel.visitors ? "font-medium" : "text-muted/50"
                          }
                        >
                          {nf.format(row.funnel.visitors)}
                        </span>
                      )}
                    </td>
                    {/**
                     * 체류 — **중앙값**. 평균이 아니다. 탭을 켜 둔 채 잊은
                     * 한 명이 평균을 통째로 망가뜨리고, 표본이 한 자릿수인
                     * 지금은 특히 그렇다. 안 쟀으면 0초가 아니라 "—" 다.
                     */}
                    <td className="px-3 py-3 text-right tabular-nums">
                      {row.funnel === null || row.funnel.dwellSec === null ? (
                        <span className="text-muted/40">—</span>
                      ) : (
                        <span
                          className={
                            row.funnel.dwellSec >= 60
                              ? "font-bold text-emerald-700"
                              : row.funnel.dwellSec >= 30
                                ? "text-amber-700"
                                : "text-muted"
                          }
                        >
                          {dwellText(row.funnel.dwellSec)}
                        </span>
                      )}
                    </td>
                    {/**
                     * 전환 — 이 글로 **처음 들어와** 신청까지 간 건수.
                     * 전환율은 유입이 0 이면 계산하지 않는다 (0으로 나눈 값을
                     * 0% 로 적으면 "실패" 로 읽힌다. 아직 모수가 없는 것이다)
                     */}
                    <td className="px-3 py-3 text-right tabular-nums">
                      {row.funnel === null ? (
                        <span className="text-muted/40">—</span>
                      ) : (
                        <>
                          <span
                            className={
                              row.funnel.inquiries
                                ? "font-bold text-emerald-700"
                                : "text-muted/50"
                            }
                          >
                            {row.funnel.inquiries}건
                          </span>
                          {row.funnel.views > 0 && (
                            <span className="mt-0.5 block text-[0.6875rem] text-muted/60">
                              {(
                                (row.funnel.inquiries / row.funnel.views) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          )}
                        </>
                      )}
                    </td>
                    {/**
                     * 거듦(assist) — 첫 착지는 아니지만 이 글도 읽고 신청했다.
                     * 실무에서 제일 흔한 모양인데 08-22 전까지 0 으로 세고 있었다.
                     */}
                    <td className="px-3 py-3 text-right tabular-nums">
                      {row.funnel === null ? (
                        <span className="text-muted/40">—</span>
                      ) : (
                        <span
                          className={
                            row.funnel.assists
                              ? "font-bold text-sky-700"
                              : "text-muted/50"
                          }
                        >
                          {row.funnel.assists}건
                        </span>
                      )}
                    </td>
                    {/**
                     * 마지막(last touch) — 신청 직전 마지막 진입이 이 글이었다.
                     * "무엇이 알게 했나" 와 "무엇이 결심시켰나" 는 다른 질문이다.
                     */}
                    <td className="px-3 py-3 text-right tabular-nums">
                      {row.funnel === null ? (
                        <span className="text-muted/40">—</span>
                      ) : (
                        <span
                          className={
                            row.funnel.lastTouch
                              ? "font-bold text-violet-700"
                              : "text-muted/50"
                          }
                        >
                          {row.funnel.lastTouch}건
                        </span>
                      )}
                    </td>
                    {/**
                     * 타겟 — 하드코딩에서 **데이터**로. (2026-08-19)
                     *
                     * 08-18 까지 이 칸은 `"브랜드 대표·이사급"` 문자열을 그대로
                     * 박아 놨다. 34행이든 300행이든 전부 같은 글자였으니
                     * "이 회차가 누구를 데려오는 글인가" 를 볼 수가 없었다.
                     * 이제 노리는 검색어에서 리드 타겟을 판정해 보여 준다.
                     */}
                    <td className="px-3 py-3 text-xs">
                      {(() => {
                        const term =
                          row.keyword.term ??
                          row.planned?.term ??
                          row.post?.headKeyword ??
                          null;
                        if (!term) return <span className="text-muted">—</span>;
                        const t = leadTargetOf(term);
                        return (
                          <>
                            <span className="font-medium text-ink">{t.label}</span>
                            <span className="mt-0.5 block text-muted">
                              {t.bottleneck}
                            </span>
                          </>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {seg ? (
                        <>
                          <span className="font-medium text-ink">
                            {seg.label}
                          </span>
                          <span className="mt-0.5 block text-muted">
                            {seg.bottleneck}
                          </span>
                        </>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="max-w-[16rem] px-3 py-3 text-xs leading-[1.6] text-muted">
                      {/* 앞으로의 슬롯은 편성 큐의 각도, 이미 만든 회차는
                          작업표에 적힌 그 회차의 각도 */}
                      {row.planned?.angle ?? row.job?.topic ?? "—"}
                    </td>
                    <td className="max-w-[20rem] px-3 py-3">
                      {row.post && row.href ? (
                        <Link
                          href={row.href}
                          className="font-medium hover:underline"
                        >
                          {row.post.title}
                        </Link>
                      ) : (
                        <span className="text-xs text-muted/60">
                          원고 생성 시 확정
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs whitespace-nowrap tabular-nums">
                      {row.date.toLocaleDateString("ko-KR", {
                        timeZone: "Asia/Seoul",
                        month: "2-digit",
                        day: "2-digit",
                        weekday: "short",
                      })}{" "}
                      {row.fixed
                        ? row.date.toLocaleTimeString("ko-KR", {
                            timeZone: "Asia/Seoul",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })
                        : `${PUBLISH_HOUR}:00`}
                    </td>
                    {/* 생성비 — 이 한 편에 실제로 나간 돈(OpenAI 실측).
                        cron 없이 매일 돌리므로 회차별 지출이 여기 남아야
                        "이 자동화가 얼마짜리인지" 를 표 하나로 판단할 수 있다 */}
                    <td className="px-3 py-3 text-right text-xs tabular-nums">
                      {row.job?.costUsd == null ? (
                        /**
                         * 빈 칸을 그냥 "—" 로 두면 "돈이 안 들었나" 인지
                         * "못 셌나" 인지 구분이 안 된다. (2026-08-18)
                         * 1편은 OpenAI 자동화 이전에 맥에서 쓴 원고라
                         * 애초에 작업표가 없다. 그건 사실대로 적는다.
                         */
                        <span className="text-[0.6875rem] text-muted/50">
                          {row.post?.publishedAt ? "자동화 이전" : "—"}
                        </span>
                      ) : (
                        <span
                          className={
                            row.job.costUsd >= 4
                              ? "font-bold text-rose-700"
                              : ""
                          }
                        >
                          ${row.job.costUsd.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs whitespace-nowrap">
                      {row.href ? (
                        <Link
                          href={row.href}
                          className={`underline-offset-4 hover:underline ${
                            state === "검수 대기"
                              ? "font-bold text-amber-700"
                              : state === "발행 대기"
                                ? "font-bold text-accent-deep"
                                : state === "발행됨"
                                  ? "text-emerald-700"
                                  : "text-ink"
                          }`}
                        >
                          {state}
                          {state === "검수 대기" && " · 검수하기 →"}
                          {state === "발행됨" && " →"}
                        </Link>
                      ) : (
                        <span
                          className={
                            state === "생성 실패"
                              ? "font-bold text-rose-700"
                              : state === "미착수"
                                ? "text-muted"
                                : "text-ink"
                          }
                        >
                          {state}
                        </span>
                      )}
                      {row.job?.costUsd ? (
                        <span className="mt-0.5 block text-[0.6875rem] text-muted tabular-nums">
                          ${row.job.costUsd.toFixed(2)}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs leading-[1.7] text-muted/70">
          <b>발행하기(승인) 버튼은 각 회차의 검수 화면 안에 있습니다.</b> 원고가
          준비되면 상태 칸이 <b className="text-amber-700">검수 대기</b>로
          바뀌고, 그걸 누르시면 본문·규격 검사와 함께 발행하기 버튼이 나옵니다.
          원고가 없는 회차는 들어갈 화면 자체가 없습니다.
          <br />
          번호는 발행된 회차부터 이어집니다 — 굵은 번호가 확정, 흐린 번호는
          예정입니다. 요일마다 노리는 키워드 난이도를 다르게 둡니다: 큰 키워드만
          노리면 순위를 못 잡고, 니치만 노리면 트래픽 천장이 낮습니다.
        </p>
      </section>

      {/* ── 키워드 보드 ── */}
      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-bold">
            키워드 {nf.format(keywords.total)}개
          </h2>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted">정렬</span>
            {(
              [
                ["niche", "니치 점수"],
                ["volume", "검색량"],
              ] as const
            ).map(([v, label]) => (
              <Link
                key={v}
                href={qs({ sort: v, page: 1 })}
                className={`rounded-full px-2.5 py-1 ${
                  sort === v
                    ? "bg-ink font-bold text-paper"
                    : "border border-line text-muted hover:border-ink"
                }`}
              >
                {label}
              </Link>
            ))}
            <span className="ml-2 text-muted">난이도</span>
            {(["전체", "니치", "중간", "빅"] as const).map((d) => {
              const value = d === "전체" ? undefined : d;
              const on = difficulty === value;
              return (
                <Link
                  key={d}
                  href={qs({ difficulty: value ?? "", page: 1 })}
                  className={`rounded-full px-2.5 py-1 ${
                    on
                      ? "bg-ink font-bold text-paper"
                      : "border border-line text-muted hover:border-ink"
                  }`}
                >
                  {d}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-paper-alt text-xs text-muted">
              <tr>
                <th className="px-3 py-2.5 text-left font-medium">키워드</th>
                <th className="px-3 py-2.5 text-right font-medium">니치</th>
                <th className="px-3 py-2.5 text-center font-medium">난이도</th>
                <th className="px-3 py-2.5 text-right font-medium">PC</th>
                <th className="px-3 py-2.5 text-right font-medium">모바일</th>
                <th className="px-3 py-2.5 text-right font-medium">합계</th>
                <th className="px-3 py-2.5 text-right font-medium">주간</th>
                <th className="px-3 py-2.5 text-right font-medium">CTR</th>
                <th className="px-3 py-2.5 text-center font-medium">경쟁</th>
                <th className="px-3 py-2.5 text-left font-medium">필러</th>
                <th className="px-3 py-2.5 text-right font-medium"> </th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {keywords.rows.map((k) => (
                <tr key={k.id} className="border-t border-line">
                  <td className="px-3 py-2.5 font-medium">{k.term}</td>
                  <td className="px-3 py-2.5 text-right font-bold">
                    {k.nicheScore ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {k.difficulty && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[0.6875rem] font-bold ${diffTone[k.difficulty] ?? ""}`}
                      >
                        {k.difficulty}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right text-muted">
                    {nf.format(k.pcVolume ?? 0)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-muted">
                    {nf.format(k.mobileVolume ?? 0)}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {nf.format(k.totalVolume ?? 0)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs">
                    <Delta value={k.deltaVolume} />
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs text-muted">
                    {k.mobileCtr ?? 0}%
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[0.6875rem] ${
                        compTone[k.competition ?? ""] ?? "text-muted"
                      }`}
                    >
                      {k.competition ?? "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted">
                    {PILLARS.find((p) => p.key === k.pillar)?.label ?? (
                      <span className="text-muted/50">미배정</span>
                    )}
                  </td>
                  {/* 남의 업체 이름을 지우는 자리. 규칙으로는 못 걸러서
                      (오탐 149개) 눈에 걸릴 때 한 번 누르는 버튼으로 뒀다 */}
                  <td className="px-3 py-2.5 text-right">
                    <form action={dropKeyword}>
                      <input type="hidden" name="id" value={k.id} />
                      <button
                        type="submit"
                        title="업체명이거나 우리와 무관한 검색어일 때. 보드와 편성에서 빠집니다"
                        className="rounded px-2 py-1 text-[0.6875rem] text-muted/60 hover:bg-rose-50 hover:text-rose-700"
                      >
                        제외
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 쪽번호 */}
        {keywords.pages > 1 && (
          <nav className="mt-4 flex flex-wrap items-center justify-center gap-1 text-sm">
            {page > 1 && (
              <Link
                href={qs({ page: page - 1 })}
                className="rounded px-2.5 py-1.5 text-muted hover:text-ink"
              >
                ←
              </Link>
            )}
            {pageNumbers(page, keywords.pages).map((n, i) =>
              n === "…" ? (
                <span key={`gap-${i}`} className="px-1.5 text-muted/50">
                  …
                </span>
              ) : (
                <Link
                  key={n}
                  href={qs({ page: n })}
                  className={`rounded px-2.5 py-1.5 tabular-nums ${
                    n === page
                      ? "bg-ink font-bold text-paper"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {n}
                </Link>
              ),
            )}
            {page < keywords.pages && (
              <Link
                href={qs({ page: page + 1 })}
                className="rounded px-2.5 py-1.5 text-muted hover:text-ink"
              >
                →
              </Link>
            )}
          </nav>
        )}

        <p className="mt-4 text-xs leading-[1.7] text-muted/70">
          <b className="text-ink">니치 점수</b>는
          검색량(로그)×클릭률×경쟁도입니다. 검색량이 크다고 높지 않습니다 — 지금
          우리가 이길 수 있고, 이기면 값이 되는 정도입니다.{" "}
          <b className="text-ink">주간</b> 열은 지난주 스냅샷 대비 변화이고,
          스냅샷이 2주치 쌓이면 값이 나타납니다.
        </p>
      </section>
    </div>
  );
}
