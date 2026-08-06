/**
 * 미확정 값 단일 출처.
 * PART G([DATA] 교체 목록) / PART I(오픈 이슈)에 걸린 값은 전부 여기 또는 DB(plans)에서 읽는다.
 * 화면에 하드코딩 금지 — 확정되면 이 파일 한 곳만 고친다.
 */

/**
 * 서비스명 확정 (2026-08-06 피그마 개편안).
 * 헤더 브랜드명이 "스케일업 숏폼 스튜디오"로 바뀌었다. 서브도메인은 shortform 고정 —
 * 폴더명(hgrs-boost)이 boost라 헷갈리지만 boost는 쓰지 않는다.
 */
export const SERVICE = {
  name: "스케일업 숏폼 스튜디오",
  nameEn: "Scaleup Shortform Studio",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://shortform.hgrs.io",
  parentName: "해그로시 해킹마케팅랩",
  parentUrl: "https://hgrs.io",
  instagram: "https://www.instagram.com/hgrs.io/",
} as const;

/** S15 푸터 — hgrs.io 게시 실데이터 + PG 심사 요건 */
export const COMPANY = {
  name: "(주)해그로시(해킹마케팅랩)",
  bizRegNumber: "187-87-02820",
  /** 삼성동 주소는 미사용 — 김포 단독 (스펙 S15) */
  address: "경기 김포시 김포한강10로 133번 127",
  addressLabel: "김포 촬영 오피스",

  // ── PART G 미확정. PG 심사 전 필수 ──
  ceoName: null as string | null,
  phone: null as string | null,
  /** 통신판매업 신고번호 — 카드사 심사 전 필수 (PART I-3) */
  mailOrderNumber: null as string | null,
  privacyOfficer: null as string | null,
  hostingProvider: "Vercel Inc.",
} as const;

/** A1 가격 명분 — 반복 사용되는 한 줄 */
export const PRICE_RATIONALE =
  "인플루언서 컨텐츠 가이드라인부터 광고용 소스컷 확보, 부스팅 숏폼 기획제작이 논스톱으로 진행됩니다.";

/** PART E4 정책 문구 — 노출 위치마다 같은 문장을 재사용 */
export const POLICY = {
  revisionOnce: "1회 무상 수정 포함 · 추가 수정은 편당 별도 견적",
  usagePeriod:
    "인플루언서 출연 컷 포함 소재의 광고 사용기간은 다운로드일로부터 5개월",
  sourceRequired:
    "플랜 2는 브랜드 보유 소스(촬영본·UGC·제품컷) 제공 조건",
  noIndividualEdit:
    "배포 콘텐츠는 크리에이터 고유 콘텐츠로 개별 수정 불가 — 사전 가이드라인으로 방향을 맞춥니다",
  downloadExpiry: "다운로드 링크는 발급 후 14일간 유효합니다",
  noGuarantee:
    "위 성과는 실제 운영 데이터이며, 브랜드·상품·예산에 따라 달라질 수 있습니다.",
  headReviewScope:
    "해그로시 헤드가 캠페인 구조와 USP를 직접 리뷰하는 60분 세션.",
} as const;

export type PlanCode = "full" | "shorts_only";

export type Plan = {
  code: PlanCode;
  tier: string;
  label: string;
  composition: string;
  influencerCount: number;
  shortsCount: number;
  /** PART G: 정가 6개 확정 전 임시 제안값 */
  listPrice: number;
  betaPrice: number;
  headReview: boolean;
  recommended?: boolean;
};

/**
 * DB(plans 테이블) 시딩 전까지의 폴백.
 * 런타임에서는 DB를 우선 읽고, 값이 없을 때만 이 배열을 쓴다.
 * PART I-2: 스케일 티어는 챌린지비 실단가 재검산 후 게시 여부 확정 → published 플래그로 제어
 */
export const PLANS: Plan[] = [
  {
    code: "full",
    tier: "starter",
    label: "스타터",
    composition: "인플루언서 10 + 숏폼 5",
    influencerCount: 10,
    shortsCount: 5,
    listPrice: 1_900_000,
    betaPrice: 1_350_000,
    headReview: false,
  },
  {
    code: "full",
    tier: "growth",
    label: "그로스",
    composition: "인플루언서 20 + 숏폼 10",
    influencerCount: 20,
    shortsCount: 10,
    listPrice: 3_100_000,
    betaPrice: 2_200_000,
    headReview: false,
    recommended: true,
  },
  {
    code: "full",
    tier: "scale",
    label: "스케일",
    composition: "인플루언서 30 + 숏폼 20",
    influencerCount: 30,
    shortsCount: 20,
    listPrice: 4_000_000,
    betaPrice: 2_840_000,
    headReview: true,
  },
  {
    code: "shorts_only",
    tier: "5",
    label: "5편",
    composition: "전환 숏폼 5편",
    influencerCount: 0,
    shortsCount: 5,
    listPrice: 1_250_000,
    betaPrice: 1_100_000,
    headReview: false,
  },
  {
    code: "shorts_only",
    tier: "10",
    label: "10편",
    composition: "전환 숏폼 10편",
    influencerCount: 0,
    shortsCount: 10,
    listPrice: 2_100_000,
    betaPrice: 1_800_000,
    headReview: false,
    recommended: true,
  },
  {
    code: "shorts_only",
    tier: "20",
    label: "20편",
    composition: "전환 숏폼 20편",
    influencerCount: 0,
    shortsCount: 20,
    listPrice: 2_800_000,
    betaPrice: 2_400_000,
    headReview: true,
  },
];

export const formatKRW = (won: number) => `₩${won.toLocaleString("ko-KR")}`;

export const discountRate = (listPrice: number, betaPrice: number) =>
  Math.round((1 - betaPrice / listPrice) * 100);
