import { PLANS, POLICY, formatKRW, type Plan } from "@/lib/constants";
import {
  DIAGNOSIS,
  diagnose,
  type DiagAnswers,
  type DiagQuestion,
  type DiagResult,
} from "@/lib/diagnosis";
import { SEEDING_STAGES, SHORTS_STAGES, TRACK_LABEL } from "@/lib/stages";

/**
 * 소개서 — 랜딩에서 가격을 내린 뒤 그 자리를 받는 문서.
 *
 * 랜딩은 가격을 말하지 않는다. 대신 진단을 받고 신청한 사람에게만 이 소개서가 간다.
 * 그러니 이 문서는 **팸플릿이 아니라 견적서에 가깝다** — 지금 이 브랜드가 어느 국면인지
 * 먼저 짚고, 그래서 어느 구성인지, 얼마인지, 어떻게 진행되는지까지 한 번에 닫는다.
 *
 * 페이지(`/brochure/[id]`)와 메일이 **같은 데이터를 쓴다.** 둘의 숫자가 갈리면
 * 받는 사람이 어느 쪽을 믿어야 할지 모른다 — 그래서 표는 여기서만 만든다.
 */

type DiagQuestionId = DiagQuestion["id"];
const QUESTION_IDS: DiagQuestionId[] = DIAGNOSIS.map((q) => q.id);

export type BrochureInquiry = {
  id: string;
  contact_name: string;
  company_name: string | null;
  /**
   * 신청서에 저장된 진단 payload(jsonb). 스키마를 믿지 않고 읽는 쪽에서 좁힌다 —
   * 진단 구조가 바뀌어도 예전 신청 건의 소개서가 터지면 안 된다.
   */
  diagnosis: unknown;
};

/** jsonb에서 답변만 안전하게 꺼낸다. 모양이 다르면 조용히 빈 값 */
function readAnswers(raw: unknown): DiagAnswers {
  if (!raw || typeof raw !== "object") return {};
  const answers = (raw as { answers?: unknown }).answers;
  if (!answers || typeof answers !== "object") return {};

  const valid = new Set(QUESTION_IDS);
  return Object.fromEntries(
    Object.entries(answers).filter(
      ([k, v]) => valid.has(k as DiagQuestionId) && typeof v === "string",
    ),
  ) as DiagAnswers;
}

export type BrochureRow = {
  label: string;
  composition: string;
  price: string;
  /** 편당가 — 편수가 늘 때 무엇이 좋아지는지는 이 숫자가 말한다 */
  perUnit: string | null;
  recommended: boolean;
};

export type Brochure = {
  greeting: string;
  /** 진단을 안 받고 신청한 경우 null — 그때는 전체 안내만 보낸다 */
  result: DiagResult | null;
  /** 권장 구성 금액. result가 없으면 null */
  price: string | null;
  singles: BrochureRow[];
  packages: BrochureRow[];
  /** 시딩 단독 단가 — 패키지 총액이 어떻게 나온 값인지 보이게 한다 */
  seeding: { label: string; count: number; price: string }[];
  steps: { track: string; stages: string[] }[];
  policies: string[];
  url: string;
};

const price = (p: Plan) => formatKRW(p.betaPrice);

/**
 * 편당가. 패키지는 총액에 시딩이 섞여 있으므로 **숏폼 몫으로만** 나눈다 —
 * 총액을 편수로 나누면 실제보다 비싸 보이고, 라벨도 "숏폼 편당"이라고 못 박는다.
 */
const perUnit = (p: Plan) => {
  if (p.shortsCount < 2) return null;
  const unit = formatKRW(Math.round((p.shortsPrice ?? p.betaPrice) / p.shortsCount));
  return p.code === "full" ? `숏폼 편당 ${unit}` : `편당 ${unit}`;
};

const row = (p: Plan): BrochureRow => ({
  label: p.label,
  composition: p.composition,
  price: price(p),
  perUnit: perUnit(p),
  recommended: Boolean(p.recommended),
});

/** 소개서 본문을 만든다. 신청서 한 건이 입력이다 */
export function buildBrochure(
  inquiry: BrochureInquiry,
  siteUrl: string,
): Brochure {
  // 저장된 결과를 그대로 쓰지 않고 답변에서 다시 계산한다.
  // 진단 로직이 바뀌면 소개서도 같이 최신이어야 한다 — 굳은 값은 언젠가 어긋난다.
  const answers = readAnswers(inquiry.diagnosis);
  const result = Object.keys(answers).length ? diagnose(answers) : null;

  const singles = PLANS.filter((p) => p.code === "shorts_only").map(row);
  const packages = PLANS.filter((p) => p.code === "full").map(row);

  return {
    greeting: inquiry.company_name
      ? `${inquiry.company_name} ${inquiry.contact_name}님`
      : `${inquiry.contact_name}님`,
    result,
    price: result ? price(result.plan) : null,
    singles,
    packages,
    seeding: PLANS.filter((p) => p.code === "full" && p.seedingPrice).map((p) => ({
      label: p.label.replace(" 패키지", ""),
      count: p.influencerCount,
      price: formatKRW(p.seedingPrice!),
    })),
    steps: [
      { track: TRACK_LABEL.seeding, stages: SEEDING_STAGES.map((s) => s.label) },
      { track: TRACK_LABEL.shorts, stages: SHORTS_STAGES.map((s) => s.label) },
    ],
    policies: [
      POLICY.revisionOnce,
      POLICY.usagePeriod,
      POLICY.sourceRequired,
      POLICY.noIndividualEdit,
      POLICY.seedingBundleOnly,
      POLICY.singleOrPackage,
    ],
    url: `${siteUrl}/brochure/${inquiry.id}`,
  };
}
