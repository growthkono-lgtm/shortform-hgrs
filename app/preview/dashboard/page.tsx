import type { Metadata } from "next";
import Link from "next/link";
import { DashboardView, type DashboardData } from "@/components/portal/dashboard-view";
import { SERVICE } from "@/lib/constants";

/**
 * 대시보드 미리보기 — 가입·결제를 거치지 않고 화면만 확인하는 용도.
 * 실데이터를 읽지 않는다. 여기 값은 전부 아래 하드코딩된 예시다.
 */
export const metadata: Metadata = {
  title: "대시보드 미리보기",
  robots: { index: false, follow: false },
};

const DEMO: DashboardData = {
  account: {
    contactName: "김데모",
    email: "demo@brand.co.kr",
    companyName: "(주)데모브랜드",
    jobTitle: "마케팅 팀장",
  },
  plan: {
    label: "그로스 패키지",
    composition: "인플루언서 20 + 숏폼 10",
    startedAt: "2026-08-01",
    amount: 2_880_000,
  },
  brands: ["데모브랜드", "데모랩스"],
  campaign: {
    planLabel: "그로스 패키지",
    composition: "인플루언서 20 + 숏폼 10",
    startedAt: "2026-08-01",
    stageA: "recruiting",
    stageB: "planning",
  },
  history: [
    { id: "1", label: "그로스 패키지", startedAt: "2026-08-01", done: false },
    { id: "2", label: "스타터", startedAt: "2026-06-12", done: true },
  ],
};

export default function DashboardPreviewPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="text-sm font-bold">
            {SERVICE.name}
          </Link>
          <span className="rounded-full bg-accent/[0.12] px-3.5 py-1.5 text-xs font-bold text-accent-deep">
            미리보기
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12 sm:px-8">
        <div className="mb-8 rounded-2xl border border-line bg-paper-alt px-5 py-4 text-xs leading-[1.7] text-muted">
          로그인한 광고주가 보는 화면입니다.{" "}
          <strong className="font-bold text-ink">
            여기 데이터는 전부 예시
          </strong>
          이며 실제 계정·주문과 무관합니다. 실제 화면은 가입 후{" "}
          <code className="rounded bg-paper px-1.5 py-0.5">/app</code> 에서
          같은 구성으로 나타납니다.
        </div>

        <DashboardView data={DEMO} readOnly />
      </main>
    </div>
  );
}
