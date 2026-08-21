/**
 * 미확정 값 단일 출처.
 * PART G([DATA] 교체 목록) / PART I(오픈 이슈)에 걸린 값은 전부 여기 또는 DB(plans)에서 읽는다.
 * 화면에 하드코딩 금지 — 확정되면 이 파일 한 곳만 고친다.
 */

/**
 * 서비스명 (2026-08-10 확정).
 * "해그로시 숏폼 스튜디오" 한 이름으로 간다 — 헤더에 "by 해그로시"를 따로 달지 않는다.
 * 서브도메인은 shortform 고정. 폴더명(hgrs-boost)이 boost라 헷갈리지만 boost는 쓰지 않는다.
 */
export const SERVICE = {
  /** 2026-08-11 사이트 명칭 — 서비스 라인이 둘 이상이라 "숏폼"을 이름에서 뺐다 */
  name: "해그로시 스튜디오",
  nameEn: "HGRS Studio",
  /** 숏폼 랜딩 안에서만 쓰는 서비스 이름 */
  shortformName: "해그로시 숏폼 스튜디오",
  /**
   * 2026-08-11 루트 도메인 이전 — 서브도메인(shortform.hgrs.io)이 아니라
   * hgrs.io 하위 경로로 간다. 프레이머 사이트는 더 쓰지 않는다.
   * canonical·sitemap·OG 가 전부 이 값을 본다.
   */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://hgrs.io",
  /** 숏폼 랜딩의 정식 경로 (루트는 여기로 보낸다) */
  path: "/shortform",
} as const;

/** 회사 소개 — 구조화 데이터(Organization)에 쓴다 */
export const ORG = {
  name: "주식회사 해그로시",
  nameEn: "HGRS",
  description:
    "브랜드 채널 그로스와 구매 전환형 숏폼을 함께 굴리는 컨텐츠 그로스 집단. 전략·기획·제작·운영을 한 팀으로 붙입니다.",
  /** 대외 연락처는 이 하나로 통일한다 — @hgrs.io 메일함은 존재하지 않는다 */
  email: "contact@h-grs.com",
  sameAs: ["https://brunch.co.kr/brunchbook/bmaha2"],
} as const;

/**
 * ⚠️ 프레이머 사이트(hgrs.io/partnership 등)로 나가는 링크는 전부 끊었다 (2026-08-11).
 * 그 도메인이 이제 이 앱이다 — 외부 링크를 두면 자기 자신을 가리키다 404가 난다.
 */

/** S15 푸터 — hgrs.io 게시 실데이터 + PG 심사 요건 */
export const COMPANY = {
  name: "주식회사 해그로시",
  bizRegNumber: "187-87-02820",
  /** 삼성동 주소는 미사용 — 김포 단독 (스펙 S15) */
  address: "경기 김포시 김포한강10로 133번 127, 438 E180호",
  /** 사업자등록상 소재지. 상주 오피스·촬영 스튜디오로 홍보하지 않는다 */
  addressLabel: "사업자 소재지",

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
    tagline:
      "인플루언서 컨텐츠 가이드라인 및 소스컷 확보와 구매전환 광고를 한번에",
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
  // 체험 1편은 "믿고 거래를 트는" 자리다. 시딩은 크리에이터 모집·배포 단위라 붙일 수 없다
  trialSingle:
    "체험 1편은 결과를 먼저 보고 판단하시라고 정가에서 20% 낮춰 여는 자리입니다 — 인플루언서 시딩은 포함되지 않습니다",
  seedingBundleOnly:
    "인플루언서 시딩은 멀티 플랜으로만 진행됩니다 — 규모에 따라 5·10·15명",
  // 싱글과 멀티를 세로로 묶어 뒀더니 같이 사는 구성으로 읽혔다 — 택일임을 문장으로도 못 박는다
  singleOrPackage:
    "싱글과 멀티는 함께 구매하는 구성이 아닙니다 — 둘 중 하나를 고르시면 됩니다",
  // 2026-08-19 신설. 모델 옵션이 어디에 붙는지 밝히지 않으면 멀티에도 붙는 줄 안다
  modelOptionSingleOnly:
    "출연 모델 섭외는 싱글 플랜에만 더할 수 있습니다 — 멀티 플랜은 시딩으로 소재를 확보합니다",
  quoteOnlyShoot:
    "현장 실사 촬영은 정가 없이 별도 견적입니다 — 촬영 회차와 장소 조건으로 산정합니다",
} as const;

export type PlanCode = "full" | "shorts_only";

export type Plan = {
  /** shorts_only = 싱글 플랜 / full = 멀티 플랜. 코드값은 결제 슬러그 호환으로 유지한다 */
  code: PlanCode;
  tier: string;
  label: string;
  composition: string;
  influencerCount: number;
  shortsCount: number;
  /** DB 컬럼(NOT NULL) 호환용. betaPrice 와 같은 값을 넣는다 */
  listPrice: number;
  betaPrice: number;
  /** 편당(싱글) 판매 단가. **표시용이 아니라 이 값에 편수를 곱해 총액을 만든다** */
  unitPrice?: number;
  /** 체험 티어 — 정가에서 깎아 주는 비율 */
  trialDiscount?: number;
  trial?: boolean;
  recommended?: boolean;
};

/* ─────────────────────────────────────────────────────────────
 * 2026-08-19 단가 전면 재설계 — 사장님 확정.
 *
 * ── 무엇이 바뀌었나 ───────────────────────────────────────────────────
 *  1. **편당가를 먼저 정하고 편수를 곱한다.** 총액을 반올림하던 앞 판은
 *     나눴을 때 값이 뒤집혔다 — 1편 210,000 인데 5편 묶음은 편당 260,000 이라
 *     1편을 다섯 번 사는 게 25만원 쌌다. 묶음을 살 이유가 없는 가격표였다.
 *  2. **수량이 적으면 외주 원가가 올라간다**(1편 ×1.15 · 5편 ×1.08 ·
 *     10편 ×1.00 · 20편 ×0.92). 10건 벌크 기준 편당 130,000.
 *  3. `shortsPrice`·`seedingPrice` **삭제.** 멀티 플랜에서 시딩 금액을 따로
 *     찍고 있었는데, 인원으로 나누면 우리가 주는 리워드가 그대로 역산된다
 *     (990,000 ÷ 20명 = 49,500원). 총액만 보여 준다.
 *  4. 패키지 플랜 → **멀티 플랜**. 시딩 인원은 5·10·15명 세 가지뿐.
 *  5. **출연 모델 섭외는 플랜이 아니라 옵션**이다(`MODEL_OPTION`).
 *     싱글 플랜에만 붙고, 기획·대본·콘티가 전용으로 따라간다.
 *
 * 마진은 목표 45% 기준이며 **기획·관리 인건비를 빼기 전** 값이다.
 * ───────────────────────────────────────────────────────────── */

/** 헤드라인 바로 밑에 공통으로 들어가는 한 줄 */
export const AI_EFFICIENCY_NOTE = "AI 활용한 효율화는 전반적으로 반영됩니다";

export const PLANS: Plan[] = [
  // ── 싱글 플랜 · 숏폼 기획제작만 ──────────────────────────────
  {
    code: "shorts_only",
    tier: "1",
    label: "체험",
    composition: "전환 숏폼 1편",
    influencerCount: 0,
    shortsCount: 1,
    unitPrice: 270_000,
    // 첫 거래를 트는 자리. 정가 270,000 에서 20% 깎아 216,000
    listPrice: 270_000,
    betaPrice: 216_000,
    trialDiscount: 0.2,
    trial: true,
  },
  {
    code: "shorts_only",
    tier: "5",
    label: "스타터",
    composition: "전환 숏폼 5편",
    influencerCount: 0,
    shortsCount: 5,
    unitPrice: 250_000,
    listPrice: 1_250_000,
    betaPrice: 1_250_000,
  },
  {
    code: "shorts_only",
    tier: "10",
    label: "그로스",
    composition: "전환 숏폼 10편",
    influencerCount: 0,
    shortsCount: 10,
    unitPrice: 240_000,
    listPrice: 2_400_000,
    betaPrice: 2_400_000,
    recommended: true,
  },
  {
    code: "shorts_only",
    tier: "20",
    label: "스케일",
    composition: "전환 숏폼 20편",
    influencerCount: 0,
    shortsCount: 20,
    unitPrice: 220_000,
    listPrice: 4_400_000,
    betaPrice: 4_400_000,
  },

  // ── 멀티 플랜 · 숏폼 + 인플루언서 시딩 ───────────────────────
  // ⚠️ 시딩 금액을 따로 적지 않는다. 인원으로 나누면 리워드가 역산된다
  {
    code: "full",
    tier: "starter",
    /**
     * ⚠️ 멀티 플랜 티어에는 **"패키지" 를 붙인다.** (2026-08-19 사장님 지시)
     *
     * 싱글과 멀티가 스타터·그로스·스케일로 이름이 똑같아 표에서 어느 쪽
     * 스타터인지 구분이 안 됐다. *"명칭 헷갈리나. 둘 다 동일하니까."*
     */
    label: "스타터 패키지",
    composition: "전환 숏폼 5편 + 인플루언서 시딩 5명",
    influencerCount: 5,
    shortsCount: 5,
    listPrice: 1_700_000,
    betaPrice: 1_700_000,
  },
  {
    code: "full",
    tier: "growth",
    label: "그로스 패키지",
    composition: "전환 숏폼 10편 + 인플루언서 시딩 10명",
    influencerCount: 10,
    shortsCount: 10,
    listPrice: 3_000_000,
    betaPrice: 3_000_000,
    recommended: true,
  },
  {
    code: "full",
    tier: "scale",
    label: "스케일 패키지",
    composition: "전환 숏폼 20편 + 인플루언서 시딩 15명",
    influencerCount: 15,
    shortsCount: 20,
    listPrice: 5_200_000,
    betaPrice: 5_200_000,
  },
];

/** 플랜 계열 이름 — 화면·소개서가 같은 말을 쓰게 한 곳에서만 정의한다 */
export const PLAN_FAMILY: Record<PlanCode, { label: string; scope: string }> = {
  shorts_only: {
    label: "싱글 플랜",
    scope: "구매 전환형 숏폼 기획·제작. 소재는 브랜드가 제공합니다.",
  },
  full: {
    label: "멀티 플랜",
    scope: "숏폼 기획·제작에 인플루언서 시딩을 함께. 소재를 우리가 확보합니다.",
  },
};

/**
 * 출연 모델 섭외 — **플랜이 아니라 옵션**이다. (2026-08-19)
 *
 * 사장님: *"출연 모델 기획 섭외형은 인당 35로 붙이고 섭외비를, 거기에 기존
 * 숏폼기획제작 금액이 붙으면 되는 거잖아. 별도 플랜으로 빼기엔 애매해서."*
 *
 * **싱글 플랜에만** 붙는다. 멀티 플랜은 시딩으로 이미 소재를 확보하므로
 * 두 방식을 겹쳐 팔면 고객이 무엇을 사는지 알 수 없게 된다.
 *
 * 인원 비례라 **수량 할인이 없다** — 섭외비가 명수만큼 그대로 나간다.
 */
export const MODEL_OPTION = {
  label: "출연 모델 섭외",
  /** 인당. 기획·대본·콘티가 전용으로 붙는다 */
  unitPrice: 350_000,
  attachesTo: "shorts_only" as PlanCode,
  includes: [
    "출연 모델 섭외 (셀프캠 · 광고형)",
    "이 편성 전용 기획 · 대본 · 콘티",
    "수정 요청 1회 포함",
  ],
  terms: [
    "제품·서비스를 사전 발송해야 진행됩니다 (발송비·제품 원가는 브랜드 부담)",
    "수정 1회를 넘기면 재섭외 비용이 발생합니다",
  ],
} as const;

/** 정가로 걸지 않는 것 — 문의가 오면 회차·장소 조건으로 견적한다 */
export const QUOTE_ONLY = [
  {
    label: "현장 촬영",
    why: "감독 데이페이와 장소 섭외가 붙는데 3시간이면 컷 1~2편이 현실이라, 편당 원가가 다른 라인의 두세 배가 됩니다.",
    note: "실사 촬영이 꼭 필요한 경우 촬영 회차와 장소 조건으로 별도 견적",
  },
] as const;

export const formatKRW = (won: number) => `₩${won.toLocaleString("ko-KR")}`;

export const discountRate = (listPrice: number, betaPrice: number) =>
  Math.round((1 - betaPrice / listPrice) * 100);

/**
 * 카카오톡 상담 채널. (2026-08-14 — 채널톡 대체)
 *
 * 브랜드가 우리에게 말을 거는 유일한 창구다. 반대 방향(우리 → 브랜드)은
 * 메일이고, 어드민 프로젝트 화면의 [브랜드에게 알리기]가 그 입구다.
 * 먼저 알려 두면 여기로 오는 문의가 줄고, 남는 건 진짜 물어볼 것뿐이다.
 */
/**
 * **마케팅 팀 구독제 월 금액.** (2026-08-21 사장님 지시)
 *
 * 랜딩과 소개서는 지금도 "브랜드 단위 협의" 로 둔다 — 처음 보는 자리에
 * 월 단위 금액이 먼저 뜨면 문턱이 된다. **메일에만** 숫자를 적는다.
 * 이미 문의한 분께 가는 자리라, 금액이 보이는 편이 다음 대화가 빠르다.
 *
 * 업무 범위에 따라 가감이 되는 값이라 메일 문안에도 그 말을 같이 적는다.
 */
export const SUBSCRIPTION_MONTHLY = 2_700_000;

/**
 * 미팅 예약 링크(캘린들리 등). 없으면 메일이 **일정 슬롯을 회신받는 문안**으로
 * 자동으로 바뀐다 — 링크가 없는데 버튼만 있는 상황을 만들지 않는다.
 *
 * 캘린들리에서 Google Meet 을 연동해 두면 예약과 동시에 미팅 링크가
 * 자동 발급된다. `CALENDLY_URL` 에 그 이벤트 주소를 넣으면 켜진다.
 */
export const MEETING_BOOKING_URL = process.env.CALENDLY_URL ?? "";

export const KAKAO_CHANNEL = {
  /** 채널 홈 */
  url: "https://pf.kakao.com/_QExiiX",
  /** 채팅 바로 열기 — 홈을 거치지 않고 대화창으로 떨어진다 */
  chatUrl: "https://pf.kakao.com/_QExiiX/chat",
} as const;
