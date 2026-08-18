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
  },
  {
    value: "shorts_package",
    label: "숏폼 — 패키지 플랜",
    desc: "인플루언서 시딩 + 2차 컷 확보 + 구매전환형 광고숏폼 기획·제작",
    needsCount: true,
  },
  {
    value: "sns_turnkey",
    label: "브랜드 SNS 채널 턴키 운영",
    desc: "채널 전략부터 콘텐츠 제작·운영까지 통째로",
    needsCount: false,
  },
  {
    value: "ai_team",
    label: "AI팀 구축 프로젝트",
    desc: "사내에 AI 제작 역량을 심는 구축형 프로젝트",
    needsCount: false,
  },
  {
    value: "consult",
    label: "상담 후 결정",
    desc: "무엇이 맞는지부터 같이 정하고 싶어요",
    needsCount: false,
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
