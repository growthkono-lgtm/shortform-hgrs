import Link from "next/link";
import { StageTrack } from "@/components/portal/stage-track";
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
    planLabel: string;
    composition: string;
    startedAt: string | null;
    stageA: string | null;
    stageB: string;
  } | null;
  history: { id: string; label: string; startedAt: string; done: boolean }[];
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
  const { account, plan, brands, campaign, history } = data;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] lg:gap-10">
      {/* ── 좌: 계정 + 구매한 플랜 ── */}
      <aside className="space-y-5 lg:sticky lg:top-8 lg:self-start">
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
                아직 구매하신 플랜이 없습니다.
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
      <div>
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

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <StageTrack
                title={TRACK_LABEL.seeding}
                stages={SEEDING_STAGES}
                stage={campaign.stageA}
              />
              <StageTrack
                title={TRACK_LABEL.shorts}
                stages={SHORTS_STAGES}
                stage={campaign.stageB}
              />
            </div>

            <p className="mt-5 text-xs leading-[1.7] text-muted">
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
