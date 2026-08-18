"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { CONSENT_VERSION } from "@/lib/consents";
import { BROCHURE, brochureMail, brochureUrl, sendMail } from "@/lib/mail";

export type InquiryState = { ok: boolean; error: string | null };

const INTERESTS = ["shorts_only", "full", "unsure"] as const;
const VOLUMES = ["v1", "v5", "v10", "v20", "unknown"] as const;

const isOneOf = <T extends readonly string[]>(list: T, v: string) =>
  (list as readonly string[]).includes(v);

/**
 * 랜딩 신청 접수.
 *
 * 가격을 화면에 걸지 않기로 하면서 **이 폼이 유일한 공개 전환 경로**가 됐다.
 * 저장은 service_role 로만 한다 — anon 에게 insert 를 열면 스팸이 그대로 테이블에 쌓인다.
 * 소개서 자동 발송은 어드민 대시보드 이후에 붙인다(지금은 접수만).
 */
export async function submitInquiry(
  _prev: InquiryState,
  formData: FormData,
): Promise<InquiryState> {
  const companyName = String(formData.get("company_name") ?? "").trim();
  const contactName = String(formData.get("contact_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const brandUrl = String(formData.get("brand_url") ?? "").trim();
  const interest = String(formData.get("interest") ?? "");
  const volume = String(formData.get("volume") ?? "");
  const message = String(formData.get("message") ?? "").trim();
  const consentRequired = formData.get("consent_required") === "on";
  const marketing = formData.get("consent_marketing") === "on";
  const diagnosisRaw = String(formData.get("diagnosis") ?? "");

  if (!companyName || !contactName || !email) {
    return { ok: false, error: "회사명·담당자 이름·이메일은 필수입니다." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "이메일 주소를 다시 확인해 주세요." };
  }
  if (!isOneOf(INTERESTS, interest) || !isOneOf(VOLUMES, volume)) {
    return { ok: false, error: "관심 구성과 예상 편수를 선택해 주세요." };
  }
  if (!consentRequired) {
    return { ok: false, error: "개인정보 수집·이용에 동의해 주셔야 접수됩니다." };
  }

  let diagnosis: unknown = null;
  if (diagnosisRaw) {
    try {
      diagnosis = JSON.parse(diagnosisRaw);
    } catch {
      diagnosis = null;
    }
  }

  const head = await headers();
  const ip =
    head.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    head.get("x-real-ip") ??
    null;

  const admin = createAdminClient();

  /**
   * 같은 사람이 연달아 보낸 것은 한 건으로 본다. (2026-08-18)
   *
   * 08-18 오전 첫 실사 문의(자보티바)가 **3초 간격으로 두 번** 들어왔고,
   * 소개서 메일도 두 통 나갔다. 고객이 같은 메일을 두 번 받은 셈이다.
   * 버튼 연타든 새로고침이든 원인은 사용자 쪽이지만, 결과는 우리 인상이다.
   *
   * 10분 창을 두고 같은 이메일이면 새로 넣지 않고 조용히 접수 성공으로
   * 돌려준다 — 사용자에게 "이미 접수됐다" 는 오류를 띄우면 실패로 읽힌다.
   * 정말 다시 보내려는 사람은 10분 뒤에 되고, 어드민에는 [소개서 재발송]이 있다.
   */
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: recent } = await admin
    .from("inquiries")
    .select("id")
    .eq("email", email)
    .gte("created_at", since)
    .limit(1)
    .maybeSingle();
  if (recent) return { ok: true, error: null };

  const { data: inserted, error } = await admin
    .from("inquiries")
    .insert({
    company_name: companyName,
    contact_name: contactName,
    email,
    phone: phone || null,
    brand_url: brandUrl || null,
    interest,
    volume,
    message: message || null,
    diagnosis: diagnosis as never,
    consent_version: CONSENT_VERSION,
    marketing_agreed: marketing,
    ip_address: ip,
      user_agent: head.get("user-agent"),
    })
    .select("id, email, contact_name, company_name")
    .single();

  if (error || !inserted) {
    return { ok: false, error: "접수 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요." };
  }

  /**
   * 접수 즉시 소개서를 보낸다 (2026-08-11).
   *
   * 예전에는 어드민이 [소개서 발송]을 눌러야 나갔다. 문의한 사람은 그때까지
   * 아무것도 못 받는데, 그 사이가 제일 식는 구간이다.
   *
   * **발송 실패가 접수 실패로 번지면 안 된다.** 신청은 이미 DB에 들어갔고
   * 어드민에서 다시 보낼 수 있다. 그래서 결과를 화면에 되돌리지 않고
   * email_log(sendMail 내부)에만 남긴다.
   */
  const mail = brochureMail(inserted);
  const sent = await sendMail({
    kind: "brochure",
    to: inserted.email,
    subject: mail.subject,
    html: mail.html,
    inquiryId: inserted.id,
    // 첨부와 링크를 함께 — 첨부를 막아 둔 메일 환경이 적지 않다
    attachments: [{ filename: BROCHURE.filename, path: brochureUrl }],
  });

  if (sent.ok) {
    await admin
      .from("inquiries")
      .update({ status: "sent", brochure_sent_at: new Date().toISOString() })
      .eq("id", inserted.id);
  }

  return { ok: true, error: null };
}
