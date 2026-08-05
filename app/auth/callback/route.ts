import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** 이메일 인증 링크 착지점. code를 세션으로 교환한 뒤 포털로 보낸다 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // open redirect 방지 — 내부 경로만 허용
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/app";
  return NextResponse.redirect(`${origin}${safeNext}`);
}
