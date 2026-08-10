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

/**
 * 본사 파트너십 페이지. 이 랜딩은 "숏폼 편수"를 파는 화면이라
 * 브랜드 종합 대행·장기 파트너십을 찾는 방문자는 여기서 답을 못 찾는다.
 * 헤더(상시 노출)와 팀 섹션·푸터 세 곳에서 넘긴다.
 */
export const PARTNERSHIP_URL = "https://hgrs.io/partnership";

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

/**
 * 플랜 코드별 설명 — 요금 섹션에서 선택에 따라 갈아 끼운다.
 * 기본은 숏폼 단독이다. 시딩까지 묶인 총액을 먼저 보여주면 숏폼 편당 값이
 * 가려지고 무조건 비싸 보인다 (사장님 지적).
 */
export const PLAN_COPY = {
  shorts_only: {
    label: "숏폼 기획제작",
    sub: "브랜드 보유 소스로 바로",
    /** 한 박스 안에서 위 칸(단독)을 한 줄로 설명하는 문장 */
    tagline: "국내 유수 라이브커머스·브랜드 숏폼 기획제작자 집단의 시스템",
    rationale:
      "구매 전환형 숏폼을 기획부터 제작까지 편수 단위로 진행합니다. 처음이라면 1편만 먼저 맡겨 결과를 보고 판단하셔도 됩니다. 브랜드가 보유한 소스(촬영본·UGC·제품컷)로 바로 시작합니다.",
  },
  full: {
    label: "숏폼 + 인플루언서 시딩",
    sub: "소스 확보부터 함께",
    /** 아래 칸(패키지)을 한 줄로 설명하는 문장 */
    tagline: "인플루언서 컨텐츠 가이드라인 및 소스컷 확보와 구매전환 광고를 한번에",
    rationale:
      "찍을 소스부터 없다면 인플루언서 시딩을 함께 붙입니다. 컨텐츠 가이드라인 → 광고용 소스컷 확보 → 부스팅 숏폼 기획제작이 논스톱으로 진행됩니다.",
  },
} as const;

/**
 * 요금 섹션의 박스 단위. 이름은 스타터·그로스·스케일 셋으로 통일하고,
 * 한 박스 안에 같은 규모의 **숏폼 단독**과 **시딩 패키지**를 위아래로 같이 놓는다.
 * 탭으로 갈라 두면 둘 중 하나만 보고 판단하게 된다 — 차액이 한눈에 보여야 한다.
 */
export const PLAN_GROUPS = [
  { key: "starter", label: "스타터", shortsTier: "5", fullTier: "starter" },
  {
    key: "growth",
    label: "그로스",
    shortsTier: "10",
    fullTier: "growth",
    recommended: true,
  },
  { key: "scale", label: "스케일", shortsTier: "20", fullTier: "scale" },
] as const;

/** PART E4 정책 문구 — 노출 위치마다 같은 문장을 재사용 */
export const POLICY = {
  revisionOnce: "1회 무상 수정 포함 · 추가 수정은 편당 별도 견적",
  usagePeriod:
    "인플루언서 출연 컷 포함 소재의 광고 사용기간은 다운로드일로부터 5개월",
  // 플랜 번호로 부르면 순서를 바꿀 때마다 어긋난다. 구성 이름으로 쓴다
  sourceRequired:
    "숏폼 기획제작 단독은 브랜드 보유 소스(촬영본·UGC·제품컷) 제공 조건",
  noIndividualEdit:
    "배포 콘텐츠는 크리에이터 고유 콘텐츠로 개별 수정 불가 — 사전 가이드라인으로 방향을 맞춥니다",
  downloadExpiry: "다운로드 링크는 발급 후 14일간 유효합니다",
  noGuarantee:
    "위 성과는 실제 운영 데이터이며, 브랜드·상품·예산에 따라 달라질 수 있습니다.",
  // 1편은 "믿고 거래를 트는" 자리다. 시딩은 크리에이터 모집·배포 단위라 1편에 붙일 수 없다
  trialSingle:
    "1편 단품은 결과를 먼저 보고 판단하시라고 여는 자리입니다 — 인플루언서 시딩은 포함되지 않습니다",
  seedingBundleOnly:
    "인플루언서 시딩은 숏폼 5편 이상 묶음부터 함께 진행됩니다",
  // 싱글과 패키지를 세로로 묶어 뒀더니 같이 사는 구성으로 읽혔다 — 택일임을 문장으로도 못 박는다
  singleOrPackage:
    "싱글과 패키지는 함께 구매하는 구성이 아닙니다 — 둘 중 하나를 고르시면 됩니다",
} as const;

export type PlanCode = "full" | "shorts_only";

export type Plan = {
  code: PlanCode;
  tier: string;
  label: string;
  composition: string;
  influencerCount: number;
  shortsCount: number;
  /**
   * 2026-08-10 확정가. 정가/베타가 이원화는 걷어냈다 —
   * 화면에 뜨는 값은 betaPrice 하나뿐이었고, 지어낸 정가로 할인율을 만들 이유가 없다.
   * listPrice는 DB 컬럼(NOT NULL) 호환용으로만 남기고 betaPrice와 같은 값을 넣는다.
   */
  listPrice: number;
  betaPrice: number;
  /**
   * 시딩 포함 플랜(full)의 내역 분리 — 총액만 보여주면 숏폼 편당 값이 가려진다.
   * shortsPrice는 같은 편수의 숏폼 단독가와 정확히 같은 값이어야 한다.
   */
  shortsPrice?: number;
  seedingPrice?: number;
  /** 첫 거래용 소량 티어 — 시딩을 붙일 수 없다 */
  trial?: boolean;
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
    label: "스타터 패키지",
    composition: "인플루언서 10 + 숏폼 5",
    influencerCount: 10,
    shortsCount: 5,
    listPrice: 1_540_000,
    betaPrice: 1_540_000,
    shortsPrice: 990_000,
    seedingPrice: 550_000,
  },
  {
    code: "full",
    tier: "growth",
    label: "그로스 패키지",
    composition: "인플루언서 20 + 숏폼 10",
    influencerCount: 20,
    shortsCount: 10,
    listPrice: 2_880_000,
    betaPrice: 2_880_000,
    shortsPrice: 1_890_000,
    seedingPrice: 990_000,
    recommended: true,
  },
  {
    code: "full",
    tier: "scale",
    label: "스케일 패키지",
    composition: "인플루언서 30 + 숏폼 20",
    influencerCount: 30,
    shortsCount: 20,
    listPrice: 4_870_000,
    betaPrice: 4_870_000,
    shortsPrice: 3_490_000,
    seedingPrice: 1_380_000,
  },
  {
    // 첫 거래를 트기 위한 단품. 시딩은 붙지 않는다 (5편 묶음부터)
    code: "shorts_only",
    tier: "1",
    label: "1편",
    composition: "전환 숏폼 1편",
    influencerCount: 0,
    shortsCount: 1,
    listPrice: 210_000,
    betaPrice: 210_000,
    trial: true,
  },
  {
    code: "shorts_only",
    tier: "5",
    label: "스타터",
    composition: "전환 숏폼 5편",
    influencerCount: 0,
    shortsCount: 5,
    listPrice: 990_000,
    betaPrice: 990_000,
  },
  {
    code: "shorts_only",
    tier: "10",
    label: "그로스",
    composition: "전환 숏폼 10편",
    influencerCount: 0,
    shortsCount: 10,
    listPrice: 1_890_000,
    betaPrice: 1_890_000,
    recommended: true,
  },
  {
    code: "shorts_only",
    tier: "20",
    label: "스케일",
    composition: "전환 숏폼 20편",
    influencerCount: 0,
    shortsCount: 20,
    listPrice: 3_490_000,
    betaPrice: 3_490_000,
  },
];

export const formatKRW = (won: number) => `₩${won.toLocaleString("ko-KR")}`;

export const discountRate = (listPrice: number, betaPrice: number) =>
  Math.round((1 - betaPrice / listPrice) * 100);
