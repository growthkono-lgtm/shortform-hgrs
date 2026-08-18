import "server-only";

import { USAGE, respond } from "@/lib/blog-ai";
import { kstDate } from "@/lib/blog-schedule";
import { PILLARS, type PillarKey } from "@/lib/blog-spec";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * 시즌·시의성 복합키워드 수집 — 주 1회. (2026-08-18)
 *
 * 사장님 제안을 그대로 옮긴 것이다. 왜 하는지는
 * `20260818000003_blog_trend.sql` 머리말에 적어 뒀다.
 *
 * ── 이 파일이 하는 일은 하나다 ──────────────────────────────────────
 * 이번 주 국내에서 실제로 벌어진 일을 찾아, **우리가 이미 노리던 니치
 * 검색어와 곱해서** 복합키워드를 만든다.
 *
 *   "인스타 리치 감소"(이번 주 소식) x "예산 배분"(우리 니치)
 *     → "인스타 리치 감소 예산 배분"
 *
 * 소식만 쓰면 남의 뉴스 요약이 되고, 니치만 쓰면 지금처럼 2~8주를 기다린다.
 * 곱해야 우리 얘기이면서 빨리 붙는다.
 *
 * ── 안전장치 ────────────────────────────────────────────────────────
 * 이 수집이 실패해도 **자동화는 멈추지 않는다.** 편성은 후보가 없으면 그냥
 * 평소 니치 풀에서 꺼낸다(`ensureJobForToday`). 새 기능이 기존 파이프라인을
 * 죽이는 것이 제일 나쁘다.
 */

/** 한 번에 몇 개까지 건질까. 주 2편이니 넉넉히 넷 */
const WANT = 4;

/** 시의성 후보를 쓰는 요일 — 주 7편 중 2편 (1=월, 4=목) */
export const SEASONAL_WEEKDAYS = new Set([1, 4]);

export type TrendCandidate = {
  headline: string;
  source_url: string;
  source_name: string | null;
  pillar: string;
  combined_term: string;
  angle: string;
};

export type TrendResult = { added: number; note: string };

const SCHEMA = {
  name: "trend_candidates",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["candidates"],
    properties: {
      candidates: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["headline", "source_url", "source_name", "pillar", "combined_term", "angle"],
          properties: {
            headline: { type: "string" },
            source_url: { type: "string" },
            source_name: { type: "string" },
            pillar: { type: "string", enum: Object.keys(PILLARS) },
            combined_term: { type: "string" },
            angle: { type: "string" },
          },
        },
      },
    },
  },
} as const;

export async function collectTrends(now = new Date()): Promise<TrendResult> {
  const supabase = createAdminClient();

  /* 우리가 이미 노리는 니치 검색어 — 곱할 재료다 */
  const { data: keywords } = await supabase
    .from("blog_keyword")
    .select("term, pillar, total_volume")
    .eq("status", "idle")
    .gte("total_volume", 300)
    .order("buyer_intent", { ascending: false })
    .order("niche_score", { ascending: false })
    .limit(40);

  const seeds = (keywords ?? []).map((k) => k.term).filter(Boolean);
  if (!seeds.length) return { added: 0, note: "곱할 니치 검색어가 없습니다" };

  /* 이미 쓴 소식은 다시 안 가져온다 */
  const { data: had } = await supabase
    .from("blog_trend")
    .select("combined_term, headline")
    .order("created_at", { ascending: false })
    .limit(40);
  const seen = (had ?? []).map((h) => h.headline).slice(0, 20);

  const year = now.getFullYear();
  const instructions = `너는 국내 마케팅 매체의 취재기자다. **이번 주 실제로 벌어진 일**만 가져온다.

[무엇을 찾나]
메타·인스타·틱톡·유튜브·네이버·쿠팡의 **정책·제품·알고리즘 변경**, 국내 광고 시장의
움직임, 커머스 플랫폼 규정 변화. ${year}년 최근 2주 안의 것만.

[규칙 — 이걸 어기면 쓸모가 없다]
- **검색해서 확인한 것만.** 기억으로 아는 소식·URL 을 쓰지 않는다
- **한국어 출처를 우선한다.** about.fb.com/ko, newsroom.tiktok.com/ko-kr,
  blog.google/intl/ko-kr, 국내 매체. 영문판은 한국어판이 없을 때만
- 2주보다 오래된 것은 버린다. "시의성" 이 이 작업의 전부다
- 출처 URL 을 정확히 그대로 적는다. 축약·복원하지 않는다

[핵심 — 복합키워드를 만든다]
소식만 적으면 남의 뉴스 요약이 된다. 아래는 우리가 이미 노리는 검색어다.
소식 하나를 고르고, 여기서 **가장 자연스럽게 붙는 검색어 하나를 골라 곱한다.**

${seeds.map((s) => `· ${s}`).join("\n")}

combined_term 은 사람이 실제로 검색창에 칠 법한 말이어야 한다. 억지로 이어 붙인
말은 아무도 안 친다. 자연스럽지 않으면 그 소식은 버린다.

[angle]
"이 변화가 국내 브랜드의 소재 운영·예산 배분에 **무엇을 요구하는가**" 까지 적는다.
무슨 일이 있었는지만 적으면 안 된다.

${seen.length ? `[이미 쓴 소식 — 다시 가져오지 않는다]\n${seen.map((h) => `· ${h}`).join("\n")}` : ""}

최대 ${WANT}개. 기준에 맞는 게 하나뿐이면 하나만 준다. **없으면 빈 배열을 준다 —
억지로 채우지 않는다.**`;

  let parsed: { candidates: TrendCandidate[] };
  try {
    const { text } = await respond({
      model: process.env.BLOG_MODEL_RESEARCH ?? "gpt-5.6-terra",
      instructions,
      message: `오늘은 ${kstDate(now)} 이다. 이번 주 소식을 찾아라.`,
      maxOutputTokens: 6000,
      search: true,
      schema: SCHEMA as unknown as { name: string; schema: unknown },
      timeoutMs: 4 * 60 * 1000,
      label: "시의성 수집",
    });
    parsed = JSON.parse(text) as { candidates: TrendCandidate[] };
  } catch (e) {
    // 실패해도 편성은 니치 풀로 돈다. 여기서 던지면 크론이 시끄러워진다
    return { added: 0, note: `수집 실패 — ${String(e).slice(0, 160)}` };
  }

  const captured_on = kstDate(now);
  const rows = (parsed.candidates ?? [])
    .filter((c) => c.combined_term && /^https?:\/\//.test(c.source_url ?? ""))
    .slice(0, WANT)
    .map((c) => ({
      captured_on,
      headline: c.headline.slice(0, 300),
      source_url: c.source_url.slice(0, 500),
      source_name: c.source_name?.slice(0, 120) ?? null,
      pillar: (c.pillar in PILLARS ? c.pillar : "brand-sns") as PillarKey,
      combined_term: c.combined_term.slice(0, 120),
      angle: c.angle.slice(0, 500),
    }));

  if (!rows.length) {
    // 0 건이 "안 돌았다" 인지 "쓸 게 없었다" 인지 구분되게 적는다
    const raw = parsed.candidates?.length ?? 0;
    return {
      added: 0,
      note:
        `후보 ${raw}건 · 검색 ${USAGE.webSearches}회 — ` +
        (raw ? "출처 URL 이 없어 전부 버렸습니다" : "기준에 맞는 소식이 없었습니다"),
    };
  }

  // 같은 복합키워드는 유니크 인덱스가 막는다. 충돌은 무시하고 새 것만 넣는다
  const { data: inserted } = await supabase
    .from("blog_trend")
    .upsert(rows, { onConflict: "combined_term", ignoreDuplicates: true })
    .select("combined_term");

  return {
    added: inserted?.length ?? 0,
    note:
      `검색 ${USAGE.webSearches}회 · $${USAGE.costFloor().toFixed(3)} · ` +
      (inserted ?? []).map((r) => r.combined_term).join(", "),
  };
}

/** 아직 안 쓴 시의성 후보 하나. 없으면 null — 그러면 평소대로 니치 풀을 쓴다 */
export async function takeTrend(now = new Date()) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("blog_trend")
    .select("id, headline, combined_term, angle, pillar, source_url")
    .is("used_on", null)
    .order("captured_on", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  await supabase
    .from("blog_trend")
    .update({ used_on: kstDate(now) })
    .eq("id", data.id);

  return data;
}
