import "server-only";

import { USAGE, respond } from "@/lib/blog-ai";
import { kstDate } from "@/lib/blog-schedule";
import { PILLARS, type PillarKey } from "@/lib/blog-spec";
import { recordSpend } from "@/lib/spend";
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

/** PILLARS 는 배열이다. Object.keys 를 쓰면 "0","1","2" 가 들어간다 (2026-08-18 수정) */
const PILLAR_KEYS = PILLARS.map((p) => p.key);

/**
 * 왜 두 단계로 쪼갰나. (2026-08-18)
 *
 * 처음엔 한 호출에 "찾아라 + 복합키워드로 만들어라 + 우리 독자에 맞춰라 +
 * 한국어 출처를 써라" 를 다 얹었다. 결과는 **빈 배열**이었다 — 검색은 6~9회
 * 돌고도 `{"candidates":[]}` 만 돌아왔다. 제약을 겹칠수록 모델은 "아무것도
 * 안 내는 쪽" 이 안전하다고 판단한다. 조사 패스를 셋으로 쪼갠 것과 같은 이유다.
 *
 *   1단계(검색) — 소식만 모은다. 제목·출처·날짜. 판단을 요구하지 않는다
 *   2단계(가공) — 그 목록을 복합키워드와 각도로 옮긴다. 검색을 안 하므로 싸다
 *
 * 1단계는 재현율을, 2단계는 정확도를 맡는다. 한 호출에 둘을 다 시키면 둘 다 잃는다.
 */
const NEWS_SCHEMA = {
  name: "week_news",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["news"],
    properties: {
      news: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["headline", "source_url", "source_name", "when"],
          properties: {
            headline: { type: "string" },
            source_url: { type: "string" },
            source_name: { type: "string" },
            when: { type: "string" },
          },
        },
      },
    },
  },
} as const;

const SHAPE_SCHEMA = {
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
          required: [
            "headline",
            "source_url",
            "source_name",
            "pillar",
            "combined_term",
            "angle",
          ],
          properties: {
            headline: { type: "string" },
            source_url: { type: "string" },
            source_name: { type: "string" },
            pillar: { type: "string", enum: PILLAR_KEYS },
            combined_term: { type: "string" },
            angle: { type: "string" },
          },
        },
      },
    },
  },
} as const;

type NewsItem = {
  headline: string;
  source_url: string;
  source_name: string;
  when: string;
};

/** 1단계 — 이번 달 소식만 모은다. 판단은 시키지 않는다 */
async function findNews(now: Date): Promise<NewsItem[]> {
  const instructions = `너는 국내 마케팅 매체의 취재기자다. **최근 4주 안에 실제로 있었던 일**을 모은다.

찾을 것 — 메타·인스타·틱톡·유튜브·구글·네이버·쿠팡의 정책·제품·알고리즘 변경,
국내 광고 시장·커머스 업계의 움직임, 브랜드 마케팅에 영향을 주는 규정 변화.

[규칙]
- **검색해서 확인한 것만.** 기억으로 아는 소식·URL 을 쓰지 않는다
- 검색을 **최소 8회** 돌린다. 검색어를 바꿔 가며 뒤진다 — 플랫폼 뉴스룸(한국어판),
  국내 매체(모비인사이드·디지털인사이트·아웃스탠딩·바이라인네트워크·전자신문),
  네이버 검색광고 공지, 커머스 채널 공지
- 한국어 출처를 먼저 찾는다. 공식 문서는 hl=ko 판이 거의 항상 있다
- URL 을 정확히 그대로 적는다. 축약·복원하지 않는다
- when 에는 발표·보도 날짜를 적는다 (YYYY-MM-DD)

**8건까지 모은다. 고르지 말고 일단 모아라 — 추리는 건 다음 단계에서 한다.**`;

  const { text } = await respond({
    model: process.env.BLOG_MODEL_RESEARCH ?? "gpt-5.6-terra",
    instructions,
    message: `오늘은 ${kstDate(now)} 이다. 최근 4주 소식을 모아라.`,
    maxOutputTokens: 6000,
    search: true,
    effort: "high",
    schema: NEWS_SCHEMA as unknown as { name: string; schema: unknown },
    timeoutMs: 4 * 60 * 1000,
    label: "시의성 1단계 검색",
  });

  return (JSON.parse(text) as { news?: NewsItem[] }).news ?? [];
}

/** 2단계 — 모은 소식을 복합키워드와 각도로 옮긴다. 검색 없음 */
async function shapeCandidates(
  news: NewsItem[],
  seeds: string[],
): Promise<TrendCandidate[]> {
  const instructions = `너는 우리 블로그의 편성 담당이다. 아래 소식 목록을 **우리 글감으로 옮긴다.**

[누가 읽나 — 소식을 버리는 기준이 아니라 **번역하는 기준**이다]
브랜드 대표·이사급이다. 광고 계정을 직접 만지는 실무자가 아니다.
소식 자체는 실무 변경이어도 된다. angle 에서 대표가 판단할 말로 옮기면 된다.

  실무자 말: "예산 제한 캠페인의 입찰 로직이 바뀐다"
  대표 말  : "이번 달 ROAS 가 떨어져 보일 수 있다. 소재를 바꾸기 전에
             목표값부터 다시 잡아야 하는 시기다"

번역이 안 되는 것(계정 설정 화면 안에서만 의미 있는 것)만 버린다.

[combined_term — 이게 결과물이다]
소식에서 **국내 마케팅 담당자가 실제로 검색창에 칠 말**을 뽑는다.
[무엇이 바뀌었나] + [담당자가 하려는 일], 2~4 어절.

  "인스타 리치 감소" + "예산 배분"   → 인스타 리치 감소 예산 배분
  "틱톡 광고 정책 변경" + "소재 심사" → 틱톡 광고 심사 기준
  "네이버 쇼핑 개편" + "상위노출"     → 네이버 쇼핑 개편 상위노출

우리가 이미 노리는 검색어다. 자연스럽게 겹치면 겹치는 대로 쓰되, 반드시
이 중에서 고를 필요는 없다.
${seeds.slice(0, 20).map((x) => "· " + x).join("\n")}

[pillar — 반드시 이 key 중 하나]
${PILLARS.map((x) => "· " + x.key + " — " + x.label).join("\n")}

[angle]
"이 변화가 국내 브랜드의 소재 운영·예산 배분에 **무엇을 요구하는가**" 까지 적는다.
무슨 일이 있었는지만 적으면 안 된다.

**소식은 이미 확인된 것들이다. 새로 찾지 말고, 주어진 목록에서 옮길 수 있는 것을
전부 옮겨라.** headline·source_url·source_name 은 받은 그대로 쓴다.`;

  const { text } = await respond({
    model: process.env.BLOG_MODEL_RESEARCH ?? "gpt-5.6-terra",
    instructions,
    message: JSON.stringify({ news }),
    maxOutputTokens: 6000,
    schema: SHAPE_SCHEMA as unknown as { name: string; schema: unknown },
    timeoutMs: 3 * 60 * 1000,
    label: "시의성 2단계 가공",
  });

  return (JSON.parse(text) as { candidates?: TrendCandidate[] }).candidates ?? [];
}

export async function collectTrends(now = new Date()): Promise<TrendResult> {
  const supabase = createAdminClient();
  USAGE.reset();

  /**
   * 어떻게 끝나든 쓴 돈은 적는다. (2026-08-18)
   *
   * 08-18 에 수집이 네 번 빈손으로 끝났는데 **어디에도 안 적혔다.** 0건이면
   * note 가 비고, note 가 비면 `cronRoute` 가 로그를 안 남기기 때문이다.
   * 그날 $1.7 이 장부 밖으로 샜고, 사장님이 잔액을 보고서야 알았다.
   * 실패한 호출도 토큰은 썼다. 성공했을 때만 적는 장부는 장부가 아니다.
   */
  const bill = async (outcome: string, added: number) => {
    await recordSpend({
      service: "openai",
      kind: "trend",
      ref: `trends/${kstDate(now)}`,
      usd: USAGE.costFloor(),
      meta: {
        outcome,
        added,
        searches: USAGE.webSearches,
        input: USAGE.input,
        output: USAGE.output,
      },
    });
  };

  /* 우리가 이미 노리는 니치 검색어 — 겹치면 겹치는 대로 쓸 재료다 */
  const { data: keywords } = await supabase
    .from("blog_keyword")
    .select("term")
    .eq("status", "idle")
    .gte("total_volume", 300)
    .order("buyer_intent", { ascending: false })
    .order("niche_score", { ascending: false })
    .limit(30);
  const seeds = (keywords ?? []).map((k) => k.term).filter(Boolean);

  let news: NewsItem[] = [];
  try {
    news = await findNews(now);
  } catch (e) {
    await bill("1단계 실패", 0);
    return { added: 0, note: `1단계(검색) 실패 — ${String(e).slice(0, 140)}` };
  }
  if (!news.length) {
    await bill("소식 없음", 0);
    return { added: 0, note: `1단계 검색 ${USAGE.webSearches}회 — 소식을 못 찾았습니다` };
  }

  /* 이미 쓴 소식은 뺀다 */
  const { data: had } = await supabase
    .from("blog_trend")
    .select("headline")
    .order("created_at", { ascending: false })
    .limit(40);
  const seen = new Set((had ?? []).map((h) => h.headline));
  const fresh = news.filter((n) => !seen.has(n.headline));
  if (!fresh.length) {
    await bill("전부 기존 소식", 0);
    return { added: 0, note: `소식 ${news.length}건 전부 이미 쓴 것입니다` };
  }

  let candidates: TrendCandidate[] = [];
  try {
    candidates = await shapeCandidates(fresh, seeds);
  } catch (e) {
    await bill("2단계 실패", 0);
    return { added: 0, note: `2단계(가공) 실패 — ${String(e).slice(0, 140)}` };
  }

  const captured_on = kstDate(now);

  /**
   * 한 출처에서 두 건까지만. (2026-08-18)
   *
   * 첫 실전 수집에서 4건이 **전부 네이버 광고 공지** 한 곳에서 나왔다.
   * 공지 게시판은 글이 많아 검색에 잘 걸리는데, 그렇다고 그 주의 소식이
   * 네이버 광고 상품뿐이었던 건 아니다. 한 곳이 주 편성을 다 먹으면
   * 그 주 블로그가 통째로 한 플랫폼 얘기가 된다.
   */
  const perDomain = new Map<string, number>();
  const rows = candidates
    .filter((c) => c.combined_term && /^https?:\/\//.test(c.source_url ?? ""))
    .filter((c) => {
      let host = "";
      try {
        host = new URL(c.source_url).hostname;
      } catch {
        return false;
      }
      const n = (perDomain.get(host) ?? 0) + 1;
      perDomain.set(host, n);
      return n <= 2;
    })
    .slice(0, WANT)
    .map((c) => ({
      captured_on,
      headline: c.headline.slice(0, 300),
      source_url: c.source_url.slice(0, 500),
      source_name: c.source_name?.slice(0, 120) ?? null,
      pillar: (PILLAR_KEYS.includes(c.pillar as PillarKey)
        ? c.pillar
        : "brand-sns") as PillarKey,
      combined_term: c.combined_term.slice(0, 120),
      angle: c.angle.slice(0, 500),
    }));

  if (!rows.length) {
    await bill("가공 결과 없음", 0);
    return {
      added: 0,
      note: `소식 ${fresh.length}건 → 가공 ${candidates.length}건, 쓸 만한 게 없었습니다`,
    };
  }

  // 같은 복합키워드는 유니크 인덱스가 막는다
  const { data: inserted } = await supabase
    .from("blog_trend")
    .upsert(rows, { onConflict: "combined_term", ignoreDuplicates: true })
    .select("combined_term");

  await bill("성공", inserted?.length ?? 0);

  return {
    added: inserted?.length ?? 0,
    note:
      `소식 ${fresh.length}건 · 검색 ${USAGE.webSearches}회 · $${USAGE.costFloor().toFixed(3)} · ` +
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
