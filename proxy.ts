import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16에서 Middleware는 Proxy로 이름이 바뀌었다 (동작은 동일).
 *
 * 여기서는 **세션 토큰 갱신만** 한다.
 * 실제 접근 제어는 각 레이아웃(/app, /admin)에서 getClaims()로 판단한다 —
 * Next 문서가 proxy를 전체 인증 해법으로 쓰지 말라고 명시하고 있어서다.
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // 만료 임박 토큰을 갱신하고 새 쿠키를 응답에 실어 보낸다
  await supabase.auth.getClaims();

  return response;
}

export const config = {
  matcher: [
    // 정적 자산과 이미지 최적화 경로는 제외
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|woff2)$).*)",
  ],
};
