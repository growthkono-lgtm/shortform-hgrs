import { scheduleBoard } from "@/lib/blog-admin";
import { kstDate } from "@/lib/blog-schedule";
import { csvResponse, toCsv } from "@/lib/csv";
import { getOptionalProfile } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/blog/export?kind=keywords|schedule — 표 통째로 CSV. (2026-08-19)
 *
 * 사장님 지시: *"컨텐츠 발행표 전체든 키워드 전체든 csv로 받을 수 있게 해줘야
 * 내가 필터 걸어서 추려서 너한테 피드백 줄 것 같아."*
 *
 * 화면 표는 쪽당 50개에 열 13개로 잘려 있다. "검색량 500 미만 전부" 나
 * "우리 사업과 무관한 것" 같은 판단은 전체를 정렬·필터해야 나오고, 그건
 * 브라우저가 아니라 엑셀이 할 일이다.
 *
 * ⚠️ 어드민 전용이다. 키워드 표에는 우리가 무엇을 노리는지가 통째로 들어 있어
 * 경쟁사에게 그대로 전략 문서다. 로그인 안 했으면 **404** — 401 은 "여기 뭔가
 * 있다" 를 알려 준다.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const notFound = () => new Response(null, { status: 404 });

export async function GET(request: Request) {
  const profile = await getOptionalProfile();
  if (profile?.role !== "admin") return notFound();

  const kind = new URL(request.url).searchParams.get("kind") ?? "keywords";
  const day = kstDate(new Date());

  if (kind === "schedule") {
    const csv = await scheduleCsv();
    return csvResponse(`편성표_${day}.csv`, csv);
  }
  const csv = await keywordCsv();
  return csvResponse(`키워드_${day}.csv`, csv);
}

/* ── 키워드 전체 ─────────────────────────────────────────────── */

/**
 * 앞자리는 사장님이 실제로 필터를 거는 열이다 — 검색량·난이도·상태.
 * 나머지 컬럼은 뒤에 그대로 딸려 나간다(컬럼이 늘어도 코드를 안 고쳐도 된다).
 */
const KEYWORD_HEAD = [
  ["term", "검색어"],
  ["total_volume", "검색량(합)"],
  ["difficulty", "난이도"],
  ["niche_score", "니치점수"],
  ["competition", "경쟁도"],
  ["buyer_intent", "구매의도"],
  ["pillar", "필러"],
  ["tier", "헤드/롱테일"],
  ["status", "상태"],
  ["pc_volume", "PC검색량"],
  ["mobile_volume", "모바일검색량"],
  ["pc_ctr", "PC클릭률"],
  ["mobile_ctr", "모바일클릭률"],
  ["ad_depth", "광고수"],
  ["refreshed_at", "지표갱신"],
  ["note", "메모"],
] as const;

async function keywordCsv(): Promise<string> {
  const supabase = createAdminClient();

  /**
   * ⚠️ PostgREST 는 요청 하나에 **1,000행에서 자른다.** 키워드가 1,998개라
   * 그냥 select 하면 절반만 내려간다 — 08-18 에 편성표가 같은 이유로
   * "검색량 없음" 을 찍었다. 다 읽을 때까지 넘긴다.
   */
  const rows: Record<string, unknown>[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data } = await supabase
      .from("blog_keyword")
      .select("*")
      .order("total_volume", { ascending: false, nullsFirst: false })
      .range(from, from + PAGE - 1);
    if (!data?.length) break;
    rows.push(...(data as unknown as Record<string, unknown>[]));
    if (data.length < PAGE) break;
  }

  /* 어느 회차가 이 검색어를 썼는지 붙인다 — "이미 쓴 것" 을 눈으로 봐야 한다 */
  const used = new Map<string, string>();
  const { data: posts } = await supabase
    .from("blog_post")
    .select("seq, title, keyword_id, status")
    .not("keyword_id", "is", null);
  for (const p of posts ?? []) {
    if (!p.keyword_id) continue;
    const label = `${p.seq === null ? "" : `#${p.seq} `}${p.title}`;
    used.set(p.keyword_id, [used.get(p.keyword_id), label].filter(Boolean).join(" | "));
  }

  const known = KEYWORD_HEAD.map(([k]) => k as string);
  const extra = rows.length
    ? Object.keys(rows[0]).filter((k) => !known.includes(k) && k !== "id")
    : [];

  const headers = [...KEYWORD_HEAD.map(([, label]) => label), ...extra, "쓴 회차"];
  const body = rows.map((r) => [
    ...known.map((k) => r[k]),
    ...extra.map((k) => r[k]),
    used.get(String(r.id)) ?? "",
  ]);

  return toCsv(headers, body);
}

/* ── 편성표 전체 ─────────────────────────────────────────────── */

const SCHEDULE_HEADERS = [
  "회차",
  "확정",
  "발행/예정일",
  "상태",
  "제목",
  "슬러그",
  "라이브주소",
  "노리는 검색어",
  "검색량",
  "클릭률",
  "경쟁도",
  "필러",
  "형식",
  "세부타겟",
  "각도",
  "글자수",
  "누적노출",
  "누적클릭",
  "평균순위",
  "측정시점",
  "이번주 노출",
  "이번주 검색클릭",
  "이번주 유입",
  "이번주 전환",
  "생성비USD",
];

async function scheduleCsv(): Promise<string> {
  // 앞으로 12주치까지. 지나온 회차는 전부 포함된다
  const board = await scheduleBoard(12);

  const rows = board.map((r) => [
    r.no,
    r.fixed ? "확정" : "예정",
    kstDate(r.date),
    r.post
      ? r.post.publishedAt
        ? "발행됨"
        : r.post.approvedAt
          ? "발행대기"
          : r.post.status
      : (r.job?.stage ?? "미착수"),
    r.post?.title ?? r.planned?.angle ?? "",
    r.post?.slug ?? "",
    r.liveUrl ?? "",
    r.keyword.term ?? "",
    r.keyword.volume,
    r.keyword.ctr,
    r.keyword.competition ?? "",
    r.post?.pillar ?? r.planned?.pillar ?? "",
    r.post?.format ?? "",
    r.planned?.segment ?? r.job?.segment ?? "",
    r.planned?.angle ?? r.job?.topic ?? "",
    r.post?.chars,
    r.performance.impressions,
    r.performance.clicks,
    r.performance.position,
    r.performance.offsetDays === null ? "" : `D+${r.performance.offsetDays}`,
    r.funnel?.impressions,
    r.funnel?.clicks,
    r.funnel?.views,
    r.funnel?.inquiries,
    r.job?.costUsd,
  ]);

  return toCsv(SCHEDULE_HEADERS, rows);
}
