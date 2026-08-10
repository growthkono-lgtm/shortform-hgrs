import type { Metadata } from "next";
import Link from "next/link";
import { requireProfile } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { ChannelTalkIdentify } from "@/components/channel-talk-identify";
import { SERVICE } from "@/lib/constants";
import { LAST_SHORTS_STAGE, stageLabel } from "@/lib/stages";

/** 포털은 검색 노출 금지 (PART F13) */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function PortalLayout({ children }: LayoutProps<"/app">) {
  const profile = await requireProfile();

  // 상담 컨텍스트용 — 가장 최근 진행 프로젝트 한 건
  const supabase = await createClient();
  const { data: activeProject } = await supabase
    .from("projects")
    .select("id, stage_a, stage_b")
    .neq("stage_b", LAST_SHORTS_STAGE)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

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

      {/* 상담 들어올 때 누가 어느 단계에서 막혔는지 바로 보이게 (F11) */}
      <ChannelTalkIdentify
        profile={{
          memberId: profile.id,
          name: profile.contact_name,
          companyName: profile.company_name,
          activeProjectId: activeProject?.id,
          // 상담원이 읽는 값이라 내부 키가 아니라 화면과 같은 한글 단계명으로 넘긴다
          activeStage: activeProject
            ? stageLabel(activeProject.stage_a ?? activeProject.stage_b)
            : undefined,
        }}
      />
    </div>
  );
}
