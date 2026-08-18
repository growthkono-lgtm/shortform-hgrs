import type { Metadata } from "next";
import Link from "next/link";
import { requireProfile } from "@/lib/supabase/auth";
import { SERVICE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "브랜드 등록",
  robots: { index: false, follow: false },
};

export default async function OnboardingLayout({
  children,
}: LayoutProps<"/onboarding">) {
  await requireProfile();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-5 sm:px-8">
          <Link href="/app" className="text-sm font-bold">
            {SERVICE.name}
          </Link>
          <Link href="/app" className="text-sm text-muted hover:text-ink">
            나중에 하기
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:px-8">
        {children}
      </main>
    </div>
  );
}
