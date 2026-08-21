import { createAdminClient } from "@/lib/supabase/server";

/**
 * 도달 확인 — **"보냈다" 와 "도착했다" 는 다른 말이다.** (2026-08-21)
 *
 * 사장님 질문: *"소개서발송이 문의들어올때 잘갔는지, 내가 재발송 누를때
 * 잘갔는지 확인할수있나? 그 내용이 제대로가는지를 보고싶은데."*
 *
 * `email_log.status = sent` 는 **Resend 가 접수했다** 는 뜻까지만이다.
 * 반송·스팸신고는 그 뒤에 일어나고 우리 DB 에는 흔적이 없었다. 여기서
 * Resend 에 메일 ID 로 물어 마지막 사건(last_event)을 끌어와 캐시한다.
 *
 * 웹훅을 걸지 않고 **눌러서 물어보는 방식**을 택했다. 웹훅은 엔드포인트·
 * 서명검증·재시도를 붙여야 하는데, 하루 몇 통 나가는 지금 규모에서는
 * 어드민을 열 때 한 번 물어보는 편이 값싸고 고장날 곳이 적다.
 */

/** Resend 의 last_event 를 사람 말로. 모르는 값이 오면 원문 그대로 보여 준다 */
export const DELIVERY_LABEL: Record<string, string> = {
  queued: "대기 중",
  scheduled: "발송 예약",
  sent: "보냄",
  delivered: "받은편지함 도착",
  delivery_delayed: "지연 중",
  opened: "열어 봄",
  clicked: "링크 눌러 봄",
  bounced: "반송됨",
  complained: "스팸 신고",
  canceled: "취소됨",
  failed: "실패",
};

/** 초록(잘 감) / 빨강(문제) / 회색(진행 중) 중 어디에 놓을지 */
export function deliveryTone(event: string | null): "good" | "bad" | "wait" {
  if (!event) return "wait";
  if (["delivered", "opened", "clicked"].includes(event)) return "good";
  if (["bounced", "complained", "failed", "canceled"].includes(event))
    return "bad";
  return "wait";
}

export type ResendEmail = {
  id: string;
  to: string[];
  from: string;
  subject: string;
  created_at: string;
  last_event: string | null;
  html: string | null;
  text: string | null;
};

/** Resend 에 메일 한 통을 물어본다. 못 물어보면 null — 던지지 않는다 */
export async function fetchResendEmail(
  providerId: string,
): Promise<ResendEmail | null> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`https://api.resend.com/emails/${providerId}`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as ResendEmail;
  } catch {
    return null;
  }
}

/**
 * 최근 발송분의 도달 상태를 한 번에 갱신한다.
 *
 * 이미 끝난 상태(도착·반송·스팸신고)는 다시 묻지 않는다 — 바뀌지 않는 값이라
 * API 호출만 늘어난다. 열어 봄/눌러 봄은 계속 바뀔 수 있어 다시 묻는다.
 */
const FINAL_EVENTS = ["delivered", "bounced", "complained", "canceled"];

export async function refreshDeliveries(limit = 30): Promise<number> {
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("email_log")
    .select("id, provider_id, delivery")
    .not("provider_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!rows?.length) return 0;

  const targets = rows.filter(
    (r) => !r.delivery || !FINAL_EVENTS.includes(r.delivery),
  );

  let updated = 0;
  // 30건 남짓이라 한꺼번에 던진다. 더 늘어나면 배치로 끊는다
  await Promise.all(
    targets.map(async (r) => {
      const mail = await fetchResendEmail(r.provider_id as string);
      if (!mail) return;
      await admin
        .from("email_log")
        .update({
          delivery: mail.last_event ?? null,
          delivery_checked_at: new Date().toISOString(),
        })
        .eq("id", r.id);
      updated += 1;
    }),
  );

  return updated;
}
