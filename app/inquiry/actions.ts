"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { CONSENT_VERSION } from "@/lib/consents";

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
  const { error } = await admin.from("inquiries").insert({
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
  });

  if (error) {
    return { ok: false, error: "접수 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요." };
  }

  return { ok: true, error: null };
}
