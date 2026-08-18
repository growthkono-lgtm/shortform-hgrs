import { NextResponse } from "next/server";
import crypto from "node:crypto";

import { auditPost } from "@/lib/blog-audit";
import { createAdminClient } from "@/lib/supabase/server";
import { FORMATS, PILLARS, type FormatKey, type PillarKey } from "@/lib/blog-spec";
import type { Source } from "@/lib/blog-sources";

/**
 * POST /api/blog/draft — 초안 수신. (2026-08-13)
 *
 * 스케줄 세션이 조사·집필을 마친 원고를 여기로 밀어 넣는다. 그러면 어드민
 * 검수 대기함에 뜨고, 사장님이 승인해야 발행된다.
 *
 * 왜 DB 키를 세션에 주지 않고 이 엔드포인트를 두는가:
 * 클라우드 세션에 `SUPABASE_SERVICE_ROLE_KEY` 를 넘기면 그 환경이 DB 전체에
 * 접근할 수 있게 된다. 초안 하나 넣자고 열기엔 너무 넓다. 여기로 좁히면
 * 그 세션이 할 수 있는 일이 "초안 등록" 하나로 제한된다.
 *
 * 인증: `Authorization: Bearer <BLOG_DRAFT_SECRET>` — 상수 시간 비교로 검사한다.
 */

export const runtime = "nodejs";

function authorized(request: Request): boolean {
  const secret = process.env.BLOG_DRAFT_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (token.length !== secret.length) return false;

  // 길이가 같을 때만 여기 온다 — timingSafeEqual 은 길이가 다르면 던진다
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(secret));
}

type Payload = {
  title?: string;
  slug?: string;
  pillar?: string;
  format?: string;
  body?: string;
  sources?: Source[];
  plan?: unknown;
  keywordTerm?: string;
  subKeywordTerms?: string[];
  scheduledFor?: string;
};

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { title, slug, body } = payload;
  const pillar = payload.pillar as PillarKey;
  const format = payload.format as FormatKey;
  const sources = payload.sources ?? [];

  const missing = [
    !title && "title",
    !slug && "slug",
    !body && "body",
    !PILLARS.some((p) => p.key === pillar) && "pillar",
    !FORMATS.some((f) => f.key === format) && "format",
  ].filter(Boolean);
  if (missing.length) {
    return NextResponse.json(
      { error: `필수값 누락 또는 잘못됨: ${missing.join(", ")}` },
      { status: 400 },
    );
  }

  // 규격 검사를 **수신 시점에** 돌려 저장한다. 어드민이 열었을 때 이미
  // 무엇이 걸렸는지 보여야 검수가 빨라진다
  const result = auditPost({ body: body!, formatKey: format, sources, title, slug });

  const supabase = createAdminClient();

  // 메인·서브 키워드는 이름으로 받아 id 로 바꾼다.
  // 세션이 uuid 를 들고 다니게 하면 키워드가 갱신될 때마다 어긋난다
  const terms = [payload.keywordTerm, ...(payload.subKeywordTerms ?? [])].filter(
    Boolean,
  ) as string[];
  const idByTerm = new Map<string, string>();
  if (terms.length) {
    const { data } = await supabase
      .from("blog_keyword")
      .select("id, term")
      .in("term", terms);
    for (const k of data ?? []) idByTerm.set(k.term, k.id);
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("blog_post")
    .upsert(
      {
        title: title!,
        slug: slug!,
        pillar,
        format,
        body: body!,
        sources: sources as never,
        plan: (payload.plan ?? {}) as never,
        keyword_id: payload.keywordTerm
          ? (idByTerm.get(payload.keywordTerm) ?? null)
          : null,
        sub_keyword_ids: (payload.subKeywordTerms ?? [])
          .map((t) => idByTerm.get(t))
          .filter(Boolean) as string[],
        chars: result.chars,
        read_minutes: result.readMinutes,
        audit: result as never,
        scheduled_for: payload.scheduledFor ?? null,
        // 검사를 통과했어도 'review' 다. 발행은 승인 버튼만이 시킨다
        status: "review",
        approved_at: null,
        reject_note: null,
        updated_at: now,
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 키워드 상태를 '기획됨'으로 옮겨 같은 검색어로 두 편이 나가지 않게 한다
  if (payload.keywordTerm && idByTerm.has(payload.keywordTerm)) {
    await supabase
      .from("blog_keyword")
      .update({ status: "planned" })
      .eq("id", idByTerm.get(payload.keywordTerm)!);
  }

  return NextResponse.json({
    id: data.id,
    status: "review",
    audit: { ok: result.ok, failures: result.failures },
    reviewUrl: `/admin/blog/${data.id}`,
  });
}
