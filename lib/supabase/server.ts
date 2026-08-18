import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

/** 서버 컴포넌트·라우트 핸들러·서버 액션용 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // 서버 컴포넌트에서는 쿠키를 쓸 수 없다.
            // 세션 갱신은 proxy.ts가 담당하므로 여기선 무시해도 안전하다.
          }
        },
      },
    },
  );
}

/**
 * 공개 데이터 전용 — 쿠키를 읽지 않는다.
 *
 * `generateStaticParams` 와 사이트맵은 **빌드 시점**에 도는데, 그때는 HTTP 요청이
 * 없어서 `cookies()` 를 부르면 에러가 난다(2026-08-13 블로그 빌드 실패).
 * 로그인 세션이 필요 없는 공개 글 목록은 이 클라이언트로 읽는다.
 *
 * anon 키라 RLS 가 그대로 걸린다 — 발행분만 보인다. 초안이 샐 경로가 없다.
 */
export function createPublicClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  );
}

/**
 * RLS를 우회하는 관리자 클라이언트.
 * 상태 전이·결제 승인 등 server route 전용. 절대 클라이언트로 새어나가면 안 된다.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다");

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    {
      cookies: { getAll: () => [], setAll: () => {} },
    },
  );
}
