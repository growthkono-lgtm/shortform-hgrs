/**
 * 랜딩 [DATA] 슬롯 — PART G 교체 목록.
 * 실데이터가 들어오기 전까지 `pending: true`로 두면 화면에 플레이스홀더로 렌더된다.
 * 값을 채울 때 pending을 지우면 그대로 실데이터 표기로 전환된다.
 */

export type Pending<T> = (T & { pending?: false }) | { pending: true };

/** S2 — 시장 통계 3건 + 출처 URL 필수 */
export type MarketStat = {
  figure: string;
  unit?: string;
  caption: string;
  source: string;
  sourceUrl: string;
};

export const MARKET_STATS: Pending<MarketStat>[] = [
  { pending: true },
  { pending: true },
  { pending: true },
];

/** S5 — 성과 케이스 (최소 3건) */
export type CaseMetric = { label: string; after: string; lift: string };
export type ProofCase = {
  categoryLabel: string;
  video: string | null;
  metrics: CaseMetric[];
  series: { label: string; before: number; after: number }[];
};

export const PROOF_CASES: Pending<ProofCase>[] = [
  { pending: true },
  { pending: true },
  { pending: true },
];

/** 케이스 카테고리 제안 (스펙 S5) — 자산 도착 전 라벨 자리 */
export const PROOF_CASE_HINTS = [
  "건기식 / 헬스",
  "펫",
  "패션잡화",
] as const;

/** S8 — 카운터. 평균 단가만 확정값 */
export const TRUST_COUNTERS = [
  { key: "brand_count", label: "함께한 브랜드", value: null, suffix: "+", en: "Brands" },
  { key: "creative_count", label: "누적 제작 소재", value: null, suffix: "+", en: "Creatives" },
  {
    key: "avg_project_price",
    label: "평균 프로젝트 단가",
    value: "₩20,000,000",
    suffix: "+",
    en: "Avg. Project Value",
  },
  { key: "achievement", label: "목표 달성률", value: null, suffix: "%", en: "Goal Achievement" },
] as const;

/** S9 — 스텝별 소요기간 [DATA step_durations] */
export const FULL_STEPS = [
  { title: "결제", duration: null },
  { title: "담당자 배정", duration: null },
  { title: "브랜드 프로필 · 그로스 AI 가이드라인", duration: null },
  { title: "인플루언서 모집", duration: null, note: "D-day 표시" },
  { title: "배포 완료 · 결과 리포트", duration: null, policy: "noIndividualEdit" },
  { title: "전환 숏폼 제작", duration: null },
  { title: "워터마크 검수 (1회 수정)", duration: null },
  { title: "최종 승인 · 다운로드", duration: null },
] as const;

export const SHORTS_ONLY_STEPS = [
  { title: "결제", duration: null },
  { title: "담당자 배정", duration: null },
  { title: "가이드라인 · 소스 접수", duration: null },
  { title: "제작", duration: null },
  { title: "검수 · 승인 · 다운로드", duration: null },
] as const;

/** S6 — portfolio.json 로드 전 카테고리 필터 */
export const PORTFOLIO_CATEGORIES = [
  "전체",
  "뷰티",
  "헬스",
  "펫",
  "푸드",
  "패션",
] as const;
