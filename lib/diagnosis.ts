import { PLANS, type Plan, type PlanCode } from "@/lib/constants";

/**
 * 플랜 진단 — 가격표 바로 앞에 놓는다.
 *
 * 가격만 던지면 "숏폼 한 편에 얼마"라는 비교로 끌려간다. 그 앞에 **진단**을 세워
 * 지금 브랜드가 어느 국면인지 먼저 짚어야 편수·구성이 근거를 갖는다.
 * 질문 자체가 제안서다 — 답을 고르는 동안 "이 사람들은 뭘 보는지"가 읽혀야 한다.
 *
 * 설계 원칙
 *  · 질문은 5개. 4개면 얕고 6개부터는 이탈이 난다
 *  · 보기는 3~4개. 반드시 **현재 상태를 있는 그대로 고르게** 한다(이상적인 답을 유도하지 않는다)
 *  · 질문마다 왜 묻는지 한 줄을 붙인다. 이 한 줄이 전문성의 대부분이다
 *  · 결과는 플랜 하나를 지목하되, 마지막 판단은 헤드 상담으로 넘긴다
 */

export type DiagOption = { value: string; label: string };

export type DiagQuestion = {
  id: "usp" | "purpose" | "source" | "stock" | "volume";
  title: string;
  /** 왜 묻는지 — 질문보다 이 줄이 더 오래 읽힌다 */
  desc: string;
  options: DiagOption[];
};

export const DIAGNOSIS: DiagQuestion[] = [
  {
    id: "usp",
    title: "브랜드의 타겟별 객단가와 USP가 정리돼 있나요?",
    desc: "기획 단계에서 가이드라인을 잡을 때 핏을 맞추기 위한 첫 질문입니다. 누구에게 얼마짜리를 왜 파는지가 정해져야 편마다 후킹이 흔들리지 않습니다.",
    options: [
      { value: "defined", label: "타겟·객단가·USP가 문서로 정리돼 있어요" },
      { value: "rough", label: "대략 알지만 문서로 정리한 적은 없어요" },
      { value: "none", label: "지금 다시 잡아야 하는 단계예요" },
    ],
  },
  {
    id: "purpose",
    title: "숏폼 소재를 어떤 목적으로 활용할 계획인가요?",
    desc: "감도가 높은 브랜디드 소재부터 감도가 조금 낮아도 리얼리티를 살린 콘텐츠까지 유형이 다양하고, 트래픽 확보냐 매출 확보냐에 따라 기획이 갈립니다.",
    options: [
      { value: "performance", label: "광고 계정에 태워 구매 전환을 낼 소재" },
      { value: "branded", label: "채널·상세페이지에 쌓을 브랜디드 소재" },
      { value: "traffic", label: "인지·트래픽부터 만들어야 해요" },
      { value: "mixed", label: "둘 다 필요해요" },
    ],
  },
  {
    id: "source",
    title: "내부적으로 영상에 활용 가능한 소스를 갖고 계신가요?",
    desc: "기존 리뷰 영상, 내부 인원 촬영본처럼 부분부분 잘라 쓸 수 있는 소스컷과 룩북·제품 누끼 이미지가 있으면 촬영 없이 바로 기획에 들어갑니다.",
    options: [
      { value: "rich", label: "촬영본·UGC·제품컷이 충분히 있어요" },
      { value: "image", label: "이미지·상세컷 정도만 있어요" },
      { value: "none", label: "거의 없어요 — 소스부터 만들어야 해요" },
    ],
  },
  {
    id: "stock",
    title: "지금 광고 소재는 어떤 상태인가요?",
    desc: "소재가 마르면 예산을 올리기 전에 CPA가 먼저 오릅니다. 지금 소재가 몇 개이고 무엇이 이겼는지 읽히느냐가 다음 편수를 정합니다.",
    options: [
      { value: "dry", label: "몇 개를 계속 돌려쓰고 있어요" },
      { value: "making", label: "만들고는 있는데 뭐가 이겼는지 판독이 안 돼요" },
      { value: "notyet", label: "아직 광고를 본격적으로 돌리진 않았어요" },
      { value: "ok", label: "소재도 성과 판독도 돌아가고 있어요" },
    ],
  },
  {
    id: "volume",
    title: "한 달에 필요한 소재는 몇 편인가요?",
    desc: "1편은 결과를 먼저 보고 판단하는 자리이고, 5편부터 A/B 변주가 돌아갑니다. 10편 이상이면 승자 소재를 뽑아 예산을 몰 수 있습니다.",
    options: [
      { value: "v1", label: "우선 1편만 받아보고 판단할게요" },
      { value: "v5", label: "월 5편 내외" },
      { value: "v10", label: "월 10편 이상" },
      { value: "unknown", label: "아직 모르겠어요 — 추천받고 싶어요" },
    ],
  },
];

export type DiagAnswers = Partial<Record<DiagQuestion["id"], string>>;

export type DiagResult = {
  plan: Plan;
  /** 결과 카드 헤드라인 — 진단 한 줄 */
  headline: string;
  /** 지목한 구성이 무엇인지 — 구성 설명 2줄(무엇을 하는 구성인가 / 이 편수가 갖는 의미) */
  blurbs: string[];
  /** 왜 이 플랜인지 — 답변에서 뽑은 근거 4줄 */
  notes: string[];
  /** 시딩이 안 붙는 조합 등, 결과에 붙는 단서 */
  caveat?: string;
};

/** 구성이 무엇을 하는 것인지 — 이름만 던지면 무슨 뜻인지 모른다 */
const CODE_BLURB: Record<PlanCode, string> = {
  shorts_only:
    "브랜드가 보유한 소스(촬영본·UGC·제품컷)로 구매 전환형 숏폼을 기획부터 제작까지 진행하는 구성입니다.",
  full: "인플루언서 시딩으로 광고에 쓸 소스컷을 먼저 확보하고, 그 소스로 구매 전환형 숏폼을 만드는 구성입니다.",
};

/** 이 편수가 갖는 의미 — 숫자만 보면 많고 적음밖에 안 읽힌다 */
const TIER_BLURB: Record<string, string> = {
  "1": "결과물을 먼저 한 편 받아보고 판단하는 자리입니다. 인플루언서 시딩은 포함되지 않습니다.",
  "5": "첫 세트로 반응을 확인하는 편수입니다. 포맷을 나눠 무엇이 먹히는지부터 봅니다.",
  "10": "A/B 변주가 실제로 도는 편수입니다. 이긴 소재를 골라 예산을 붙일 수 있습니다.",
  "20": "승자 소재에 예산을 몰면서 파생본까지 계속 갈아 끼울 수 있는 편수입니다.",
  starter: "첫 세트로 반응을 확인하는 규모입니다. 시딩으로 소스를 만들고 숏폼 5편으로 이어갑니다.",
  growth:
    "A/B 변주가 실제로 도는 규모입니다. 시딩 20명으로 소스 폭을 넓히고 숏폼 10편으로 테스트합니다.",
  scale:
    "승자 소재에 예산을 몰 수 있는 규모입니다. 시딩 30명 소스로 숏폼 20편까지 파생을 이어갑니다.",
};

const NOTE: Record<string, Record<string, string>> = {
  usp: {
    defined:
      "타겟·객단가·USP가 정리돼 있어, 첫 세션부터 후킹 설계로 바로 들어갑니다.",
    rough:
      "USP가 머릿속에만 있으면 편마다 후킹이 흔들립니다. 첫 가이드라인에서 한 장으로 정리해 드립니다.",
    none: "무엇을 누구에게 파는지부터 같이 잡습니다. 소재보다 이 정리가 먼저입니다.",
  },
  purpose: {
    performance:
      "광고 계정에 태울 소재라 브랜디드 감도보다 후킹·CTA 구조를 먼저 설계합니다.",
    branded: "브랜드 톤을 지키는 감도 높은 유형으로 편성합니다.",
    traffic: "먼저 도달을 만드는 유형으로 시작해 전환형으로 넘깁니다.",
    mixed:
      "감도 높은 브랜디드형과 리얼리티형을 섞어, 계정과 채널을 동시에 채웁니다.",
  },
  source: {
    rich: "보유하신 소스로 촬영 없이 바로 시작합니다.",
    image:
      "이미지·상세컷만으로는 움직임이 부족합니다. 일부 소스컷 확보를 함께 잡습니다.",
    none: "찍을 소스부터 없습니다. 인플루언서 시딩으로 소스컷 확보부터 함께 갑니다.",
  },
  stock: {
    dry: "같은 소재를 돌려쓰는 구간입니다. 편수를 확보해 소재 피로도를 끊는 게 우선입니다.",
    making:
      "만드는 건 되는데 판독이 안 되는 구간입니다. 변주본을 묶어 무엇이 이겼는지 읽는 구조가 필요합니다.",
    notyet: "첫 소재 세트로 반응을 확인하는 단계입니다.",
    ok: "구조는 돌아갑니다. 남은 건 편당 퀄리티와 변주 폭입니다.",
  },
};

const HEADLINE: Record<string, string> = {
  none: "소스 확보부터 함께 가야 하는 국면",
  dry: "소재 피로도를 먼저 끊어야 하는 국면",
  making: "판독 가능한 변주 세트가 필요한 국면",
  notyet: "첫 세트로 반응을 확인할 국면",
  ok: "편당 퀄리티와 변주 폭을 올릴 국면",
};

const findPlan = (code: PlanCode, tier: string) =>
  PLANS.find((p) => p.code === code && p.tier === tier)!;

/**
 * 답변 → 플랜.
 *
 * 갈림길은 두 개뿐이다.
 *   ① 소스가 있느냐 → 싱글(숏폼만) / 패키지(시딩까지)
 *   ② 몇 편이 필요하냐 → 티어
 * 스케일(인플 30)은 여기서 지목하지 않는다. 그 규모는 상담에서 정할 일이다.
 */
export function diagnose(answers: DiagAnswers): DiagResult {
  const { usp, purpose, source, stock, volume } = answers;

  const needsSeeding =
    source === "none" ||
    (source === "image" && (purpose === "performance" || purpose === "mixed"));
  const code: PlanCode = needsSeeding ? "full" : "shorts_only";

  let tier: string;
  if (code === "full") {
    // 시딩은 숏폼 5편 묶음부터라 1편 응답도 스타터로 올린다
    tier = volume === "v10" ? "growth" : "starter";
  } else if (volume === "v1") {
    tier = "1";
  } else if (volume === "v5") {
    tier = "5";
  } else if (volume === "v10") {
    tier = "10";
  } else {
    // 모르겠다 → 지금 상태로 결정한다. 소재가 말랐거나 전환용이면 테스트가 되는 편수부터
    tier = stock === "dry" || purpose === "performance" ? "10" : "5";
  }

  const notes = [
    usp && NOTE.usp[usp],
    purpose && NOTE.purpose[purpose],
    source && NOTE.source[source],
    stock && NOTE.stock[stock],
  ].filter(Boolean) as string[];

  const plan = findPlan(code, tier);

  return {
    plan,
    blurbs: [CODE_BLURB[code], TIER_BLURB[tier]].filter(Boolean),
    headline:
      (source === "none" ? HEADLINE.none : stock && HEADLINE[stock]) ??
      "지금 필요한 구성",
    notes,
    caveat:
      code === "full" && volume === "v1"
        ? "인플루언서 시딩은 숏폼 5편 이상 묶음부터 진행됩니다. 1편만 먼저 보시려면 싱글 1편으로 시작하실 수 있습니다."
        : undefined,
  };
}
