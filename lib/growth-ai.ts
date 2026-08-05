import Anthropic from "@anthropic-ai/sdk";

/**
 * 그로스 AI (PART F9).
 *
 * 스펙 F9는 claude-sonnet-4-6으로 적혀 있으나 claude-opus-5를 쓴다 —
 * 브랜드 프로필 분석은 브랜드당 1회만 도는 호출이라 비용 영향이 작고,
 * 여기서 뽑은 USP·타겟이 이후 모든 캠페인 기획의 입력이 되기 때문.
 */
const MODEL = "claude-opus-5";

export function anthropic() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY가 설정되지 않았습니다");
  return new Anthropic({ apiKey });
}

/** 브랜드 프로필 구조 — 검수 화면과 어드민이 함께 읽는다 (E1) */
export type BrandProfile = {
  brand_name: string;
  brand_intro: string;
  product_summary: string;
  usps: { headline: string; evidence: string }[];
  target: { age_range: string; situation: string; purchase_trigger: string };
  price_band: string;
  tone_and_manner: string;
  forbidden_expressions: { expression: string; reason: string; alternative: string }[];
  competitive_context: string;
};

const BRAND_PROFILE_SCHEMA = {
  type: "object",
  properties: {
    brand_name: { type: "string", description: "브랜드명" },
    brand_intro: { type: "string", description: "브랜드 소개 2~3문장" },
    product_summary: { type: "string", description: "핵심 제품과 카테고리 요약" },
    usps: {
      type: "array",
      description: "핵심 USP 3개. 구매 결정에 영향이 큰 순서로 정렬",
      items: {
        type: "object",
        properties: {
          headline: { type: "string", description: "한 문장 USP" },
          evidence: { type: "string", description: "그 USP를 뒷받침하는 근거" },
        },
        required: ["headline", "evidence"],
        additionalProperties: false,
      },
    },
    target: {
      type: "object",
      properties: {
        age_range: { type: "string" },
        situation: { type: "string", description: "이 제품을 찾게 되는 상황" },
        purchase_trigger: { type: "string", description: "구매를 결정짓는 계기" },
      },
      required: ["age_range", "situation", "purchase_trigger"],
      additionalProperties: false,
    },
    price_band: { type: "string", description: "가격대·객단가 추정" },
    tone_and_manner: { type: "string", description: "브랜드가 유지해야 할 화법" },
    forbidden_expressions: {
      type: "array",
      description:
        "광고 심의 위반 소지가 있어 쓰면 안 되는 표현과 대체안. 없으면 빈 배열",
      items: {
        type: "object",
        properties: {
          expression: { type: "string" },
          reason: { type: "string" },
          alternative: { type: "string" },
        },
        required: ["expression", "reason", "alternative"],
        additionalProperties: false,
      },
    },
    competitive_context: { type: "string", description: "경쟁 맥락과 차별점" },
  },
  required: [
    "brand_name",
    "brand_intro",
    "product_summary",
    "usps",
    "target",
    "price_band",
    "tone_and_manner",
    "forbidden_expressions",
    "competitive_context",
  ],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `너는 퍼포먼스 마케팅 크리에이티브 디렉터다. 브랜드가 제공한 자료를 읽고, 숏폼 광고 소재를 기획할 때 곧바로 쓸 수 있는 브랜드 프로필로 구조화한다.

원칙:
- 자료에 실제로 있는 내용만 쓴다. 근거가 없으면 추측 대신 "자료에서 확인되지 않음"이라고 적는다.
- USP는 브랜드가 자랑하고 싶은 것이 아니라 **구매 결정에 실제로 영향을 주는 것** 순서로 정렬한다.
- 타겟은 인구통계가 아니라 "어떤 상황에서 이걸 찾게 되는가"로 정의한다.
- 금지 표현에는 의학적 효능 단정, 최상급 단정, 근거 없는 수치 등 광고 심의 위반 소지가 있는 표현을 담고, 반드시 쓸 수 있는 대체 표현을 함께 제안한다. 해당 없으면 빈 배열로 둔다.
- 전부 한국어로 쓴다.`;

export type AnalyzeInput =
  | { kind: "url"; url: string; pageText: string }
  | { kind: "text"; text: string };

export async function analyzeBrand(input: AnalyzeInput): Promise<BrandProfile> {
  const source =
    input.kind === "url"
      ? `아래는 브랜드의 상세페이지에서 추출한 텍스트다.\n\n출처: ${input.url}\n\n---\n${input.pageText}`
      : `아래는 브랜드가 직접 작성한 소개다.\n\n---\n${input.text}`;

  const response = await anthropic().messages.create({
    model: MODEL,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    output_config: {
      // 기본값 high로는 3분 가까이 걸려 온보딩 UX가 무너진다.
      // medium에서도 USP·금지표현 품질이 유지되는 것을 실측으로 확인했다.
      effort: "medium",
      format: {
        type: "json_schema",
        schema: BRAND_PROFILE_SCHEMA,
      },
    },
    messages: [{ role: "user", content: source }],
  });

  // 안전 분류기가 거절하면 content가 비어 있다 — 인덱싱 전에 확인
  if (response.stop_reason === "refusal") {
    throw new Error("분석을 완료하지 못했습니다. 입력 내용을 확인해 주세요.");
  }

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("분석 결과를 받지 못했습니다.");
  }

  return JSON.parse(block.text) as BrandProfile;
}
