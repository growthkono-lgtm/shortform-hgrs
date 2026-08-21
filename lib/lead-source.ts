import "server-only";

import { referrerLabel } from "@/lib/attribution";
import { SERVICE } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * 신청 한 건이 **어디서 왔는지** 읽어 온다. (2026-08-19)
 *
 * 어드민의 기존 "유입 경로" 칸은 폼이 놓인 페이지(`/sns-brand`)를 적고 있었다.
 * 그건 어디서 왔는지가 아니라 **어디서 눌렀는지**다. 이 파일이 답하는 건
 * 그 앞의 질문이다 — 처음 우리 사이트에 닿은 곳이 어디였나, 그게 블로그의
 * 몇 편이었나.
 */

/** 기록을 시작한 날. 이 앞의 신청은 "없음" 이 아니라 "기록 이전" 이다 */
export const TRACKING_SINCE = "2026-08-19";

export type PostRef = {
  id: string;
  /** 회차 번호. 고객 이야기(story)처럼 번호가 없는 글도 있다 */
  seq: number | null;
  slug: string;
  title: string;
  /** 손님이 보는 그 주소 */
  url: string;
};

export type LeadSource = {
  /** 이 사람을 데려온 글. 첫 착지가 블로그가 아니었으면 null */
  entry: PostRef | null;
  /** 데려온 글은 아니지만 전환 전에 읽은 편들 */
  assists: PostRef[];
  /** 처음 착지한 경로 원문 */
  firstPath: string | null;
  /** 사람이 읽는 리퍼러 한 줄 ("구글 검색", "인스타그램", "직접 방문") */
  from: string | null;
  firstAt: string | null;
  utm: Record<string, string> | null;
  /**
   * **라스트 터치** — 신청 직전 마지막 진입. (2026-08-21)
   * 첫 접점과 같으면 한 번에 온 것이고, 다르면 다른 경로로 되돌아온 것이다.
   */
  lastPath: string | null;
  lastFrom: string | null;
  lastAt: string | null;
  /** 외부에서 들어온 횟수. 1=첫 방문 전환 / 2 이상=재방문 전환 */
  visits: number | null;
  /** 첫 접점과 마지막 접점이 같은 경로인가 — 화면에서 중복해 적지 않으려고 */
  sameTouch: boolean;
  /**
   * 이 건에 유입 기록이 **있는가**.
   *
   * false 는 "블로그를 안 거쳤다" 가 아니라 "그때는 재고 있지 않았다" 다.
   * 이 둘을 화면에서 같은 말로 적으면 안 된다 — 없는 걸 0 으로 세는 순간
   * 콘텐츠 성과가 실제보다 나쁘게 보인다.
   */
  recorded: boolean;
};

/** inquiries 행에서 우리가 읽는 부분만. 마이그레이션 전이면 전부 undefined 다 */
type InquiryLike = {
  id: string;
  created_at?: string | null;
  visitor_id?: string | null;
  first_path?: string | null;
  first_referrer?: string | null;
  first_at?: string | null;
  utm?: unknown;
  entry_post_id?: string | null;
  assist_post_ids?: string[] | null;
  last_path?: string | null;
  last_referrer?: string | null;
  last_at?: string | null;
  visit_count?: number | null;
};

const EMPTY = (recorded: boolean): LeadSource => ({
  entry: null,
  assists: [],
  firstPath: null,
  from: null,
  firstAt: null,
  utm: null,
  lastPath: null,
  lastFrom: null,
  lastAt: null,
  visits: null,
  sameTouch: true,
  recorded,
});

/**
 * 여러 건을 한 번에. 신청 목록이 100줄이라 건별로 물으면 쿼리가 100번 나간다.
 */
export async function leadSources(
  rows: InquiryLike[],
): Promise<Map<string, LeadSource>> {
  const out = new Map<string, LeadSource>();
  if (!rows.length) return out;

  const ids = new Set<string>();
  for (const r of rows) {
    if (r.entry_post_id) ids.add(r.entry_post_id);
    for (const a of r.assist_post_ids ?? []) ids.add(a);
  }

  const byId = new Map<string, PostRef>();
  if (ids.size) {
    try {
      const { data } = await createAdminClient()
        .from("blog_post")
        .select("id, seq, slug, title")
        .in("id", [...ids]);
      for (const p of data ?? []) {
        byId.set(p.id, {
          id: p.id,
          seq: p.seq ?? null,
          slug: p.slug,
          title: p.title,
          url: `${SERVICE.url}/blog/${p.slug}`,
        });
      }
    } catch {
      // 글을 못 읽어도 신청 목록은 떠야 한다
    }
  }

  for (const r of rows) {
    /**
     * 기록이 있는 건인가. 컬럼이 아예 없는 상태(마이그레이션 전)에서는
     * 전부 undefined 라 자연스럽게 "기록 이전" 으로 떨어진다.
     */
    const recorded = Boolean(r.visitor_id || r.first_path || r.first_at);
    if (!recorded) {
      out.set(r.id, EMPTY(false));
      continue;
    }

    out.set(r.id, {
      entry: r.entry_post_id ? (byId.get(r.entry_post_id) ?? null) : null,
      assists: (r.assist_post_ids ?? [])
        .map((a) => byId.get(a))
        .filter((p): p is PostRef => !!p),
      firstPath: r.first_path ?? null,
      from: referrerLabel(r.first_referrer),
      firstAt: r.first_at ?? null,
      utm:
        r.utm && typeof r.utm === "object"
          ? (r.utm as Record<string, string>)
          : null,
      lastPath: r.last_path ?? null,
      lastFrom: referrerLabel(r.last_referrer),
      lastAt: r.last_at ?? null,
      visits: r.visit_count ?? null,
      /**
       * 08-21 이전 방문자는 라스트 터치 쿠키가 없다. 그 경우 값이 비어 있는데,
       * 그걸 "첫 접점과 다르다" 로 읽으면 화면이 없는 사실을 지어낸다.
       */
      sameTouch: !r.last_path || r.last_path === r.first_path,
      recorded: true,
    });
  }

  return out;
}

/** 화면에 한 줄로 적을 때 쓰는 회차 이름 — "#5편" 또는 "고객 이야기" */
export function postLabel(p: PostRef): string {
  return p.seq === null ? "고객 이야기" : `#${p.seq}편`;
}

/**
 * 첫 방문 전환인가, 재방문 전환인가. (2026-08-21)
 *
 * 사장님 지시: *"첫방문인지 재방문유저인지도."*
 *
 * 세는 값은 **외부에서 들어온 횟수**다. 사이트 안에서 페이지를 넘긴 건
 * 방문이 아니다 — 그걸 세면 한 번 와서 다섯 장 읽은 사람이 5회 방문이 되고,
 * 콘텐츠를 열심히 본 사람일수록 "재방문 고객" 으로 잘못 찍힌다.
 *
 * 값이 없으면 **모른다고 적는다.** 08-21 이전 방문자는 이 쿠키가 없었다.
 * 없는 걸 1 로 채우면 전부 "첫 방문 전환" 이 되어 장부가 거짓말을 한다.
 */
export function visitLabel(s?: LeadSource): {
  text: string;
  tone: "new" | "return" | "unknown";
} {
  if (!s?.recorded || !s.visits) return { text: "기록 없음", tone: "unknown" };
  if (s.visits === 1) return { text: "첫 방문 전환", tone: "new" };
  return { text: `재방문 ${s.visits}회`, tone: "return" };
}

/**
 * 첫 접점에서 신청까지 걸린 시간. "얼마나 재고 있었나" 를 한 줄로.
 * 하루 안이면 시간으로, 그 뒤로는 날로 적는다.
 */
export function ponderLabel(s?: LeadSource): string | null {
  if (!s?.firstAt) return null;
  const first = new Date(s.firstAt).getTime();
  const last = s.lastAt ? new Date(s.lastAt).getTime() : first;
  const gap = Math.max(0, last - first);
  const hours = Math.round(gap / 3_600_000);
  if (hours < 1) return "같은 방문에 신청";
  if (hours < 24) return `${hours}시간 뒤 신청`;
  return `${Math.round(hours / 24)}일 뒤 신청`;
}
