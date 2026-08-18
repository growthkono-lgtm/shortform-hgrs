"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { auditPost } from "@/lib/blog-audit";
import { publishDue, publishMomentOf } from "@/lib/blog-publish";
import type { FormatKey } from "@/lib/blog-spec";

/**
 * 블로그 검수 액션 — 수정 · 승인 · 반려. (2026-08-13)
 *
 * 발행은 **승인 버튼이 유일한 트리거**다. 시간이 지나도 자동으로 나가지 않는다.
 * 사장님이 정한 운영 방식이고, SEO/AEO 리드 수주가 목적이면 틀린 글 한 편이
 * 크레딧보다 비싸기 때문이다.
 *
 * 모든 액션이 requireAdmin() 을 다시 부른다 — 레이아웃 가드를 믿고 생략하면
 * 액션이 직접 호출될 때 뚫린다.
 */

/** 본문 수정 — 저장할 때마다 규격 검사를 다시 돌린다 */
export async function saveBody(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const body = String(formData.get("body") ?? "");
  if (!id) throw new Error("회차 id 가 없습니다.");

  const supabase = createAdminClient();
  const { data: post } = await supabase
    .from("blog_post")
    .select("format, sources")
    .eq("id", id)
    .maybeSingle();
  if (!post) throw new Error("회차를 찾지 못했습니다.");

  const result = auditPost({
    body,
    formatKey: post.format as FormatKey,
    sources: (post.sources ?? []) as never,
  });

  const { error } = await supabase
    .from("blog_post")
    .update({
      body,
      chars: result.chars,
      read_minutes: result.readMinutes,
      audit: result as never,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(`저장 실패: ${error.message}`);

  revalidatePath(`/admin/blog/${id}`);
}

/**
 * "발행하기" — **승인이지 발행이 아니다.** (2026-08-13 흐름 변경)
 *
 * 사장님이 정한 두 칸짜리 흐름을 그대로 따른다:
 *   당일 15시  검수 요청 메일이 간다
 *   사장님이 여기서 발행하기를 누른다 → 승인 도장이 찍힌다
 *   당일 17시  cron 이 승인된 글만 내보낸다
 *
 * 예정일 17시가 이미 지났다면 그 자리에서 바로 나간다. 기다릴 시각이
 * 지나 버린 글을 다음 날까지 붙잡아 둘 이유가 없다.
 *
 * 규격 미달이면 막는다. 어드민이 강제로 넘길 수 있게 두면 검사식이 있으나 마나다 —
 * 정말 내보내야 하면 본문을 고쳐서 통과시키는 게 맞다.
 */
export async function approvePost(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const supabase = createAdminClient();

  const { data: post } = await supabase
    .from("blog_post")
    .select("body, format, sources, slug, scheduled_for")
    .eq("id", id)
    .maybeSingle();
  if (!post?.body) throw new Error("본문이 없습니다.");

  const result = auditPost({
    body: post.body,
    formatKey: post.format as FormatKey,
    sources: (post.sources ?? []) as never,
  });
  if (result.failures.length > 0) {
    throw new Error(
      `규격 미달이라 발행할 수 없습니다:\n· ${result.failures.join("\n· ")}`,
    );
  }

  const now = new Date();
  const { error } = await supabase
    .from("blog_post")
    .update({
      // 상태는 아직 발행이 아니다. 승인 도장만 찍고 예약 시각을 기다린다
      status: "review",
      approved_at: now.toISOString(),
      reject_note: null,
      audit: result as never,
      updated_at: now.toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(`승인 실패: ${error.message}`);

  // 예정일 17시가 이미 지났으면 기다릴 게 없다 — 그 자리에서 내보낸다
  const due = post.scheduled_for ? publishMomentOf(post.scheduled_for) : now;
  if (due.getTime() <= now.getTime()) await publishDue(now);

  // 목록·발행면·사이트맵이 같이 갱신돼야 한다
  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/sitemap.xml");
  revalidatePath(`/admin/blog/${id}`);
  revalidatePath("/admin/blog");
}

/** 반려 — 사유를 남긴다. 사유 없는 반려는 다시 만들 때 참고할 게 없다 */
export async function rejectPost(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!note) throw new Error("반려 사유를 적어 주세요.");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("blog_post")
    .update({
      status: "drafted",
      reject_note: note,
      approved_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(`반려 실패: ${error.message}`);

  revalidatePath(`/admin/blog/${id}`);
  revalidatePath("/admin/blog");
}

/** 승인 취소 — 발행 전에 도장을 무른다 */
export async function unapprovePost(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("blog_post")
    .update({ approved_at: null, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`승인 취소 실패: ${error.message}`);

  revalidatePath(`/admin/blog/${id}`);
  revalidatePath("/admin/blog");
}

/** 발행 취소 — 잘못 나간 글을 내린다 */
export async function unpublishPost(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const supabase = createAdminClient();
  const { data: post } = await supabase
    .from("blog_post")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("blog_post")
    .update({
      status: "review",
      published_at: null,
      // 승인도 함께 무른다. 안 그러면 cron 이 다음 차례에 도로 올린다
      approved_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(`내리기 실패: ${error.message}`);

  revalidatePath("/blog");
  if (post?.slug) revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/sitemap.xml");
  revalidatePath(`/admin/blog/${id}`);
}

/**
 * 키워드 한 줄을 보드에서 뺀다. (2026-08-14)
 *
 * 쓰임새는 하나다 — **남의 업체 이름을 지우는 것.** 네이버 키워드도구가 연관
 * 검색어로 브랜드 검색어를 같이 뱉는데, 규칙으로 걸러 보니 멀쩡한 검색어까지
 * 149개가 딸려 나갔다(자세한 건 `lib/keyword-filter.ts`). 판단은 사람이 하고
 * 기억은 DB 가 하도록, 눈에 걸릴 때 한 번 누르는 버튼으로 뒀다.
 *
 * 지우지 않고 `dropped` 로 눕히는 이유: 다음 주 갱신 때 같은 검색어가 다시
 * 수집되면 도로 살아난다. 표시를 남겨야 두 번 지우지 않는다.
 */
export async function dropKeyword(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = createAdminClient();
  await supabase.from("blog_keyword").update({ status: "dropped" }).eq("id", id);
  revalidatePath("/admin/blog");
}
