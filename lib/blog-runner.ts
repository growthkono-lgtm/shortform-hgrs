import { citedSourceIndexes } from "@/lib/blog-ai";
import { fitFindings, judgeSourceFit } from "@/lib/blog-fit-judge";
import type { FitContext } from "@/lib/blog-fit";
import { leadTargetOf } from "@/lib/blog-spec";
import "server-only";

import {
  USAGE,
  planPost,
  researchTopic,
  revisePost,
  writePost,
  countChars,
  type BlogPlan,
} from "@/lib/blog-ai";
import { readingTime } from "@/lib/blog-spec";
import { auditPost } from "@/lib/blog-audit";
import { WEEKLY_SLOTS, kstDate, kstParts } from "@/lib/blog-schedule";
import { SEASONAL_WEEKDAYS, takeTrend } from "@/lib/blog-trends";
import { auditQueue } from "@/lib/blog-queue";
import {
  CORE_TERMS,
  DIFFICULTY_FOR_TRACK,
  MIN_MAIN_VOLUME,
  TRACK_BY_WEEKDAY,
  isOurs,
} from "@/lib/keyword-filter";
import { isDomestic, verifySources, type Source } from "@/lib/blog-sources";
import { format, type FormatKey, type PillarKey, type SegmentKey } from "@/lib/blog-spec";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * 원고 자동 생성 — 한 호출에 **한 단계만** 밟는다. (2026-08-14)
 *
 * 사장님 지시로 2편부터는 사람이 시작 버튼을 누르지 않는다. 발행 당일 아침에
 * cron 이 이 러너를 부르고, 부를 때마다 한 칸씩 나아간다.
 *
 *   research → plan → verify → write → polish → done
 *
 * **왜 한 번에 안 하는가.** 전 과정이 5~10분인데 Vercel 함수는 300초에서
 * 끊긴다. 한 호출에 몰아넣으면 중간에 끊길 때 가장 비싼 조사(웹 검색 12회)가
 * 통째로 날아간다 — 2026-08-13 에 실제로 겪었다. 단계마다 DB 에 적어 두면
 * 어디서 죽든 그 앞은 살아남는다.
 *
 * ── 사람 손을 뗀다 (2026-08-14 개편) ──────────────────────────────────
 * 사장님 지시: "컨펌도 할 필요 없는. 그저 돈 얼마 나가고 발행이 됐고
 * 조회수 나오고 이런 거 메일 리포트만 오는."
 *
 * 그래서 검수 버튼을 없앴다. 대신 **검사식이 승인권을 갖는다.**
 *   polish 단계에서 `auditPost` 를 돌린다
 *     통과  → `approved_at` 을 찍는다 → 그날 17시에 자동 발행
 *     미달  → 걸린 항목만 모델에게 돌려주고 다시 쓰게 한다 (최대 2회)
 *     그래도 미달 → **승인하지 않는다.** 그 회차는 그냥 안 나간다
 *
 * 마지막 줄이 이 설계의 전부다. 자동화의 목적은 주 3회를 채우는 것이 아니라
 * 사장님이 안 보셔도 되는 품질을 지키는 것이다. 미달 원고를 내보내면
 * 사람이 다시 봐야 하고, 그러면 자동화한 의미가 없다.
 */

/**
 * 한 단계에 허용하는 시간. 300초 함수 안에서 여유를 남긴다.
 *
 * 실측(2026-08-14): 집필 4분 안팎, 교정 75초, 기획 2분대. 집필이 제일 빠듯해서
 * `respond()` 쪽 중단선(4.3분)보다 이 값을 조금 뒤에 둔다 — 안쪽이 먼저 끊어야
 * "무엇이 시간을 먹었는지" 가 오류 문구에 남는다.
 */
const STAGE_BUDGET_MS = 4.6 * 60 * 1000;

/** 같은 단계를 이만큼 실패하면 사람이 봐야 한다 */
const MAX_ATTEMPTS = 3;

/**
 * 규격 미달 원고를 어떻게 밀어붙일 것인가. (2026-08-16 개편)
 *
 * ── 왜 바꿨나 ──────────────────────────────────────────────────────────
 * 전에는 **걸린 항목만 패치**해서 두 번 고쳐 보고, 안 되면 그 회차를 걸렀다.
 * 근거는 "두 번에 안 되는 건 자료가 얇아서라 세 번째도 안 된다" 였는데,
 * 08-16 편이 그 전제를 깼다. 걸린 것은 검사식의 **오탐 한 줄**이었고 원고는
 * 멀쩡했다. 패치는 고칠 게 없으니 두 번 다 헛돌았고, 규칙대로면 그날 편이
 * 조용히 사라질 참이었다.
 *
 * 사장님 원칙은 명확하다 — **미달이면 막히는 게 아니라, 시간 안에 채워서
 * 결국 내보내야 한다.** 그래서 포기 조건을 "시도 횟수"에서 **수단**으로 옮겼다.
 * 패치가 헛도는 종류의 미달(문장 구조·논리 정합)은 패치를 백 번 해도 안 되고,
 * 처음부터 다시 쓰면 대개 풀린다.
 *
 *   패치 → 패치 → 전면 재집필 → 패치 → 전면 재집필 → 패치 → (여기서 사람)
 *
 * 재집필은 같은 자료·구성안으로 집필만 다시 한다. 조사가 제일 비싸서 거기까지
 * 되감지 않는다. 바깥 울타리는 두 개다 — **편당 비용 상한($4)** 과
 * **15시 컷오프**. 둘 중 하나에 닿으면 사다리 중간이라도 멈춘다.
 */
const REPAIR_LADDER = [
  "patch",
  "patch",
  "rewrite",
  "patch",
  "rewrite",
  "patch",
] as const;


/** 잠금이 이보다 오래되면 죽은 호출로 보고 뺏는다 */
const LOCK_STALE_MS = 8 * 60 * 1000;

/**
 * 돈이 새는 걸 코드가 직접 막는다. (2026-08-14)
 *
 * 2026-08-13 에 "$1~2" 라고 말해 놓고 $22 를 냈다. 원인은 파이프라인이
 * 실패할 때마다 **가장 비싼 조사를 처음부터 다시 돌린 것** 이었다.
 * 단계별 저장으로 그 원인은 없앴지만, 추정치는 또 틀릴 수 있다.
 * 그래서 추정 대신 상한을 박는다 — 넘으면 그 자리에서 멈춘다.
 */
/**
 * 한 편 상한. 엔진을 OpenAI 로 바꾸면서 다시 잡았다(2026-08-14).
 *
 * 앤트로픽 시절 회당 $4.4 를 만든 단가가 $5/$25 였다. 지금 쓰는 조합은
 * 조사·기획 $2/$12 · 집필 $5/$30 이라 같은 파이프라인이면 편당 $1 언저리다.
 * 상한은 예산 목표가 아니라 폭주 차단기라서 정상 비용의 서너 배에 둔다 —
 * 조사(가장 비싼 단계)를 끝낸 뒤 집필 직전에 잘리면 **돈은 다 쓰고 원고는
 * 없는** 최악이 되기 때문이다.
 */
const MAX_COST_PER_JOB_USD = 4;

/**
 * 월 총액 상한.
 *
 * 08-14 에 $50 으로 잡았는데, 실측이 편당 $1.34(8/14 $0.96 · 8/15 $1.71) 이라
 * 매일 1편이면 **월 $41.5** 다. 벽까지 $8.5 밖에 안 남아서, 재집필이 몇 번
 * 붙는 달이면 월말에 상한에 닿아 **며칠이 조용히 빈다.** 그건 폭주 차단이
 * 아니라 그냥 서비스 중단이다.
 *
 * 08-16 에 $80 으로 올린다. 벽 위치만 옮기는 것이라 실제 결제액은 안 변한다 —
 * 실측이 $41 이면 $41 만 나간다. 실측이 이 근처까지 오르면 그때 다시 본다.
 */
export const MAX_COST_PER_MONTH_USD = 80;

/** 이번 달에 원고 생성으로 쓴 총액 */
export async function monthlySpend(now = new Date()): Promise<number> {
  const supabase = createAdminClient();
  const { year, month } = kstParts(now);
  const from = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);

  const { data } = await supabase
    .from("blog_job")
    .select("cost_usd")
    .gte("scheduled_for", from);

  return (data ?? []).reduce((sum, r) => sum + Number(r.cost_usd ?? 0), 0);
}

export type JobRow = {
  id: string;
  cost_usd: number | null;
  scheduled_for: string;
  pillar: string;
  format: string;
  topic: string;
  segment: string | null;
  keyword_term: string | null;
  stage: "research" | "plan" | "verify" | "write" | "polish" | "done" | "failed";
  last_error: string | null;
  research: string | null;
  plan: unknown;
  sources: unknown;
  post_id: string | null;
  attempts: number;
  locked_at: string | null;
  search_count: number | null;
  revisions: number | null;
  audit: unknown;
};

/**
 * 오늘 만들어야 할 작업이 있으면 만든다.
 *
 * 편성 슬롯(월·수·목)이 아닌 날엔 아무것도 하지 않는다. 이미 그 날짜로
 * 원고가 있으면(사람이 직접 넣었든 어제 만들었든) 새로 만들지 않는다.
 */
export async function ensureJobForToday(now = new Date()): Promise<JobRow | null> {
  const { weekday } = kstParts(now);
  const slot = WEEKLY_SLOTS.find((s) => s.weekday === weekday);
  if (!slot) return null;

  const supabase = createAdminClient();
  // ⚠️ kstMoment(now,0,0).toISOString().slice(0,10) 을 쓰면 **전날**이 나온다.
  // 그 한 줄 때문에 작업표·원고 날짜가 하루씩 밀려 있었다 (2026-08-16 수정)
  const day = kstDate(now);

  const { data: existing } = await supabase
    .from("blog_job")
    .select("*")
    .eq("scheduled_for", day)
    .maybeSingle();
  if (existing) return existing as JobRow;

  // 이미 그 날짜 원고가 어드민에 있으면 만들지 않는다
  const { data: post } = await supabase
    .from("blog_post")
    .select("id")
    .eq("kind", "insight")
    // 원고의 scheduled_for 는 그날 **한국시간 자정**을 가리킨다. UTC 로 물으면
    // 9시간 어긋나 옆 날짜를 집는다
    .gte("scheduled_for", `${day}T00:00:00+09:00`)
    .lte("scheduled_for", `${day}T23:59:59+09:00`)
    .maybeSingle();
  if (post) return null;

  /**
   * 무엇을 쓸지 — 편성 큐에서 아직 안 쓴 검색어를 순서대로 꺼낸다.
   *
   * ⚠️ 2026-08-14 버그 수정. 여기서 `topic`(각도 문장)을 모아 놓고 `term`
   * (검색어)과 비교하고 있었다. 둘은 절대 같아질 수 없어서 **큐의 첫 항목이
   * 영원히 다시 뽑혔다** — 매일 1편으로 바꾸는 순간 같은 주제를 매일 쓰는
   * 사고가 났을 것이다. 비교 기준을 `keyword_term` 으로 맞춘다.
   */
  const { data: used } = await supabase
    .from("blog_job")
    .select("keyword_term");
  const taken = new Set(
    (used ?? []).map((r) => r.keyword_term).filter(Boolean) as string[],
  );
  let next: {
    pillar: string;
    angle: string;
    segment: string | null;
    term: string;
    difficulty?: string;
  } | null = null;

  /**
   * 오늘 요일이 원하는 난이도부터 찾는다. (2026-08-14)
   *
   * 주 5편은 니치, 주말 2편은 빅이다. 이유는 `DIFFICULTY_BY_WEEKDAY` 에 적어 뒀다 —
   * 요약하면 1년 3개월 된 도메인이 경쟁 '높음' 검색어를 잡는 데 6~12개월이 들고,
   * 니치는 2~8주면 붙기 때문이다. 작은 걸로 먼저 이겨야 큰 걸 칠 힘이 생긴다.
   *
   * 해당 난이도가 동나면 남은 것 아무거나 쓴다 — 그날을 통째로 비우는 것보다 낫다.
   */
  /**
   * 월·목은 **시의성 슬롯**이다. (2026-08-18 사장님 제안)
   *
   * 뉴스·급상승 소식을 우리 니치 검색어와 곱한 복합키워드는 며칠이면 순위가
   * 붙는다(니치는 2~8주). 도메인 1년 3개월에 노출 2회인 지금, 이 상태를
   * 깨는 가장 빠른 길이다.
   *
   * 주 2편만인 이유: 시의성 키워드는 3개월이면 트래픽이 0 이 되어 자산이
   * 안 쌓이고, 전부를 뉴스로 채우면 매거진 포지션이 무너진다.
   *
   * **후보가 없으면 평소대로 니치 풀을 쓴다.** 이번 주에 쓸 만한 소식이
   * 없는 것은 고장이 아니다. 새 기능이 기존 편성을 멈춰 세우면 안 된다.
   */
  if (SEASONAL_WEEKDAYS.has(weekday)) {
    try {
      const trend = await takeTrend(now);
      if (trend && !taken.has(trend.combined_term)) {
        next = {
          pillar: trend.pillar,
          angle: trend.angle,
          segment: null,
          term: trend.combined_term,
          difficulty: "니치",
        };
      }
    } catch {
      // 시의성 수집이 죽어도 그날 편은 나가야 한다
    }
  }

  /**
   * 그날의 **트랙**. (2026-08-19 — 난이도 단독 판단에서 갈아탐)
   *
   * 난이도만 보면 "이길 수 있나" 만 묻고 "왜 이 검색어를 먹어야 하나" 는
   * 묻지 않는다. 그래서 08-19 실측에서 평일 픽업 1순위가 **`포장지제작`
   * (월 540)** 이었다 — 이길 수는 있지만 우리 사업이 아니다.
   * 트랙은 사장님의 SEO 4원칙을 그대로 옮긴 것이다(`lib/keyword-filter.ts`).
   */
  const track = TRACK_BY_WEEKDAY[weekday];
  const wants = DIFFICULTY_FOR_TRACK[track];

  /**
   * 코어 트랙 — **반복 배포**. 여기서만 `taken` 을 무시한다.
   *
   * 사장님: *"우리 서비스와 직결되는 키워드들 중 중요한 것들은 격주 단위나
   * 많으면 주 단위로도 정기적으로 배포 루틴을 반복해야 하는 거야."*
   *
   * 나머지 트랙은 한 번 쓴 검색어를 다시 쓰지 않는다(카니발라이제이션).
   * 코어만 예외인 이유는, 그 자리는 한 편으로 못 먹고 문서 뭉치로 먹기
   * 때문이다. 대신 **최소 간격**을 지킨다 — 같은 검색어가 연달아 나가면
   * 우리 글끼리 순위를 나눠 갖는다.
   */
  if (!next && track === "core") {
    const { data: history } = await supabase
      .from("blog_job")
      .select("keyword_term, scheduled_for")
      .in("keyword_term", CORE_TERMS.map((c) => c.term))
      .order("scheduled_for", { ascending: false });

    const lastUsed = new Map<string, string>();
    for (const h of history ?? []) {
      if (h.keyword_term && !lastUsed.has(h.keyword_term)) {
        lastUsed.set(h.keyword_term, h.scheduled_for as string);
      }
    }

    /** 간격을 채운 것 중 **가장 오래 안 쓴** 것부터. 한 번도 안 쓴 게 먼저다 */
    const ready = CORE_TERMS.filter((c) => {
      const last = lastUsed.get(c.term);
      if (!last) return true;
      const gap = Math.floor(
        (new Date(`${day}T00:00:00+09:00`).getTime() -
          new Date(`${last}T00:00:00+09:00`).getTime()) /
          86_400_000,
      );
      return gap >= c.days;
    }).sort((a, b) => (lastUsed.get(a.term) ?? "").localeCompare(lastUsed.get(b.term) ?? ""));

    const pickCore = ready[0];
    if (pickCore) {
      const { data: meta } = await supabase
        .from("blog_keyword")
        .select("pillar, total_volume")
        .eq("term", pickCore.term)
        .maybeSingle();
      next = {
        pillar: meta?.pillar && meta.pillar !== "unassigned" ? meta.pillar : "shortform",
        // 각도는 회차마다 달라야 한다 — 같은 검색어를 같은 각도로 또 쓰면 중복 문서다
        angle: `${pickCore.term} — 이번 회차는 앞선 편과 다른 각도로(사례·비교·체크리스트 순환)`,
        segment: null,
        term: pickCore.term,
        difficulty: "코어",
      };
    }
  }

  /**
   * 손으로 적은 편성 큐. **검증을 통과한 것만** 쓴다. (2026-08-19 저녁 수정)
   *
   * 앞 판은 `taken` 만 걸렀다. 그래서 오전에 세운 관련성·하한 규칙이 큐에는
   * 적용되지 않았고, 큐가 DB 풀보다 우선이라 **관문 앞에 우회로가 열려 있었다.**
   * 오늘 편이 `스마트스토어상품등록대행`(510·관련성 탈락)으로 나간 경로다.
   * 판정은 `lib/blog-queue.ts` 한 곳에서만 한다 — 어드민 표도 같은 걸 본다.
   */
  if (!next) {
    const { usable } = await auditQueue();
    next =
      usable.find((t) => t.difficulty && wants.includes(t.difficulty as never)) ??
      usable[0] ??
      null;
  }

  /**
   * 큐가 마르면 키워드 보드에서 이어 받는다. (2026-08-14)
   *
   * 매일 1편이면 손으로 적은 큐(25개)는 25일이면 바닥난다. 바닥나면 그날부터
   * 조용히 발행이 없어지는데, 그게 제일 나쁘다 — 아무도 모른 채 멈춘다.
   *
   * 그래서 실제 수집된 검색어 중 **월 검색량 1,000 이상**이면서 우리가 파는
   * 것과 붙어 있는 것을 니치 점수 순으로 꺼낸다. 사장님 기준: *"검색량이
   * 적어도 최소 1-2천 건 이상은 나오는게 맞아. 그 이하는 정말 별 의미가 없어서."*
   */
  if (!next) {
    /**
     * 오늘 요일이 원하는 난이도로 좁혀서 꺼낸다. 정렬은 **구매의도 우선**이다.
     *
     * 같은 니치라도 "숏폼외주단가" 는 견적을 받으려는 사람이 치고
     * "숏폼트렌드" 는 구경하는 사람이 친다. 둘 다 순위는 잡히지만 문의로
     * 이어지는 건 앞쪽이라, 같은 조건이면 앞쪽을 먼저 쓴다.
     *
     * 검색량 하한 300 — 사장님 기준(*"그 이하는 정말 별 의미가 없어서"*).
     */
    let query = supabase
      .from("blog_keyword")
      .select("term, pillar, total_volume, niche_score, buyer_intent")
      .eq("status", "idle")
      .in("difficulty", wants)
      /**
       * 하한을 300 → 500 으로 올렸다. (2026-08-19 사장님 기준)
       *
       * *"500 내외 혹은 그 미만은 그냥 엄청나게 작은 키워드라 컨텐츠 메인으로
       * 걸 건 사실 원래 아닌데."* 실측으로도 1,998개 중 1,358개(68%)가
       * 100~499 였고, 그게 매일 뽑히고 있었다.
       */
      .gte("total_volume", MIN_MAIN_VOLUME)
      /**
       * 정렬은 **구매의도 먼저, 그다음 검색량**이다. (2026-08-19)
       *
       * 검색량만으로 줄 세우면 `카페24쇼핑몰`(2,970) 이 `광고대행사`(2,960)
       * 를 이긴다. 열 건 더 검색되는 대신 우리에게 올 사람이 아니다.
       * 예전에는 `niche_score` 를 2차 키로 썼는데 그 값이 1,998개 중 1,460개가
       * **비어 있어서**(08-19 실측) 사실상 정렬이 없었다. 지금은 전량 채웠지만,
       * 1차 키는 돈이 오가는 신호여야 한다.
       */
      .order("buyer_intent", { ascending: false })
      .order("total_volume", { ascending: false });

    /** 전환 트랙은 검색량이 아니라 **구매의도**로 고른다 */
    if (track === "convert") query = query.eq("buyer_intent", true);

    const { data: pool } = await query.limit(200);

    /**
     * 관련성을 **뽑는 순간에 한 번 더** 본다. (2026-08-19)
     *
     * DB 의 status 로 이미 걸러 두지만, 재분류가 아직 안 돌았거나 수집이
     * 새 규칙보다 앞서 있으면 옛 쓰레기가 남아 있다. 편성은 마지막 관문이라
     * 여기서 한 번 더 막는 게 싸다 — 한 편이 잘못 나가면 되돌릴 수 없다.
     */
    const pick = (pool ?? []).find((k) => !taken.has(k.term) && isOurs(k.term));
    if (pick) {
      /**
       * 업종을 검색어에서 짐작한다.
       *
       * 세부 타겟이 비면 글이 일반론이 되고, 일반론은 어느 업종 사람이 읽어도
       * 자기 얘기가 아니라 문의로 안 이어진다. 검색어에 업종이 드러나면 그걸
       * 쓰고, 안 드러나면 우리 주력인 이커머스 D2C 로 둔다.
       */
      const SEGMENT_HINT: [RegExp, SegmentKey][] = [
        [/화장품|뷰티|코스메|스킨|헤어/, "beauty"],
        [/패션|의류|무신사|쇼핑몰/, "fashion"],
        [/식품|건기식|건강기능|다이어트|음료/, "food"],
        [/리빙|가구|가전|인테리어/, "living"],
        [/시니어|헬스케어|병원|반려|실버/, "senior"],
        [/지역|로컬|매장|플레이스|당근|오프라인/, "service"],
        [/SaaS|saas|B2B|앱|솔루션|링크드인/, "saas"],
      ];
      const guessed =
        SEGMENT_HINT.find(([re]) => re.test(pick.term))?.[1] ?? "d2c";

      next = {
        pillar: pick.pillar && pick.pillar !== "unassigned" ? pick.pillar : "brand-sns",
        angle: `${pick.term} — 이 검색어를 치는 결정권자가 지금 무엇을 판단하려는지에서 출발한다`,
        segment: guessed,
        term: pick.term,
        difficulty: track,
      };
    }
  }

  if (!next) return null; // 큐도 보드도 비었다 — 키워드를 더 수집해야 한다

  const { data: created } = await supabase
    .from("blog_job")
    .insert({
      scheduled_for: day,
      pillar: next.pillar,
      format: slot.format,
      topic: next.angle,
      segment: next.segment,
      keyword_term: next.term,
    })
    .select("*")
    .single();

  return (created as JobRow) ?? null;
}

/** 지금 손댈 작업 하나 — 잠금을 걸어 가져온다 */
async function claim(now: Date): Promise<JobRow | null> {
  const supabase = createAdminClient();
  const staleBefore = new Date(now.getTime() - LOCK_STALE_MS).toISOString();

  const { data: rows } = await supabase
    .from("blog_job")
    .select("*")
    .not("stage", "in", "(done,failed)")
    .order("scheduled_for", { ascending: true })
    .limit(5);

  for (const row of (rows ?? []) as JobRow[]) {
    // 다른 호출이 붙들고 있으면 건너뛴다. 너무 오래됐으면 죽은 것으로 보고 뺏는다
    if (row.locked_at && row.locked_at > staleBefore) continue;

    // 잠금 획득은 "내가 본 그 상태 그대로일 때만" 이라야 두 호출이 겹치지 않는다.
    // null 비교는 eq() 로 안 걸린다 — is() 를 써야 한다
    const guard = supabase
      .from("blog_job")
      .update({ locked_at: now.toISOString(), attempts: row.attempts + 1 })
      .eq("id", row.id);
    const { data: locked } = await (row.locked_at
      ? guard.eq("locked_at", row.locked_at)
      : guard.is("locked_at", null)
    )
      .select("*")
      .maybeSingle();

    if (locked) return locked as JobRow;
  }
  return null;
}

/** 단계가 예산을 넘기면 잘라 낸다 — 함수가 통째로 죽는 것보다 낫다 */
async function withBudget<T>(work: Promise<T>, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${label} 단계가 시간 안에 안 끝났습니다`)),
          STAGE_BUDGET_MS,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export type StepResult = {
  jobId: string | null;
  from: string | null;
  to: string | null;
  note: string;
  /**
   * 이 한 칸이 정상이었나. (2026-08-18 신설)
   *
   * 이 필드가 없어서 08-17·08-18 두 편이 조용히 비었다. `stepOnce` 는 실패해도
   * **예외를 안 던지고 정상 반환한다** — 조사 3패스가 크레딧 부족으로 전멸해도
   * `return` 이다. 그래서 `cronRoute` 는 그걸 `ok=true` 로 적었고, 그 결과
   * (1) 크레딧 긴급 메일이 한 통도 안 나갔고 (2) 저녁 리포트의 "걸린 것" 칸이
   * 늘 비어 있었다. `blog_ops_log` 에 `ok=false` 는 개설 이래 **0줄**이었다.
   *
   * 성공/실패를 부르는 쪽이 판정하게 만든다. 문구를 정규식으로 훑어 짐작하지 않는다.
   */
  ok: boolean;
};

/**
 * 한 칸 나아간다. cron 이 반복해 부르면 결국 done 에 닿는다.
 */
export async function stepOnce(now = new Date()): Promise<StepResult> {
  await ensureJobForToday(now);

  const job = await claim(now);
  if (!job)
    return { jobId: null, from: null, to: null, note: "할 일 없음", ok: true };

  const supabase = createAdminClient();

  // ── 돈 상한 ────────────────────────────────────────────────────────
  const spentOnJob = Number(job.cost_usd ?? 0);
  const spentThisMonth = await monthlySpend(now);

  const overrun =
    spentOnJob >= MAX_COST_PER_JOB_USD
      ? `한 편 상한 $${MAX_COST_PER_JOB_USD} 초과 (현재 $${spentOnJob.toFixed(2)})`
      : spentThisMonth >= MAX_COST_PER_MONTH_USD
        ? `이번 달 상한 $${MAX_COST_PER_MONTH_USD} 초과 (현재 $${spentThisMonth.toFixed(2)})`
        : null;

  if (overrun) {
    await supabase
      .from("blog_job")
      .update({
        stage: "failed",
        last_error: `${overrun} — 사람이 확인해야 합니다`,
        locked_at: null,
        updated_at: now.toISOString(),
      })
      .eq("id", job.id);
    return {
      jobId: job.id,
      from: job.stage,
      to: "failed",
      note: overrun,
      ok: false,
    };
  }

  // 이 호출에서 쓴 만큼만 재려면 매번 0 에서 시작해야 한다.
  // 서버리스라 모듈 상태가 호출마다 초기화되지만, 같은 인스턴스가
  // 재사용되면 앞 호출의 값이 남는다
  USAGE.reset();
  const formatKey = job.format as FormatKey;
  const pillarKey = job.pillar as PillarKey;

  const fail = async (message: string) => {
    const dead = job.attempts >= MAX_ATTEMPTS;
    await supabase
      .from("blog_job")
      .update({
        stage: dead ? "failed" : job.stage,
        last_error: message.slice(0, 800),
        // 실패한 호출도 토큰은 썼다. 안 적으면 상한을 못 지킨다
        cost_usd: Number((spentOnJob + USAGE.costFloor()).toFixed(4)),
        locked_at: null,
        updated_at: now.toISOString(),
      })
      .eq("id", job.id);
    return {
      jobId: job.id,
      from: job.stage,
      to: dead ? "failed" : job.stage,
      note: message.slice(0, 200),
      ok: false,
    };
  };

  /**
   * 앞 단계로 되돌린다. (2026-08-15 신설)
   *
   * 그동안 자료 검증이 미달일 때 *"기획부터 다시 돌립니다"* 라고 적어 놓고
   * 실제로는 `fail()` 을 불렀다. `fail()` 은 **같은 단계를 그대로 둔다.**
   * 그래서 똑같은 자료 후보로 똑같은 검증을 세 번 반복하고 죽었다 —
   * 되돌린다는 말만 있고 되돌리는 코드가 없었다.
   *
   * 08-15 에 국내·임베드 기준을 올리면서 이 경로를 자주 타게 됐으므로
   * 실제로 되감는다. `attempts` 는 일부러 안 지운다 — 세 바퀴를 돌면
   * `fail()` 이 받아서 failed 로 끊는다.
   */
  const rewind = async (to: "research" | "plan", message: string) => {
    if (job.attempts >= MAX_ATTEMPTS) return fail(message);
    await supabase
      .from("blog_job")
      .update({
        stage: to,
        last_error: message.slice(0, 800),
        cost_usd: Number((spentOnJob + USAGE.costFloor()).toFixed(4)),
        locked_at: null,
        updated_at: now.toISOString(),
      })
      .eq("id", job.id);
    return {
      jobId: job.id,
      from: job.stage,
      to,
      note: message.slice(0, 200),
      ok: false,
    };
  };

  /**
   * 집필로 되감는다 — 규격을 못 채운 원고를 통째로 다시 쓰게 한다. (2026-08-16)
   *
   * `rewind()` 와 달리 `attempts` 를 0 으로 되돌린다. 이건 실패 재시도가 아니라
   * **의도한 재집필**이라, 실패 카운터로 죽이면 안 된다. 대신 `revisions` 가
   * 횟수를 세고, 편당 비용 상한과 15시 컷오프가 바깥 울타리다.
   *
   * `fixNote` 는 집필 프롬프트에 그대로 붙는다 — 무엇에 걸렸는지 모르고
   * 다시 쓰면 같은 원고가 나온다.
   */
  const rewindToWrite = async (fixNote: string, note: string) => {
    await supabase
      .from("blog_job")
      .update({
        stage: "write",
        last_error: fixNote.slice(0, 800),
        cost_usd: Number((spentOnJob + USAGE.costFloor()).toFixed(4)),
        attempts: 0,
        locked_at: null,
        updated_at: now.toISOString(),
      })
      .eq("id", job.id);
    return { jobId: job.id, from: job.stage, to: "write", note, ok: true };
  };

  const advance = async (to: string, patch: Record<string, unknown>, note: string) => {
    await supabase
      .from("blog_job")
      .update({
        ...patch,
        stage: to,
        attempts: 0,
        last_error: null,
        locked_at: null,
        // 누적이다. 덮어쓰면 마지막 단계 비용만 남아 상한이 무용지물이 된다
        cost_usd: Number((spentOnJob + USAGE.costFloor()).toFixed(4)),
        updated_at: now.toISOString(),
      })
      .eq("id", job.id);
    return { jobId: job.id, from: job.stage, to, note, ok: true };
  };

  /**
   * **6축 적합성 좌표.** (2026-08-22)
   *
   * 조사·기획 프롬프트가 이걸 보고 자료를 고른다. 앞 판에는 이 값이
   * 프롬프트에 닿지 않아서, 모델이 아는 것이라곤 "국내 유튜브 4건" 뿐이었다.
   * 그 결과가 "블로그 운영" 글의 에어컨 A/S 영상 4편이다.
   */
  const fit: FitContext = {
    keyword: job.keyword_term ?? job.topic,
    topic: job.topic,
    pillarKey,
    leadTargetKey: leadTargetOf(job.keyword_term ?? job.topic).key,
    difficulty: null,
  };

  try {
    switch (job.stage) {
      /* ── 조사 ─────────────────────────────────────────────────────── */
      case "research": {
        const research = await withBudget(
          researchTopic({
            pillarKey,
            formatKey,
            topic: job.topic,
            fit,
            // 되감겨 온 조사면 무엇이 모자랐는지 알려 준다. 안 주면 같은
            // 검색어를 다시 쳐서 같은 결과를 가져온다
            retryNote: job.last_error,
          }),
          "조사",
        );
        return advance(
          "plan",
          { research: research.findings, search_count: research.searchCount },
          `조사 ${research.findings.length}자 · 검색 ${research.searchCount}회`,
        );
      }

      /* ── 기획 ─────────────────────────────────────────────────────── */
      case "plan": {
        if (!job.research) return fail("조사 결과가 비어 있습니다");
        const plan = await withBudget(
          planPost({
            pillarKey,
            formatKey,
            // 세부 타겟 — 같은 검색어라도 업종마다 병목이 다르다.
            // 08-14 까지 이 값이 프롬프트에 안 닿아서 글이 늘 일반론이었다
            segmentKey: (job.segment as SegmentKey | null) ?? null,
            topic: job.topic,
            research: { findings: job.research, searchCount: job.search_count ?? 0 },
            fit,
            retryNote: job.last_error,
          }),
          "기획",
        );
        return advance("verify", { plan: plan as never }, `구성안 — ${plan.title}`);
      }

      /* ── 자료 검증 ────────────────────────────────────────────────── */
      case "verify": {
        const plan = job.plan as BlogPlan | null;
        if (!plan?.sources?.length) return fail("기획에 자료 후보가 없습니다");

        const { verified } = await withBudget(verifySources(plan.sources), "검증");
        const f = format(formatKey);

        /**
         * 국내 자료만 남긴다. (2026-08-15)
         *
         * 사장님 3편 검수 지적 1번. 프롬프트로만 막으면 새기 때문에 **검증
         * 단계에서 물리적으로 버린다.** 다만 플랫폼 공식 발표는 근거로 필요하니
         * 링크 인용(임베드 없음)일 때만 살려 둔다 — 보여 주는 자리에는 못 온다.
         */
        const kept = verified.filter((s) => isDomestic(s) || !s.embedHtml);
        const dropped = verified.length - kept.length;

        if (kept.length < f.minSources) {
          // 자료가 모자라면 기획부터 다시 — 조사는 그대로 재사용한다.
          // 조사를 다시 돌리면 웹 검색 비용이 또 나간다
          return rewind(
            "plan",
            `검증 통과 자료 ${kept.length}건 (${f.minSources}건 필요` +
              `${dropped ? `, 해외 실물 ${dropped}건 제외` : ""}) — 기획부터 다시 돌립니다`,
          );
        }

        /**
         * 재생되는 자료가 모자라면 **집필로 넘기지 않는다.** (2026-08-15)
         *
         * 넘겨 봐야 검사식이 막고, 교정 두 번을 헛돌린 뒤 그날 글이 안 나간다.
         * 그 두 번이 편당 $1 을 그냥 태우는 자리라 여기서 끊는 게 싸다.
         *
         * 참고 — 구글 트렌드로 바닥을 깔아 볼까 했는데 안 된다. 트렌드 임베드는
         * `x-frame-options: SAMEORIGIN` 이라 남의 페이지에서 못 띄운다(08-15 실측).
         * 기댈 곳은 국내 유튜브·틱톡 실물뿐이라, 조사 패스가 4건을 목표로 찾는다.
         */
        const playable = kept.filter((s) => s.embedHtml).length;
        if (playable < f.minEmbeds) {
          /**
           * 여기는 **조사까지** 되감는다. 기획은 조사 보고에 있는 URL 만 쓸 수
           * 있으므로, 조사가 국내 영상을 못 건졌으면 몇 번을 다시 기획해도
           * 같은 결과다. 웹 검색 비용이 다시 나가지만 그날 글이 통째로
           * 안 나가는 것보다 싸다(편당 상한 $${MAX_COST_PER_JOB_USD} 안에서 돈다).
           */
          return rewind(
            "research",
            `재생되는 국내 자료 ${playable}건 (${f.minEmbeds}건 필요) — ` +
              `국내 유튜브·틱톡 실물을 못 건졌습니다. 조사부터 다시 돌립니다`,
          );
        }

        return advance(
          "write",
          { sources: kept as never },
          `자료 ${kept.length}건 검증 통과 (재생 ${playable}건` +
            `${dropped ? ` · 해외 실물 ${dropped}건 제외` : ""})`,
        );
      }

      /* ── 집필 ─────────────────────────────────────────────────────── */
      case "write": {
        const plan = job.plan as BlogPlan;
        const sources = (job.sources ?? []) as Source[];

        const draft = await withBudget(
          writePost({
            plan,
            sources,
            pillarKey,
            formatKey,
            segmentKey: (job.segment as SegmentKey | null) ?? null,
            // 재집필로 되감겨 온 경우에만 — 무엇에 걸렸는지 알려 준다
            fixNote: (job.revisions ?? 0) > 0 ? job.last_error : null,
          }),
          "집필",
        );

        const body =
          `📖 읽는 시간: 약 ${draft.readMinutes}분\n\n` + draft.body.trim() + "\n";
        const result = auditPost({
          body,
          formatKey,
          sources,
          title: plan.title,
          slug: plan.slug,
        });

        // 예정일 저녁 5시를 가리키게 둔다 — 검수 메일과 예약 발행이 이 값을 본다
        const scheduledFor = `${job.scheduled_for}T00:00:00+09:00`;

        const { data: post, error } = await supabase
          .from("blog_post")
          .upsert(
            {
              kind: "insight",
              title: plan.title,
              slug: plan.slug,
              pillar: pillarKey,
              format: formatKey,
              body,
              sources: sources as never,
              plan: plan as never,
              chars: result.chars,
              read_minutes: result.readMinutes,
              audit: result as never,
              scheduled_for: scheduledFor,
              // 승인은 다음 단계(polish)에서 검사식이 찍는다. 여기서는 안 찍는다 —
              // 집필 직후 원고는 아직 검사를 통과했는지 확정되지 않은 상태다
              status: "review",
              approved_at: null,
              notified_at: null,
              reject_note: null,
              updated_at: now.toISOString(),
            },
            { onConflict: "slug" },
          )
          .select("id")
          .single();

        if (error) return fail(`어드민 등록 실패: ${error.message}`);

        // 같은 검색어로 두 편이 나가지 않게 키워드를 기획됨으로 옮긴다
        if (job.keyword_term) {
          await supabase
            .from("blog_keyword")
            .update({ status: "planned" })
            .eq("term", job.keyword_term);
        }

        return advance(
          "polish",
          { post_id: post.id, audit: result as never },
          `${result.chars}자 · 자료 ${sources.length}건 · 규격 ${result.ok ? "통과" : `미달 ${result.failures.length}건`}`,
        );
      }

      /* ── 교정·승인 ────────────────────────────────────────────────── */
      /**
       * 사람이 검수하던 자리. 검사식이 통과시키면 승인 도장을 찍는다.
       *
       * 한 호출에 한 번만 고친다. 교정 한 번이 2~3분이라 두 번을 한 호출에
       * 넣으면 함수 제한(300초)에 걸린다. cron 이 5분마다 부르니 두 번째
       * 교정은 다음 호출이 맡는다.
       */
      case "polish": {
        if (!job.post_id) return fail("교정할 원고가 없습니다");

        const { data: post } = await supabase
          .from("blog_post")
          .select("id, title, slug, body")
          .eq("id", job.post_id)
          .maybeSingle();
        if (!post) return fail("원고를 찾지 못했습니다");

        const sources = (job.sources ?? []) as Source[];
        const formatKeyNow = job.format as FormatKey;
        const done = job.revisions ?? 0;

        const check = (body: string) =>
          auditPost({
            body,
            formatKey: formatKeyNow,
            sources,
            title: post.title,
            slug: post.slug,
          });

        let result = check(post.body ?? "");

        /**
         * **적합성 2차 판정 — 발행 직전 마지막 관문.** (2026-08-22)
         *
         * 사장님: *"이중으로 기획수집단계에서 한번 제작배포단계에서 한번해서
         * 더블체크하고 배포해."*
         *
         * 1차는 조사·기획 프롬프트가 본다. 그건 지시일 뿐 지켜졌는지는 아무도
         * 안 셌다. 여기서 **완성 원고에 실제로 인용된 자료**를 6축에 다시 댄다.
         * 개수·연도·해상도는 검사식이 세고, **의미가 맞는지는 모델이 판정**한다.
         *
         * 기계 검사를 통과한 경우에만 부른다 — 어차피 되돌아갈 원고에
         * 모델 호출을 더 쓸 이유가 없다.
         */
        if (result.ok) {
          const judged = await judgeSourceFit({
            fit,
            sources,
            citedIndexes: citedSourceIndexes(post.body ?? ""),
          });
          const misfit = fitFindings(judged);

          /**
           * **여러 건이 엉뚱하면 검사로는 못 고친다 — 다시 찾아야 한다.** (2026-08-22)
           *
           * 사장님: *"소스를 못 찾았으면 찾으면 되는 거 아니었어?"*
           *
           * 판정기는 **버리는 일만** 한다. 사다리(패치·재집필)는 **같은 자료 풀**을
           * 다시 쓴다. 9편처럼 풀 전체가 주제 밖이면 바꿔 낄 것이 없어서, 사다리만
           * 태우고 죽거나 자료 없는 원고가 나온다. 한 건이면 빼고 가면 되지만
           * 두 건 이상이면 **수집이 잘못된 것**이므로 조사부터 되감는다.
           *
           * 되감을 때 이 문구가 `last_error` 로 남고, 조사 프롬프트의 `retryNote`
           * 로 그대로 들어간다 — 무엇이 왜 어긋났는지 모르고 다시 찾으면 같은
           * 자료가 또 올라온다. `attempts` 는 안 지운다. 세 바퀴면 `fail()` 이 끊는다.
           */
          if (misfit.length >= 2) {
            return rewind(
              "research",
              [
                "자료 적합성 2차 판정에서 여러 건이 주제와 어긋났습니다.",
                "같은 자료 풀로는 못 고칩니다 — 검색어를 바꿔 다시 찾으십시오.",
                "",
                ...misfit,
              ].join("\n"),
            );
          }

          if (misfit.length) {
            result = {
              ...result,
              ok: false,
              failures: [...result.failures, ...misfit],
              findings: [
                ...result.findings,
                ...misfit.map((m) => ({ level: "fail" as const, message: m })),
              ],
            };
          }
        }

        // ── 통과 → 승인. 이 한 줄이 사장님의 "발행하기" 버튼을 대신한다
        if (result.ok) {
          await supabase
            .from("blog_post")
            .update({
              approved_at: now.toISOString(),
              audit: result as never,
              updated_at: now.toISOString(),
            })
            .eq("id", post.id);

          return advance(
            "done",
            { audit: result as never },
            `규격 통과 · 자동 승인 — ${result.chars}자`,
          );
        }

        // ── 미달. 이제 사다리를 한 칸 오른다 (2026-08-16)
        //
        //   패치 → 패치 → 전면 재집필 → 패치 → 전면 재집필 → 패치 → (사람)
        //
        // 패치는 걸린 항목만 고치고, 재집필은 같은 자료·구성안으로 처음부터
        // 다시 쓴다. 패치가 헛도는 종류의 미달(문장 구조·논리 정합)은 재집필이
        // 풀고, 재집필이 흘린 잔항목은 다음 패치가 줍는다.
        const step = REPAIR_LADDER[done];

        if (step === "patch") {
          const revised = await withBudget(
            revisePost({
              body: post.body ?? "",
              failures: result.failures,
              sources,
              plan: job.plan as BlogPlan,
              formatKey: formatKeyNow,
              segmentKey: (job.segment as SegmentKey | null) ?? null,
            }),
            "교정",
          );

          const body =
            `📖 읽는 시간: 약 ${readingTime(countChars(revised))}분\n\n` +
            revised.replace(/^📖[^\n]*\n+/, "").trim() +
            "\n";

          result = check(body);

          await supabase
            .from("blog_post")
            .update({
              body,
              chars: result.chars,
              read_minutes: result.readMinutes,
              audit: result as never,
              // 이번 교정으로 통과했으면 여기서 바로 승인한다.
              // 다음 호출을 기다리면 17시를 넘길 수 있다
              approved_at: result.ok ? now.toISOString() : null,
              updated_at: now.toISOString(),
            })
            .eq("id", post.id);

          return advance(
            result.ok ? "done" : "polish",
            { revisions: done + 1, audit: result as never },
            result.ok
              ? `${done + 1}차 교정 후 규격 통과 · 자동 승인`
              : `${done + 1}차 교정 — 남은 미달 ${result.failures.length}건`,
          );
        }

        // ── 통째로 다시 쓴다.
        //
        // 같은 자료·같은 구성안으로 집필만 다시 시킨다. 조사비가 제일 비싸서
        // 거기까지 되감지 않는다. 걸린 항목은 `last_error` 로 넘어가 집필
        // 프롬프트에 그대로 붙는다.
        if (step === "rewrite") {
          await supabase
            .from("blog_job")
            .update({ revisions: done + 1 })
            .eq("id", job.id);

          return rewindToWrite(
            `앞 원고가 규격 ${result.failures.length}건으로 막혔다: ${result.failures.join(" / ")}`,
            `패치로 안 됨 — 전면 재집필 (${done + 1}번째 시도)`,
          );
        }

        // ── 사다리를 다 올랐다. 여기서 남는 미달은 문장이 아니라 자료·기획의
        //    문제라 사람이 봐야 한다. 저녁 리포트에 그대로 실린다
        return advance(
          "done",
          { audit: result as never },
          `교정·재집필 ${REPAIR_LADDER.length}회에도 규격 미달 ${result.failures.length}건 — 발행 보류: ${result.failures.slice(0, 3).join(" / ")}`,
        );
      }

      default:
        return {
          jobId: job.id,
          from: job.stage,
          to: job.stage,
          note: "손댈 단계 없음",
          ok: true,
        };
    }
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
