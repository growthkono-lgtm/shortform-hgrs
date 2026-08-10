import Link from "next/link";
import { requireProfile } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { StageTrack } from "@/components/portal/stage-track";
import {
  SEEDING_STAGES,
  SHORTS_STAGES,
  TRACK_LABEL,
  LAST_SHORTS_STAGE,
} from "@/lib/stages";
import { formatKRW } from "@/lib/plans";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

/**
 * 포털 홈 = 광고주 대시보드.
 *
 * 좌: 내 계정(아이디·닉네임) → 구매한 플랜·진행 시작일
 * 우: 진행중인 캠페인 → 플랜명 → 두 트랙의 단계
 * 고객이 여기서 확인하려는 건 딱 하나다 — "지금 어디까지 왔나".
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

  const active = projects?.find((p) => p.stage_b !== LAST_SHORTS_STAGE);
  const current = active ?? projects?.[0] ?? null;
  const currentPlan = current?.orders?.plans ?? null;
  const startedAt = current?.orders?.paid_at ?? current?.created_at ?? null;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] lg:gap-10">
      {/* ── 좌: 계정 + 구매한 플랜 ── */}
      <aside className="space-y-5 lg:sticky lg:top-8 lg:self-start">
        <section className="rounded-2xl border border-line bg-paper-alt p-6">
          <p className="eyebrow">Account</p>
          <p className="mt-4 text-base font-bold">{profile.contact_name}</p>
          <p className="mt-1 text-xs break-all text-muted">{email}</p>

          <dl className="mt-5 space-y-2 border-t border-line pt-4 text-xs">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">회사</dt>
              <dd className="text-right font-bold">{profile.company_name}</dd>
            </div>
            {profile.job_title && (
              <div className="flex justify-between gap-3">
                <dt className="text-muted">직책</dt>
                <dd className="text-right font-bold">{profile.job_title}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className="rounded-2xl border border-line bg-paper p-6">
          <p className="eyebrow">Plan</p>

          {currentPlan ? (
            <>
              <p className="mt-4 text-base font-bold">{currentPlan.label}</p>
              <p className="mt-1 text-xs text-muted">{currentPlan.composition}</p>

              <dl className="mt-5 space-y-2 border-t border-line pt-4 text-xs">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">진행 시작일</dt>
                  <dd className="text-right font-bold">
                    {startedAt ? formatDate(startedAt) : "—"}
                  </dd>
                </div>
                {current?.orders?.amount != null && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">결제 금액</dt>
                    <dd className="stat-figure text-right">
                      {formatKRW(current.orders.amount)}
                    </dd>
                  </div>
                )}
              </dl>
            </>
          ) : (
            <>
              <p className="mt-4 text-sm text-muted">
                아직 구매하신 플랜이 없습니다.
              </p>
              <Link
                href="/#pricing"
                className="mt-4 inline-flex rounded-full border border-ink/20 px-4 py-2 text-xs font-bold hover:border-ink"
              >
                플랜 보기
              </Link>
            </>
          )}
        </section>

        {brands && brands.length > 0 && (
          <section className="rounded-2xl border border-line bg-paper p-6">
            <div className="flex items-center justify-between">
              <p className="eyebrow">Brand</p>
              <Link href="/onboarding" className="text-xs text-muted hover:text-ink">
                + 추가
              </Link>
            </div>
            <ul className="mt-4 space-y-1.5 text-sm">
              {brands.map((brand) => (
                <li key={brand.id} className="font-bold">
                  {brand.brand_name}
                </li>
              ))}
            </ul>
          </section>
        )}
      </aside>

      {/* ── 우: 진행중인 캠페인 ── */}
      <div>
        <p className="eyebrow">Campaign</p>
        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">진행중인 캠페인</h1>

        {/* 브랜드 프로필 온보딩 (PART E1) — 최초 1회 */}
        {(!brands || brands.length === 0) && (
          <div className="mt-6 rounded-2xl border border-accent/40 bg-accent/[0.06] p-6">
            <p className="text-sm font-bold text-accent-deep">
              먼저 브랜드 프로필을 등록해 주세요
            </p>
            <p className="mt-2 text-xs leading-[1.7] text-muted">
              상세페이지 URL만 넣으시면 그로스 AI가 브랜드 소개·핵심 USP·타겟을
              정리해 드립니다. 한 번 등록해두면 이후 모든 주문에서 재사용됩니다.
            </p>
            <Link
              href="/onboarding"
              className="mt-4 inline-flex rounded-full bg-ink px-4 py-2 text-xs font-bold text-paper"
            >
              브랜드 등록하기
            </Link>
          </div>
        )}

        {!current ? (
          <div className="mt-6 rounded-2xl border border-line bg-paper p-10 text-center">
            <p className="text-sm text-muted">진행중인 캠페인이 없습니다.</p>
            <Link
              href="/#pricing"
              className="mt-5 inline-flex rounded-full border border-ink/20 px-5 py-2.5 text-sm font-bold hover:border-ink"
            >
              플랜 보기
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="text-lg font-bold">{currentPlan?.label ?? "캠페인"}</p>
              <p className="text-xs text-muted">
                {currentPlan?.composition}
                {startedAt && ` · ${formatDate(startedAt)} 시작`}
              </p>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <StageTrack
                title={TRACK_LABEL.seeding}
                stages={SEEDING_STAGES}
                stage={current.stage_a}
              />
              <StageTrack
                title={TRACK_LABEL.shorts}
                stages={SHORTS_STAGES}
                stage={current.stage_b}
              />
            </div>

            <p className="mt-5 text-xs leading-[1.7] text-muted">
              단계는 담당자가 진행에 맞춰 갱신합니다. 궁금한 점은 우측 하단
              채널톡으로 문의해 주세요.
            </p>
          </>
        )}

        {/* 지난 캠페인 — 진행중인 것 말고도 있을 때만 */}
        {projects && projects.length > 1 && (
          <section className="mt-12">
            <h2 className="text-sm font-bold">전체 캠페인</h2>
            <ul className="mt-4 space-y-2">
              {projects.map((project) => (
                <li
                  key={project.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-paper px-5 py-4"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">
                      {project.orders?.plans?.label ??
                        (project.type === "full" ? "패키지 플랜" : "싱글 플랜")}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {formatDate(project.orders?.paid_at ?? project.created_at)} 시작
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-paper-alt px-3 py-1.5 text-xs font-bold">
                    {project.stage_b === LAST_SHORTS_STAGE ? "완료" : "진행중"}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
