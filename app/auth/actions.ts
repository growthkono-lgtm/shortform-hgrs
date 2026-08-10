"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { CONSENT_VERSION } from "@/lib/consents";

export type AuthState = { error: string | null };

/**
 * 가입은 3단계다 — **이메일 인증을 먼저 끝내고** 나머지를 채운다.
 *
 *   1) 이메일 입력 → 6자리 인증번호 발송
 *   2) 인증번호 확인 → 여기서 계정과 profiles 행이 먼저 생긴다(회사 정보는 빈 값)
 *   3) 비밀번호·회사명·담당자·직책·동의 입력 → [가입 완료] → 대시보드 또는 고르던 결제 화면
 *
 * 2)에서 이탈하면 `profiles.signup_completed = false`인 반쪽 계정이 남는다.
 * 같은 이메일로 다시 들어오면 1)~2)를 거쳐 3)부터 이어서 마칠 수 있다.
 *
 * 로그인은 이메일 + 비밀번호. 소셜 로그인은 열지 않는다 —
 * 회원 DB를 우리가 직접 들고 가야 이메일 마케팅·CRM이 가능하다.
 */
export type SignUpState = {
  step: 1 | 2 | 3;
  email: string;
  error: string | null;
  notice: string | null;
};


/** Supabase가 돌려주는 영문 메시지를 그대로 노출하지 않는다 */
function toKoreanMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
  if (m.includes("email not confirmed"))
    return "이메일 인증이 완료되지 않았습니다.";
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
 * 동의 이력 기록. 같은 버전 재기록은 unique 제약이 막는다.
 * 전문 원본은 lib/consents.ts가 버전별로 들고 있다.
 */
async function recordConsents(userId: string, marketingAgreed: boolean) {
  const head = await headers();
  const ip =
    head.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    head.get("x-real-ip") ??
    null;
  const userAgent = head.get("user-agent");

  const admin = createAdminClient();
  await admin.from("user_consents").upsert(
    [
      {
        user_id: userId,
        kind: "required",
        version: CONSENT_VERSION,
        agreed: true,
        ip_address: ip,
        user_agent: userAgent,
      },
      {
        user_id: userId,
        kind: "marketing",
        version: CONSENT_VERSION,
        agreed: marketingAgreed,
        ip_address: ip,
        user_agent: userAgent,
      },
    ],
    { onConflict: "user_id,kind,version", ignoreDuplicates: true },
  );
}

async function sendCode(email: string): Promise<string | null> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  return error ? toKoreanMessage(error.message) : null;
}

/**
 * 가입 폼 단일 액션. formData의 `intent`로 단계를 옮긴다 —
 * 단계를 클라이언트 상태로만 들고 있으면 새로고침 한 번에 인증이 날아간다.
 */
export async function signUpStep(
  prev: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const intent = String(formData.get("intent") ?? "");
  const keep = { ...prev, error: null, notice: null };

  // ── 이메일 다시 입력 ──
  if (intent === "edit_email") {
    return { step: 1, email: "", error: null, notice: null };
  }

  // ── 1단계: 인증번호 발송 ──
  if (intent === "send" || intent === "resend") {
    const email =
      intent === "resend"
        ? prev.email
        : String(formData.get("email") ?? "").trim().toLowerCase();

    if (!email) return { ...keep, step: 1, error: "이메일을 입력해 주세요." };
    // 이미 가입을 마친 이메일이면 인증번호를 보내지 않고 로그인으로 안내한다
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("profiles")
      .select("signup_completed")
      .eq("email", email)
      .maybeSingle();
    if (existing?.signup_completed) {
      return {
        ...keep,
        step: 1,
        error: "이미 가입된 이메일입니다. 로그인해 주세요.",
      };
    }

    const error = await sendCode(email);
    if (error) return { ...keep, step: 1, email, error };

    return {
      step: 2,
      email,
      error: null,
      notice:
        intent === "resend" ? "인증번호를 다시 보냈습니다." : null,
    };
  }

  // ── 2단계: 인증번호 확인 ──
  if (intent === "verify") {
    const token = String(formData.get("token") ?? "").replace(/\D/g, "");
    if (!prev.email)
      return { ...keep, step: 1, error: "이메일부터 입력해 주세요." };
    if (token.length !== 6)
      return { ...keep, step: 2, error: "6자리 인증번호를 입력해 주세요." };

    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: prev.email,
      token,
      type: "email",
    });
    if (error) return { ...keep, step: 2, error: toKoreanMessage(error.message) };

    return { step: 3, email: prev.email, error: null, notice: null };
  }

  // ── 3단계: 나머지 정보 + 동의 → 가입 완료 ──
  if (intent === "complete") {
    const password = String(formData.get("password") ?? "");
    const passwordConfirm = String(formData.get("password_confirm") ?? "");
    const companyName = String(formData.get("company_name") ?? "").trim();
    const contactName = String(formData.get("contact_name") ?? "").trim();
    const jobTitle = String(formData.get("job_title") ?? "").trim();
    const consentRequired = formData.get("consent_required") === "on";
    const consentMarketing = formData.get("consent_marketing") === "on";
    const next = safeNext(formData.get("next"));

    if (!password || !companyName || !contactName || !jobTitle) {
      return { ...keep, step: 3, error: "필수 항목을 모두 입력해 주세요." };
    }
    if (password.length < 8) {
      return { ...keep, step: 3, error: "비밀번호는 8자 이상이어야 합니다." };
    }
    if (password !== passwordConfirm) {
      return { ...keep, step: 3, error: "비밀번호가 서로 다릅니다." };
    }
    if (!consentRequired) {
      return {
        ...keep,
        step: 3,
        error: "필수 동의 항목에 동의해 주셔야 가입이 완료됩니다.",
      };
    }

    // 인증 단계에서 만들어진 세션이 있어야 한다
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    const userId = claimsData?.claims?.sub as string | undefined;
    if (!userId) {
      return {
        ...keep,
        step: 1,
        email: "",
        error: "인증이 만료되었습니다. 이메일 인증부터 다시 진행해 주세요.",
      };
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: {
        company_name: companyName,
        contact_name: contactName,
        job_title: jobTitle,
        marketing_opt_in: consentMarketing,
        consent_version: CONSENT_VERSION,
      },
    });
    if (updateError)
      return { ...keep, step: 3, error: toKoreanMessage(updateError.message) };

    // profiles 행은 인증 시점에 빈 값으로 만들어져 있다 → 여기서 채운다
    const admin = createAdminClient();
    const { error: profileError } = await admin
      .from("profiles")
      .update({
        company_name: companyName,
        contact_name: contactName,
        job_title: jobTitle,
        marketing_opt_in: consentMarketing,
        signup_completed: true,
      })
      .eq("id", userId);
    if (profileError)
      return { ...keep, step: 3, error: "가입 정보를 저장하지 못했습니다." };

    await recordConsents(userId, consentMarketing);

    revalidatePath("/", "layout");
    redirect(next);
  }

  return keep;
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
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: toKoreanMessage(error.message) };

  // 어드민이 그냥 로그인 화면으로 들어온 경우엔 어드민 보드로 보낸다.
  // 갈 곳을 지정해 온 경우(next)는 그 뜻을 존중한다
  let target = next;
  if (target === "/app" && data.user) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();
    if (profile?.role === "admin") target = "/admin";
  }

  revalidatePath("/", "layout");
  redirect(target);
}

/**
 * 인증번호 로그인 — 비밀번호가 기억나지 않을 때의 우회로이자,
 * 비밀번호 없이 만들어진 계정(어드민 등)의 유일한 입구다.
 * 단계는 가입 폼과 같은 방식으로 한 액션 안에서 넘긴다.
 */
export async function codeLogin(
  prev: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const intent = String(formData.get("intent") ?? "");
  const keep = { ...prev, error: null, notice: null };
  const next = safeNext(formData.get("next"));

  if (intent === "send" || intent === "resend") {
    const email =
      intent === "resend"
        ? prev.email
        : String(formData.get("email") ?? "").trim().toLowerCase();
    if (!email) return { ...keep, step: 1, error: "이메일을 입력해 주세요." };

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (error) return { ...keep, step: 1, email, error: toKoreanMessage(error.message) };

    return {
      step: 2,
      email,
      error: null,
      notice: intent === "resend" ? "인증번호를 다시 보냈습니다." : null,
    };
  }

  // 이미 번호를 받아 둔 경우 — 코드를 다시 보내지 않고 입력 칸으로만 넘어간다.
  // (메일은 받았는데 탭을 닫은 경우가 흔하고, 재발송은 시간당 한도를 깎는다)
  if (intent === "have_code") {
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    if (!email) return { ...keep, step: 1, error: "이메일을 입력해 주세요." };
    return { step: 2, email, error: null, notice: null };
  }

  if (intent === "verify") {
    const token = String(formData.get("token") ?? "").replace(/\D/g, "");
    if (!prev.email) return { ...keep, step: 1, error: "이메일부터 입력해 주세요." };
    if (token.length !== 6)
      return { ...keep, step: 2, error: "6자리 인증번호를 입력해 주세요." };

    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: prev.email,
      token,
      type: "email",
    });
    if (error) return { ...keep, step: 2, error: toKoreanMessage(error.message) };

    revalidatePath("/", "layout");
    redirect(next);
  }

  return keep;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
