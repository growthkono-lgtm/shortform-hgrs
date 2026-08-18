import { ORG, SERVICE } from "./constants";
import {
  AEO_SPEC,
  AUDIENCE,
  BLOG_SPEC,
  CONVERSION,
  HOOKING,
  POSITIONING,
  FLOW,
  SOURCE_SPEC,
  STRUCTURE,
  VISUAL_SPEC,
  WRITING_RULES,
  segment,
  type SegmentKey,
  format,
  pillar,
  pitchFor,
  readingTime,
  type FormatKey,
  type PillarKey,
} from "./blog-spec";
import {
  sourceBriefing,
  type Source,
  type SourceCandidate,
} from "./blog-sources";

/**
 * 블로그 생성 엔진 — 2026-08-13 전면 개편.
 *
 * ── 순서를 뒤집었다 ────────────────────────────────────────────────────
 *   전(08-12)  기획 → 집필 → (도판 억지 삽입) → 검사
 *   후(08-13)  **조사 → 기획 → 자료 검증 → 집필 → 검사**
 *
 * 왜: 글을 먼저 쓰고 자료를 나중에 끼우면 08-11 에 /blog 를 접게 만든 그 구조로
 * 되돌아간다. 자료가 먼저 확정되어야 모델이 그 자료를 근거로 문장을 쓴다.
 *
 * 1단계 조사가 이번 개편의 핵심이다. 사장님이 소스를 주실 수 없으니
 * **모델이 직접 웹을 검색**해서 실재하는 출처를 가져온다(web_search 서버 도구).
 * 그렇게 모은 URL 을 `lib/blog-sources.ts` 가 다시 한 번 실제로 호출해 검증한다.
 * 모델의 말은 믿지 않는다 — 응답하는 URL 만 믿는다.
 *
 * ── 엔진 교체: 앤트로픽 → OpenAI (2026-08-14) ─────────────────────────
 * 이유는 둘이다.
 *  1. **앤트로픽 크레딧이 바닥났다.** 08-14 새벽 작업표가 세 번 다 400
 *     `credit balance is too low` 로 죽었다. 원고가 한 편도 안 나온다.
 *  2. **같은 품질을 더 싸게 살 수 있다.** 1편은 claude-opus-5($5/$25 per MTok)
 *     로 뽑았고 한 편에 $4 넘게 들었다. gpt-5.6-terra 는 $2/$12 다.
 *
 * 프롬프트·규격·검사식은 **한 글자도 바꾸지 않았다.** 1편의 품질을 만든 것은
 * 모델이 아니라 이 파일의 규칙과 `blog-audit.ts` 의 검사식이라서, 엔진만 갈아
 * 끼우고 나머지는 그대로 둔다. 품질은 검사식이 지킨다.
 */

/**
 * 어느 모델을 어디에 쓰는가 — 단계마다 요구가 다르다.
 *
 * 조사·기획은 **긴 검색 결과를 읽어 정리하는 일**이라 중간 모델로 충분하고,
 * 입력 토큰이 가장 많이 나오는 단계라 단가가 곧 총액이 된다.
 * 집필은 이 파이프라인에서 **품질이 결정되는 단 하나의 단계**라 상위 모델을 쓴다.
 * 출력 1.5만 토큰 기준 차액이 편당 $0.3 남짓이다 — 그 값에 품질을 건다.
 *
 * 환경변수로 갈아 끼울 수 있게 둔다. 모델이 또 바뀌어도 배포만 하면 된다.
 */
const MODEL_RESEARCH = process.env.BLOG_MODEL_RESEARCH ?? "gpt-5.6-terra";
const MODEL_PLAN = process.env.BLOG_MODEL_PLAN ?? "gpt-5.6-terra";
const MODEL_WRITE = process.env.BLOG_MODEL_WRITE ?? "gpt-5.6-sol";

/**
 * 공시 단가(USD / 1M 토큰). 2026-08-14 developers.openai.com/api/docs/pricing 실측.
 *
 * 여기 없는 모델을 쓰면 비용이 0 으로 찍힌다 — 그러면 상한이 무용지물이 되므로
 * 모르는 모델은 **가장 비싼 단가로 친다.** 과대 계상은 멈추게 할 뿐이지만
 * 과소 계상은 돈이 새게 한다.
 */
const PRICES: Record<string, { in: number; cached: number; out: number }> = {
  "gpt-5.6-sol": { in: 5, cached: 0.5, out: 30 },
  "gpt-5.6-terra": { in: 2, cached: 0.2, out: 12 },
  "gpt-5.6-luna": { in: 0.2, cached: 0.02, out: 1.2 },
  "gpt-5.5": { in: 5, cached: 0.5, out: 30 },
  "gpt-5.4": { in: 2.5, cached: 0.25, out: 15 },
  "gpt-5.4-mini": { in: 0.75, cached: 0.075, out: 4.5 },
  "gpt-5.4-nano": { in: 0.2, cached: 0.02, out: 1.25 },
};
const UNKNOWN_PRICE = { in: 5, cached: 0.5, out: 30 };

/** 웹 검색 도구 — 호출당 $0.01. 검색 결과 토큰은 위 모델 단가로 따로 붙는다 */
const WEB_SEARCH_PER_CALL = 10 / 1000;

/**
 * 실사용량 집계 — 2026-08-13 추가, 08-14 OpenAI 로 이관.
 *
 * 사장님 질문이 "이 과금이 의미 있느냐"였다. 추정으로 답하면 안 되므로
 * 응답의 usage 를 그대로 모아 실측으로 찍는다. [[feedback_no_fabricated_metrics]]
 *
 * OpenAI 는 추론(reasoning) 토큰을 `output_tokens` **안에 포함해서** 준다.
 * 앤트로픽처럼 빠지는 값이 없어서 이 합계가 곧 청구액이다 — "하한" 이라는
 * 단서를 뗄 수 있게 됐다.
 */
export const USAGE = {
  input: 0,
  output: 0,
  cacheRead: 0,
  webSearches: 0,
  /** 모델별 단가가 달라 총액을 단계마다 누적해 둔다 */
  cost: 0,
  reset() {
    this.input = 0;
    this.output = 0;
    this.cacheRead = 0;
    this.webSearches = 0;
    this.cost = 0;
  },
  add(model: string, usage: OpenAIUsage, searches = 0) {
    const price = PRICES[model] ?? UNKNOWN_PRICE;
    const cached = usage.input_tokens_details?.cached_tokens ?? 0;
    // 캐시된 입력은 입력 토큰 합계에 이미 포함돼 온다. 두 번 세지 않게 뺀다
    const fresh = Math.max(0, (usage.input_tokens ?? 0) - cached);
    const out = usage.output_tokens ?? 0;

    this.input += fresh;
    this.cacheRead += cached;
    this.output += out;
    this.webSearches += searches;
    this.cost +=
      (fresh / 1_000_000) * price.in +
      (cached / 1_000_000) * price.cached +
      (out / 1_000_000) * price.out +
      searches * WEB_SEARCH_PER_CALL;
  },
  /** 실측 비용(USD) */
  costFloor(): number {
    return this.cost;
  },
  summary(): string {
    return (
      `입력 ${this.input.toLocaleString()} / 출력 ${this.output.toLocaleString()} 토큰` +
      `${this.cacheRead ? ` / 캐시읽기 ${this.cacheRead.toLocaleString()}` : ""}` +
      ` / 웹검색 ${this.webSearches}회\n` +
      `  공시가 기준 $${this.cost.toFixed(3)}`
    );
  },
};

// ─────────────────────────────────────────────────────────────────────────
// OpenAI Responses API — 이 파일이 쓰는 유일한 입구
// ─────────────────────────────────────────────────────────────────────────

type OpenAIUsage = {
  input_tokens?: number;
  output_tokens?: number;
  input_tokens_details?: { cached_tokens?: number };
};

type ResponsePayload = {
  status?: string;
  incomplete_details?: { reason?: string };
  error?: { message?: string } | null;
  usage?: OpenAIUsage;
  output?: {
    type: string;
    content?: { type: string; text?: string; refusal?: string }[];
  }[];
};

/**
 * SDK 를 안 쓰고 fetch 로 직접 부른다.
 *
 * 의존성을 하나 덜 지려는 것도 있지만, 진짜 이유는 **타임아웃과 재시도를
 * 우리가 쥐어야** 하기 때문이다. 08-13 에 앤트로픽 SDK 스트림 하나가 43분
 * 응답 없이 매달려 파이프라인 전체를 멈춰 세웠다. 그 일을 다시 겪지 않으려면
 * 연결을 끊는 손잡이가 이쪽에 있어야 한다.
 */
export async function respond(input: {
  model: string;
  instructions: string;
  message: string;
  maxOutputTokens: number;
  /** 웹 검색을 붙일지. 조사 단계만 true */
  search?: boolean;
  /** 구조화 출력 스키마. 주면 JSON 문자열이 돌아온다 */
  schema?: { name: string; schema: unknown };
  effort?: "low" | "medium" | "high";
  timeoutMs: number;
  label: string;
}): Promise<{ text: string; searches: number }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY 가 설정되지 않았습니다");

  const body: Record<string, unknown> = {
    model: input.model,
    instructions: input.instructions,
    input: input.message,
    max_output_tokens: input.maxOutputTokens,
    reasoning: { effort: input.effort ?? "high" },
    store: false,
  };
  if (input.search) {
    body.tools = [{ type: "web_search", search_context_size: "medium" }];
  }
  if (input.schema) {
    body.text = {
      format: {
        type: "json_schema",
        name: input.schema.name,
        schema: input.schema.schema,
        strict: true,
      },
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), input.timeoutMs);

  let payload: ResponsePayload;
  try {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await res.text();
    if (!res.ok) {
      // 상태 코드를 살려서 던진다 — 재시도할 오류인지 여기서 갈린다
      const err = new Error(`${input.label}: ${res.status} ${text.slice(0, 300)}`);
      (err as Error & { status?: number }).status = res.status;
      throw err;
    }
    payload = JSON.parse(text) as ResponsePayload;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(
        `${input.label}: ${input.timeoutMs / 1000}초 안에 응답이 없어 중단`,
      );
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }

  const searches = (payload.output ?? []).filter(
    (o) => o.type === "web_search_call",
  ).length;
  USAGE.add(input.model, payload.usage ?? {}, searches);

  if (payload.error?.message) {
    throw new Error(`${input.label}: ${payload.error.message}`);
  }

  const refusal = (payload.output ?? [])
    .flatMap((o) => o.content ?? [])
    .find((c) => c.type === "refusal");
  if (refusal) {
    throw new Error(`${input.label}: 모델이 거부했습니다 — ${refusal.refusal ?? ""}`);
  }

  const text = (payload.output ?? [])
    .filter((o) => o.type === "message")
    .flatMap((o) => o.content ?? [])
    .filter((c) => c.type === "output_text")
    .map((c) => c.text ?? "")
    .join("")
    .trim();

  /**
   * `incomplete` 는 출력 한도에 걸려 **문장 중간에 잘린** 상태다.
   * 잘린 본문을 그대로 흘려보내면 검사식이 통과시켜 버리는 경우가 있어
   * (표가 다 나온 뒤 잘리면 실패 항목이 안 잡힌다) 여기서 막는다.
   */
  if (payload.status === "incomplete") {
    throw new Error(
      `${input.label}: 출력이 한도에서 잘렸습니다 (${payload.incomplete_details?.reason ?? "unknown"})`,
    );
  }
  if (!text) throw new Error(`${input.label}: 빈 응답`);

  return { text, searches };
}

/**
 * 원고에 박히는 주소는 항상 프로덕션이다.
 *
 * SERVICE.url 은 NEXT_PUBLIC_SITE_URL 을 따라가는데, 로컬에서 원고를 뽑으면
 * 그 값이 localhost 라 본문에 `http://localhost:3000/shortform` 이 그대로
 * 박힌다(실제로 한 번 그렇게 나왔다). 콘텐츠는 실행 환경을 타면 안 된다.
 */
const CANONICAL_URL = SERVICE.url.includes("localhost")
  ? "https://hgrs.io"
  : SERVICE.url;

/** 브랜드 사실 — 모델이 회사를 지어내지 않도록 확정된 것만 넘긴다 */
const BRAND_CONTEXT = `발행 주체: ${ORG.name}(${ORG.nameEn}), 사이트명 "${SERVICE.name}", ${CANONICAL_URL}
소개: ${ORG.description}
서비스 라인: 구매 전환형 숏폼 기획제작(/shortform), 브랜드 SNS 채널 커뮤니케이션(/sns-brand), 성과 사례(/portfolio)

[포지셔닝 — 이 문장들이 어필 문단의 원본이다. 여기서 벗어난 주장을 지어내지 않는다]
${POSITIONING.identity}
· 숏폼 라인: ${POSITIONING.shortform}
· 브랜드 SNS 라인: ${POSITIONING.brandSns}`;

/** 독자 정의 — 조사·기획·집필 세 호출이 같은 독자를 본다 */
const AUDIENCE_CONTEXT = `[독자]
주 독자: ${AUDIENCE.primary}
부 독자: ${AUDIENCE.secondary}

[독자에게 하지 않을 것]
${AUDIENCE.never.map((n) => `- ${n}`).join("\n")}

[이 층이 실제로 쓰는 말 — 맥락에 맞을 때만 쓴다. 억지로 다 넣지 않는다]
${AUDIENCE.vocabulary.map((v) => `- ${v}`).join("\n")}`;

// ─────────────────────────────────────────────────────────────────────────
// 1단계 — 조사
// ─────────────────────────────────────────────────────────────────────────

export type Research = {
  /** 조사 결과 원문. 그대로 기획 입력이 된다 */
  findings: string;
  /** web_search 를 몇 번 돌렸는지 — 비용 추적용 */
  searchCount: number;
};

/**
 * 조사 패스 — 한 호출에 몰지 않고 셋으로 쪼갠 이유.
 *
 * 처음엔 웹 검색 12회를 한 호출에 몰아넣었다. 그 호출이 9분 동안 연결 하나를
 * 물고 있다가 **ECONNRESET 으로 끊겨** 조사 전체가 날아갔다(2026-08-13 실측).
 * 긴 스트리밍 연결일수록 끊길 확률이 올라가고, 끊기면 검색 12회가 통째로 낭비다.
 *
 * 그래서 짧은 패스 셋으로 나눠 **동시에** 돌린다.
 *  · 한 연결이 3분 안팎으로 짧아져 끊길 확률 자체가 줄고
 *  · 하나가 끊겨도 나머지 둘은 살아남으며
 *  · 전체 소요 시간도 순차 실행보다 짧다
 * 패스별 주제를 갈라 둔 덕에 검색어가 겹치지 않는 부수 효과도 있다.
 */
const RESEARCH_PASSES = [
  {
    key: "change",
    label: "플랫폼·시장 변화",
    brief: `메타·틱톡·유튜브의 **공식 발표와 정책·제품 변경**, 그리고 국내 광고 시장의 구조 변화.

⚠️ **한국어 판을 먼저 찾는다.** 같은 발표라도 about.fb.com/ko, newsroom.tiktok.com/ko-kr,
blog.google/intl/ko-kr 에 한국어 글이 있으면 **반드시 그쪽 URL 을 적는다.** 영문 판은
한국어 판이 없을 때만 쓴다.
국내 매체·기관(한국방송광고진흥공사, 한국온라인광고협회, 국내 미디어렙 리포트)이
같은 변화를 다뤘으면 함께 가져온다.
이 변화가 국내 브랜드의 소재 운영·예산 배분에 무엇을 요구하는지까지 적는다.`,
  },
  {
    key: "numbers",
    label: "공개 통계·지표",
    brief: `출처를 댈 수 있는 **수치**만 모은다. **국내 조사를 우선한다.**

먼저 뒤질 곳(이 목록부터 검색어를 만든다):
${SOURCE_SPEC.region.domesticStatSources.map((s) => `· ${s}`).join("\n")}
· 틱톡 크리에이티브 센터(ads.tiktok.com/business/creativecenter) — **지역을 KR 로 두고** 본다

**기준(기간·지역·대상)이 명시되지 않은 수치는 버린다.**
해외 조사(미국 소비자 대상 서베이, 글로벌 평균)는 국내 독자의 판단 근거가 되지
않으므로 가져오지 않는다. 국내 수치를 못 찾으면 그 항목은 비워 두고 사실대로 적는다.`,
  },
  {
    key: "artifacts",
    label: "재생 가능한 국내 실물",
    brief: `본문에서 **바로 재생하거나 열어 볼 수 있는 국내 자료**를 찾는다.

⚠️ **이 패스가 이 글의 성패를 가른다.** 지금까지 두 번 실패했다 —
08-14 에는 URL 을 하나도 못 건져 원고가 링크 인용만으로 채워졌고,
08-15 검수에서는 건진 것이 **전부 해외 영문 자료**여서 사장님이 "적절하지 않다"고
하셨다. 링크만 있는 글은 독자를 밖으로 내보내고, 해외 사례는 한국 브랜드 대표에게
"번역된 남의 얘기"로 읽힌다.

**국내 실물 URL 을 최소 4건 건져야 한다.** 못 건지면 검색어를 바꿔서라도 다시 찾아라.

🚫 **해외 영상·해외 브랜드 사례는 한 건도 가져오지 않는다.** 없는 것보다 낫지 않다.
   국내에서 못 찾으면 주제를 좁혀서라도 국내에서 찾는다.

찾는 요령 — **검색어를 반드시 한국어로 짓는다.** 영문 검색어를 쓰면 해외 결과만 돌아온다:
${SOURCE_SPEC.region.domesticArtifactRecipe.map((s) => `· ${s}`).join("\n")}

가져올 URL 형태:
· 유튜브 영상·쇼츠 (youtube.com/watch?v= 또는 youtube.com/shorts/) — **채널명·제목이 한글인 것**
· 틱톡 영상 (tiktok.com/@계정/video/숫자) — 국내 계정
· 메타 광고 라이브러리(facebook.com/ads/library) — **국가=대한민국** 으로 필터한 광고의 영구 링크

각 항목마다 **채널명(계정명)과 영상 제목을 한글 그대로** 적는다. 국내 여부를 그걸로 판정한다.
**URL 을 정확히 그대로 적는다.** 축약하거나 기억으로 복원하지 않는다 — 뒤에서 우리가 직접 호출해 검증하므로 틀린 URL 은 전부 탈락한다.`,
  },
] as const;

/** 끊긴 연결·과부하는 다시 걸면 되고, 400·401 은 다시 걸어도 같다 */
function isTransient(error: unknown): boolean {
  const status = (error as { status?: number } | null)?.status;
  if (typeof status === "number") return status === 429 || status >= 500;
  const msg = error instanceof Error ? error.message : String(error);
  return /terminated|ECONNRESET|aborted|socket|timeout|fetch failed|응답이 없어/i.test(
    msg,
  );
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * 패스 하나에 거는 제한 시간.
 *
 * 2026-08-13: 검색 5회짜리 패스 하나가 **43분 동안 응답 없이 매달렸다.**
 * 나머지 두 패스는 진작 끝났는데 allSettled 가 그 하나를 무한정 기다려
 * 전체가 멈췄다. 한 패스를 버리는 건 감당되지만(둘 이상 실패해야 중단),
 * 멈춘 채로 기다리는 건 감당이 안 된다. 시간을 못 박는다.
 *
 * 지금은 `respond()` 가 AbortController 로 연결까지 끊는다. Promise.race 로
 * 버리기만 하면 응답 없는 연결이 뒤에 살아남아 함수가 안 끝나는 일이 있었다.
 */
const PASS_TIMEOUT_MS = 4 * 60 * 1000;

/** 조사 패스 하나. 끊기면 두 번까지 다시 건다 */
async function runResearchPass(
  pass: (typeof RESEARCH_PASSES)[number],
  input: {
    pillarKey: PillarKey;
    formatKey: FormatKey;
    topic: string;
    retryNote?: string | null;
  },
): Promise<{ text: string; searches: number }> {
  const p = pillar(input.pillarKey);
  const f = format(input.formatKey);
  const year = new Date().getFullYear();

  const system = `너는 마케팅 대행사의 리서처다. 글을 쓰기 전에 **실재하는 근거**를 모은다.

${BRAND_CONTEXT}

${AUDIENCE_CONTEXT}

[조사 규칙 — 이 규칙이 이 회사 콘텐츠의 신뢰도를 결정한다]
- **검색해서 확인한 것만 보고한다.** 기억으로 아는 수치나 URL 을 쓰지 않는다.
- 수치에는 **출처명·발행 연도·기준(기간·지역·대상)** 을 함께 적는다. 셋 중 하나라도 못 찾으면 그 수치는 버린다.
- 오래된 자료를 최신인 것처럼 쓰지 않는다. ${year - 1}~${year}년 자료를 우선하고, 그보다 오래됐으면 연도를 분명히 밝힌다.
- "업계 평균", "대부분의 브랜드가" 같은 표현은 출처가 있을 때만 쓴다.

[🇰🇷 국내 규격 — 2026-08-15 사장님 지시. 이 규칙이 앞의 모든 규칙에 우선한다]
- ${SOURCE_SPEC.region.rule}
- 검색어를 **한국어로 짓는다.** 영문 검색어를 쓰면 해외 결과만 돌아오고, 그 결과가
  그대로 원고에 실려 "번역된 남의 얘기"가 된다.
- 해외 자료를 허용하는 유일한 경우: ${SOURCE_SPEC.region.foreignException}
- 국내 자료를 못 찾았으면 **찾은 척하지 말고 "확인하지 못한 것"에 적는다.**
  해외 자료로 자리를 메우지 않는다.

[이번 패스: ${pass.label}]
${pass.brief}

[보고 형식]
발견한 것을 항목별로 정리하되, 각 항목마다 반드시:
  · 무엇을 발견했는가 (한 문장)
  · 출처명 / 발행·조회 연도 / 기준
  · URL (전체 주소)
마지막에 "확인하지 못한 것" 절을 두고, 찾으려 했으나 근거를 못 찾은 항목을 솔직히 적는다.

[유형: ${f.label}] ${f.brief}
이 글은 실물 자료가 최소 ${f.minSources}건 필요하고, 그중 **${f.minEmbeds}건 이상은
본문에서 재생되는 국내 자료**(국내 유튜브·틱톡)여야 한다.
이 패스에서 최소 ${f.minEmbeds + 1}건은 건져야 한다 — 뒤에서 URL 검증으로 일부가 탈락하기 때문이다.`;

  const message = `필러: ${p.label} — ${p.scope}
이번 주제: ${input.topic}
${
  // 되감겨 온 조사다. 같은 검색어를 다시 치면 같은 결과가 나오므로
  // 무엇이 모자랐는지를 알려 준다
  input.retryNote
    ? `\n⚠️ [다시 조사하는 이유] ${input.retryNote}\n앞선 조사와 **다른 검색어**를 써라. 특히 국내 브랜드명·업종명을 한국어로 바꿔 가며 찾는다.\n`
    : ""
}
이 주제로 글을 쓸 것이다. **${pass.label}** 에 해당하는 근거를 검색해서 모아라.`;

  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      // 검색 횟수 상한은 API 인자가 없어 프롬프트로 건다. 실제 지출은
      // 응답에 찍힌 web_search_call 개수로 세므로 새는 곳은 없다
      return await respond({
        model: MODEL_RESEARCH,
        instructions: `${system}\n\n[검색 횟수] 이 패스에서 웹 검색은 최대 5회까지만 쓴다. 그 안에서 가장 값진 것을 찾는다.`,
        message,
        maxOutputTokens: 16000,
        search: true,
        effort: "high",
        timeoutMs: PASS_TIMEOUT_MS,
        label: pass.label,
      });
    } catch (error) {
      lastError = error;
      if (!isTransient(error) || attempt === 3) throw error;
      // 끊긴 직후 바로 다시 걸면 또 끊기는 경우가 많다 — 조금 물러섰다 건다
      await wait(attempt * 3000);
    }
  }
  throw lastError;
}

/**
 * 조사 — 서버 웹 검색으로 **실재하는** 근거를 모은다.
 *
 * 사장님이 소스를 주실 수 없으므로 이 단계가 유일한 사실 공급원이다.
 * 그래서 여기서 나온 URL 이 곧 원고의 뼈대가 된다 — 검색 결과가 부실하면
 * 기획 단계에서 섹션이 줄어들지언정, 없는 것을 지어내게 두지 않는다.
 *
 * 패스 하나가 끝내 실패해도 나머지로 진행한다. 다만 둘 이상 실패하면
 * 근거가 얇아 글이 부실해지므로 거기서 멈춘다.
 */
export async function researchTopic(input: {
  pillarKey: PillarKey;
  formatKey: FormatKey;
  topic: string;
  /** 되감겨 온 경우 무엇이 모자랐는지 — 같은 검색을 반복하지 않게 한다 */
  retryNote?: string | null;
  /** 패스가 끝날 때마다 부른다 — CLI 가 진행 상황을 찍는 용도 */
  onPass?: (label: string, ok: boolean, detail: string) => void;
}): Promise<Research> {
  const results = await Promise.allSettled(
    RESEARCH_PASSES.map(async (pass) => {
      const out = await runResearchPass(pass, input);
      input.onPass?.(
        pass.label,
        true,
        `검색 ${out.searches}회 / ${out.text.length}자`,
      );
      return { pass, ...out };
    }),
  );

  const parts: string[] = [];
  let searchCount = 0;
  let failed = 0;
  const reasons: string[] = [];

  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      parts.push(`## [조사: ${result.value.pass.label}]\n\n${result.value.text}`);
      searchCount += result.value.searches;
    } else {
      failed += 1;
      const reason =
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason);
      reasons.push(`${RESEARCH_PASSES[i].label}: ${reason}`);
      input.onPass?.(RESEARCH_PASSES[i].label, false, reason);
    }
  });

  if (failed >= 2) {
    // 실패 사유를 반드시 붙인다. 서버에서 돌 때는 콘솔을 못 보므로
    // 이 문자열이 유일한 단서가 된다 — 2026-08-14 에 사유 없이 실패해
    // 원인을 찾는 데 시간을 버렸다
    throw new Error(
      `조사 패스 ${failed}개 실패 — 근거가 얇아 글이 부실해집니다. ` +
        reasons.join(" / ").slice(0, 500),
    );
  }

  const findings = parts.join("\n\n").trim();
  if (findings.length < 300) {
    throw new Error(
      "조사 결과가 너무 짧습니다. 검색이 제대로 돌지 않았을 수 있습니다.",
    );
  }

  return { findings, searchCount };
}

// ─────────────────────────────────────────────────────────────────────────
// 2단계 — 기획
// ─────────────────────────────────────────────────────────────────────────

export type BlogPlan = {
  title: string;
  slug: string;
  /** 훅 한 문장. 유형의 hook 강도에 맞춰 세기가 달라진다 */
  lead: string;
  head_keyword: string;
  sub_keywords: string[];
  sections: {
    heading: string;
    intent: string;
    /** AEO — 이 섹션 첫머리에 들어갈 직답 */
    answer: string;
    table: { caption: string; columns: string[] } | null;
    /** 이 섹션에 붙일 자료. sources 배열의 인덱스(0부터) */
    source_refs: number[];
    /** 이 섹션의 핵심 포인트 강조 박스 (2026-08-15 신설) */
    key_point: { title: string; items: string[] };
  }[];
  /** 실행 블록 — "뭘 어떻게 하라는 건지" 에 답하는 자리 (2026-08-15 신설) */
  actions: { title: string; steps: string[]; handoff: string };
  /** 조사에서 건진 자료 후보. 검증을 거쳐야 원고에 들어간다 */
  sources: SourceCandidate[];
  faq: string[];
  next_teaser: string;
  thumbnail_prompt: string;
};

const SOURCE_KINDS = Object.keys(SOURCE_SPEC.kinds);

const PLAN_SCHEMA = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description:
        "제목. 주 검색어를 앞쪽에 둔다. '~란?' 정의형 제목은 쓰지 않는다 — 독자는 이미 안다. 문제·판단·변화를 담은 제목으로 잡는다",
    },
    slug: {
      type: "string",
      description:
        "영문 케밥케이스 + 연도로 끝나는 슬러그. 예: meta-cpm-surge-response-2026. 한글·대문자·언더스코어 금지",
    },
    lead: {
      type: "string",
      description:
        "글을 여는 한 문장. 유형별 훅 강도 지시를 따른다. 인사말·배경 설명 금지",
    },
    head_keyword: { type: "string", description: "노리는 주 검색어 하나" },
    sub_keywords: {
      type: "array",
      description: "본문에 자연스럽게 깔 연관 검색어 5~8개",
      items: { type: "string" },
    },
    sections: {
      type: "array",
      description:
        "본론 H2 섹션. 전부 질문형 제목이어야 한다. **개수는 지시문 [1] 에 적힌 범위를 지킨다** — 그 범위를 넘기면 원고가 발행 검사에서 통째로 걸린다. 목차·자주 묻는 질문·맺으며는 여기 넣지 않는다",
      items: {
        type: "object",
        properties: {
          heading: {
            type: "string",
            description:
              "질문형 H2. 결정권자가 실제로 검색창에 칠 법한 질문. 예: '메타 CPM이 오를 때 소재 예산을 어떻게 조정해야 하나요?'",
          },
          intent: {
            type: "string",
            description: "이 섹션이 독자에게 남겨야 할 결론 한 줄",
          },
          answer: {
            type: "string",
            description: `AEO 직답. H2 바로 아래에 들어간다. ${AEO_SPEC.answerBlock.minChars}~${AEO_SPEC.answerBlock.maxChars}자. AI 답변 엔진이 이 단위를 통째로 인용하므로 그 자체로 완결되어야 한다. 수치가 들어가면 같은 문장 안에 출처와 연도를 넣는다`,
          },
          table: {
            type: ["object", "null"],
            description: "이 섹션에 넣을 비교표 설계. 표가 없는 섹션이면 null",
            properties: {
              caption: { type: "string" },
              columns: {
                type: "array",
                description: "표의 열 제목 2~4개",
                items: { type: "string" },
              },
            },
            required: ["caption", "columns"],
            additionalProperties: false,
          },
          source_refs: {
            type: "array",
            description:
              "이 섹션에 붙일 자료의 인덱스(sources 배열 기준, 0부터). 모든 섹션에 최소 1개는 있어야 한다",
            items: { type: "integer" },
          },
          key_point: {
            type: "object",
            description:
              "이 섹션의 핵심 포인트 강조 박스(:::point). 줄글 사이에서 결론이 눈에 안 잡혀 안 읽힌다는 지적으로 신설했다. 앞 문단 요약이 아니라 **판단 기준**으로 적는다",
            properties: {
              title: {
                type: "string",
                description:
                  "결론 한 줄. 이 섹션에서 독자가 딱 하나 가져갈 것",
              },
              items: {
                type: "array",
                description: `판단 기준 ${VISUAL_SPEC.point.minItems}~${VISUAL_SPEC.point.maxItems}개. 각 항목은 한 줄`,
                items: { type: "string" },
              },
            },
            required: ["title", "items"],
            additionalProperties: false,
          },
        },
        required: [
          "heading",
          "intent",
          "answer",
          "table",
          "source_refs",
          "key_point",
        ],
        additionalProperties: false,
      },
    },
    actions: {
      type: "object",
      description:
        "실행 블록(:::do). '뭘 어떻게 하라는 건지 대안과 실제 방법이 안 나온다'는 지적으로 신설했다. 이 업종 담당자가 **이번 주 안에 직접 할 수 있는 것**만 적는다",
      properties: {
        title: {
          type: "string",
          description: "블록 제목 한 줄. 예: '이번 주에 확인할 것'",
        },
        steps: {
          type: "array",
          description: `실행 단계 ${VISUAL_SPEC.action.minItems}~${VISUAL_SPEC.action.maxItems}개. 각 항목에 **무엇을 · 어디서 · 무엇을 기준으로 판단** 이 다 들어가야 한다. '전략을 점검한다' 같은 추상 항목은 쓰지 않는다`,
          items: { type: "string" },
        },
        handoff: {
          type: "string",
          description:
            "실행 단계 중 브랜드가 자체 인력으로 하기 **어려운 것 하나**를 짚는 한 문장. 이 문장이 문의로 넘어가는 다리가 된다. 광고 문구를 쓰지 않는다",
        },
      },
      required: ["title", "steps", "handoff"],
      additionalProperties: false,
    },
    sources: {
      type: "array",
      description:
        "조사에서 확인한 실물 자료. **조사 보고에 URL 이 나온 것만 적는다. 하나라도 지어내면 검증에서 전부 탈락한다**",
      items: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            enum: SOURCE_KINDS,
            description:
              "youtube=유튜브 영상/쇼츠, tiktok=틱톡 영상, instagram=인스타 게시물, trends=구글 트렌드, creativecenter=틱톡 크리에이티브 센터, adlibrary=메타 광고 라이브러리, stat=공개 통계·리포트·플랫폼 공식 발표, owned=해그로시 자체 채널",
          },
          url: { type: "string", description: "전체 URL. 축약하지 않는다" },
          title: { type: "string", description: "출처명 또는 자료 제목" },
          author: {
            type: "string",
            description: "발행 기관·채널·계정명. 모르면 빈 문자열",
          },
          year: { type: "string", description: "발행 또는 조회 연도. 네 자리" },
          basis: {
            type: "string",
            description:
              "기준 — 기간·지역·대상. 예: '2026년 상반기, 한국, 만 20~49세'. 이것이 비면 검증에서 탈락한다",
          },
        },
        required: ["kind", "url", "title", "author", "year", "basis"],
        additionalProperties: false,
      },
    },
    faq: {
      type: "array",
      description:
        "자주 묻는 질문 4개. 본문에서 이미 답한 것을 반복하지 않는다. 결정권자가 실제로 던지는 질문으로 잡는다",
      items: { type: "string" },
    },
    next_teaser: {
      type: "string",
      description: "다음 편에서 다룰 주제 예고 한 문장",
    },
    thumbnail_prompt: {
      type: "string",
      description:
        "썸네일 이미지 생성 프롬프트. 영어로 쓰고, 이미지 안에 들어갈 글자는 요구하지 않는다",
    },
  },
  required: [
    "title",
    "slug",
    "lead",
    "head_keyword",
    "sub_keywords",
    "sections",
    "actions",
    "sources",
    "faq",
    "next_teaser",
    "thumbnail_prompt",
  ],
  additionalProperties: false,
} as const;

/**
 * 편집 원칙 — 기획·집필 두 호출이 같은 문서를 본다.
 * 벤치마크(BAT 4편)에서 관찰한 것과 사장님 지시만 규칙으로 옮겼다.
 */
function editorialRules(formatKey: FormatKey, segmentKey?: SegmentKey | null): string {
  const f = format(formatKey);
  const seg = segmentKey ? segment(segmentKey) : null;

  /**
   * 검사식 산수를 프롬프트에 그대로 옮긴다. (2026-08-14)
   *
   * 08-14 첫 OpenAI 원고가 규격 미달로 걸렸는데, 원인은 모델이 아니라
   * **지시문과 검사식이 서로 다른 말을 하고 있던 것**이었다.
   *
   * 2026-08-15: 여기 있던 `sectionMax = maxVisuals - minTables` 계산을 뺐다.
   * 링크 인용까지 시각물로 세던 시절의 산수라, **링크가 늘수록 섹션을
   * 줄이라는** 뜻이 되어 임베드가 들어갈 자리를 우리 손으로 없애고 있었다.
   * 이제 시각물은 임베드 + 표이고, 섹션 수와는 별개로 센다.
   */
  const sectionMax = f.maxH2;
  const sectionMin = f.minH2;

  const hookRule = {
    strong:
      "**훅을 세게 연다.** '지금 바뀌고 있다', '이걸 안 바꾸면 뒤처진다' 계열. 단 변화가 실재해야 하고 본문이 그 근거를 대야 한다. 근거 없이 위기감만 조성하면 신뢰가 깎인다.",
    medium:
      "**통념을 뒤집는 한 문장으로 연다.** 독자가 당연하게 여기던 것이 왜 지금은 안 통하는지. 본문 전체가 그 문장의 근거다.",
    calm: "**판단 기준을 담담히 제시하며 연다.** 위기감 조성 금지. 이 유형은 검색으로 들어온 사람이 끝까지 읽고 남기는 것이 목적이다.",
  }[f.hook];

  return `[문단 흐름 — 이 순서와 역할을 지킨다. 자리마다 할 일이 다르다]
${FLOW.map((f) => `  ${f.no}. ${f.role} — ${f.job}`).join("\n")}

⚠️ **질문형 H2 를 달았으면 그 아래 첫 문장이 그 질문에 직접 답해야 한다.**
   "무엇이 차이를 만드나?" 라고 물었으면 차이를 만드는 것이 무엇인지로 답한다.
   배경 설명("~가 표준이 됐기 때문입니다")으로 답하면 질문과 어긋난다.
   같은 문장을 두 번 반복하지 않는다.

⚠️⚠️ **아래 여덟 항목은 검사식이 기계적으로 센다. 하나라도 벗어나면 발행되지 않는다.**
   사람이 검수하지 않으므로 여기서 걸리면 그날 글은 그냥 안 나간다.

[1] 본론 H2 **${sectionMin}~${sectionMax}개**
  목차·자주 묻는 질문·맺으며는 여기서 세지 않는다. 그 사이의 본론만이다.
  적게 쓰라는 뜻이 아니라 **적은 수로 깊게** 쓰라는 뜻이다.

[2] 본문 **${f.minChars}~${f.maxChars}자** — 넘겨도 미달이다
  마크다운 기호·표 구분선·URL 을 뺀 순수 글자 수다.
  섹션이 ${sectionMax}개면 한 섹션이 대략 ${Math.round(f.maxChars / (sectionMax + 1))}자다.

[3] 문단마다 최소 ${STRUCTURE.minCharsPerSection}자
  블록 수를 줄인 만큼 **각 문단을 깊게** 쓴다. 얕은 문단 일곱 개보다 두꺼운 문단 넷이 낫다.

[4] 🎬 **본문에서 재생되는 자료 ${f.minEmbeds}건 이상** — 이번 개정의 핵심이다
  자료 목록에서 \`[🎬 본문에서 재생됨]\` 이 붙은 것만 여기 센다.
  \`[🔗 링크 인용만]\` 은 **아무리 많아도 0건으로 친다.** 화면에 아무것도 안 보이기 때문이다.
  링크 인용은 ${STRUCTURE.maxLinkOnlyCitations}건까지만 쓴다 — 각주가 본문을 덮으면 안 된다.
  시각 자료 총량(재생 + 표)은 ${STRUCTURE.minVisuals}~${STRUCTURE.maxVisuals}개다. 표는 ${f.minTables}개 이상.
${STRUCTURE.visualCaption}

[5] 🇰🇷 **인용하는 자료는 국내 것이어야 한다**
  · 재생되는 자료(영상·게시물)는 **100% 국내**. 해외 영상이 한 건이라도 있으면 발행되지 않는다.
  · 전체 인용 자료의 ${Math.round(SOURCE_SPEC.region.minDomesticRatio * 100)}% 이상이 국내여야 한다.
  · 해외 예외: ${SOURCE_SPEC.region.foreignException}
  자료 목록에 \`[국내]\` / \`[해외]\` 가 표시돼 있다. 그걸 보고 고른다.

[6] 💡 **핵심 포인트 박스 ${f.minPoints}개** — 사장님 지적: "핵심이 강조가 안 되니 안 읽힌다"
  본론 섹션마다 **최대 1개**, 그 섹션에서 독자가 딱 하나 가져갈 것을 이 모양으로 세운다:
${VISUAL_SPEC.point.syntax
  .split("\n")
  .map((l) => `    ${l}`)
  .join("\n")}
  ${VISUAL_SPEC.point.rule}
  항목은 ${VISUAL_SPEC.point.minItems}~${VISUAL_SPEC.point.maxItems}개. 앞 문단을 그대로 베끼지 않는다.

[7] ✅ **실행 블록 ${VISUAL_SPEC.action.count}개** — 사장님 지적: "뭘 어떻게 하라는 건지 안 나온다"
  ${VISUAL_SPEC.action.place} 에 정확히 한 번 둔다:
${VISUAL_SPEC.action.syntax
  .split("\n")
  .map((l) => `    ${l}`)
  .join("\n")}
  ${VISUAL_SPEC.action.rule}
  항목은 ${VISUAL_SPEC.action.minItems}~${VISUAL_SPEC.action.maxItems}개.
  ⚠️ **이 블록 바로 다음 문단이 문의로 넘어가는 유일한 다리다.**
  ${CONVERSION.handoff.shape}
  금지: ${CONVERSION.handoff.ban}

[8] **굵게 강조 ${VISUAL_SPEC.bold.min}~${VISUAL_SPEC.bold.max}곳**
  ${VISUAL_SPEC.bold.rule}
  선택지·조건·순서는 줄글 대신 \`- \` 목록이나 \`1. \` 목록으로 쓴다. ${VISUAL_SPEC.list.rule}

[첫 세 문장 — 이 글에서 가장 중요하다]
구조는 **${WRITING_RULES.lead.shape}** 로 고정한다.
  예: "${WRITING_RULES.lead.example}"
독자가 지금 겪고 있는 장면을 먼저 꺼내고, 공감을 받고, 그 다음 뒤집는다.
다음은 쓰지 않는다:
${WRITING_RULES.lead.banned.map((b) => `  - ${b}`).join("\n")}

[한 편 = 한 주제]
${WRITING_RULES.onePerPost}

[H2 는 담당자가 소리 내어 물을 문장으로]
이렇게 쓴다:
${WRITING_RULES.headings.good.map((g) => `  ○ ${g}`).join("\n")}
이렇게 쓰지 않는다:
${WRITING_RULES.headings.bad.map((b) => `  ✗ ${b}`).join("\n")}

[독자 화면에 내부 어휘를 쓰지 않는다]
다음 표현은 본문에 등장하면 안 된다 — 우리가 규격을 관리하려고 만든 말이라
독자는 무슨 뜻인지 모른다: ${WRITING_RULES.bannedWords.join(", ")}

[톤]
${WRITING_RULES.tone}

[글의 골격]
- ${hookRule}
- 본론 H2 는 위 [1] 의 ${sectionMin}~${sectionMax}개이고 **전부 질문형**이다. 결정권자가 실제로 검색창에 칠 질문이어야 한다.
- **H2 바로 아래에 직답 블록**을 둔다(${AEO_SPEC.answerBlock.minChars}~${AEO_SPEC.answerBlock.maxChars}자). AI 답변 엔진이 이 단위를 인용한다. ${AEO_SPEC.requireSourceInAnswer}
  ⚠️ 이 자릿수도 검사식이 센다. 짧아도 길어도 걸린다.
- 비교표 ${f.minTables}개. 열 제목은 '구분 | A | B', '단계 | 핵심 과제 | 판단 기준' 처럼 **판단에 쓰이는 축**으로 잡는다.
- FAQ ${BLOG_SPEC.faqCount}문항 → "맺으며" → 다음 편 예고 순으로 닫는다.

[읽는 맛 — 사장님 지시: 산뜻하게, 스낵 콘텐츠처럼]
- **한 문단은 ${BLOG_SPEC.maxParagraphChars}자를 넘기지 않는다.** 길면 끊는다. 이게 1차 원고가 무겁게 읽힌 원인이었다.
- 소제목으로 계속 끊어 준다. 길어도 빠르게 읽혀야 한다.
- 존댓말. 단정적이고 직설적으로 쓰되 과장하지 않는다.

[숫자와 사실 — 가장 중요]
- **조사에서 확인된 자료에 있는 수치만 쓴다.** 그 외의 수치는 한 개도 쓰지 않는다.
- 수치를 쓸 때는 같은 문단 안에 출처·연도·기준을 밝힌다.
- 자사 성과를 숫자로 자랑하지 않는다. 사례가 필요하면 /portfolio 로 링크만 건다.
- 경쟁사·특정 브랜드를 깎아내리지 않는다.

[유형: ${f.label}]
${f.brief}

${
  seg
    ? `[이 글이 정조준하는 업종: ${seg.label}]
같은 검색어라도 어느 업종 담당자가 치느냐에 따라 병목이 다르다. 이 글은 그 업종의
사람이 읽는다고 가정하고 쓴다 — 사례도 예시도 그 업종에서 고른다.

  이 업종의 병목: ${seg.bottleneck}
  이 사람이 실제로 묻는 것: ${seg.question}

**본문 어딘가에서 이 병목을 정면으로 다룬다.** 일반론만 쓰면 어느 업종 사람이
읽어도 자기 얘기가 아니게 되고, 그러면 문의로 이어지지 않는다.`
    : ""
}

[제목 — 검색 결과에서 클릭을 만드는 자리]
${HOOKING.title.shape}
이렇게 쓴다:
${HOOKING.title.good.map((g) => `  ○ ${g}`).join("\n")}
이렇게 쓰지 않는다:
${HOOKING.title.bad.map((b) => `  ✗ ${b}`).join("\n")}

[목차·H2 — 브랜드 사람이 실제로 쓰는 말로]
${HOOKING.toc.good.map((g) => `  ○ ${g}`).join("\n")}
${HOOKING.toc.bad.map((b) => `  ✗ ${b}`).join("\n")}

[⚠️ 모호어 — 뒤에 '무엇이' 가 안 붙으면 쓰지 않는다]
${HOOKING.vague.join(" · ")}
"반응이 좋았다" 가 아니라 "저장 수가 3배가 됐다", "성과가 났다" 가 아니라
"장바구니 담기가 늘었다" 로 쓴다. 숫자가 없으면 **무엇이 어떻게 달라졌는지**라도 적는다.

[전환 — 이 글의 목적은 조회수가 아니라 문의다]
· 본문 중간(${CONVERSION.inline.after}): ${CONVERSION.inline.shape}
  금지: ${CONVERSION.inline.ban}
· **${CONVERSION.handoff.where}**: ${CONVERSION.handoff.shape}
  ← 독자가 "이건 우리가 직접 하긴 어렵겠는데" 라고 느끼는 순간이 정확히 이 자리다.
    여기가 비어 있으면 글이 아무리 좋아도 문의로 안 넘어간다.
· 맺으며 직전: ${CONVERSION.closing.shape}
· 독자는 준비된 정도가 다르다. 세 갈래를 남긴다 —
${CONVERSION.ladder.map((l) => `  · ${l}`).join("\n")}`;
}

/** 2단계 — 기획. 조사 결과를 구성안과 자료 목록으로 바꾼다 */
export async function planPost(input: {
  pillarKey: PillarKey;
  formatKey: FormatKey;
  segmentKey?: SegmentKey | null;
  topic: string;
  research: Research;
  publishedTitles?: string[];
  /** 검증에서 되감겨 온 경우 무엇이 모자랐는지 */
  retryNote?: string | null;
}): Promise<BlogPlan> {
  const p = pillar(input.pillarKey);
  const f = format(input.formatKey);

  const published = input.publishedTitles?.length
    ? `\n\n[이미 발행한 글 — 주제가 겹치면 각도를 바꾼다]\n${input.publishedTitles.map((t) => `- ${t}`).join("\n")}`
    : "";

  const { text } = await respond({
    model: MODEL_PLAN,
    maxOutputTokens: 16000,
    effort: "high",
    timeoutMs: 4 * 60 * 1000,
    label: "기획",
    schema: { name: "blog_plan", schema: PLAN_SCHEMA },
    instructions: `너는 마케팅 대행사의 콘텐츠 에디터다. 조사 결과를 받아 구성안을 짠다.

${BRAND_CONTEXT}

${AUDIENCE_CONTEXT}

${editorialRules(input.formatKey, input.segmentKey)}

[자료 규격 — 이 규칙을 어기면 발행 검사에서 전부 걸러진다]
- sources 배열에는 **조사 보고에 URL 이 실제로 나온 것만** 넣는다. 기억이나 추측으로 URL 을 만들지 않는다.
- 각 자료마다 출처명·연도·기준(${SOURCE_SPEC.citation.join(" / ")})을 채운다. 하나라도 비면 그 자료는 탈락한다.
- **모든 H2 섹션에 자료를 최소 ${SOURCE_SPEC.minPerSection}개** 붙인다(source_refs).
  재생되는 자료가 있는 섹션은 그것을 우선 배치한다.
- sources 배열 자체는 ${f.minSources + 3}건 이상 **넉넉히** 담는다. 검증에서 탈락하는 것이
  나오기 때문이다. 넉넉히 담는 것과 본문에 많이 인용하는 것은 다른 이야기다.
- ⚠️ **재생 가능한 자료(youtube·tiktok)를 최소 ${f.minEmbeds + 1}건 반드시 포함한다.**
  조사 보고에 그런 URL 이 있으면 무조건 넣어라. 재생되는 자료가 ${f.minEmbeds}건에
  못 미치면 발행 검사에서 걸린다 — 링크 인용만으로 채운 원고는 통과하지 못한다.
- 🇰🇷 **${SOURCE_SPEC.region.rule}**
  youtube·tiktok 자료는 **채널명(author)과 제목(title)을 한글 그대로** 적는다.
  검증기가 그 값으로 국내 여부를 판정한다. 해외 영상이 한 건이라도 인용되면 발행되지 않는다.
  해외 예외: ${SOURCE_SPEC.region.foreignException}
- ${SOURCE_SPEC.personRule}

[핵심 포인트와 실행 블록 — 2026-08-15 신설. 이번 개정의 목적이다]
- 섹션마다 \`key_point\` 를 채운다. 그 섹션의 결론을 줄글에서 꺼내 눈에 띄게 세우는 자리다.
  ${VISUAL_SPEC.point.rule}
- \`actions\` 를 채운다. ${VISUAL_SPEC.action.rule}
  \`actions.handoff\` 는 그 단계 중 브랜드가 자체 인력으로 하기 어려운 것을 짚는 문장이다.
  이 한 문장이 글에서 문의로 넘어가는 유일한 다리다.`,
    message: `필러: ${p.label} — ${p.scope}
유형: ${f.label} (훅 강도: ${f.hook})
이번 주제: ${input.topic}${published}${
      input.retryNote
        ? `\n\n⚠️ [앞선 구성안이 자료 검증에서 걸린 이유] ${input.retryNote}\n같은 자료를 다시 고르지 말고, 조사 결과에서 **국내 · 재생 가능한** 것을 우선 골라라.`
        : ""
    }

[조사 결과 — 이 안에 있는 사실과 URL 만 쓸 수 있다]
${input.research.findings}

이 조사 결과를 근거로 구성안을 짜라.`,
  });

  return JSON.parse(text) as BlogPlan;
}

// ─────────────────────────────────────────────────────────────────────────
// 3단계 — 집필
// ─────────────────────────────────────────────────────────────────────────

export type BlogDraft = {
  plan: BlogPlan;
  /** 마크다운 본문. 프론트매터 없이 리드 문단부터 시작한다 */
  body: string;
  /** 검증을 통과해 본문에 실제로 인용된 자료 */
  sources: Source[];
  chars: number;
  readMinutes: number;
};

/** 3단계 — 본문. 검증된 자료만 손에 쥐고 쓴다 */
export async function writePost(input: {
  plan: BlogPlan;
  sources: Source[];
  pillarKey: PillarKey;
  formatKey: FormatKey;
  segmentKey?: SegmentKey | null;
  /**
   * 앞 원고가 검사식에서 걸린 항목. (2026-08-16)
   *
   * 교정(패치)으로 두 번 고쳐도 안 되면 통째로 다시 쓴다. 그때 이걸 안 주면
   * 같은 구성안으로 같은 실수를 다시 한다 — 되돌린다는 말만 있고 되돌리는
   * 정보가 없는 셈이다.
   */
  fixNote?: string | null;
}): Promise<BlogDraft> {
  const { plan, sources } = input;
  const p = pillar(input.pillarKey);
  const f = format(input.formatKey);

  const outline = plan.sections
    .map((s, i) => {
      const table = s.table
        ? `\n   표: ${s.table.caption} (열: ${s.table.columns.join(" | ")})`
        : "";
      // 핵심 포인트 박스는 기획 단계에서 이미 정해져 있다. 집필이 새로
      // 지어내면 섹션 결론과 어긋난다 — 여기서 그대로 넘긴다
      const point = s.key_point
        ? `\n   핵심 포인트 박스: ${s.key_point.title}\n     ${(s.key_point.items ?? []).join("\n     ")}`
        : "";
      return `${i + 1}. ${s.heading}\n   직답: ${s.answer}\n   결론: ${s.intent}${table}${point}`;
    })
    .join("\n");

  const actions = plan.actions
    ? `\n[실행 블록 — ${VISUAL_SPEC.action.place} 에 이 내용으로 넣는다]\n` +
      `제목: ${plan.actions.title}\n` +
      plan.actions.steps.map((s, i) => `  ${i + 1}. ${s}`).join("\n") +
      `\n블록 다음 문단에서 이어 갈 것: ${plan.actions.handoff}`
    : "";

  const { text: body } = await respond({
    model: MODEL_WRITE,
    maxOutputTokens: 32000,
    effort: "high",
    timeoutMs: 4.3 * 60 * 1000,
    label: "집필",
    instructions: `너는 마케팅 대행사의 콘텐츠 에디터다. 확정된 구성안과 **검증된 자료**로 본문을 쓴다.

${BRAND_CONTEXT}

${AUDIENCE_CONTEXT}

${editorialRules(input.formatKey, input.segmentKey)}

[자료 사용 — 이 글의 신뢰도가 여기서 갈린다]
- 아래 자료 목록에 있는 것만 인용한다. **목록에 없는 URL·수치·출처를 만들어내지 않는다.**
- 자료를 인용한 자리마다 지시자를 한 줄로 넣는다:
  \`:::source N\`  (N 은 자료 번호)
  페이지가 이 자리에 임베드 또는 출처 카드를 렌더링한다. 지시자는 문단과 문단 사이 **독립된 줄**에 둔다.
- \`[🎬 본문에서 재생됨]\` 자료는 영상이 그 자리에서 재생된다. **이걸 ${f.minEmbeds}건 이상 반드시 인용한다.**
  앞뒤 문장을 "무엇을 보라는 것인지" 알 수 있게 쓰고, 앞에 H3 소제목을 단다.
- \`[🔗 링크 인용만]\` 자료는 화면에 아무것도 안 보인다. 시각물로 세지 않으므로
  ${STRUCTURE.maxLinkOnlyCitations}건까지만 쓴다. 문장 안에서 출처명과 연도를 밝히고 지시자를 붙인다.
- \`[해외]\` 표시가 붙은 자료는 **재생되는 자리에 절대 쓰지 않는다.** 플랫폼 공식 발표를
  근거로 댈 때만 링크로 인용한다.

[강조 박스 — 2026-08-15 신설. 이 두 가지가 이번 원고의 합격선이다]
- 구성안이 준 \`핵심 포인트 박스\` 를 해당 섹션 안에 이 모양 그대로 넣는다(총 ${f.minPoints}개 이상):
${VISUAL_SPEC.point.syntax
  .split("\n")
  .map((l) => `    ${l}`)
  .join("\n")}
  본문 문단이 끝난 뒤, 다음 H2 앞에 둔다. 내용은 구성안 것을 쓰되 문맥에 맞게 다듬는다.
- 구성안이 준 \`실행 블록\` 을 ${VISUAL_SPEC.action.place} 에 정확히 한 번 넣는다:
${VISUAL_SPEC.action.syntax
  .split("\n")
  .map((l) => `    ${l}`)
  .join("\n")}
- ⚠️ 실행 블록 **바로 다음 문단**에 구성안의 "블록 다음 문단에서 이어 갈 것" 을 풀어 쓰고,
  그 문단 안에 \`[해그로시 숏폼 스튜디오](/shortform)\` 또는 \`[브랜드 SNS 채널](/sns-brand)\`
  링크를 건다. 이 문단이 없으면 발행되지 않는다.
- 여는 줄과 닫는 \`:::\` 은 각각 **독립된 줄**이어야 한다. 박스 안에는 목록만 넣는다.

[해그로시 어필 — 사장님 지시: 마지막 줄이나 중간중간]
- 본문 중간에 최대 ${POSITIONING.placement.maxInline}회. ${POSITIONING.placement.preferAfterH2.join("번째, ")}번째 H2 뒤가 자연스럽다.
- 광고 문구가 아니라 **글의 논지가 끝나는 자리에서 이어지는 한 문단**이어야 한다.
- "맺으며" 직전에 한 번 더. 이번 필러에 맞는 주장은 이것이다:
  ${pitchFor(input.pillarKey)}
  이 내용을 그대로 베끼지 말고 글의 문맥에 맞게 풀어 쓴다. 없는 기능·성과를 덧붙이지 않는다.

[출력 형식 — 이 규칙을 어기면 발행 검사에서 걸러진다]
- **순수 마크다운만 출력한다. HTML 태그를 쓰지 않는다.** <h2>, <div>, <a>, <iframe> 전부 금지다.
  섹션 제목은 반드시 \`## \` 로 시작하는 마크다운 H2 여야 한다.
- 제목(H1)·프론트매터·설명·인사말은 쓰지 않는다. 첫 줄이 곧 리드 문단이다.
- "## 목차" 는 순서 있는 목록으로 제목만 나열한다. **앵커 링크를 걸지 않는다** — 링크는 페이지가 자동으로 붙인다.
- H2 바로 다음 줄에 직답 문단을 둔다. 굵은 글씨나 인용부호로 감싸지 않는다.
- 표는 마크다운 표로 쓴다. **이미지를 직접 넣지 않는다** — 시각 요소는 \`:::source N\`·\`:::point\`·\`:::do\`·표뿐이다.
- 선택지·조건·순서는 \`- \` 불릿이나 \`1. \` 번호 목록으로 쓴다. 목록도 정상 렌더된다.
  (2026-08-14 까지는 렌더러에 불릿이 없어 문단으로 나왔다. 이제 고쳤으니 써도 된다.)
- FAQ 질문은 \`### \` H3 로 쓴다. 검색엔진이 FAQ 로 인식하는 건 H3 다.
- 마지막은 "## 자주 묻는 질문" → "## 맺으며"(다음 편 예고 포함) 순서로 닫는다. CTA 버튼은 페이지가 붙이므로 본문에 쓰지 않는다.

[내부 링크 — ${BLOG_SPEC.minInternalLinks}개 이상, 필수]
**반드시 아래 세 개를 각각 최소 한 번씩, 서로 다른 섹션에 건다.** 도메인을 붙이지 않은
상대 경로 그대로 쓴다 — 도메인이 바뀌어도 링크가 깨지지 않아야 한다.
- 숏폼 기획·제작을 언급하는 섹션 → [해그로시 숏폼 스튜디오](/shortform)
- 브랜드 채널 운영·커뮤니케이션을 언급하는 섹션 → [브랜드 SNS 채널](/sns-brand)
- 실제 사례가 궁금해질 지점 → [성과 사례](/portfolio)
문장 안에 자연스럽게 녹인다. 목차 항목이나 출처 URL 은 내부 링크로 치지 않는다.`,
    message: `제목: ${plan.title}
필러: ${p.label}
유형: ${f.label} (훅 강도: ${f.hook})
주 키워드: ${plan.head_keyword}
연관 키워드: ${plan.sub_keywords.join(", ")}

리드 첫 문장(이 문장으로 시작한다):
${plan.lead}

구성안:
${outline}
${actions}

[검증을 통과한 자료 — 이것만 인용할 수 있다]
${sourceBriefing(sources)}

자주 묻는 질문 ${BLOG_SPEC.faqCount}문항:
${plan.faq.map((q, i) => `${i + 1}. ${q}`).join("\n")}

다음 편 예고: ${plan.next_teaser}
${
  input.fixNote
    ? `
[⚠️ 다시 쓰는 이유 — 앞 원고가 발행 검사에서 막혔다]
${input.fixNote}
이번 원고는 위 항목을 반드시 해소한 상태로 나와야 한다. 나머지 규격도 그대로 지킨다.
`
    : ""
}
이 구성안대로 본문 전체를 써라.`,
  });

  const chars = countChars(body);

  return { plan, body, sources, chars, readMinutes: readingTime(chars) };
}

// ─────────────────────────────────────────────────────────────────────────
// 4단계 — 교정
// ─────────────────────────────────────────────────────────────────────────

/**
 * 규격 미달 원고를 고쳐 온다. (2026-08-14 — 완전 자동화의 핵심)
 *
 * 사람이 검수하던 자리를 무엇으로 대신하느냐가 이 개편의 전부다. 답은
 * "사람 대신 모델이 본다" 가 아니라 **"검사식이 본다"** 이다.
 * `blog-audit.ts` 는 분량·질문형 H2·직답 블록·표·자료 인용·내부 링크·금지어를
 * 기계적으로 센다. 사람의 눈보다 이쪽이 일관되다.
 *
 * 이 함수는 그 검사식이 뱉은 실패 항목만 손에 쥐고 본문을 다시 쓴다.
 * 통과할 때까지 두 번 돈다. 그래도 안 되면 **발행하지 않는다** — 자동화의
 * 목적은 매주 세 편을 채우는 게 아니라, 사장님이 안 보셔도 되는 품질을
 * 유지하는 것이다. 미달 원고를 내보내면 그 목적이 무너진다.
 */
export async function revisePost(input: {
  body: string;
  failures: string[];
  sources: Source[];
  plan: BlogPlan;
  formatKey: FormatKey;
  segmentKey?: SegmentKey | null;
}): Promise<string> {
  const f = format(input.formatKey);

  const { text } = await respond({
    model: MODEL_WRITE,
    maxOutputTokens: 32000,
    effort: "high",
    timeoutMs: 4.3 * 60 * 1000,
    label: "교정",
    instructions: `너는 마케팅 대행사의 콘텐츠 에디터다. 발행 검사에서 걸린 원고를 고친다.

${BRAND_CONTEXT}

${AUDIENCE_CONTEXT}

${editorialRules(input.formatKey, input.segmentKey)}

[교정 규칙 — 이게 전부다]
- **지적된 항목만 고친다.** 통과한 부분의 문장을 취향으로 손보지 않는다.
- 분량이 모자라면 문단을 새로 늘리지 말고 **기존 문단을 깊게** 쓴다.
  근거 없는 문장으로 자릿수만 채우면 다음 검사에서 다른 항목이 깨진다.
- 자료·수치는 아래 목록 밖에서 단 하나도 새로 만들지 않는다.
- 출력은 **고친 본문 전체**다. 설명·머리말·변경 요약을 붙이지 않는다.
  첫 줄이 곧 리드 문단이다.
- 마크다운만 쓴다. HTML 태그 금지.

[유형: ${f.label}] ${f.brief}`,
    message: `[발행 검사에서 걸린 항목 — 이것만 고친다]
${input.failures.map((x, i) => `${i + 1}. ${x}`).join("\n")}

[인용할 수 있는 자료 — 이것 말고는 없다]
${sourceBriefing(input.sources)}
${
  // 강조 박스·실행 블록이 빠져서 걸린 경우, 무엇을 넣을지는 기획안에 이미 있다.
  // 이걸 안 주면 교정이 내용을 새로 지어내고 섹션 결론과 어긋난다
  input.plan?.sections?.some((s) => s.key_point)
    ? `\n[핵심 포인트 박스 — 섹션별로 이 내용을 :::point 로 넣는다]\n` +
      input.plan.sections
        .filter((s) => s.key_point)
        .map(
          (s) =>
            `· ${s.heading}\n  :::point ${s.key_point.title}\n${(s.key_point.items ?? [])
              .map((x) => `  - ${x}`)
              .join("\n")}\n  :::`,
        )
        .join("\n")
    : ""
}${
  input.plan?.actions
    ? `\n\n[실행 블록 — ${VISUAL_SPEC.action.place} 에 :::do 로 넣는다]\n` +
      `:::do ${input.plan.actions.title}\n` +
      input.plan.actions.steps.map((s, i) => `${i + 1}. ${s}`).join("\n") +
      `\n:::\n블록 다음 문단: ${input.plan.actions.handoff} — 이 문단 안에 /shortform 또는 /sns-brand 링크를 건다`
    : ""
}

[고칠 본문]
${input.body}`,
  });

  return text.trim();
}

/**
 * 본문 글자 수 — 마크다운 문법과 공백을 뺀 실제 읽는 글자만 센다.
 * 표 구분선·링크 URL·자료 지시자까지 세면 분량 기준이 헐거워진다.
 */
export function countChars(markdown: string): number {
  return markdown
    .replace(/^:::source\s+\d+\s*$/gm, "") // 자료 지시자
    .replace(/^:::(?:point|do)\s*/gm, "") // 강조 박스 여는 줄의 지시자만
    .replace(/^:::\s*$/gm, "") // 강조 박스 닫는 줄
    .replace(/^\|[\s:|-]+\|$/gm, "") // 표 구분선
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // 링크는 표시 텍스트만
    .replace(/[#>*_`|-]/g, "")
    .replace(/\s+/g, "").length;
}

/** 본문이 실제로 인용한 자료 번호 — 검사식이 이걸 본다 */
export function citedSourceIndexes(markdown: string): number[] {
  const found = new Set<number>();
  for (const m of markdown.matchAll(/^:::source\s+(\d+)\s*$/gm)) {
    found.add(Number(m[1]));
  }
  return [...found].sort((a, b) => a - b);
}
