"use client";

import { Section, SectionHeading } from "@/components/ui/section";
import { cn } from "@/lib/cn";
import {
  POLICY,
  PRICE_RATIONALE,
  formatKRW,
} from "@/lib/constants";
import { usePlanSelection, useSwitchPlanCode } from "./plan-selection";
import { PricingTable } from "./pricing-table";

/** S12. 가격 — Pricing */
export function Pricing() {
  const { tier, setTier, tiersForCode } = usePlanSelection();
  const switchCode = useSwitchPlanCode();

  return (
    <Section eyebrow="Pricing" alt id="pricing">
      <SectionHeading>
        <strong className="font-bold">플랜 안내</strong>
      </SectionHeading>
      <p className="mt-5 max-w-2xl text-base leading-[1.75] text-muted sm:text-lg">
        {PRICE_RATIONALE}
      </p>

      {/* 피그마 요금표 — 구성과 금액을 한눈에 비교시키는 자리 */}
      <PricingTable />

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

                <span className="stat-figure mt-6 block text-3xl text-accent-deep">
                  {formatKRW(plan.betaPrice)}
                </span>

                {/* 헤드 전략 리뷰 배지 — 스케일 / 20편 한정 (A2) */}
                {plan.headReview && (
                  <span
                    title={POLICY.headReviewScope}
                    className="mt-5 block rounded-xl border border-accent/40 bg-accent/[0.06] px-3.5 py-3 text-xs leading-[1.7] font-bold text-accent-deep"
                  >
                    + 헤드 전략 리뷰 1회
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

      {/* 숏폼 단독 — 풀 파이프라인이 최우선순위라 대등한 탭이 아니라 각주로 둔다 */}
      <button
        type="button"
        onClick={() => switchCode("shorts_only")}
        className="mt-8 w-full rounded-2xl border border-line bg-paper/70 px-5 py-4 text-left transition-colors duration-200 hover:border-ink/30"
      >
        <span className="text-sm font-bold">
          이미 소스가 있으신가요? 전환 숏폼만 따로 받기
        </span>
        <span className="mt-1 block text-xs leading-[1.7] text-muted">
          브랜드 보유 소스(촬영본·UGC·제품컷) 제공 조건 · 5편 / 10편 / 20편
        </span>
        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-bold text-white">
          숏폼 단독 가격 보기
          <svg viewBox="0 0 16 16" className="size-3.5 fill-current" aria-hidden>
            <path d="M6 3l5 5-5 5z" />
          </svg>
        </span>
      </button>

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
