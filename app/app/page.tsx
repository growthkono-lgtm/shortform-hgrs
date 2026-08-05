import Link from "next/link";
import { requireProfile } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

const STAGE_LABEL: Record<string, string> = {
  waiting: "진행 대기",
  reviewing: "담당자 확인중",
  recruiting: "인플루언서 모집중",
  distributed: "배포완료",
  guideline: "가이드라인 기획중",
  targeting: "광고 타겟 체크",
  producing: "숏폼 제작중",
  review: "완성본 확인",
  final: "최종 확인",
  done: "완료",
};

export default async function PortalHome() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, type, stage_a, stage_b, created_at")
    .order("created_at", { ascending: false });

  const { data: brands } = await supabase
    .from("brand_profiles")
    .select("id, brand_name")
    .order("created_at", { ascending: false });

  return (
    <>
      <p className="eyebrow">My Projects</p>
      <h1 className="mt-4 text-3xl font-bold">
        {profile.contact_name}님, 안녕하세요
      </h1>

      {/* 브랜드 프로필 온보딩 (PART E1) — 최초 1회 */}
      {(!brands || brands.length === 0) && (
        <div className="mt-8 rounded-2xl border border-accent/40 bg-accent/[0.06] p-6">
          <p className="text-base font-bold text-accent-deep">
            먼저 브랜드 프로필을 등록해 주세요
          </p>
          <p className="mt-2 text-sm leading-[1.7] text-muted">
            상세페이지 URL만 넣으시면 그로스 AI가 브랜드 소개·핵심 USP·타겟을 정리해
            드립니다. 한 번 등록해두면 이후 모든 주문에서 그대로 재사용됩니다.
          </p>
          <Link
            href="/onboarding"
            className="mt-5 inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-paper"
          >
            브랜드 등록하기
          </Link>
        </div>
      )}

      <section className="mt-12">
        <h2 className="text-lg font-bold">진행 중인 프로젝트</h2>

        {!projects || projects.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-line bg-paper-alt p-8 text-center">
            <p className="text-sm text-muted">아직 진행 중인 프로젝트가 없습니다.</p>
            <Link
              href="/#pricing"
              className="mt-5 inline-flex rounded-full border border-ink/20 px-5 py-2.5 text-sm font-bold hover:border-ink"
            >
              플랜 보기
            </Link>
          </div>
        ) : (
          <ul className="mt-5 space-y-3">
            {projects.map((project) => {
              const stage = project.stage_a ?? project.stage_b;
              return (
                <li key={project.id}>
                  <Link
                    href={`/app/projects/${project.id}`}
                    className="flex items-center justify-between rounded-2xl border border-line bg-paper p-5 transition-colors duration-200 hover:border-ink/40"
                  >
                    <div>
                      <p className="text-sm font-bold">
                        {project.type === "full"
                          ? "풀 파이프라인"
                          : "전환 숏폼 단독"}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {new Date(project.created_at).toLocaleDateString("ko-KR")} 시작
                      </p>
                    </div>
                    <span className="rounded-full bg-paper-alt px-3 py-1.5 text-xs font-bold">
                      {STAGE_LABEL[stage] ?? stage}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {brands && brands.length > 0 && (
        <section className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">등록된 브랜드</h2>
            <Link href="/onboarding" className="text-sm text-muted hover:text-ink">
              + 브랜드 추가
            </Link>
          </div>
          <ul className="mt-5 flex flex-wrap gap-2">
            {brands.map((brand) => (
              <li
                key={brand.id}
                className="rounded-full border border-line px-4 py-2 text-sm"
              >
                {brand.brand_name}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
