"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { CONSENT_VERSION } from "@/lib/consents";
import { BROCHURE, brochureMail, brochureUrl, inquiryNoticeMail, sendMail } from "@/lib/mail";
import {
  INQUIRY_PLAN_LABEL,
  INQUIRY_PLAN_VALUES,
  INQUIRY_SOURCE_LABEL,
  VOLUME_LABEL,
  needsCount,
} from "@/lib/inquiry-plans";
import { readDiagnosis, type DiagAnswers } from "@/lib/diagnosis";

export type InquiryState = { ok: boolean; error: string | null };

/**
 * 선택지는 `lib/inquiry-plans.ts` 한 곳에서만 정의한다. (2026-08-18)
 * 폼·서버·어드민이 각자 목록을 들고 있으면 하나를 늘릴 때 반드시 어긋난다.
 */
const INTERESTS = INQUIRY_PLAN_VALUES;
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
  if (!isOneOf(INTERESTS, interest)) {
    return { ok: false, error: "어떤 프로젝트를 찾으시는지 선택해 주세요." };
  }
  if (!isOneOf(VOLUMES, volume)) {
    return { ok: false, error: "예상 편수를 선택해 주세요." };
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

  /**
   * 소개서가 나간 사실을 contact@h-grs.com 에 알린다. (2026-08-18)
   *
   * 사장님 지시 — 어드민을 열지 않고도 받은편지함에서 바로 회신하실 수 있어야
   * 한다. 그래서 `replyTo` 에 **문의한 분의 주소**를 박는다.
   *
   * ⚠️ 이 알림은 **이 경로(신규 접수)에만** 붙인다. 어드민의 [소개서 재발송]
   * 에는 붙이지 않는다 — 사장님이 직접 누르시는 것이고, 그때마다 알림이 또
   * 오면 소음이다. 배포 이전에 접수된 건에도 당연히 소급 발송하지 않는다.
   *
   * 발송 실패가 접수 실패로 번지지 않는다. 소개서와 같은 원칙이다.
   */
  const planLabel = INQUIRY_PLAN_LABEL[interest] ?? interest;
  const diag = diagnosis as {
    answers?: DiagAnswers;
    plan?: { label?: string; composition?: string };
    source?: string;
  } | null;

  const notice = inquiryNoticeMail({
    companyName,
    contactName,
    email,
    phone: phone || null,
    brandUrl: brandUrl || null,
    planLabel,
    // 편수를 묻지 않는 플랜에 "미정" 을 찍으면 고른 것처럼 읽힌다
    countLabel: needsCount(interest) ? (VOLUME_LABEL[volume] ?? volume) : null,
    from: INQUIRY_SOURCE_LABEL[diag?.source ?? ""] ?? "숏폼 랜딩 (/shortform)",
    checkLog: readDiagnosis(diag?.answers),
    recommended: diag?.plan?.label
      ? `${diag.plan.label}${diag.plan.composition ? ` (${diag.plan.composition})` : ""}`
      : null,
    message: message || null,
    sentTo: email,
  });

  await sendMail({
    kind: "inquiry_notice",
    to: "contact@h-grs.com",
    subject: notice.subject,
    html: notice.html,
    inquiryId: inserted.id,
    // 이 한 줄이 이 메일의 존재 이유다 — [답장] 이 고객에게 바로 간다
    replyTo: email,
  });

  return { ok: true, error: null };
}
