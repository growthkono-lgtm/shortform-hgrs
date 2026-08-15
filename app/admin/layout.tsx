import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth";
import { SERVICE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "어드민",
  robots: { index: false, follow: false },
};

/** 어드민 — role=admin 만. 판단은 서버에서 한다(프록시에 맡기지 않는다) */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line bg-paper-alt">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-5 text-sm">
            <span className="font-bold">{SERVICE.name} 어드민</span>
            <Link href="/admin" className="text-muted hover:text-ink">
              신청
            </Link>
            <Link href="/admin/projects" className="text-muted hover:text-ink">
              프로젝트
            </Link>
            <Link href="/admin/review" className="text-muted hover:text-ink">
              현황
            </Link>
            <Link href="/admin/workers" className="text-muted hover:text-ink">
              작업자
            </Link>
            <Link href="/admin/adfilm" className="text-muted hover:text-ink">
              AI 영상
            </Link>
            <Link href="/admin/blog" className="text-muted hover:text-ink">
              블로그
            </Link>
          </div>
          <Link href="/app" className="text-xs text-muted hover:text-ink">
            내 프로젝트로
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-8">
        {children}
      </main>
    </div>
  );
}
