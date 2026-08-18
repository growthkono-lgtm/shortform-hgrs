import type { Metadata } from "next";
import {
  DashboardView,
  type DashboardData,
} from "@/components/portal/dashboard-view";
import { SERVICE } from "@/lib/constants";

/**
 * 대시보드 미리보기 — 가입·결제를 거치지 않고 실제 화면 그대로 확인하는 경로.
 *
 * **화면에 "미리보기"라고 적지 않는다.** 클라이언트가 보게 될 화면을 그대로 봐야
 * 판단이 되기 때문이다. 실데이터는 읽지 않고 아래 예시값만 그린다. noindex.
 */
export const metadata: Metadata = {
  title: "내 대시보드",
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
    projectId: "preview",
    planLabel: "그로스 패키지",
    composition: "인플루언서 20 + 숏폼 10",
    startedAt: "2026-08-01",
    stageA: "recruiting",
    stageB: "planning",
    shortsCount: 10,
    influencerCount: 20,
  },
  guideline: null,
  clientNote: null,
  shipments: [],
  contents: [],
  candidates: [],
  deliverables: [],
  seedingDriveLink: null,
  finalDriveLink: null,
  history: [
    { id: "1", label: "그로스 패키지", startedAt: "2026-08-01", done: false },
    { id: "2", label: "스타터", startedAt: "2026-06-12", done: true },
  ],
};

export default function DashboardPreviewPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* /app 레이아웃과 같은 헤더. 링크만 동작하지 않는다 */}
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <span className="text-sm font-bold">{SERVICE.name}</span>

          <div className="flex items-center gap-5 text-sm">
            <span className="hidden text-muted sm:inline">
              {DEMO.account.companyName}
            </span>
            <span className="text-muted">설정</span>
            <span className="text-muted">로그아웃</span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12 sm:px-8">
        <DashboardView data={DEMO} readOnly />
      </main>
    </div>
  );
}
