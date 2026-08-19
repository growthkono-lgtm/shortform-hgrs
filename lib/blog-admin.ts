import "server-only";

import {
  metricsByPost,
  weekStart,
  weeklyByPost,
  type PostMetric,
} from "@/lib/blog-metrics";
import { SERVICE } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/server";

import { PILLARS, type FormatKey, type PillarKey } from "./blog-spec";
import { auditQueue } from "@/lib/blog-queue";
import {
  WEEKLY_SLOTS,
  kstDate,
  upcomingSlots,
  type QueuedTopic,
} from "./blog-schedule";
import type { Source } from "./blog-sources";

/**
 * 어드민 블로그 데이터 — 키워드 보드 · 편성 · 검수. (2026-08-13)
 *
 * 읽기는 service client 로 한다. 어드민 화면은 이미 `requireAdmin()` 뒤에 있고,
 * 키워드 보드는 초안·미발행분까지 통째로 봐야 하는데 RLS 는 발행분만 연다.
 * 가드를 두 겹으로 두되 판단은 서버 한 곳에서만 한다.
 */

export type KeywordRow = {
  id: string;
  term: string;
  pillar: string;
  tier: "head" | "long";
  status: "idle" | "planned" | "done" | "dropped";
  pcVolume: number | null;
  mobileVolume: number | null;
  totalVolume: number | null;
  pcCtr: number | null;
  mobileCtr: number | null;
  competition: string | null;
  adDepth: number | null;
  refreshedAt: string | null;
  /** 지난주 대비 검색량 변화. 스냅샷이 2주치 이상 쌓여야 값이 생긴다 */
  deltaVolume: number | null;
  note: string | null;
  /** 지금 우리가 이길 수 있고 이기면 값이 되는 정도 0~100 */
  nicheScore: number | null;
  /** 니치 / 중간 / 빅 — 요일별로 섞는 기준 */
  difficulty: string | null;
};

export type PostRow = {
  id: string;
  title: string;
  slug: string;
  /** insight: 편성표에 오르는 회차 / story: 고객 이야기(상시 자료) */
  kind: "insight" | "story";
  /** 발행 순번. 발행 시점에 못 박힌다 */
  seq: number | null;
  pillar: PillarKey;
  format: FormatKey;
  status: "planned" | "drafted" | "review" | "published" | "archived";
  keywordId: string | null;
  subKeywordIds: string[];
  chars: number | null;
  readMinutes: number | null;
  sources: Source[];
  audit: unknown;
  scheduledFor: string | null;
  approvedAt: string | null;
  publishedAt: string | null;
  rejectNote: string | null;
  body: string | null;
  createdAt: string;
  /**
   * 이 글이 노리는 **주 검색어**. 기획안(`plan.head_keyword`)에서 꺼낸다.
   *
   * 2026-08-14: 편성표의 "키워드" 칸에 영문 슬러그가 찍히고 있었다
   * (`ai-shortform-baseline-vs-conversion-2026`). 슬러그는 주소이지 키워드가
   * 아니다. 발행 전 회차는 편성 큐의 term 을, 발행된 회차는 이 값을 쓴다.
   */
  headKeyword: string | null;
  /** 본문에 깔린 연관 검색어 */
  subKeywords: string[];
};

const asNum = (v: unknown) => (v === null || v === undefined ? null : Number(v));

/**
 * 키워드 보드.
 *
 * 이번 주와 지난주 스냅샷을 같이 읽어 변화량을 붙인다 — 순위와 검색량은 계속
 * 움직이고, "지난주보다 오른 것"이 이번 주 편성의 근거가 된다. 현재값만 보면
 * 그 판단을 못 한다.
 */
export type KeywordQuery = {
  pillar?: string;
  difficulty?: string;
  /** volume = 검색량순 / niche = 니치 점수순(기본) */
  sort?: "volume" | "niche";
  page?: number;
  perPage?: number;
};

/**
 * 키워드 보드 — 쪽번호로 전체를 본다.
 *
 * 08-13 첫 판은 상위 60개만 보여 줬는데, 그러면 "검색량 큰 것"만 보이고
 * 정작 우리가 노려야 할 니치가 안 보인다(사장님 지적). 전체를 쪽으로 넘기고,
 * 기본 정렬을 **니치 점수**로 둔다 — 검색량이 크다고 좋은 게 아니기 때문이다.
 */
export async function listKeywords(
  q: KeywordQuery = {},
): Promise<{ rows: KeywordRow[]; total: number; page: number; pages: number }> {
  const supabase = createAdminClient();
  const perPage = q.perPage ?? 50;
  const page = Math.max(1, q.page ?? 1);
  const from = (page - 1) * perPage;

  let query = supabase
    .from("blog_keyword")
    .select(
      "id, term, pillar, tier, status, note, pc_volume, mobile_volume, total_volume, pc_ctr, mobile_ctr, competition, ad_depth, refreshed_at, niche_score, difficulty",
      { count: "exact" },
    )
    .neq("status", "dropped");

  if (q.pillar) query = query.eq("pillar", q.pillar);
  if (q.difficulty) query = query.eq("difficulty", q.difficulty);

  query =
    q.sort === "volume"
      ? query.order("total_volume", { ascending: false, nullsFirst: false })
      : query.order("niche_score", { ascending: false, nullsFirst: false });

  const { data, error, count } = await query.range(from, from + perPage - 1);
  if (error) throw new Error(`키워드 조회 실패: ${error.message}`);

  const ids = (data ?? []).map((k) => k.id);
  const deltas = await volumeDeltas(ids);

  return {
    rows: (data ?? []).map((k) => ({
      id: k.id,
      term: k.term,
      pillar: k.pillar,
      tier: k.tier as KeywordRow["tier"],
      status: k.status as KeywordRow["status"],
      pcVolume: asNum(k.pc_volume),
      mobileVolume: asNum(k.mobile_volume),
      totalVolume: asNum(k.total_volume),
      pcCtr: asNum(k.pc_ctr),
      mobileCtr: asNum(k.mobile_ctr),
      competition: k.competition,
      adDepth: asNum(k.ad_depth),
      refreshedAt: k.refreshed_at,
      deltaVolume: deltas.get(k.id) ?? null,
      note: k.note,
      nicheScore: asNum(k.niche_score),
      difficulty: k.difficulty,
    })),
    total: count ?? 0,
    page,
    pages: Math.max(1, Math.ceil((count ?? 0) / perPage)),
  };
}

/** 최근 두 주 스냅샷의 차이. 한 주치뿐이면 null 이다 */
async function volumeDeltas(ids: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (ids.length === 0) return out;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("blog_keyword_metric")
    .select("keyword_id, week, total_volume")
    .in("keyword_id", ids)
    .order("week", { ascending: false });

  const seen = new Map<string, number[]>();
  for (const row of data ?? []) {
    const list = seen.get(row.keyword_id) ?? [];
    if (list.length < 2) list.push(Number(row.total_volume ?? 0));
    seen.set(row.keyword_id, list);
  }
  for (const [id, [now, prev]] of seen) {
    if (prev !== undefined) out.set(id, now - prev);
  }
  return out;
}

/** 키워드 보드 요약 — 화면 상단에 한 줄로 붙는다 */
export async function keywordSummary() {
  const supabase = createAdminClient();
  const [{ count: total }, { count: assigned }, { count: used }] =
    await Promise.all([
      supabase.from("blog_keyword").select("id", { count: "exact", head: true })
        .neq("status", "dropped"),
      supabase
        .from("blog_keyword")
        .select("id", { count: "exact", head: true })
        .neq("pillar", "unassigned")
        .neq("status", "dropped"),
      /**
       * ⚠️ **`blog_keyword.status='done'` 을 세면 영원히 0 이다.** (08-19 수정)
       *
       * 자동 발행 파이프라인이 `blog_post.keyword_id` 를 채우지 않아
       * `lib/blog-publish.ts` 의 `status='done'` 전환이 한 번도 안 돌았다.
       * 그래서 6편을 발행했는데 화면에 "발행 완료 0" 이 찍혀 있었다.
       * 발행 편수는 **발행된 회차**를 세는 것이 맞다 — 키워드 상태는 부산물이다.
       */
      supabase
        .from("blog_post")
        .select("id", { count: "exact", head: true })
        .eq("status", "published"),
    ]);

  const { data: latest } = await supabase
    .from("blog_keyword")
    .select("refreshed_at")
    .not("refreshed_at", "is", null)
    .order("refreshed_at", { ascending: false })
    .limit(1);

  /**
   * ⚠️ 행을 끌어와 세지 않는다. (2026-08-18 수정)
   *
   * 앞서 `.limit(2000)` 으로 받아 자바스크립트에서 셌는데, **서버가 1,000에서
   * 자른다.** 키워드가 1,998개라 니치·빅 집계가 절반만 세어졌다. limit 을
   * 올려도 소용없다 — PostgREST 의 max-rows 는 클라이언트가 못 넘긴다.
   *
   * 세는 일은 DB 에 시킨다. 행을 안 가져오므로 몇 만 개가 되어도 정확하다.
   */
  /**
   * ⚠️ **["니치","빅"] 두 개만 세고 있었다.** (2026-08-19 저녁 수정)
   *
   * 화면 상단에 "난이도 — 니치 189 · 빅 19" 만 찍혀서, 실제로 있는
   * **중간 45개·마이크로 1,069개·일반어 6개가 통째로 안 보였다.**
   * 08-19 오전에 난이도 구간을 다섯으로 늘렸는데 이 집계는 안 따라왔다.
   * 구간을 늘릴 때 세는 곳까지 같이 봐야 한다.
   */
  const DIFFICULTIES = ["마이크로", "니치", "중간", "빅", "일반어"] as const;
  const counted = await Promise.all(
    DIFFICULTIES.map(async (d) => {
      const { count } = await supabase
        .from("blog_keyword")
        .select("id", { count: "exact", head: true })
        .neq("status", "dropped")
        .eq("difficulty", d);
      return [d, count ?? 0] as const;
    }),
  );
  const { count: noneCount } = await supabase
    .from("blog_keyword")
    .select("id", { count: "exact", head: true })
    .neq("status", "dropped")
    .is("difficulty", null);

  const byDifficulty: Record<string, number> = Object.fromEntries(
    counted.filter(([, n]) => n > 0),
  );
  if (noneCount) byDifficulty["미분류"] = noneCount;

  return {
    total: total ?? 0,
    assigned: assigned ?? 0,
    used: used ?? 0,
    refreshedAt: latest?.[0]?.refreshed_at ?? null,
    byDifficulty,
  };
}

export async function listPosts(status?: string): Promise<PostRow[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("blog_post")
    .select(
      "id, title, slug, kind, seq, pillar, format, status, keyword_id, sub_keyword_ids, chars, read_minutes, sources, audit, plan, scheduled_for, approved_at, published_at, reject_note, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(60);

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw new Error(`회차 조회 실패: ${error.message}`);
  return (data ?? []).map(toPost);
}

export async function getPost(id: string): Promise<PostRow | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("blog_post")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ? toPost(data) : null;
}

function toPost(row: Record<string, unknown>): PostRow {
  return {
    id: row.id as string,
    title: row.title as string,
    slug: row.slug as string,
    kind: row.kind === "story" ? "story" : "insight",
    seq: asNum(row.seq),
    pillar: row.pillar as PillarKey,
    format: row.format as FormatKey,
    status: row.status as PostRow["status"],
    keywordId: (row.keyword_id as string | null) ?? null,
    subKeywordIds: (row.sub_keyword_ids as string[] | null) ?? [],
    chars: asNum(row.chars),
    readMinutes: asNum(row.read_minutes),
    sources: (row.sources as Source[] | null) ?? [],
    audit: row.audit ?? null,
    scheduledFor: (row.scheduled_for as string | null) ?? null,
    approvedAt: (row.approved_at as string | null) ?? null,
    publishedAt: (row.published_at as string | null) ?? null,
    rejectNote: (row.reject_note as string | null) ?? null,
    body: (row.body as string | null) ?? null,
    createdAt: row.created_at as string,
    headKeyword:
      ((row.plan as { head_keyword?: string } | null)?.head_keyword ?? null) ||
      null,
    subKeywords:
      (row.plan as { sub_keywords?: string[] } | null)?.sub_keywords ?? [],
  };
}

/**
 * 편성표 — 번호가 1부터 쭉 달리는 발행 예정표. (2026-08-13 재설계)
 *
 * 사장님이 지정한 열 구조 그대로다:
 *   번호 · 키워드 · 타겟 · 세부타겟 · 주제 · 훅 제목 · 발행 예정 일시
 *
 * 슬롯(언제)은 코드가 정하고, 그 자리에 무엇이 들어갔는지는 DB 가 안다.
 * 아직 원고가 없는 칸은 TOPIC_QUEUE 가 "무엇을 쓸 예정인지" 를 채운다 —
 * 빈칸으로 두면 앞으로 뭘 쓸지가 안 보여서 편성표 구실을 못 한다.
 *
 * 번호는 발행된 회차의 seq 를 이어받는다. 아직 안 나간 칸의 번호는 예정치라,
 * 중간에 한 편이 빠지면 밀린다 — 그래서 발행 시점에 seq 로 못 박는다.
 */
export type BoardRow = {
  /** 회차 번호. 발행됐으면 확정, 아니면 예정 */
  no: number;
  fixed: boolean;
  /** 발행된 회차는 실제 발행 시각, 예정 회차는 예약 시각 */
  date: Date;
  slot: (typeof WEEKLY_SLOTS)[number] | null;
  post: PostRow | null;
  /** 원고가 아직 없을 때 무엇을 쓸 예정인지 */
  planned: QueuedTopic | null;
  /** 검수·발행 화면으로 가는 입구. 원고가 없으면 null */
  href: string | null;
  /** 원고 자동 생성이 지금 어디까지 왔는지. 아직 안 걸렸으면 null */
  job: {
    stage: string;
    note: string | null;
    costUsd: number | null;
    /** 이 회차가 실제로 노리는 검색어 (기획안 문구가 아니라 편성이 고른 것) */
    keywordTerm: string | null;
    /** 세부타겟 — 편성이 검색어에서 추정한 업종 */
    segment: string | null;
    /** 이 회차의 각도 한 문장 */
    topic: string | null;
  } | null;
  /**
   * 이 회차가 노리는 검색어와 그 지표. (2026-08-14 사장님 요청)
   *
   * "4에 적힌 키워드에는 5,6에서 어떤 키워드(검색량·클릭률)를 노리는지도
   * 같이 명시해서 표를 만들라고 했던 것 같아."
   *
   * 지표는 `blog_keyword` 에 실제로 수집된 값만 싣는다. 없으면 null 이고
   * 화면에는 "—" 로 나간다 — 추정치를 지어내지 않는다.
   */
  keyword: {
    term: string | null;
    volume: number | null;
    ctr: number | null;
    competition: string | null;
  };
  /**
   * 실제 검색 성과 — Search Console 실측. (2026-08-14)
   *
   * 검색량·CTR 은 "이 검색어가 얼마나 쳐지는가" 이고, 이건 "**우리가** 그
   * 검색어로 몇 번 노출돼 몇 위인가" 다. 앞은 시장이고 뒤는 성적표다.
   * 편성표에 성적표가 없으면 무엇을 갈아탈지 판단할 수 없다.
   *
   * 연결 전이면 전부 null 이고 화면에는 "—" 가 나간다.
   */
  performance: {
    impressions: number | null;
    clicks: number | null;
    position: number | null;
    /**
     * 발행 후 며칠째에 잰 값인가 (7 · 21 · 60). (2026-08-18)
     *
     * 이게 없으면 "노출 0" 이 실패인지 아직 이른 것인지 구분이 안 된다.
     * D+7 의 0 은 색인 문제고, D+21 의 0 은 아직 정상이다.
     */
    offsetDays: number | null;
    /** 아직 첫 측정(D+7) 전이면 며칠 남았나 */
    daysUntilFirst: number | null;
  };
  /**
   * 이번 주 깔때기 — 노출 → 클릭 → 유입 → 전환. (2026-08-19)
   *
   * 위의 `performance` 는 발행일부터의 **누적**이라 "지금 이 글이 돌고 있나" 를
   * 못 답한다. 이건 이번 주(월~일, KST) 구간 값이고 매일 다시 계산된다.
   *
   * `views` 는 우리 실측(blog_view)이라 검색 밖에서 들어온 사람까지 잡힌다.
   * `inquiries` 는 **이 글로 처음 들어와** 신청까지 간 건수다.
   */
  funnel: {
    weekStart: string | null;
    impressions: number;
    clicks: number;
    views: number;
    inquiries: number;
    position: number | null;
  } | null;
  /** 발행됐다면 실제 라이브 주소. 어드민 상세가 아니라 손님이 보는 그 화면 */
  liveUrl: string | null;
};

const JOB_STAGE_LABEL: Record<string, string> = {
  research: "조사 중",
  plan: "기획 중",
  verify: "자료 검증 중",
  write: "집필 중",
  done: "원고 완료",
  failed: "생성 실패",
};

export async function scheduleBoard(weeks = 4): Promise<BoardRow[]> {
  const posts = await listPosts();

  // 자동 생성 진행 상황 — 날짜로 편성표 행에 붙인다
  const supabase = createAdminClient();
  const { data: jobs } = await supabase
    .from("blog_job")
    .select("id, scheduled_for, stage, last_error, cost_usd, keyword_term, segment, topic, post_id");

  /**
   * 키워드 지표 — 편성표에 검색량·클릭률을 같이 세운다. (2026-08-14)
   *
   * 키워드 보드와 편성표가 따로 놀면 "이 회차가 무엇을 노리는지" 를 두 화면을
   * 오가며 맞춰 봐야 한다. 노리는 검색어와 그 검색량이 같은 줄에 있어야
   * 편성이 맞았는지 한눈에 판단된다.
   */
  /**
   * ⚠️ `.select()` 만 쓰면 **1,000행에서 잘린다.** (2026-08-18 수정)
   *
   * PostgREST 기본 상한이 1,000이고 키워드는 지금 1,998개다. 그래서 5편이
   * 노리는 `인스타메타광고`(470회·1.8%)가 표에 멀쩡히 있는데도 편성표에는
   * "—" 로 나왔다 — 잘려 나간 뒷쪽 998개에 들어 있었다.
   *
   * 낮에 매칭 키를 고치고 3·4편이 뜨는 걸 보고 통과로 판단했다. 표본 두 개로
   * 넘긴 것이고, 그 둘이 우연히 앞쪽 1,000개 안에 있었을 뿐이다.
   * 키워드는 계속 늘어나므로 상한을 올리는 게 아니라 **다 읽을 때까지 넘긴다.**
   */
  const keywordRows: {
    term: string;
    total_volume: number | null;
    pc_ctr: number | null;
    mobile_ctr: number | null;
    competition: string | null;
  }[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data } = await supabase
      .from("blog_keyword")
      .select("term, total_volume, pc_ctr, mobile_ctr, competition")
      .order("term")
      .range(from, from + PAGE - 1);
    if (!data?.length) break;
    keywordRows.push(...data);
    if (data.length < PAGE) break;
  }

  /**
   * 우리 실제 성적 — **글 단위**로 읽는다. (2026-08-18 전환)
   *
   * 예전엔 검색어 차원(`searchSummary`)에서 검색어를 맞춰 붙였다. 그런데
   * 편성표의 열쇠는 검색어가 아니라 **글**이라 거의 안 맞았고, 맞아도
   * "그 검색어 전체 노출" 이지 "이 글의 노출" 이 아니었다.
   *
   * 이제 `blog_post_metric` 이 발행 후 D+7·21·60 세 시점에 글별로 재 둔다.
   * 여기서는 그중 **가장 나중 시점**을 대표값으로 세운다.
   */
  const metrics = await metricsByPost();
  const latest = (list: PostMetric[] | undefined) =>
    list && list.length ? list[list.length - 1] : null;

  const EMPTY_PERF = {
    impressions: null,
    clicks: null,
    position: null,
    offsetDays: null,
    daysUntilFirst: null,
  };

  const perfOf = (post: PostRow | null | undefined) => {
    if (!post?.publishedAt) return EMPTY_PERF;
    const hit = latest(metrics.get(post.id));
    if (hit) {
      return {
        impressions: hit.impressions,
        clicks: hit.clicks,
        position: hit.position,
        offsetDays: hit.offsetDays,
        daysUntilFirst: null,
      };
    }
    /**
     * 아직 한 번도 안 잰 글. "—" 만 찍으면 고장인지 이른 건지 구분이 안 된다.
     * 며칠 남았는지 세어 준다 — 첫 측정은 D+7 이다.
     */
    const age = Math.floor(
      (Date.now() - new Date(post.publishedAt).getTime()) / 86_400_000,
    );
    return { ...EMPTY_PERF, daysUntilFirst: Math.max(0, 7 - age) };
  };

  /**
   * 이번 주 깔때기. (2026-08-19)
   *
   * 주간 표에 그 글의 이번 주 행이 아직 없을 수 있다(방금 발행됐거나 집계가
   * 아직 안 돈 경우). 그때는 **0 을 지어내지 않고 null** 을 준다 — 화면에서
   * "0 건" 과 "아직 안 쟀다" 는 완전히 다른 말이다.
   */
  const weekly = await weeklyByPost(4);
  const thisWeek = weekStart(new Date());
  const funnelOf = (post: PostRow | null | undefined) => {
    if (!post?.publishedAt) return null;
    const hit = weekly.get(post.id)?.find((w) => w.weekStart === thisWeek);
    return hit
      ? {
          weekStart: hit.weekStart,
          impressions: hit.impressions,
          clicks: hit.clicks,
          views: hit.views,
          inquiries: hit.inquiries,
          position: hit.position,
        }
      : null;
  };

  const liveOf = (post: PostRow | null | undefined) =>
    post?.publishedAt ? `${SERVICE.url}/blog/${post.slug}` : null;

  /**
   * 편성 큐의 검색어는 사람이 손으로 적은 것("숏폼 소재 교체 주기")이고
   * 네이버 수집분은 붙여 쓴 것("숏폼소재교체주기")이다. 띄어쓰기 때문에
   * 매칭이 통째로 빗나가므로 공백을 지우고 맞춘다.
   */
  const norm = (t: string) => t.replace(/\s+/g, "");
  const metricOf = (term: string | null | undefined) => {
    const row = term
      ? keywordRows.find((k) => norm(k.term) === norm(term))
      : undefined;
    return {
      term: term ?? null,
      volume: row?.total_volume ?? null,
      // PC·모바일 중 큰 쪽을 쓴다. 우리 독자는 대부분 모바일에서 검색하지만
      // B2B 검색어는 PC 비중이 높은 것도 있어서 한쪽만 보면 과소평가된다
      ctr:
        row == null
          ? null
          : Math.max(Number(row.pc_ctr ?? 0), Number(row.mobile_ctr ?? 0)) ||
            null,
      competition: row?.competition ?? null,
    };
  };
  /**
   * ⚠️ 작업표를 **날짜로** 붙이면 안 된다. (2026-08-18)
   *
   * 원고의 `scheduled_for` 와 작업표의 `scheduled_for` 가 하루씩 어긋나 있다
   * (08-16 이전 날짜 버그의 잔재 — 원고 08-13 ↔ 작업표 08-14).
   * 날짜로 붙였더니 2·3행에 엉뚱한 검색어가 걸리고 6행 생성비가 옆 회차 것으로
   * 나왔다. `blog_job.post_id` 라는 정확한 열쇠가 처음부터 있었다.
   *
   * 날짜 맵은 **아직 원고가 없는 앞으로의 슬롯**에만 쓴다. 그때는 붙일
   * post_id 자체가 없기 때문이다.
   */
  const toJob = (j: (typeof jobs extends (infer U)[] | null ? U : never)) => ({
    stage: JOB_STAGE_LABEL[j.stage] ?? j.stage,
    note: j.last_error,
    costUsd: j.cost_usd === null ? null : Number(j.cost_usd),
    keywordTerm: (j.keyword_term as string | null) ?? null,
    segment: (j.segment as string | null) ?? null,
    topic: (j.topic as string | null) ?? null,
  });

  const jobByPost = new Map(
    (jobs ?? []).filter((j) => j.post_id).map((j) => [j.post_id as string, toJob(j)]),
  );

  const jobByDay = new Map(
    (jobs ?? []).map((j) => [j.scheduled_for, toJob(j)] as const),
  );


  // 고객 이야기는 편성표에 오르지 않는다 — 발행 예정이 있는 연재물이 아니라
  // 늘 거기 있는 상시 자료다
  const insights = posts.filter((p) => p.kind === "insight");

  // ── 이미 손댄 회차 (발행됐거나 원고가 있는 것) ─────────────────────
  // 앞선 판은 앞으로의 슬롯만 보여 줬는데, 그러면 1편을 발행하고도 표가
  // 2번부터 시작해서 "1번은 어디 갔나" 가 된다. 지나온 회차도 같이 세운다.
  const settled = insights
    .filter((p) => p.status !== "planned")
    .sort((a, b) => {
      const an = a.seq ?? Number.MAX_SAFE_INTEGER;
      const bn = b.seq ?? Number.MAX_SAFE_INTEGER;
      if (an !== bn) return an - bn;
      return (a.scheduledFor ?? a.createdAt).localeCompare(
        b.scheduledFor ?? b.createdAt,
      );
    });

  /** 이미 원고가 있는 회차는 post_id 로 붙인다. 날짜는 못 믿는다 */
  const settledJob = (post: PostRow) => jobByPost.get(post.id) ?? null;

  const rows: BoardRow[] = [];
  let cursor = 0;

  for (const post of settled) {
    const no = post.seq ?? cursor + 1;
    cursor = Math.max(cursor, no);
    rows.push({
      no,
      fixed: Boolean(post.publishedAt),
      date: new Date(post.publishedAt ?? post.scheduledFor ?? post.createdAt),
      slot: null,
      post,
      planned: null,
      href: `/admin/blog/${post.id}`,
      // ⚠️ scheduledFor 를 그냥 slice 하면 UTC 날짜라 **전날**이 나오고,
      // 생성비·진행상태가 옆 회차 것으로 붙는다 (2026-08-16 수정)
      job: settledJob(post),
      // 노리는 검색어가 먼저다. 기획안 문구는 그게 없을 때의 차선책이다
      keyword: metricOf(settledJob(post)?.keywordTerm ?? post.headKeyword),
      performance: perfOf(post),
      funnel: funnelOf(post),
      liveUrl: liveOf(post),
    });
  }

  // ── 앞으로의 슬롯 ────────────────────────────────────────────────
  const slots = upcomingSlots(new Date(), weeks * WEEKLY_SLOTS.length);
  const byDay = new Map<string, PostRow>();
  for (const p of insights) {
    if (p.scheduledFor && p.status === "planned") {
      byDay.set(kstDate(new Date(p.scheduledFor)), p);
    }
  }

  /** 편성과 **같은 판정**을 쓴다. 두 벌이면 표와 실제가 어긋난다 */
  const { usable: queue } = await auditQueue();
  let queueAt = 0;
  for (const { date, slot } of slots) {
    const post = byDay.get(kstDate(date)) ?? null;
    cursor += 1;
    rows.push({
      no: cursor,
      fixed: false,
      date,
      slot,
      post,
      // 원고가 있으면 예정 주제는 안 보여 준다 — 이미 정해진 걸 두 번 말하는 셈이다
      /**
       * ⚠️ **검증된 큐만** 세운다. (2026-08-19 저녁 수정)
       *
       * 앞 판은 `TOPIC_QUEUE` 를 그대로 순서대로 뿌렸다. 그래서 이미 쓴
       * 항목이 미래 슬롯에 유령으로 떴다 — 사장님 스크린샷에서
       * `스마트스토어상품등록대행` 이 #6(오늘 발행분)과 7(내일)에 같이
       * 보인 이유다. 편성은 안 뽑는데 표만 그렇게 보였다.
       */
      planned: post ? null : (queue[queueAt++] ?? null),
      href: post ? `/admin/blog/${post.id}` : null,
      job: jobByDay.get(kstDate(date)) ?? null,
      keyword: metricOf(
        jobByDay.get(kstDate(date))?.keywordTerm ??
          post?.headKeyword ??
          queue[queueAt - 1]?.term,
      ),
      // 아직 안 나간 회차는 성적이 있을 수 없다
      performance: perfOf(post),
      funnel: funnelOf(post),
      liveUrl: liveOf(post),
    });
  }

  return rows;
}

export const PILLAR_OPTIONS = [
  { key: "unassigned", label: "미배정" },
  ...PILLARS.map((p) => ({ key: p.key as string, label: p.label })),
];
