"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { CONSENT_VERSION } from "@/lib/consents";

export type AuthState = { error: string | null };

/**
 * 인증 방식: **이메일 + 비밀번호**. 소셜 로그인은 열지 않는다 —
 * 회원 DB를 우리가 직접 들고 가야 이메일 마케팅·CRM이 가능하다.
 * 가입 마지막에 이메일로 6자리 인증번호를 보내 주소 소유만 한 번 확인한다.
 *
 * ※ 인증번호가 메일에 찍히려면 Supabase Auth 템플릿에 `{{ .Token }}`이 있어야 한다(적용 완료).
 */

/** 개인 메일 도메인 — 회사 이메일로만 받는다 */
const CONSUMER_DOMAINS = new Set([
  "gmail.com",
  "naver.com",
  "daum.net",
  "hanmail.net",
  "nate.com",
  "kakao.com",
  "hotmail.com",
  "outlook.com",
  "outlook.kr",
  "yahoo.com",
  "yahoo.co.kr",
  "icloud.com",
  "me.com",
  "live.com",
  "msn.com",
  "proton.me",
  "protonmail.com",
  "korea.com",
  "empas.com",
  "hanmir.com",
  "dreamwiz.com",
  "tutanota.com",
]);

function emailDomain(email: string) {
  return email.split("@")[1]?.toLowerCase() ?? "";
}

/** Supabase가 돌려주는 영문 메시지를 그대로 노출하지 않는다 */
function toKoreanMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
  if (m.includes("email not confirmed"))
    return "이메일 인증이 완료되지 않았습니다. 가입 시 받으신 인증번호로 인증을 마쳐 주세요.";
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "이미 가입된 이메일입니다. 로그인해 주세요.";
  if (m.includes("password should be at least"))
    return "비밀번호는 8자 이상이어야 합니다.";
  if (m.includes("token has expired") || m.includes("expired"))
    return "인증번호가 만료되었습니다. 다시 받아 주세요.";
  if (m.includes("invalid") && m.includes("token"))
    return "인증번호가 올바르지 않습니다. 다시 확인해 주세요.";
  if (m.includes("rate limit") || m.includes("too many") || m.includes("security purposes"))
    return "요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.";
  if (m.includes("invalid") && m.includes("email"))
    return "이메일 주소를 다시 확인해 주세요.";
  return "처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.";
}

/** 열린 리다이렉트 차단 — 앱 내부 경로만 허용 */
function safeNext(next: unknown): string {
  const value = typeof next === "string" ? next : "";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/app";
}

/**
 * 동의 이력 기록. 가입 폼에서 받은 값을 user_metadata로 넘겨 두었다가
 * 인증이 끝나 사용자 행이 확정된 시점에 IP·UA와 함께 남긴다.
 * 같은 버전 재기록은 unique 제약이 막는다.
 */
async function recordConsents(userId: string, marketingAgreed: boolean) {
  const head = await headers();
  const ip =
    head.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    head.get("x-real-ip") ??
    null;

  const admin = createAdminClient();
  await admin.from("user_consents").upsert(
    [
      {
        user_id: userId,
        kind: "required",
        version: CONSENT_VERSION,
        agreed: true,
        ip_address: ip,
        user_agent: head.get("user-agent"),
      },
      {
        user_id: userId,
        kind: "marketing",
        version: CONSENT_VERSION,
        agreed: marketingAgreed,
        ip_address: ip,
        user_agent: head.get("user-agent"),
      },
    ],
    { onConflict: "user_id,kind,version", ignoreDuplicates: true },
  );
}

/** 가입 — 이메일·비밀번호·회사 정보·동의를 받고 인증번호를 보낸다 */
export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("password_confirm") ?? "");
  const companyName = String(formData.get("company_name") ?? "").trim();
  const contactName = String(formData.get("contact_name") ?? "").trim();
  const jobTitle = String(formData.get("job_title") ?? "").trim();
  const consentRequired = formData.get("consent_required") === "on";
  const consentMarketing = formData.get("consent_marketing") === "on";
  const next = safeNext(formData.get("next"));

  if (!email || !password || !companyName || !contactName || !jobTitle) {
    return { error: "필수 항목을 모두 입력해 주세요." };
  }
  if (password.length < 8) {
    return { error: "비밀번호는 8자 이상이어야 합니다." };
  }
  if (password !== passwordConfirm) {
    return { error: "비밀번호가 서로 다릅니다." };
  }
  if (CONSUMER_DOMAINS.has(emailDomain(email))) {
    return {
      error:
        "회사 이메일로 가입해 주세요. 개인 메일(gmail·naver 등)은 사용할 수 없습니다.",
    };
  }
  if (!consentRequired) {
    return { error: "필수 동의 항목에 동의해 주셔야 가입이 가능합니다." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // profiles 행은 on_auth_user_created 트리거가 이 값들로 만든다.
      // 인가 판단에는 절대 쓰지 않는다 — user_metadata는 사용자가 수정 가능하다
      data: {
        company_name: companyName,
        contact_name: contactName,
        job_title: jobTitle,
        marketing_opt_in: consentMarketing,
        consent_version: CONSENT_VERSION,
      },
    },
  });

  if (error) return { error: toKoreanMessage(error.message) };

  // 이메일 인증이 꺼져 있으면 바로 세션이 온다
  if (data.session && data.user) {
    await recordConsents(data.user.id, consentMarketing);
    revalidatePath("/", "layout");
    redirect(next);
  }

  redirect(
    `/verify?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`,
  );
}

/** 로그인 — 이메일 + 비밀번호 */
export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력해 주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: toKoreanMessage(error.message) };

  revalidatePath("/", "layout");
  redirect(next);
}

/** 가입 마지막 단계 — 이메일로 받은 6자리 인증번호 확인 */
export async function verifyCode(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const token = String(formData.get("token") ?? "").replace(/\D/g, "");
  const next = safeNext(formData.get("next"));

  if (!email) return { error: "이메일 정보가 없습니다. 처음부터 다시 진행해 주세요." };
  if (token.length !== 6) return { error: "6자리 인증번호를 입력해 주세요." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "signup",
  });

  if (error) return { error: toKoreanMessage(error.message) };

  if (data.user) {
    const marketing = data.user.user_metadata?.marketing_opt_in === true;
    await recordConsents(data.user.id, marketing);
  }

  revalidatePath("/", "layout");
  redirect(next);
}

/** 인증번호 재발송 */
export async function resendCode(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "이메일 정보가 없습니다." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email });

  if (error) return { error: toKoreanMessage(error.message) };
  return { error: null };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
