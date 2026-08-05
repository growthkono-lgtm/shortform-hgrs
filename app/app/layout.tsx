import type { Metadata } from "next";
import Link from "next/link";
import { requireProfile } from "@/lib/supabase/auth";
import { SERVICE } from "@/lib/constants";

/** 포털은 검색 노출 금지 (PART F13) */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function PortalLayout({ children }: LayoutProps<"/app">) {
  const profile = await requireProfile();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5 sm:px-8">
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

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12 sm:px-8">
        {children}
      </main>
    </div>
  );
}
