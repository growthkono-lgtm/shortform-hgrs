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

/**
 * 조회 권한 상태. (2026-08-21 실측)
 *
 * Resend 의 API 키에는 **Sending access** 와 **Full access** 두 등급이 있고,
 * 지금 쓰는 키는 발송 전용이다. 실제로 물어봤을 때 돌아온 답:
 *
 *   GET /emails/{id}
 *   401 {"name":"restricted_api_key",
 *        "message":"This API key is restricted to only send emails"}
 *
 * 그래서 도달 확인과 발송본 열기는 **Full access 키로 바꾸기 전까지 안 된다.**
 * 화면에서 그냥 빈칸으로 두면 "확인해 봤더니 문제 없음" 처럼 읽힌다.
 * 못 하는 이유를 화면에 적기 위해 이 값을 따로 들고 다닌다.
 */
export type ReadScope = "ok" | "no_key" | "restricted" | "error";

export const READ_SCOPE_NOTE: Record<Exclude<ReadScope, "ok">, string> = {
  no_key:
    "RESEND_API_KEY 가 설정되어 있지 않아 도달 확인과 발송본 열기를 할 수 없습니다.",
  restricted:
    "지금 Resend 키는 발송 전용(Sending access)이라 조회가 막혀 있습니다. resend.com/api-keys 에서 Full access 키를 새로 만들어 RESEND_API_KEY 를 교체하면 도달 확인과 실제 발송본 열기가 켜집니다. 발송 자체는 지금 키로도 정상입니다.",
  error: "Resend 에 닿지 못했습니다. 잠시 뒤 다시 눌러 주세요.",
};

/**
 * 이 키로 조회가 되는지 **직접 물어본다.** 문서를 읽고 판단하지 않는다.
 * 없는 ID 를 물어 200/404 면 조회 가능, 401 이면 발송 전용이다.
 */
let scopeCache: ReadScope | null = null;

export async function readScope(): Promise<ReadScope> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return "no_key";

  /**
   * 판정은 배포 한 벌에 한 번이면 된다 — 키는 런타임에 바뀌지 않고,
   * 바뀌면 재배포라 이 모듈이 새로 뜬다. 어드민을 열 때마다 Resend 에
   * 묻지 않게 캐시한다. (error 는 일시적일 수 있어 캐시하지 않는다)
   */
  if (scopeCache) return scopeCache;

  try {
    const res = await fetch(
      "https://api.resend.com/emails/00000000-0000-0000-0000-000000000000",
      { headers: { Authorization: `Bearer ${key}` }, cache: "no-store" },
    );
    scopeCache = res.status === 401 || res.status === 403 ? "restricted" : "ok";
    return scopeCache;
  } catch {
    return "error";
  }
}

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

export async function refreshDeliveries(
  limit = 30,
): Promise<{ updated: number; scope: ReadScope }> {
  const scope = await readScope();
  if (scope !== "ok") return { updated: 0, scope };

  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("email_log")
    .select("id, provider_id, delivery")
    .not("provider_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!rows?.length) return { updated: 0, scope };

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

  return { updated, scope };
}
