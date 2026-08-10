import Link from "next/link";
import { requireProfile } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardView, type DashboardData } from "@/components/portal/dashboard-view";
import { LAST_SHORTS_STAGE } from "@/lib/stages";

/**
 * 포털 홈 = 광고주 대시보드. 그리는 일은 DashboardView가 하고,
 * 여기서는 로그인 사용자의 실데이터를 모아 넘기기만 한다.
 */
export default async function PortalHome() {
  const profile = await requireProfile();
  const supabase = await createClient();

  // 로그인 아이디(이메일)는 profiles가 아니라 토큰 클레임에 있다
  const { data: claimsData } = await supabase.auth.getClaims();
  const email = (claimsData?.claims?.email as string | undefined) ?? "";

  const { data: projects } = await supabase
    .from("projects")
    .select(
      "id, type, stage_a, stage_b, created_at, orders(paid_at, amount, plans(label, composition))",
    )
    .order("created_at", { ascending: false });

  const { data: brands } = await supabase
    .from("brand_profiles")
    .select("id, brand_name")
    .order("created_at", { ascending: false });

  const current =
    projects?.find((p) => p.stage_b !== LAST_SHORTS_STAGE) ?? projects?.[0] ?? null;
  const currentPlan = current?.orders?.plans ?? null;
  const startedAt = current?.orders?.paid_at ?? current?.created_at ?? null;

  const data: DashboardData = {
    account: {
      contactName: profile.contact_name,
      email,
      companyName: profile.company_name,
      jobTitle: profile.job_title,
    },
    plan: currentPlan
      ? {
          label: currentPlan.label,
          composition: currentPlan.composition,
          startedAt,
          amount: current?.orders?.amount ?? null,
        }
      : null,
    brands: (brands ?? []).map((b) => b.brand_name),
    campaign: current
      ? {
          planLabel: currentPlan?.label ?? "캠페인",
          composition: currentPlan?.composition ?? "",
          startedAt,
          stageA: current.stage_a,
          stageB: current.stage_b,
        }
      : null,
    history: (projects ?? []).map((p) => ({
      id: p.id,
      label:
        p.orders?.plans?.label ??
        (p.type === "full" ? "패키지 플랜" : "싱글 플랜"),
      startedAt: p.orders?.paid_at ?? p.created_at,
      done: p.stage_b === LAST_SHORTS_STAGE,
    })),
  };

  return (
    <>
      {/* 브랜드 프로필 온보딩 (PART E1) — 최초 1회 */}
      {(!brands || brands.length === 0) && (
        <div className="mb-8 rounded-2xl border border-accent/40 bg-accent/[0.06] p-6">
          <p className="text-sm font-bold text-accent-deep">
            먼저 브랜드 프로필을 등록해 주세요
          </p>
          <p className="mt-2 text-xs leading-[1.7] text-muted">
            상세페이지 URL만 넣으시면 그로스 AI가 브랜드 소개·핵심 USP·타겟을 정리해
            드립니다. 한 번 등록해두면 이후 모든 주문에서 재사용됩니다.
          </p>
          <Link
            href="/onboarding"
            className="mt-4 inline-flex rounded-full bg-ink px-4 py-2 text-xs font-bold text-paper"
          >
            브랜드 등록하기
          </Link>
        </div>
      )}

      <DashboardView data={data} />
    </>
  );
}
