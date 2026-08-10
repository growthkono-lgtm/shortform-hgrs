import { redirect } from "next/navigation";
import { createClient } from "./server";
import type { Database } from "./database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * 로그인 사용자의 profiles 행을 돌려준다. 없으면 /login으로 보낸다.
 *
 * getClaims()를 쓴다 — getSession()은 저장된 토큰을 검증 없이 돌려주므로
 * 서버 인가 판단에 쓰면 안 된다.
 */
export async function requireProfile(): Promise<Profile> {
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims) redirect("/login");

  const userId = claimsData.claims.sub as string;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  // 트리거가 아직 행을 못 만든 극히 드문 경우 — 재로그인 유도
  if (!profile) redirect("/login?error=profile_missing");

  // 이메일 인증만 하고 이탈한 반쪽 계정 — 가입 마무리로 돌려보낸다
  if (!profile.signup_completed) redirect("/signup");

  return profile;
}

/** admin 롤 전용 화면 가드 */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/app");
  return profile;
}

/** 로그인 여부만 알면 될 때 (헤더 등). 리다이렉트하지 않는다 */
export async function getOptionalProfile(): Promise<Profile | null> {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  // 가입을 마치지 않은 계정은 로그인하지 않은 것으로 본다
  return profile?.signup_completed ? profile : null;
}
