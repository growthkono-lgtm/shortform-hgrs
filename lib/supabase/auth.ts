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
export async function requireProfile(next?: string): Promise<Profile> {
  const supabase = await createClient();

  // 어디로 가려다 막혔는지를 로그인 화면에 넘긴다.
  // 안 넘기면 로그인 후 무조건 /app 으로 떨어져 "어드민이 안 열린다"가 된다
  const login = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims) redirect(login);

  const userId = claimsData.claims.sub as string;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  // 트리거가 아직 행을 못 만든 극히 드문 경우 — 재로그인 유도
  if (!profile) redirect("/login?error=profile_missing");

  // 작업자 계정은 클라이언트 표면에 들어올 일이 없다.
  // 여기서 막지 않으면 /app 에서 회사명·플랜·금액을 그대로 보게 된다
  if (profile.role === "worker") redirect("/work");

  // 이메일 인증만 하고 이탈한 반쪽 계정 — 가입 마무리로 돌려보낸다
  if (!profile.signup_completed) redirect("/signup");

  return profile;
}

/**
 * 작업자 전용 가드.
 *
 * requireProfile 을 재사용하지 않는다 — 그쪽은 실패하면 `/login`·`/signup` 으로 보내는데
 * 작업자 호스트에서 그 경로는 404 다(proxy.ts). 막다른 골목이 된다.
 * 여기서는 언제나 `/work/login` 으로만 보낸다.
 */
export async function requireWorker(): Promise<Profile> {
  const supabase = await createClient();

  const { data: claimsData, error } = await supabase.auth.getClaims();
  if (error || !claimsData?.claims) redirect("/work/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", claimsData.claims.sub as string)
    .single();

  if (!profile || profile.role !== "worker") redirect("/work/login?error=denied");

  return profile;
}

/** admin 롤 전용 화면 가드 */
export async function requireAdmin(next = "/admin"): Promise<Profile> {
  const profile = await requireProfile(next);
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
