"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error: string | null };

/** Supabase가 돌려주는 영문 메시지를 그대로 노출하지 않는다 */
function toKoreanMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
  if (m.includes("email not confirmed"))
    return "이메일 인증이 완료되지 않았습니다. 받은 메일함을 확인해 주세요.";
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "이미 가입된 이메일입니다. 로그인해 주세요.";
  if (m.includes("password should be at least"))
    return "비밀번호는 8자 이상이어야 합니다.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.";
  return "처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.";
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력해 주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: toKoreanMessage(error.message) };

  revalidatePath("/", "layout");
  redirect("/app");
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const companyName = String(formData.get("company_name") ?? "").trim();
  const contactName = String(formData.get("contact_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const marketingOptIn = formData.get("marketing_opt_in") === "on";

  if (!email || !password || !companyName || !contactName) {
    return { error: "필수 항목을 모두 입력해 주세요." };
  }
  if (password.length < 8) {
    return { error: "비밀번호는 8자 이상이어야 합니다." };
  }

  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      // profiles 행은 on_auth_user_created 트리거가 이 값들로 생성한다.
      // 인가 판단에는 절대 쓰지 않는다 — user_metadata는 사용자가 수정 가능하다
      data: {
        company_name: companyName,
        contact_name: contactName,
        phone: phone || null,
        marketing_opt_in: marketingOptIn,
      },
    },
  });

  if (error) return { error: toKoreanMessage(error.message) };

  // 이메일 인증이 켜져 있으면 세션 없이 돌아온다 → 안내 화면으로
  if (!data.session) {
    redirect(`/signup/check-email?email=${encodeURIComponent(email)}`);
  }

  revalidatePath("/", "layout");
  redirect("/app");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
