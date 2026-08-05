"use client";

import { Section, SectionHeading } from "@/components/ui/section";
import { cn } from "@/lib/cn";
import {
  POLICY,
  PRICE_RATIONALE,
  discountRate,
  formatKRW,
  type PlanCode,
} from "@/lib/constants";
import { usePlanSelection, useSwitchPlanCode } from "./plan-selection";

const PLAN_TABS: { code: PlanCode; label: string; note: string }[] = [
  {
    code: "full",
    label: "플랜 1 — 풀 파이프라인",
    note: "인플루언서 바이럴 시딩 + 확보 소스로 전환형 숏폼 제작",
  },
  {
    code: "shorts_only",
    label: "플랜 2 — 전환 숏폼 단독",
    note: "브랜드 보유 소스 제공 조건",
  },
];

/** S12. 가격 — Pricing */
export function Pricing() {
  const { code, tier, setTier, tiersForCode } = usePlanSelection();
  const switchCode = useSwitchPlanCode();

  return (
    <Section eyebrow="Pricing" alt id="pricing">
      <SectionHeading>
        <strong className="font-bold">베타 오픈 특별가</strong>
      </SectionHeading>
      <p className="mt-5 max-w-2xl text-base leading-[1.75] text-muted sm:text-lg">
        {PRICE_RATIONALE}
      </p>

      {/* 플랜 토글 */}
      <div
        role="tablist"
        aria-label="상품 플랜"
        className="mt-10 grid gap-3 sm:grid-cols-2"
      >
        {PLAN_TABS.map((planTab) => (
          <button
            key={planTab.code}
            type="button"
            role="tab"
            aria-selected={code === planTab.code}
            onClick={() => switchCode(planTab.code)}
            className={cn(
              "rounded-2xl border p-5 text-left transition-colors duration-200",
              code === planTab.code
                ? "border-ink bg-paper"
                : "border-line bg-paper/60 hover:border-ink/40",
            )}
          >
            <span className="block text-base font-bold">{planTab.label}</span>
            <span className="mt-1 block text-sm text-muted">{planTab.note}</span>
          </button>
        ))}
      </div>

      {/* 수량 라디오 카드 */}
      <fieldset className="mt-6">
        <legend className="sr-only">티어 선택</legend>
        <div className="grid gap-5 lg:grid-cols-3">
          {tiersForCode.map((plan) => {
            const active = plan.tier === tier;
            return (
              <label
                key={plan.tier}
                className={cn(
                  "relative flex h-full cursor-pointer flex-col rounded-2xl border bg-paper p-7 transition-colors duration-200",
                  active ? "border-ink" : "border-line hover:border-ink/40",
                )}
              >
                <input
                  type="radio"
                  name="tier"
                  value={plan.tier}
                  checked={active}
                  onChange={() => setTier(plan.tier)}
                  className="sr-only"
                />

                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{plan.label}</span>
                  {plan.recommended && (
                    <span className="rounded-full bg-ink px-2.5 py-0.5 text-[0.6875rem] font-bold text-paper">
                      추천
                    </span>
                  )}
                </div>
                <span className="mt-1 text-sm text-muted">{plan.composition}</span>

                <span className="mt-6 block text-sm text-muted line-through">
                  {formatKRW(plan.listPrice)}
                </span>
                <span className="stat-figure mt-1 block text-3xl">
                  {formatKRW(plan.betaPrice)}
                </span>
                <span className="mt-2 inline-flex w-fit rounded-full bg-accent/[0.12] px-2.5 py-1 text-xs font-bold text-accent-deep">
                  {discountRate(plan.listPrice, plan.betaPrice)}% 할인
                </span>

                {/* 헤드 전략 리뷰 배지 — 스케일 / 20편 한정 (A2) */}
                {plan.headReview && (
                  <span
                    title={POLICY.headReviewScope}
                    className="mt-5 block rounded-xl border border-accent/40 bg-accent/[0.06] px-3.5 py-3 text-xs leading-[1.7] font-bold text-accent-deep"
                  >
                    + 헤드 전략 리뷰 1회 (베타 한정)
                    <span className="mt-1 block font-normal text-muted">
                      {POLICY.headReviewScope}
                    </span>
                  </span>
                )}

                <span
                  className={cn(
                    "mt-6 block rounded-full px-5 py-3 text-center text-sm font-bold transition-colors duration-200 lg:mt-auto lg:pt-3",
                    active
                      ? "bg-ink text-paper"
                      : "border border-ink/20 text-ink",
                  )}
                >
                  {active ? "이 플랜으로 시작하기" : "선택"}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* 정책 노출 ②③④ — 카드 하단 고정 3줄 (PART E4) */}
      <ul className="mt-8 space-y-2 text-xs leading-[1.7] text-muted">
        {[POLICY.revisionOnce, POLICY.usagePeriod, POLICY.sourceRequired].map(
          (line) => (
            <li key={line} className="flex gap-2">
              <span aria-hidden className="text-accent">
                ·
              </span>
              {line}
            </li>
          ),
        )}
      </ul>
    </Section>
  );
}
