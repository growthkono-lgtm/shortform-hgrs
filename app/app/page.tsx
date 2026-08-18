import { requireProfile } from "@/lib/supabase/auth";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  DashboardView,
  type DashboardData,
} from "@/components/portal/dashboard-view";
import { LAST_SHORTS_STAGE } from "@/lib/stages";

/**
 * 포털 홈 = 광고주 대시보드. 그리는 일은 DashboardView가 하고,
 * 여기서는 로그인 사용자의 실데이터를 모아 넘기기만 한다.
 *
 * 후보·산출물은 RLS로 자기 것만 보이지만, 조인이 많아 admin 클라이언트로 한 번에 읽고
 * **project.user_id 로 직접 필터**한다. 남의 프로젝트 id가 섞일 여지를 만들지 않는다.
 */
export default async function PortalHome() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const email = (claimsData?.claims?.email as string | undefined) ?? "";

  const admin = createAdminClient();
  const { data: projects } = await admin
    .from("projects")
    .select(
      "id, type, stage_a, stage_b, created_at, started_at, plans(label, composition, shorts_count, influencer_count), orders(paid_at, amount)",
    )
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  const { data: brands } = await supabase
    .from("brand_profiles")
    .select("id, brand_name")
    .order("created_at", { ascending: false });

  const current =
    projects?.find((p) => p.stage_b !== LAST_SHORTS_STAGE) ??
    projects?.[0] ??
    null;
  const plan = current?.plans ?? null;
  const startedAt =
    current?.started_at ??
    current?.orders?.paid_at ??
    current?.created_at ??
    null;

  // 진행중 프로젝트에 딸린 것들만 읽는다
  const [
    { data: guideline },
    { data: candidates },
    { data: deliverables },
    { data: grants },
    { data: brief },
    { data: shipments },
    { data: contents },
  ] = current
    ? await Promise.all([
        admin
          .from("project_guidelines")
          .select("*")
          .eq("project_id", current.id)
          .maybeSingle(),
        admin
          .from("influencer_candidates")
          .select("*")
          .eq("project_id", current.id)
          .order("sort_order")
          .order("created_at"),
        admin
          .from("deliverables")
          .select("*, revision_requests(id)")
          .eq("project_id", current.id)
          .order("seq"),
        admin
          .from("drive_grants")
          .select("kind, drive_link")
          .eq("project_id", current.id),
        admin
          .from("work_briefs")
          .select("client_note")
          .eq("project_id", current.id)
          .maybeSingle(),
        admin
          .from("seeding_shipments")
          .select("*")
          .eq("project_id", current.id)
          .order("sort_order"),
        admin
          .from("influencer_contents")
          .select("*")
          .eq("project_id", current.id)
          .order("posted_at", { ascending: false, nullsFirst: false }),
      ])
    : [
        { data: null },
        { data: [] },
        { data: [] },
        { data: [] },
        { data: null },
        { data: [] },
        { data: [] },
      ];

  const data: DashboardData = {
    account: {
      contactName: profile.contact_name,
      email,
      companyName: profile.company_name,
      jobTitle: profile.job_title,
    },
    plan: plan
      ? {
          label: plan.label,
          composition: plan.composition,
          startedAt,
          amount: current?.orders?.amount ?? null,
        }
      : null,
    brands: (brands ?? []).map((b) => b.brand_name),
    campaign: current
      ? {
          projectId: current.id,
          planLabel: plan?.label ?? "캠페인",
          composition: plan?.composition ?? "",
          startedAt,
          stageA: current.stage_a,
          stageB: current.stage_b,
          shortsCount: plan?.shorts_count ?? 0,
          influencerCount: plan?.influencer_count ?? 0,
        }
      : null,
    guideline: guideline ?? null,
    clientNote: brief?.client_note ?? null,
    shipments: shipments ?? [],
    contents: contents ?? [],
    candidates: candidates ?? [],
    deliverables: (deliverables ?? [])
      // 아직 아무것도 안 올라온 칸은 감춘다 — 빈 카드가 줄줄이 보이면 진행이 멈춘 것처럼 읽힌다
      .filter((d) => d.preview_url || d.status !== "producing")
      .map((d) => ({
        id: d.id,
        seq: d.seq,
        title: d.title,
        preview_url: d.preview_url,
        status: d.status,
        revised: (d.revision_requests?.length ?? 0) > 0,
      })),
    seedingDriveLink:
      grants?.find((g) => g.kind === "seeding")?.drive_link ?? null,
    finalDriveLink: grants?.find((g) => g.kind === "final")?.drive_link ?? null,
    history: (projects ?? []).map((p) => ({
      id: p.id,
      label:
        p.plans?.label ?? (p.type === "full" ? "패키지 플랜" : "싱글 플랜"),
      startedAt: p.started_at ?? p.orders?.paid_at ?? p.created_at,
      done: p.stage_b === LAST_SHORTS_STAGE,
    })),
  };

  /**
   * 그로스 AI 브랜드 프로필 배너를 걷어냈다. (2026-08-14)
   *
   * "상세페이지 URL 만 넣으면 AI 가 정리해 드립니다" 는 자리를 두 번 만들었다 —
   * 여기서 한 번, 아래 [브랜드 · 제품] 칸에서 또 한 번. 클라이언트는 어디에
   * 쓰라는 건지 헷갈리고, AI 가 정리한 요약은 어차피 제작에 못 쓴다.
   * 사장님 판단: **필요한 건 클라이언트가 직접 적는 링크·가격·옵션·프로모션**이고,
   * 그게 그대로 작업자에게 넘어가야 한다. 정리는 사람이 읽고 하면 된다.
   */
  return <DashboardView data={data} />;
}
