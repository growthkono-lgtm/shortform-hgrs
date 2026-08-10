"use client";

import { Section, SectionHeading } from "@/components/ui/section";
import { cn } from "@/lib/cn";
import {
  PLANS,
  PLAN_COPY,
  PLAN_GROUPS,
  POLICY,
  type Plan,
  type PlanCode,
  formatKRW,
} from "@/lib/constants";
import { usePlanSelection } from "./plan-selection";

const findPlan = (code: PlanCode, tier: string) =>
  PLANS.find((plan) => plan.code === code && plan.tier === tier)!;

const TRIAL = PLANS.find((plan) => plan.trial)!;

/** 선택 상태를 알려주는 라디오 점 — 박스 안에 고를 칸이 둘이라 표식이 없으면 뭘 골랐는지 안 보인다 */
function Dot({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-4 shrink-0 place-items-center rounded-full border transition-colors duration-200",
        active ? "border-accent bg-accent" : "border-ink/25",
      )}
    >
      {active && <span className="size-1.5 rounded-full bg-white" />}
    </span>
  );
}

/**
 * 박스 안의 한 칸. 위 칸은 숏폼 단독, 아래 칸은 시딩까지 묶은 패키지다.
 * 아래 칸은 배경을 한 톤 눌러 "붙이는 쪽"으로 읽히게 한다.
 */
function Option({
  plan,
  tagline,
  active,
  onSelect,
  alt,
}: {
  plan: Plan;
  tagline: string;
  active: boolean;
  onSelect: () => void;
  alt?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer flex-col p-6 transition-colors duration-200",
        alt ? "border-t border-line bg-paper-alt" : "bg-paper",
        active && "bg-accent/[0.06]",
      )}
    >
      <input
        type="radio"
        name="plan"
        value={`${plan.code}-${plan.tier}`}
        checked={active}
        onChange={onSelect}
        className="sr-only"
      />

      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <Dot active={active} />
            <span className="text-base font-bold">{plan.label}</span>
          </span>
          <span className="mt-1 block pl-6 text-xs text-muted">
            {plan.composition}
          </span>
        </span>
        <span className="stat-figure shrink-0 text-xl text-accent-deep">
          {formatKRW(plan.betaPrice)}
        </span>
      </span>

      <span className="mt-3 block pl-6 text-xs leading-[1.7] text-muted">
        {tagline}
      </span>

      {/* 총액만 보여주면 숏폼 편당 값이 가려진다 — 시딩 단가를 쪼개 적는다 */}
      {plan.shortsPrice != null && plan.seedingPrice != null && (
        <span className="mt-4 ml-6 block space-y-1.5 rounded-xl border border-line bg-paper px-3.5 py-3 text-xs text-muted">
          <span className="flex justify-between gap-3">
            <span>숏폼 기획제작 {plan.shortsCount}편</span>
            <span className="stat-figure">{formatKRW(plan.shortsPrice)}</span>
          </span>
          <span className="flex justify-between gap-3">
            <span>인플루언서 시딩 {plan.influencerCount}명</span>
            <span className="stat-figure">{formatKRW(plan.seedingPrice)}</span>
          </span>
        </span>
      )}

      <span
        className={cn(
          "mt-5 block rounded-full px-5 py-2.5 text-center text-xs font-bold transition-colors duration-200",
          active ? "bg-ink text-paper" : "border border-ink/20 text-ink",
        )}
      >
        {active ? "이 구성으로 시작하기" : "선택"}
      </span>
    </label>
  );
}

/**
 * S12. 가격 — Pricing
 *
 * 2026-08-10: 플랜 코드 탭을 걷어냈다. 스타터·그로스·스케일 한 박스 안에
 * 숏폼 단독(스타터)과 시딩 패키지(스타터 패키지)를 위아래로 같이 놓는다 —
 * 탭으로 갈라 두면 둘 중 하나만 보고 판단하게 되고, 시딩을 붙이는 차액이 안 보인다.
 * 1편 단품은 그리드 위에 가로 한 줄로 따로 뺐다 (규모 비교 대상이 아니라 "먼저 한 편"이다).
 */
export function Pricing() {
  const { code, tier, select } = usePlanSelection();
  const isActive = (plan: Plan) => plan.code === code && plan.tier === tier;

  return (
    <Section eyebrow="Pricing" alt id="pricing">
      <SectionHeading>
        <strong className="font-bold">플랜 안내</strong>
      </SectionHeading>

      <p className="mt-6 max-w-2xl text-base leading-[1.75] text-muted sm:text-lg">
        스타터·그로스·스케일 세 규모입니다. 각 박스에서 숏폼 기획제작만 받으실지,
        인플루언서 시딩까지 묶으실지 고르시면 됩니다.
      </p>

      <fieldset className="mt-8">
        <legend className="sr-only">플랜 선택</legend>

        {/* 첫 거래를 트는 자리 — 규모 비교에 끼우지 않고 위에 한 줄로 둔다 */}
        <label
          className={cn(
            "flex cursor-pointer flex-col gap-4 rounded-2xl border bg-paper p-6 transition-colors duration-200 sm:flex-row sm:items-center sm:justify-between",
            isActive(TRIAL)
              ? "border-ink bg-accent/[0.06]"
              : "border-line hover:border-ink/40",
          )}
        >
          <input
            type="radio"
            name="plan"
            value={`${TRIAL.code}-${TRIAL.tier}`}
            checked={isActive(TRIAL)}
            onChange={() => select(TRIAL.code, TRIAL.tier)}
            className="sr-only"
          />
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <Dot active={isActive(TRIAL)} />
              <span className="text-base font-bold">먼저 1편만</span>
              <span className="rounded-full border border-accent/50 px-2.5 py-0.5 text-[0.6875rem] font-bold text-accent-deep">
                first
              </span>
            </span>
            <span className="mt-2 block pl-6 text-xs leading-[1.7] text-muted">
              한 편 받아보고 판단하세요. 인플루언서 시딩은 포함되지 않습니다.
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-4 pl-6 sm:pl-0">
            <span className="stat-figure text-xl text-accent-deep">
              {formatKRW(TRIAL.betaPrice)}
            </span>
            <span
              className={cn(
                "rounded-full px-5 py-2.5 text-xs font-bold transition-colors duration-200",
                isActive(TRIAL)
                  ? "bg-ink text-paper"
                  : "border border-ink/20 text-ink",
              )}
            >
              {isActive(TRIAL) ? "이 구성으로 시작하기" : "선택"}
            </span>
          </span>
        </label>

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          {PLAN_GROUPS.map((group) => {
            const shorts = findPlan("shorts_only", group.shortsTier);
            const full = findPlan("full", group.fullTier);
            const boxActive = isActive(shorts) || isActive(full);
            const headReview = shorts.headReview || full.headReview;

            return (
              <div
                key={group.key}
                className={cn(
                  "flex h-full flex-col overflow-hidden rounded-2xl border transition-colors duration-200",
                  boxActive ? "border-ink" : "border-line",
                )}
              >
                <div className="flex items-center gap-2 border-b border-line bg-paper px-6 pt-5 pb-4">
                  <span className="font-display text-xs tracking-[0.14em] text-muted uppercase">
                    {group.key}
                  </span>
                  {"recommended" in group && group.recommended && (
                    <span className="rounded-full bg-ink px-2.5 py-0.5 text-[0.6875rem] font-bold text-paper">
                      추천
                    </span>
                  )}
                </div>

                <Option
                  plan={shorts}
                  tagline={PLAN_COPY.shorts_only.tagline}
                  active={isActive(shorts)}
                  onSelect={() => select(shorts.code, shorts.tier)}
                />
                <Option
                  plan={full}
                  tagline={PLAN_COPY.full.tagline}
                  active={isActive(full)}
                  onSelect={() => select(full.code, full.tier)}
                  alt
                />

                {/* 헤드 전략 리뷰는 스케일 박스의 두 칸 모두에 붙는다 — 박스 바닥에 한 번만 적는다 */}
                {headReview && (
                  <p
                    title={POLICY.headReviewScope}
                    className="mt-auto border-t border-line bg-accent/[0.06] px-6 py-4 text-xs leading-[1.7] font-bold text-accent-deep"
                  >
                    + 헤드 전략 리뷰 1회
                    <span className="mt-1 block font-normal text-muted">
                      {POLICY.headReviewScope}
                    </span>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </fieldset>

      {/* 정책 노출 ②③④ — 두 구성이 한 화면에 있으니 해당 줄을 모두 남긴다 (PART E4) */}
      <ul className="mt-8 space-y-2 text-xs leading-[1.7] text-muted">
        {[
          POLICY.revisionOnce,
          POLICY.usagePeriod,
          POLICY.sourceRequired,
          POLICY.seedingBundleOnly,
          POLICY.trialSingle,
        ].map((line) => (
          <li key={line} className="flex gap-2">
            <span aria-hidden className="text-accent">
              ·
            </span>
            {line}
          </li>
        ))}
      </ul>
    </Section>
  );
}
