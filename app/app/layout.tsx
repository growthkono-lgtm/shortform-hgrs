import type { Metadata } from "next";
import Link from "next/link";
import { requireProfile } from "@/lib/supabase/auth";
import { KakaoConsult } from "@/components/kakao-consult";
import { SERVICE } from "@/lib/constants";

/** 포털은 검색 노출 금지 (PART F13) */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * 상담 컨텍스트(누가·어느 단계)를 미리 읽던 쿼리를 걷어냈다. (2026-08-14)
 *
 * 채널톡은 위젯 부팅 때 프로필을 실어 보낼 수 있어서 그 값이 쓸모가 있었지만,
 * 카카오 채널은 링크 하나로 열리고 우리가 붙일 수 있는 값이 없다.
 * 쓰지도 않을 조회를 모든 포털 페이지에서 한 번씩 돌릴 이유가 없다.
 *
 * 대신 누가 문의했는지는 카카오 상담창에서 물어보거나, 어드민에서
 * 이메일로 찾는다 — 지금 검색이 붙어 있다.
 */
export default async function PortalLayout({ children }: LayoutProps<"/app">) {
  const profile = await requireProfile();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/app" className="text-sm font-bold">
            {SERVICE.name}
          </Link>

          <div className="flex items-center gap-5 text-sm">
            <span className="hidden text-muted sm:inline">
              {profile.company_name}
            </span>
            {profile.role === "admin" && (
              <Link href="/admin" className="font-bold text-accent-deep">
                어드민
              </Link>
            )}
            <Link href="/app/settings" className="text-muted hover:text-ink">
              설정
            </Link>
            <form action="/auth/signout" method="post">
              <button type="submit" className="text-muted hover:text-ink">
                로그아웃
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* 대시보드가 좌(계정·플랜) + 우(캠페인) 두 열이라 5xl로는 좁다 */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12 sm:px-8">
        {children}
      </main>

      {/* 위젯은 루트가 아니라 표면별로 붙인다 — 작업자 대시보드에는 올라가면 안 된다 */}
      <KakaoConsult />

    </div>
  );
}
