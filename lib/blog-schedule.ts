import type { FormatKey, PillarKey, SegmentKey } from "./blog-spec";

/**
 * 편성 스케줄 — 무엇을, 언제, 어떤 유형으로 쓸 것인가. (2026-08-13)
 *
 * `blog-spec.ts` 가 **어떻게 쓸 것인가**(규격)를 정한다면 이 파일은
 * **무엇을 쓸 것인가**(주제·순서)를 정한다. 둘을 한 파일에 두면 규격을 손댈 때마다
 * 편성이 흔들린다.
 *
 * ── 리드 확보 목표에서 역산한 키워드 원칙 ────────────────────────────
 * 목표는 조회수가 아니라 **문의**다. 그래서 검색어를 이렇게 고른다.
 *
 *  1. **정의형("~란")을 쓰지 않는다.** 정의를 검색하는 사람은 결정권자가 아니다.
 *     벤치마크(비에이티)도 정의형 글이 한 편도 없다 — 08-13 실측으로 확인했다.
 *  2. **문제·판단·비교 단계**를 노린다. "지금 뭘 해야 하나", "맡길까 직접 할까",
 *     "이 값이 맞나" — 이미 예산을 쥔 사람이 치는 검색어다.
 *  3. **검색량보다 구매 근접도.** 월 10만 조회의 정의형 한 편보다, 월 300 조회라도
 *     "숏폼 외주 단가"를 치는 사람 쪽이 문의로 이어진다.
 *  4. **우리가 실제로 파는 것과 붙어 있어야 한다.** 글의 결론이 /shortform 또는
 *     /sns-brand 로 자연스럽게 이어지지 않으면 리드가 안 된다.
 *
 * ⚠️ 검색량 수치를 여기 적지 않는다. 실제 수집 경로(데이터랩 등)를 붙이기 전까지
 * 손으로 적은 추정치는 근거 없는 숫자이고, 그걸 보고 편성 순서를 정하면 판단이 흐려진다.
 */

/**
 * 요일별 편성 — **매일 1편.** (사장님 확정 2026-08-14, 주 3회에서 변경)
 *
 * 유형을 요일에 고정하는 이유: 같은 톤이 연속으로 나가면 독자가 지치고,
 * 매번 고르게 두면 결국 쓰기 쉬운 유형으로 쏠린다.
 *
 * ⚠️ 매일 1편이면 **주제 큐가 한 주에 7개씩 빈다.** `TOPIC_QUEUE` 가 마르면
 * `ensureJobForToday` 가 조용히 아무것도 안 만든다(그날은 발행 없음).
 * 리포트의 "발행 없음" 이 며칠 연속이면 큐부터 확인할 것.
 *
 * 비용도 함께 곱해진다 — 편당 약 $1.2 이므로 매일이면 월 $36 선이다.
 * `blog-runner.ts` 의 월 상한을 그에 맞춰 올려 두었다.
 */
export const WEEKLY_SLOTS = [
  {
    /** 0=일 … 6=토 */
    weekday: 0,
    label: "일요일",
    format: "howto" as FormatKey,
    why: "주말엔 급한 검색이 없다. 두고 읽는 판단 기준이 맞는다",
  },
  {
    weekday: 1,
    label: "월요일",
    format: "trend" as FormatKey,
    why: "주 초 '무엇이 바뀌었나' 검색을 받는다. 훅이 가장 센 유형",
  },
  {
    weekday: 2,
    label: "화요일",
    format: "deep" as FormatKey,
    why: "주력 유형. 통념을 뒤집고 우리 포지셔닝으로 착지시킨다",
  },
  {
    weekday: 3,
    label: "수요일",
    format: "howto" as FormatKey,
    why: "주중 실무 검색. 담당자가 그대로 들고 쓸 절차",
  },
  {
    weekday: 4,
    label: "목요일",
    format: "deep" as FormatKey,
    why: "주 후반 의사결정 검색. 결정권자가 보고받을 때 쓸 판단 기준",
  },
  {
    weekday: 5,
    label: "금요일",
    format: "trend" as FormatKey,
    why: "한 주 정리. 이번 주에 바뀐 것을 모아 준다",
  },
  {
    weekday: 6,
    label: "토요일",
    format: "deep" as FormatKey,
    why: "검색량은 낮지만 색인은 쌓인다. 에버그린을 여기 둔다",
  },
] as const;

/**
 * 발행 흐름 — 2026-08-13 밤 사장님 확정.
 *
 * **자동 발행 시각이 없다.** 승인 버튼을 누른 순간이 곧 발행 시각이다.
 * 시간이 지나도 저절로 나가지 않는다 — SEO/AEO 리드 수주가 목적이면
 * 틀린 글 한 편이 제일 비싸기 때문이다.
 *
 * 대신 **발행일 당일 15:00 까지** 검수 요청 메일이 ceo@h-grs.com 으로 간다.
 * 초안은 그 전날 밤에 만들어 둔다 — 당일 아침에 만들면 실패했을 때
 * 되돌릴 시간이 없다.
 */
/** 검수 요청 메일 마감 시각 (발행일 당일) */
export const NOTICE_HOUR = 15;
export const NOTICE_MINUTE = 0;
/** 초안 생성 시각 — 발행 전날 밤 */
export const DRAFT_HOUR = 21;

/**
 * 실제 발행 시각 — **예약 발행일 저녁 5시**. (2026-08-13 사장님 지시)
 *
 * 흐름이 두 칸으로 나뉜다:
 *   당일 15시  검수 요청 메일 → 사장님이 "발행하기" 를 누른다(= 승인)
 *   당일 17시  승인된 글만 실제로 나간다
 *
 * 승인 즉시 나가지 않는 이유: 승인은 아침에도 밤에도 눌릴 수 있는데,
 * 발행 시각이 들쭉날쭉하면 검색엔진이 읽는 발행 주기가 흐려지고
 * 구독 알림도 아무 때나 날아간다. 승인은 "허락", 발행은 "정해진 시각" 이다.
 *
 * 승인하지 않으면 17시가 지나도 나가지 않는다. 자동 발행은 없다.
 */
export const PUBLISH_HOUR = 17;
export const PUBLISH_MINUTE = 0;

/**
 * 알림을 보내지 않는 시간대 — 저녁 8시부터 다음 날 오전 10시까지.
 * (2026-08-13 사장님 지시)
 *
 * 대표·이사급에게 밤 11시에 도착하는 마케팅 메일은 내용과 무관하게
 * 브랜드 인상을 깎는다. 그 시간대에 발행되면 보내지 않고 아침을 기다린다.
 */
export const QUIET_START_HOUR = 20;
export const QUIET_END_HOUR = 10;

/** 지금이 조용한 시간인가. 자정을 넘기므로 구간이 둘로 갈린다 */
export function inQuietHours(at: Date): boolean {
  return kstParts(at).hour >= QUIET_START_HOUR || kstParts(at).hour < QUIET_END_HOUR;
}

/* ── 시간대 ──────────────────────────────────────────────────────────────
 *
 * ⚠️ 이 파일의 모든 시각은 **한국 시각**이다. 그런데 배포된 서버(Vercel)는
 * UTC 로 돈다. `date.setHours(17)` 는 서버에서 17:00 UTC = 새벽 2시(KST) 가
 * 되어 버린다. 실제로 이 함정에 한 번 빠졌다 — 발행일 15시 검수 메일이
 * 한국 시각 자정을 기준으로 잡혀 한 통도 안 나갔다.
 *
 * 그래서 로컬 시각 함수(setHours/getDay/getHours)를 쓰지 않고, KST 를 직접
 * 계산한다. 한국은 서머타임이 없어 늘 UTC+9 라 offset 이 고정이다.
 */
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 어느 순간의 한국 시각 달력값 */
export function kstParts(at: Date) {
  const shifted = new Date(at.getTime() + KST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    weekday: shifted.getUTCDay(),
  };
}

/** 그 날(한국 기준)의 특정 시각을 가리키는 순간 */
export function kstMoment(at: Date, hour: number, minute = 0): Date {
  const { year, month, day } = kstParts(at);
  return new Date(Date.UTC(year, month, day, hour, minute, 0, 0) - KST_OFFSET_MS);
}

/**
 * 한국 기준 날짜 문자열 `YYYY-MM-DD`. (2026-08-16 신설)
 *
 * ⚠️ **`kstMoment(now, 0, 0).toISOString().slice(0, 10)` 을 쓰면 안 된다.**
 * 그건 한국 00시를 가리키는 순간이고, 그 순간의 UTC 날짜는 **전날**이다
 * (한국 8/16 00:00 = UTC 8/15 15:00). 작업표·원고의 날짜가 이 한 줄 때문에
 * 하루씩 밀려 있었고, 어드민 편성표가 오늘 편을 어제로 표시하고 생성비를
 * 옆 회차 것으로 붙이고 있었다(08-16 발견).
 */
export function kstDate(at: Date): string {
  const { year, month, day } = kstParts(at);
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** 한국 기준으로 며칠 뒤 */
export function kstAddDays(at: Date, days: number): Date {
  return new Date(at.getTime() + days * 24 * 60 * 60 * 1000);
}

export type QueuedTopic = {
  pillar: PillarKey;
  /** 노리는 주 검색어. 이것이 blog_keyword.term 이 된다 */
  term: string;
  /**
   * 세부 타겟 업종. 같은 검색어라도 어느 업종 담당자가 치느냐에 따라
   * 병목이 다르다 — 뷰티는 규제, 리빙은 검토 기간이 걸린다.
   * 이 값이 본문의 "실제 사례" 문단이 어느 업종에서 나올지를 정한다.
   */
  segment: SegmentKey;
  /** head = 상위 개념(가이드형으로 통째로) / long = 롱테일 */
  tier: "head" | "long";
  /**
   * 노리는 난이도. 요일이 원하는 난이도와 맞는 것을 먼저 꺼낸다
   * (`DIFFICULTY_BY_WEEKDAY`). 니치는 2~8주면 순위가 잡히고,
   * 빅은 6~12개월 장기전이다. 둘을 섞어야 중간에 안 접는다.
   */
  difficulty: "니치" | "빅";
  /** 이 글이 데려갈 곳 — 리드가 되는 경로 */
  lead: "/shortform" | "/sns-brand" | "/portfolio";
  /** 이 주제를 쓰는 이유. 어드민 편성표에 그대로 보인다 */
  angle: string;
};

/**
 * 시드 키워드 큐 — 8주치.
 *
 * 순서가 곧 발행 순서다. 어드민에서 순서를 바꾸거나 주제를 갈 수 있고,
 * 여기 목록은 DB(blog_keyword)를 처음 채울 때만 쓰인다.
 *
 * 필러를 주마다 섞은 이유: 한 필러를 몰아 쓰면 그 주제의 검색 순위가 서로
 * 깎아먹고(카니발라이제이션), 독자에게도 같은 얘기만 하는 채널로 보인다.
 */
export const TOPIC_QUEUE: QueuedTopic[] = [
  // ── 니치 (경쟁 중간 이하 · 2~8주면 순위가 잡히는 자리) ───────────────
  {
    pillar: "brand-sns",
    term: "스마트스토어상품등록대행",
    segment: "d2c",
    tier: "long",
    difficulty: "니치",
    lead: "/sns-brand",
    angle:
      "등록을 대행 맡기면 매출이 오르나. 상품이 안 팔리는 이유는 등록이 아니라 그 앞단이라는 것",
  },
  {
    pillar: "shortform",
    term: "인스타메타광고",
    segment: "beauty",
    tier: "long",
    difficulty: "니치",
    lead: "/shortform",
    angle:
      "같은 예산을 인스타와 메타에 어떻게 나눌 것인가. 소재가 그 배분을 바꾼다",
  },
  {
    pillar: "brand-sns",
    term: "브랜드스토어",
    segment: "d2c",
    tier: "head",
    difficulty: "니치",
    lead: "/sns-brand",
    angle:
      "브랜드스토어를 열어 두고 방치하는 브랜드가 많다. 유입을 만드는 건 스토어가 아니라 콘텐츠다",
  },
  {
    pillar: "shortform",
    term: "인스타스토리광고",
    segment: "fashion",
    tier: "long",
    difficulty: "니치",
    lead: "/shortform",
    angle:
      "스토리 광고는 피드와 소재 구조가 다르다. 세로 전체를 쓰는 소재를 따로 만들어야 하는 이유",
  },
  {
    pillar: "ai-mkt",
    term: "마케팅AI",
    segment: "saas",
    tier: "long",
    difficulty: "니치",
    lead: "/sns-brand",
    angle:
      "AI 를 붙일 자리와 사람을 남길 자리. 도입 순서를 잘못 잡으면 비용만 는다",
  },
  {
    pillar: "scaleup",
    term: "지역소상공인광고",
    segment: "service",
    tier: "long",
    difficulty: "니치",
    lead: "/shortform",
    angle:
      "적은 예산으로 지역에서 이기는 법. 광범위 타겟팅보다 소재 한 편이 싸다",
  },
  {
    pillar: "scaleup",
    term: "카카오모먼트광고",
    segment: "food",
    tier: "long",
    difficulty: "니치",
    lead: "/shortform",
    angle:
      "메타·구글만 보다 놓치는 채널. 국내 리타겟팅에서 카카오가 값을 하는 구간",
  },
  {
    pillar: "brand-sns",
    term: "로컬브랜딩",
    segment: "service",
    tier: "long",
    difficulty: "니치",
    lead: "/sns-brand",
    angle:
      "동네에서 이름이 알려지는 것과 팔리는 것은 다르다. 로컬에서 매출로 잇는 구조",
  },
  {
    pillar: "creator",
    term: "링크드인마케팅",
    segment: "saas",
    tier: "long",
    difficulty: "니치",
    lead: "/sns-brand",
    angle:
      "B2B 는 링크드인이라는 말과 실제 성과 사이의 간격. 무엇을 올려야 문의가 오나",
  },
  {
    pillar: "scaleup",
    term: "스마트스토어광고비용",
    segment: "d2c",
    tier: "long",
    difficulty: "니치",
    lead: "/shortform",
    angle:
      "광고비를 얼마 써야 하나가 아니라, 그 돈의 몇 %를 소재에 남길 것인가",
  },

  // ── 빅 (검색량 1,000+ · 경쟁 높음 · 6~12개월 장기전) ─────────────────
  // ── 컨텐츠 마케팅 (최우선 축) ─────────────────────────────────────
  {
    pillar: "brand-sns",
    term: "상세페이지제작",
    segment: "d2c",
    tier: "head",
    difficulty: "빅",
    lead: "/sns-brand",
    angle:
      "상세페이지에 다 써 놓고 왜 안 팔리나. 구매 결정은 상세페이지 전에 끝나 있고, 그 앞단을 무엇으로 채우는가",
  },
  {
    pillar: "brand-sns",
    term: "바이럴마케팅",
    segment: "food",
    tier: "head",
    difficulty: "빅",
    lead: "/sns-brand",
    angle:
      "터지는 걸 노리는 것과 팔리는 걸 쌓는 것은 다르다. 바이럴을 매출로 잇는 구간에서 무엇이 빠지는가",
  },
  {
    pillar: "brand-sns",
    term: "블로그마케팅",
    segment: "service",
    tier: "head",
    difficulty: "빅",
    lead: "/sns-brand",
    angle:
      "블로그가 죽었다는 말과 검색 유입이 늘었다는 데이터가 같이 있다. 지금 블로그를 쓰는 자리는 어디인가",
  },
  {
    pillar: "brand-sns",
    term: "인스타마케팅",
    segment: "beauty",
    tier: "head",
    difficulty: "빅",
    lead: "/sns-brand",
    angle:
      "계정을 키우는 일과 물건을 파는 일을 한 계정에서 동시에 하려다 둘 다 놓치는 구조",
  },
  {
    pillar: "scaleup",
    term: "CRM마케팅",
    segment: "d2c",
    tier: "head",
    difficulty: "빅",
    lead: "/sns-brand",
    angle:
      "신규 획득 단가가 오를수록 재구매가 답이라는데, 컨텐츠가 없으면 CRM 도 보낼 게 없다",
  },
  {
    pillar: "scaleup",
    term: "객단가",
    segment: "living",
    tier: "long",
    difficulty: "빅",
    lead: "/shortform",
    angle:
      "광고비를 줄이는 것보다 객단가를 올리는 게 빠르다. 소재가 객단가에 개입하는 지점",
  },

  // ── 숏폼 ────────────────────────────────────────────────────────
  {
    pillar: "shortform",
    term: "영상제작",
    segment: "d2c",
    tier: "head",
    difficulty: "빅",
    lead: "/shortform",
    angle:
      "영상 한 편을 잘 만드는 일과 팔리는 소재를 계속 대는 일은 다른 일이다. 견적서에서 그 차이를 어떻게 읽는가",
  },
  {
    pillar: "shortform",
    term: "홍보영상제작",
    segment: "saas",
    tier: "long",
    difficulty: "빅",
    lead: "/shortform",
    angle:
      "회사 소개 영상은 아무도 안 본다. 같은 예산으로 무엇을 만들어야 실제로 보이는가",
  },
  {
    pillar: "shortform",
    term: "인스타광고하는법",
    segment: "beauty",
    tier: "long",
    difficulty: "빅",
    lead: "/shortform",
    angle:
      "설정은 30분이면 끝난다. 그 뒤로 성과를 가르는 건 소재 공급 속도라는 것",
  },
  {
    pillar: "shortform",
    term: "인스타광고비용",
    segment: "food",
    tier: "long",
    difficulty: "빅",
    lead: "/shortform",
    angle:
      "얼마를 쓰느냐가 아니라 얼마를 소재에 남기느냐. 예산 배분표로 보는 손익분기",
  },
  {
    pillar: "shortform",
    term: "틱톡에이전시",
    segment: "fashion",
    tier: "long",
    difficulty: "빅",
    lead: "/portfolio",
    angle:
      "대행을 맡길 때 확인할 것. 계정 운영과 소재 제작과 광고 집행은 서로 다른 일이다",
  },

  // ── 인플루언서 ──────────────────────────────────────────────────
  {
    pillar: "creator",
    term: "인스타광고",
    segment: "beauty",
    tier: "head",
    difficulty: "빅",
    lead: "/sns-brand",
    angle:
      "광고로 미는 소재와 인플루언서가 만든 소재는 성과 구조가 다르다. 무엇을 어디에 태울 것인가",
  },
  {
    pillar: "creator",
    term: "퍼스널브랜딩",
    segment: "service",
    tier: "long",
    difficulty: "빅",
    lead: "/sns-brand",
    angle:
      "대표가 얼굴을 내는 것이 브랜드에 무엇을 남기고 무엇을 묶어 두는가. 판단 기준",
  },

  // ── AI (자주 얹는다 — 지금 가장 검색이 몰리는 축) ─────────────────
  {
    pillar: "ai-mkt",
    term: "AI영상제작",
    segment: "d2c",
    tier: "head",
    difficulty: "빅",
    lead: "/shortform",
    angle:
      "AI 로 뽑은 컷이 광고 성과로 안 이어지는 이유. 어디까지 AI 에 맡기고 어디부터 사람이 붙는가",
  },
  {
    pillar: "ai-mkt",
    term: "AI추천",
    segment: "d2c",
    tier: "head",
    difficulty: "빅",
    lead: "/shortform",
    angle:
      "플랫폼 추천이 AI 로 넘어가면서 광고주에게 남은 통제 변수는 소재 하나다",
  },
  {
    pillar: "ai-mkt",
    term: "퍼포먼스마케팅",
    segment: "d2c",
    tier: "head",
    difficulty: "빅",
    lead: "/shortform",
    angle:
      "타깃팅 레버가 사라진 자리에 무엇이 들어왔나. 자동화 이후의 퍼포먼스 조직 구성",
  },
  {
    pillar: "ai-mkt",
    term: "ROAS",
    segment: "beauty",
    tier: "head",
    difficulty: "빅",
    lead: "/shortform",
    angle:
      "ROAS 만 보다 놓치는 것. 신규 고객 비중과 기여 매출을 함께 읽는 법",
  },

  // ── 플랫폼·집행 ─────────────────────────────────────────────────
  {
    pillar: "scaleup",
    term: "메타광고",
    segment: "d2c",
    tier: "head",
    difficulty: "빅",
    lead: "/shortform",
    angle:
      "어드밴티지+ 이후 계정 구조는 단순해졌는데 왜 성과는 안 단순해졌나",
  },
  {
    pillar: "scaleup",
    term: "유튜브광고",
    segment: "senior",
    tier: "head",
    difficulty: "빅",
    lead: "/shortform",
    angle:
      "쇼츠와 인스트림은 같은 예산에서 다른 일을 한다. 어디에 얼마를 둘 것인가",
  },
  {
    pillar: "scaleup",
    term: "구글광고",
    segment: "saas",
    tier: "head",
    difficulty: "빅",
    lead: "/sns-brand",
    angle:
      "검색으로 들어온 수요와 피드에서 만든 수요. 두 예산을 한 표에서 보는 법",
  },
  {
    pillar: "scaleup",
    term: "광고대행사",
    segment: "living",
    tier: "head",
    difficulty: "빅",
    lead: "/portfolio",
    angle:
      "제안서에서 확인할 것 다섯 가지. 구매 직전 단계에서 실제로 갈리는 항목",
  },
  {
    pillar: "brand-sns",
    term: "브랜딩",
    segment: "fashion",
    tier: "head",
    difficulty: "빅",
    lead: "/sns-brand",
    angle:
      "브랜딩과 퍼포먼스를 나눠 놓고 예산을 따로 쓰면 둘 다 안 된다. 한 줄로 잇는 구조",
  },

  // ── 시즌 (8~9월: 추석 · 하반기 예산 · 4분기 준비) ─────────────────
  {
    pillar: "scaleup",
    term: "마케팅",
    segment: "food",
    tier: "head",
    difficulty: "빅",
    lead: "/sns-brand",
    angle:
      "추석 프로모션을 8월에 준비하는 브랜드와 9월에 붙는 브랜드의 차이. 리드타임 역산표",
  },
  {
    pillar: "scaleup",
    term: "캠페인",
    segment: "d2c",
    tier: "head",
    difficulty: "빅",
    lead: "/shortform",
    angle:
      "4분기 예산을 짜기 전에 3분기 소재 성과부터 정리해야 하는 이유. 하반기 예산 편성 순서",
  },
];

/** 다음 발행 예정일 — 오늘 이후 가장 가까운 편성 슬롯 */
export function nextSlot(from: Date): {
  date: Date;
  slot: (typeof WEEKLY_SLOTS)[number];
} {
  for (let add = 0; add < 14; add += 1) {
    const day = kstAddDays(from, add);
    const slot = WEEKLY_SLOTS.find((s) => s.weekday === kstParts(day).weekday);
    if (!slot) continue;
    const d = kstMoment(day, PUBLISH_HOUR, PUBLISH_MINUTE);
    if (d.getTime() <= from.getTime()) continue;
    return { date: d, slot };
  }
  throw new Error("편성 슬롯을 찾지 못했습니다");
}

/** 앞으로 n회분 발행 일정 */
export function upcomingSlots(from: Date, count: number) {
  const out: { date: Date; slot: (typeof WEEKLY_SLOTS)[number] }[] = [];
  let cursor = from;
  for (let i = 0; i < count; i += 1) {
    const next = nextSlot(cursor);
    out.push(next);
    cursor = next.date;
  }
  return out;
}
