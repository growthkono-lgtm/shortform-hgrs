import { PLANS, type PlanCode } from "@/lib/constants";

/**
 * 문의 폼에서 고르는 프로젝트 종류. (2026-08-18)
 *
 * ── 왜 새로 만들었나 ──────────────────────────────────────────────────
 * 08-18 첫 실사 문의(자보티바)가 들어왔는데 어드민에 "관심 추천 요청 · 편수
 * 미정" 으로 찍혔다. 고객이 그렇게 고른 게 아니라 `/sns-brand` 폼이 서버로
 * `unsure`·`unknown` 을 **하드코딩해 보내고 있었다.** 물어본 적이 없는데
 * 고른 것처럼 보인 것이다. 통화 전에 보는 화면이 사실과 다르면 첫 마디가 어긋난다.
 *
 * 그리고 그때 팔 수 있는 것이 숏폼 두 가지뿐이었는데, 지금은 채널 턴키와
 * AI팀 구축까지 넷이다. 폼이 사업을 못 따라가고 있었다.
 *
 * ── 옛 값을 왜 안 지우나 ──────────────────────────────────────────────
 * `shorts_only`·`full`·`unsure` 로 접수된 건이 이미 있다. 지우면 과거 문의가
 * 깨진다. 새 폼은 신규 값만 보내고, 어드민은 옛 값도 라벨로 읽는다.
 */

export const INQUIRY_PLANS = [
  {
    value: "shorts_single",
    label: "숏폼 — 싱글 플랜",
    desc: "구매전환형 광고숏폼 기획·제작",
    /** 편수를 물어볼 플랜인가 */
    needsCount: true,
    /**
     * **가격이 아니라 포함 내역을 보여 준다.** (2026-08-19 오후 수정)
     *
     * 앞 판은 카드 오른쪽에 "21.6만원 ~ 440만원" 처럼 범위를 크게 박았다.
     * 사장님 지적: *"가격 저렇게 표현하지 말고 뭐뭐가 포함되는지 위주로 넣어.
     * 가격만 저렇게 통으로 넣으면 비싸 보여."*
     *
     * 맞다. 상한(440만·520만)이 먼저 눈에 들어오면 그 숫자가 기준점이 되고,
     * 실제로 사는 구성이 무엇인지는 안 읽힌다. 금액은 **고른 뒤 규모별로**
     * 펼쳐 보여 준다 — 거기서는 "무엇에 얼마" 라는 맥락이 붙는다.
     */
    includes: [
      "기획 · 대본 · 콘티",
      "편집 · 자막 · 보정",
      "AI 활용 효율화",
      "1회 무상 수정",
    ],
    priceFrom: "shorts_only" as const,
  },
  {
    value: "shorts_package",
    // 2026-08-19 "패키지" → "멀티" 로 개명. 무엇이 묶였는지 말해 주는 이름이다
    label: "숏폼 — 멀티 플랜",
    desc: "인플루언서 시딩으로 소재부터 확보해 광고 숏폼까지",
    needsCount: true,
    includes: [
      "인플루언서 시딩 5·10·15명",
      "콘텐츠 가이드라인 설계",
      "회수 소재 광고용 재편집",
      "싱글 플랜의 기획·제작 전부",
    ],
    priceFrom: "full" as const,
  },
  {
    value: "sns_turnkey",
    label: "브랜드 SNS 채널 턴키 운영",
    desc: "채널 전략부터 콘텐츠 제작·운영까지 통째로",
    needsCount: false,
    includes: [
      "채널 포지셔닝 · 전략",
      "콘텐츠 기획 · 제작",
      "편성 · 운영 대행",
      "성과 리포트",
    ],
    priceNote: "채널 수·편성 주기에 따라 구성",
  },
  {
    value: "consult",
    label: "상담 후 결정",
    desc: "무엇이 맞는지부터 같이 정하고 싶어요",
    needsCount: false,
    includes: [],
    priceNote: "현황을 먼저 듣고 구성부터 같이 정합니다",
  },
] as const;

export type InquiryPlanValue = (typeof INQUIRY_PLANS)[number]["value"];

export const INQUIRY_PLAN_VALUES = INQUIRY_PLANS.map((p) => p.value);

export const needsCount = (v: string) =>
  INQUIRY_PLANS.find((p) => p.value === v)?.needsCount ?? false;

/**
 * 어드민이 읽는 라벨. 옛 값 셋이 여기 같이 있는 이유는 위 머리말에 적었다 —
 * 지우면 이미 접수된 문의가 빈칸이 된다.
 */
export const INQUIRY_PLAN_LABEL: Record<string, string> = {
  ...Object.fromEntries(INQUIRY_PLANS.map((p) => [p.value, p.label])),
  // ── 폼에서 내린 선택지 (2026-08-19 사장님 지시) ──
  // 값은 남긴다 — 이 값으로 접수된 건이 있으면 어드민이 빈칸이 된다
  ai_team: "AI팀 구축 프로젝트 (폼에서 내림)",
  // ── 2026-08-18 이전 접수건 ──
  shorts_only: "숏폼 단독 (구 버전)",
  full: "시딩 포함 (구 버전)",
  unsure: "추천 요청 (구 버전)",
};

/**
 * 현황 체크(진단) 결과를 폼 기본 선택으로 옮긴다.
 *
 * 진단은 숏폼 두 갈래만 판정한다(`lib/diagnosis.ts`). 채널 턴키·AI팀은
 * 진단 문항 밖이라 여기서 나올 수 없다 — 사용자가 직접 고르면 그 값이 이긴다.
 */
export const fromDiagnosisCode = (code: string): InquiryPlanValue =>
  code === "full" ? "shorts_package" : "shorts_single";

export const VOLUMES = [
  { value: "v1", label: "1편" },
  { value: "v5", label: "5편" },
  { value: "v10", label: "10편" },
  { value: "v20", label: "20편 이상" },
  { value: "unknown", label: "미정" },
] as const;

export const VOLUME_LABEL: Record<string, string> = Object.fromEntries(
  VOLUMES.map((v) => [v.value, v.label]),
);

/**
 * 어느 랜딩에서 들어온 문의인가.
 *
 * `inquiries` 에 source 컬럼이 없어 `diagnosis`(jsonb) 스냅샷에 남기고 있다.
 * 도메인 이전 때 컬럼으로 올리기로 했는데 아직이다 — 그때까지 여기서 읽는다.
 * 키가 없으면 숏폼 랜딩이다(그쪽 폼은 source 를 안 넣는다).
 */
export const INQUIRY_SOURCE_LABEL: Record<string, string> = {
  "sns-brand": "채널 운영 랜딩 (/sns-brand)",
  shortform: "숏폼 랜딩 (/shortform)",
};

/**
 * 고른 것인가, 우리가 박아 넣은 것인가. (2026-08-18)
 *
 * 08-18 오전에 들어온 첫 실사 문의가 어드민에 "추천 요청 · 미정" 으로 찍혔다.
 * 사장님이 "이 클라가 뭘 선택해서 제출했냐" 고 물으셨는데, **답은 "아무것도
 * 고르지 않았다" 이고 정확히는 "고를 화면이 없었다"** 였다. 그날 `/sns-brand`
 * 폼에는 플랜 선택 UI 자체가 없었고 서버로 `unsure`·`unknown` 을 하드코딩해
 * 보내고 있었다.
 *
 * 그 값을 라벨로 옮기기만 하면 화면은 거짓말을 한다. 안 물어본 것은 안
 * 물어봤다고 적어야 통화 첫 마디가 어긋나지 않는다.
 *
 * 판정: `/sns-brand` 에서 온 `unsure` 는 고른 것이 아니다. 개편 뒤 그 폼이
 * 보내는 값은 전부 신규 코드(shorts_single…)라 이 조합은 옛 폼에서만 나온다.
 * 반대로 숏폼 랜딩의 `unsure` 는 "추천받고 싶어요" 라는 **실제 선택지**였다.
 */
export function describeSelection(input: {
  interest: string;
  volume: string;
  source: string | null | undefined;
}): { plan: string; count: string; chosen: boolean } {
  const legacyChannelForm =
    input.source === "sns-brand" && input.interest === "unsure";

  if (legacyChannelForm) {
    return {
      plan: "미선택 — 당시 폼에 플랜 선택 항목이 없었습니다",
      count: "미선택",
      chosen: false,
    };
  }

  return {
    plan: INQUIRY_PLAN_LABEL[input.interest] ?? input.interest,
    // 편수를 묻지 않는 플랜에 "미정" 을 찍으면 고객이 그렇게 고른 것처럼 읽힌다
    count: needsCount(input.interest)
      ? (VOLUME_LABEL[input.volume] ?? input.volume)
      : "해당 없음",
    chosen: true,
  };
}


/* ─────────────────────────────────────────────────────────────
 * 폼에 붙는 가격 안내. (2026-08-19)
 *
 * 값은 전부 `lib/constants.ts` 의 PLANS 에서 파생한다 — 가격이 두 벌이 되면
 * 폼에 적힌 값과 실제 청구액이 달라진다. 오늘만 같은 종류로 세 번 어긋났다.
 * ───────────────────────────────────────────────────────────── */

/** 그 계열에서 제일 싼 값 ~ 제일 비싼 값 */
export function planRange(code: PlanCode): { min: number; max: number } | null {
  const rows = PLANS.filter((p) => p.code === code);
  if (!rows.length) return null;
  const prices = rows.map((p) => p.betaPrice);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

/**
 * 선택지를 고른 뒤 펼쳐지는 영역의 안내 한 줄.
 *
 * ⚠️ **카드 오른쪽에 범위를 박는 데 쓰지 마라.** 상한이 먼저 보이면 그 숫자가
 * 기준점이 되어 비싸 보이고, 정작 무엇을 사는지는 안 읽힌다 (2026-08-19).
 * 정가가 없는 구성은 안내 문구를 그대로 돌려준다.
 */
export function planPriceLine(plan: (typeof INQUIRY_PLANS)[number]): string {
  if ("priceNote" in plan && plan.priceNote) return plan.priceNote;
  return "규모별 구성과 금액입니다 — 정확한 값은 상담에서 확정합니다";
}

/**
 * **건당 얼마 내외** 한 줄. (2026-08-19 사장님 지시)
 *
 * 앞 판은 고르면 규모별 금액 4줄이 펼쳐졌다. 사장님 지적:
 * *"플랜 확인이 아래에 있으니 안 보인다. 눌러보지도 않을걸 사람들은.
 * 그리고 저렇게 가격 다 노출하지 말고 건당 얼마 내외 이것만 표기하라니까?"*
 *
 * 두 가지가 틀렸다 — (1) **눌러야 보이는 값은 안 보이는 값이다.**
 * (2) 총액 네 줄을 늘어놓으면 440만·520만이 먼저 눈에 들어와 비싸 보인다.
 * 그래서 **항상 보이는 자리에 건당 한 줄만** 둔다.
 *
 * 기준은 **주력 티어(10편)** 다. 최저가(20편 220,000)로 적으면 실제 견적이
 * 그보다 비싸지고, 최고가로 적으면 문턱이 높아진다.
 */
export function planUnitLine(plan: (typeof INQUIRY_PLANS)[number]): string {
  if ("priceNote" in plan && plan.priceNote) return plan.priceNote;
  if (!("priceFrom" in plan)) return "";

  const 만 = (n: number) => `${Math.round(n / 10000)}만원`;

  if (plan.priceFrom === "shorts_only") {
    const main = PLANS.find((p) => p.code === "shorts_only" && p.tier === "10");
    return main?.unitPrice ? `숏폼 건당 ${만(main.unitPrice)} 내외` : "";
  }

  // 멀티는 시딩이 섞여 편당이 성립하지 않는다. 숏폼 편수로 나눈 값으로 안내한다
  const main = PLANS.find((p) => p.code === "full" && p.tier === "growth");
  if (!main) return "";
  return `숏폼 건당 ${만(main.betaPrice / main.shortsCount)} 내외 (시딩 포함)`;
}
