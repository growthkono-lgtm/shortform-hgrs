import Link from "next/link";
import { StageSteps } from "@/components/portal/stage-steps";
import {
  CandidatePanel,
  DeliverablePanel,
  GuidelinePanel,
  type Candidate,
  type Deliverable,
  type Guideline,
} from "@/components/portal/project-panels";
import { SEEDING_STAGES, SHORTS_STAGES, TRACK_LABEL } from "@/lib/stages";
import { formatKRW } from "@/lib/constants";

export type DashboardData = {
  account: {
    contactName: string;
    email: string;
    companyName: string;
    jobTitle: string | null;
  };
  plan: {
    label: string;
    composition: string;
    startedAt: string | null;
    amount: number | null;
  } | null;
  brands: string[];
  campaign: {
    projectId: string;
    planLabel: string;
    composition: string;
    startedAt: string | null;
    stageA: string | null;
    stageB: string;
    shortsCount: number;
    influencerCount: number;
  } | null;
  guideline: Guideline;
  candidates: Candidate[];
  deliverables: Deliverable[];
  seedingDriveLink: string | null;
  history: { id: string; label: string; startedAt: string; done: boolean }[];
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

/** 기획제작 요청 확정 기한 — 적용 시작 + 7일 */
function dueInfo(startedAt: string | null) {
  if (!startedAt) return null;
  const due = new Date(startedAt);
  due.setDate(due.getDate() + 7);
  const days = Math.ceil((due.getTime() - Date.now()) / 86_400_000);
  return { due, days };
}

/**
 * 광고주 대시보드 본문. /app(실데이터)과 /preview/dashboard(미리보기)가 같이 쓴다.
 * 데이터를 읽어오는 책임은 호출하는 쪽에 있다 — 여기는 그리기만 한다.
 */
export function DashboardView({
  data,
  readOnly,
}: {
  data: DashboardData;
  readOnly?: boolean;
}) {
  const {
    account,
    plan,
    brands,
    campaign,
    guideline,
    candidates,
    deliverables,
    seedingDriveLink,
    history,
  } = data;
  const due = dueInfo(campaign?.startedAt ?? null);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] lg:gap-10">
      {/* ── 좌: 계정 + 구매한 플랜 ── */}
      <aside className="min-w-0 space-y-5 lg:sticky lg:top-8 lg:self-start">
        <section className="rounded-2xl border border-line bg-paper-alt p-6">
          <p className="eyebrow">Account</p>
          <p className="mt-4 text-base font-bold">{account.contactName}</p>
          <p className="mt-1 text-xs break-all text-muted">{account.email}</p>

          <dl className="mt-5 space-y-2 border-t border-line pt-4 text-xs">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">회사</dt>
              <dd className="text-right font-bold">{account.companyName}</dd>
            </div>
            {account.jobTitle && (
              <div className="flex justify-between gap-3">
                <dt className="text-muted">직책</dt>
                <dd className="text-right font-bold">{account.jobTitle}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className="rounded-2xl border border-line bg-paper p-6">
          <p className="eyebrow">Plan</p>

          {plan ? (
            <>
              <p className="mt-4 text-base font-bold">{plan.label}</p>
              <p className="mt-1 text-xs text-muted">{plan.composition}</p>

              <dl className="mt-5 space-y-2 border-t border-line pt-4 text-xs">
                {campaign && (
                  <>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">인플루언서 시딩</dt>
                      <dd className="text-right font-bold">
                        {campaign.influencerCount > 0
                          ? `${campaign.influencerCount}명`
                          : "해당없음"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">숏폼 기획제작</dt>
                      <dd className="text-right font-bold">
                        {campaign.shortsCount}편
                      </dd>
                    </div>
                  </>
                )}
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">진행 시작일</dt>
                  <dd className="text-right font-bold">
                    {plan.startedAt ? formatDate(plan.startedAt) : "—"}
                  </dd>
                </div>
                {plan.amount != null && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">결제 금액</dt>
                    <dd className="stat-figure text-right">
                      {formatKRW(plan.amount)}
                    </dd>
                  </div>
                )}
              </dl>
            </>
          ) : (
            <>
              <p className="mt-4 text-sm text-muted">
                아직 진행 중인 플랜이 없습니다.
              </p>
              {!readOnly && (
                <Link
                  href="/#apply"
                  className="mt-4 inline-flex rounded-full border border-ink/20 px-4 py-2 text-xs font-bold hover:border-ink"
                >
                  신청하기
                </Link>
              )}
            </>
          )}
        </section>

        {brands.length > 0 && (
          <section className="rounded-2xl border border-line bg-paper p-6">
            <div className="flex items-center justify-between">
              <p className="eyebrow">Brand</p>
              {!readOnly && (
                <Link
                  href="/onboarding"
                  className="text-xs text-muted hover:text-ink"
                >
                  + 추가
                </Link>
              )}
            </div>
            <ul className="mt-4 space-y-1.5 text-sm">
              {brands.map((brand) => (
                <li key={brand} className="font-bold">
                  {brand}
                </li>
              ))}
            </ul>
          </section>
        )}
      </aside>

      {/* ── 우: 진행중인 캠페인 ── */}
      <div className="min-w-0">
        <p className="eyebrow">Campaign</p>
        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">진행중인 캠페인</h1>

        {!campaign ? (
          <div className="mt-6 rounded-2xl border border-line bg-paper p-10 text-center">
            <p className="text-sm text-muted">진행중인 캠페인이 없습니다.</p>
            {!readOnly && (
              <Link
                href="/#apply"
                className="mt-5 inline-flex rounded-full border border-ink/20 px-5 py-2.5 text-sm font-bold hover:border-ink"
              >
                신청하기
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="text-lg font-bold">{campaign.planLabel}</p>
              <p className="text-xs text-muted">
                {campaign.composition}
                {campaign.startedAt && ` · ${formatDate(campaign.startedAt)} 시작`}
              </p>
            </div>

            {/* 기획제작 요청 확정 기한 — 시작일 + 7일 */}
            {due && (
              <p className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-xl border border-accent/40 bg-accent/[0.06] px-4 py-2.5 text-xs leading-[1.7] text-accent-deep">
                <span className="stat-figure text-sm font-bold">
                  D{due.days >= 0 ? `-${due.days}` : `+${-due.days}`}
                </span>
                기획제작 요청 확정까지 · {formatDate(due.due.toISOString())}
              </p>
            )}

            {/* 인플루언서 시딩 트랙 */}
            {campaign.stageA && (
              <section className="mt-8">
                <h2 className="text-sm font-bold">
                  {TRACK_LABEL.seeding}
                  <span className="ml-2 font-normal text-muted">
                    {campaign.influencerCount}명
                  </span>
                </h2>
                <div className="mt-4 rounded-2xl border border-line bg-paper p-5 sm:p-6">
                  <StageSteps stages={SEEDING_STAGES} stage={campaign.stageA} />
                </div>

                {candidates.length > 0 && (
                  <div className="mt-4">
                    <CandidatePanel
                      projectId={campaign.projectId}
                      candidates={candidates}
                    />
                  </div>
                )}

                {seedingDriveLink && (
                  <a
                    href={seedingDriveLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex rounded-full bg-ink px-5 py-2.5 text-xs font-bold text-paper"
                  >
                    인플루언서 결과물 받기
                  </a>
                )}
              </section>
            )}

            {/* 숏폼 기획제작 트랙 */}
            <section className="mt-10">
              <h2 className="text-sm font-bold">
                {TRACK_LABEL.shorts}
                <span className="ml-2 font-normal text-muted">
                  {campaign.shortsCount}편
                </span>
              </h2>
              <div className="mt-4 rounded-2xl border border-line bg-paper p-5 sm:p-6">
                <StageSteps stages={SHORTS_STAGES} stage={campaign.stageB} />
              </div>

              {deliverables.length > 0 && (
                <div className="mt-4">
                  <DeliverablePanel
                    projectId={campaign.projectId}
                    deliverables={deliverables}
                  />
                </div>
              )}
            </section>

            {/* 컨텐츠 가이드라인 */}
            {!readOnly && (
              <section className="mt-10">
                <GuidelinePanel
                  projectId={campaign.projectId}
                  guideline={guideline}
                />
              </section>
            )}

            <p className="mt-6 text-xs leading-[1.7] text-muted">
              단계는 담당자가 진행에 맞춰 갱신합니다. 궁금한 점은 우측 하단
              채널톡으로 문의해 주세요.
            </p>
          </>
        )}

        {history.length > 1 && (
          <section className="mt-12">
            <h2 className="text-sm font-bold">전체 캠페인</h2>
            <ul className="mt-4 space-y-2">
              {history.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-paper px-5 py-4"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {formatDate(item.startedAt)} 시작
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-paper-alt px-3 py-1.5 text-xs font-bold">
                    {item.done ? "완료" : "진행중"}
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
