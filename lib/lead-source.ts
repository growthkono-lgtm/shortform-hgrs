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
};

const EMPTY = (recorded: boolean): LeadSource => ({
  entry: null,
  assists: [],
  firstPath: null,
  from: null,
  firstAt: null,
  utm: null,
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
      recorded: true,
    });
  }

  return out;
}

/** 화면에 한 줄로 적을 때 쓰는 회차 이름 — "#5편" 또는 "고객 이야기" */
export function postLabel(p: PostRef): string {
  return p.seq === null ? "고객 이야기" : `#${p.seq}편`;
}
