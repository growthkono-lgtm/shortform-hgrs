"use server";

import { createAdminClient } from "@/lib/supabase/server";

/**
 * 신규 콘텐츠 알림 구독. (2026-08-13)
 *
 * 뉴스레터가 아니다 — 정기 발송물을 따로 만들지 않고, **글이 올라갈 때만**
 * 한 통 나간다. 그래서 화면 문구도 "신규 컨텐츠 알림 받기" 다.
 *
 * 서비스 키로만 쓴다. 구독자 메일 주소는 공개 클라이언트가 읽으면 안 되고,
 * 그래서 blog_subscriber 에는 RLS 정책을 하나도 만들지 않았다.
 */
export type SubscribeState = { ok: boolean; message: string } | null;

// 완벽한 검사는 불가능하다(RFC 5322 는 훨씬 복잡하다). 오타를 걸러 낼 만큼만 본다
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function subscribe(
  _prev: SubscribeState,
  formData: FormData,
): Promise<SubscribeState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const source = String(formData.get("source") ?? "") || null;

  if (!EMAIL.test(email)) {
    return { ok: false, message: "메일 주소를 다시 확인해 주세요." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("blog_subscriber")
    // 이미 있는 주소면 갱신만 한다. 중복 등록 실패를 사용자에게 보여 줄 이유가 없다 —
    // 두 번 신청한 사람에게 "이미 있습니다" 는 거절처럼 읽힌다
    .upsert(
      { email, source, unsubscribed_at: null },
      { onConflict: "email", ignoreDuplicates: false },
    );

  if (error) {
    // 유니크 인덱스가 lower(email) 이라 onConflict 가 안 걸릴 수 있다.
    // 그때는 직접 찾아 되살린다
    const { data: exists } = await supabase
      .from("blog_subscriber")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (!exists) {
      return { ok: false, message: "잠시 후 다시 시도해 주세요." };
    }
    await supabase
      .from("blog_subscriber")
      .update({ unsubscribed_at: null })
      .eq("id", exists.id);
  }

  return {
    ok: true,
    message: "신청됐습니다. 새 글이 올라갈 때 한 통씩 보내 드립니다.",
  };
}
