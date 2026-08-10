"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error: string | null };

/**
 * 인증은 비밀번호 없이 **이메일 인증번호(OTP)** 하나로 통일한다.
 * 가입: 이메일·회사명·담당자명·직책 입력 → 인증번호 발송 → 6자리 입력 → 가입 완료.
 * 로그인: 이메일 입력 → 인증번호 → 완료. 비밀번호를 만들지 않으니 잊을 것도 없다.
 *
 * ※ 인증번호가 메일에 찍히려면 Supabase Auth 이메일 템플릿에 `{{ .Token }}`이 있어야 한다.
 *   (magic link / confirm signup 두 템플릿 모두)
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
  if (m.includes("signups not allowed") || m.includes("user not found"))
    return "가입되지 않은 이메일입니다. 먼저 가입해 주세요.";
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

const verifyUrl = (email: string, next: string) =>
  `/verify?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`;

/** 가입 — 이메일·회사명·담당자명·직책을 받고 인증번호를 보낸다 */
export async function startSignUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const companyName = String(formData.get("company_name") ?? "").trim();
  const contactName = String(formData.get("contact_name") ?? "").trim();
  const jobTitle = String(formData.get("job_title") ?? "").trim();
  const marketingOptIn = formData.get("marketing_opt_in") === "on";
  const next = safeNext(formData.get("next"));

  if (!email || !companyName || !contactName || !jobTitle) {
    return { error: "필수 항목을 모두 입력해 주세요." };
  }
  if (CONSUMER_DOMAINS.has(emailDomain(email))) {
    return {
      error:
        "회사 이메일로 가입해 주세요. 개인 메일(gmail·naver 등)은 사용할 수 없습니다.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      // profiles 행은 on_auth_user_created 트리거가 이 값들로 만든다.
      // 인가 판단에는 절대 쓰지 않는다 — user_metadata는 사용자가 수정 가능하다
      data: {
        company_name: companyName,
        contact_name: contactName,
        job_title: jobTitle,
        marketing_opt_in: marketingOptIn,
      },
    },
  });

  if (error) return { error: toKoreanMessage(error.message) };

  redirect(verifyUrl(email, next));
}

/** 로그인 — 가입된 이메일에만 인증번호를 보낸다 */
export async function startSignIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = safeNext(formData.get("next"));

  if (!email) return { error: "이메일을 입력해 주세요." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });

  if (error) return { error: toKoreanMessage(error.message) };

  redirect(verifyUrl(email, next));
}

/** 인증번호 확인 — 가입/로그인 공통 */
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
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });

  if (error) return { error: toKoreanMessage(error.message) };

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
