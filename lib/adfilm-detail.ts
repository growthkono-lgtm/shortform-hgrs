import "server-only";

/**
 * 상세페이지 자동 분석 — 링크 하나로 기획안 재료를 뽑는다. (2026-08-16)
 *
 * ── 왜 만들었나 ───────────────────────────────────────────────────────
 * 사장님이 2026-08-15 에 펠리웨이 상세페이지 링크를 주셨는데, 내가 텍스트만
 * 긁어 보고 *"상세페이지가 이미지라 정보가 없다"* 며 넘어갔다. 그리고 패키지
 * 문구와 리뷰로 기획안을 때웠다. 그 결과 **상세페이지에만 있던 것이 통째로
 * 빠졌다** — 1,400만 마리·40개국·논문 30개·25년·F3 정의·이상행동 목록.
 *
 * 사장님이 직접 스크린샷 14장을 떠서 보내 주시고 나서야 반영했다.
 * *"매번 내가 저렇게 주는 게 이 작업의 목적이 아니잖아."* — 맞다.
 *
 * ── 되는 이유 ─────────────────────────────────────────────────────────
 * 국내 상세페이지는 거의 전부 **이미지 덩어리**다(카페24·고도몰 공통).
 * 그런데 그 이미지 URL 은 HTML 에 그대로 있다. 받아서 **비전 모델에게 읽히면**
 * 사람이 스크린샷 뜨는 일을 대신할 수 있다. 2026-08-16 실측으로 확인했다 —
 * cevakorea.com 에서 상세 이미지 23장을 받아 전부 판독했다.
 *
 * ⚠️ 이 파일은 남의 상세페이지를 **읽기만** 한다. 이미지를 우리 서버에
 * 재호스팅하거나 영상에 그대로 넣지 않는다. 기획 재료로만 쓴다.
 */

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126 Safari/537.36";

/** 상세 이미지가 올라가는 경로 — 카페24·고도몰이 쓰는 관례 */
const DETAIL_HINT = /\/web\/upload|\/detail|editor|contents?\//i;

/** 스킨·아이콘 따위. 이런 건 상세 내용이 아니다 */
const SKIN_HINT = /echosting|skin\/|icon|btn_|logo|banner|common\//i;

export type DetailImage = { url: string; bytes: number };

/**
 * 상세페이지에서 **읽을 가치가 있는 이미지**만 골라 온다.
 *
 * 크기로 한 번 더 거른다 — 상세 컷은 보통 100KB 를 넘고, 그보다 작은 것은
 * 아이콘이나 배지다. 이걸 안 걸러 내면 판독 비용이 몇 배가 된다.
 */
export async function collectDetailImages(
  pageUrl: string,
  opts: { max?: number; minBytes?: number } = {},
): Promise<DetailImage[]> {
  const max = opts.max ?? 30;
  const minBytes = opts.minBytes ?? 80_000;

  const res = await fetch(pageUrl, { headers: { "user-agent": UA } });
  if (!res.ok) throw new Error(`상세페이지를 못 열었습니다 (HTTP ${res.status})`);
  const html = await res.text();
  const origin = new URL(pageUrl).origin;

  const found: string[] = [];
  const re = /(?:src|data-src)\s*=\s*["']([^"']+\.(?:jpg|jpeg|png|gif|webp))["']/gi;
  for (const m of html.matchAll(re)) {
    let u = m[1];
    if (SKIN_HINT.test(u)) continue;
    if (!DETAIL_HINT.test(u)) continue;
    if (u.startsWith("//")) u = `https:${u}`;
    else if (u.startsWith("/")) u = `${origin}${u}`;
    else if (!/^https?:/i.test(u)) continue;
    if (!found.includes(u)) found.push(u);
  }

  // 순서가 곧 상세페이지의 서사 순서다. 정렬하지 않는다
  const out: DetailImage[] = [];
  for (const url of found.slice(0, max * 2)) {
    if (out.length >= max) break;
    try {
      const head = await fetch(url, { method: "HEAD", headers: { "user-agent": UA } });
      const bytes = Number(head.headers.get("content-length") ?? 0);
      if (bytes && bytes < minBytes) continue;
      out.push({ url, bytes });
    } catch {
      // 개별 실패는 넘어간다 — 한 장 때문에 전체를 버리지 않는다
    }
  }
  return out;
}

/**
 * 상세페이지에서 뽑아내는 것. **기획안 칸 1·2·3 의 재료**다.
 * 여기 없는 항목은 영상에도 못 들어간다.
 */
export type DetailAnalysis = {
  /** 제품이 무엇인지 한 줄 */
  what: string;
  /** 브랜드가 내건 헤드 카피 (상세페이지 원문) */
  headline: string;
  /** 제품 팩트 — 용량·지속·규격 등. 원문 그대로 */
  facts: { label: string; value: string }[];
  /** 제품이 해 주는 것. 상세페이지가 나열한 기능 */
  functions: string[];
  /** 이 제품을 사야 하는 사람 — 상세페이지의 추천 대상 */
  audience: string[];
  /** 고객이 겪는 증상·문제 (비포의 재료) */
  problems: string[];
  /** 신뢰 지표 — 수치·인증·논문 */
  trust: string[];
  /** 하지 말아야 할 말 (아님·오해) */
  caveats: string[];
  /** 상세페이지가 쓴 서사 순서 그대로 */
  storyOrder: string[];
};

const SYSTEM = `너는 광고 기획자다. 브랜드 **상세페이지 이미지들**을 순서대로 받아
그 안의 글자를 전부 읽고, 광고 기획에 쓸 재료를 뽑는다.

지켜야 할 것:
- **이미지에 실제로 쓰인 문구만** 쓴다. 상식으로 채우거나 지어내지 않는다.
- 수치(용량·기간·마리 수·논문 수·연차·평수)는 **한 글자도 바꾸지 않는다.**
- 브랜드가 "아니다" 라고 명시한 것(예: 진정제가 아님)은 caveats 에 그대로 담는다.
- 상세페이지는 대개 **인지도 0 인 사람을 가정하고** 짜여 있다. 그 서사 순서가
  광고 순서의 힌트이므로 storyOrder 에 소제목을 순서대로 적는다.
- 못 읽은 이미지가 있으면 억지로 채우지 말고 빈 배열로 둔다.`;

/**
 * 이미지들을 한 번에 읽혀 분석을 받는다.
 * 비전 판독이라 이미지 수가 곧 비용이다 — 호출부에서 max 로 조절한다.
 */
export async function analyzeDetailPage(
  images: DetailImage[],
  hint: { productName?: string; goal?: string } = {},
): Promise<DetailAnalysis> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY 가 설정되지 않았습니다");
  if (!images.length) throw new Error("읽을 상세 이미지가 없습니다");

  const schema = {
    type: "object",
    properties: {
      what: { type: "string" },
      headline: { type: "string" },
      facts: {
        type: "array",
        items: {
          type: "object",
          properties: { label: { type: "string" }, value: { type: "string" } },
          required: ["label", "value"],
          additionalProperties: false,
        },
      },
      functions: { type: "array", items: { type: "string" } },
      audience: { type: "array", items: { type: "string" } },
      problems: { type: "array", items: { type: "string" } },
      trust: { type: "array", items: { type: "string" } },
      caveats: { type: "array", items: { type: "string" } },
      storyOrder: { type: "array", items: { type: "string" } },
    },
    required: [
      "what", "headline", "facts", "functions",
      "audience", "problems", "trust", "caveats", "storyOrder",
    ],
    additionalProperties: false,
  } as const;

  const content: unknown[] = [
    {
      type: "input_text",
      text:
        `상세페이지 이미지 ${images.length}장을 순서대로 보낸다.` +
        (hint.productName ? `\n제품명: ${hint.productName}` : "") +
        (hint.goal ? `\n이 영상의 제작 목표: ${hint.goal}` : "") +
        `\n전부 읽고 광고 기획 재료를 뽑아라.`,
    },
    ...images.map((im) => ({ type: "input_image", image_url: im.url })),
  ];

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ADFILM_MODEL_DETAIL ?? "gpt-5.6-terra",
      instructions: SYSTEM,
      input: [{ role: "user", content }],
      max_output_tokens: 8000,
      reasoning: { effort: "medium" },
      text: {
        format: { type: "json_schema", name: "detail_analysis", schema, strict: true },
      },
      store: false,
    }),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`상세페이지 분석 실패 ${res.status}: ${text.slice(0, 300)}`);

  const payload = JSON.parse(text) as {
    output?: { type: string; content?: { type: string; text?: string }[] }[];
  };
  const body = (payload.output ?? [])
    .filter((o) => o.type === "message")
    .flatMap((o) => o.content ?? [])
    .filter((c) => c.type === "output_text")
    .map((c) => c.text ?? "")
    .join("");

  if (!body) throw new Error("상세페이지 분석 응답이 비었습니다");
  return JSON.parse(body) as DetailAnalysis;
}

/** 링크 하나 → 분석. 어드민 버튼이 이 함수 하나만 부른다 */
export async function analyzeProductUrl(
  pageUrl: string,
  hint: { productName?: string; goal?: string; max?: number } = {},
): Promise<{ analysis: DetailAnalysis; images: DetailImage[] }> {
  const images = await collectDetailImages(pageUrl, { max: hint.max ?? 24 });
  const analysis = await analyzeDetailPage(images, hint);
  return { analysis, images };
}
