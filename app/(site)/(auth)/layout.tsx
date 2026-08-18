import Link from "next/link";
import { SERVICE } from "@/lib/constants";

/** 인증 화면 공통 껍데기 — 랜딩 헤더/푸터 없이 단순하게 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col px-5 py-10 sm:px-8">
      <header>
        <Link href="/" className="text-sm font-bold">
          {SERVICE.name}
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
