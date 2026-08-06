"use client";

import { Section, SectionHeading } from "@/components/ui/section";
import { cn } from "@/lib/cn";
import {
  PLAN_COPY,
  POLICY,
  type PlanCode,
  formatKRW,
} from "@/lib/constants";
import { usePlanSelection, useSwitchPlanCode } from "./plan-selection";

const CODES: PlanCode[] = ["shorts_only", "full"];

function SwitchNote({
  onClick,
  title,
  body,
  cta,
}: {
  onClick: () => void;
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-8 w-full rounded-2xl border border-line bg-paper/70 px-5 py-4 text-left transition-colors duration-200 hover:border-ink/30"
    >
      <span className="text-sm font-bold">{title}</span>
      <span className="mt-1 block text-xs leading-[1.7] text-muted">{body}</span>
      <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-bold text-white">
        {cta}
        <svg viewBox="0 0 16 16" className="size-3.5 fill-current" aria-hidden>
          <path d="M6 3l5 5-5 5z" />
        </svg>
      </span>
    </button>
  );
}

/**
 * S12. 가격 — Pricing
 *
 * 2026-08-07: 요금표 컴포넌트를 걷어냈다. 같은 플랜 3개를 표로 한 번, 라디오 카드로
 * 또 한 번 그려서 모바일에서 똑같은 표가 두 번 나왔다.
 * 선택이 되는 라디오 카드 한 벌만 남긴다.
 *
 * 순서도 뒤집었다 — 숏폼 기획제작(단독)이 먼저, 인플루언서 시딩은 붙이는 선택지다.
 */
export function Pricing() {
  const { code, tier, setTier, tiersForCode } = usePlanSelection();
  const switchCode = useSwitchPlanCode();
  const copy = PLAN_COPY[code];

  return (
    <Section eyebrow="Pricing" alt id="pricing">
      <SectionHeading>
        <strong className="font-bold">플랜 안내</strong>
      </SectionHeading>

      {/* 무엇을 사는지부터 고르게 한다. 총액이 아니라 구성이 먼저다 */}
      <div className="mt-8 inline-flex w-full max-w-xl rounded-2xl border border-line bg-paper p-1.5 sm:w-auto">
        {CODES.map((c) => {
          const active = c === code;
          return (
            <button
              key={c}
              type="button"
              onClick={() => switchCode(c)}
              aria-pressed={active}
              className={cn(
                "flex-1 rounded-xl px-4 py-3 text-center transition-colors duration-200 sm:px-6",
                active ? "bg-ink text-paper" : "text-muted hover:text-ink",
              )}
            >
              <span className="block text-[0.8125rem] font-bold whitespace-nowrap sm:text-sm">
                {PLAN_COPY[c].label}
              </span>
              <span
                className={cn(
                  "mt-0.5 block text-[0.6875rem]",
                  active ? "text-paper/60" : "text-muted",
                )}
              >
                {PLAN_COPY[c].sub}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-6 max-w-2xl text-base leading-[1.75] text-muted sm:text-lg">
        {copy.rationale}
      </p>

      {/* 수량 라디오 카드 */}
      <fieldset className="mt-8">
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

      {/* 반대편 플랜으로 넘어가는 각주 — 탭을 못 보고 내려온 사람을 위한 두 번째 문 */}
      {code === "shorts_only" ? (
        <SwitchNote
          onClick={() => switchCode("full")}
          title="찍을 소스부터 없으신가요?"
          body="인플루언서 시딩을 붙여 광고용 소스컷 확보부터 함께 진행합니다."
          cta="시딩 포함 가격 보기"
        />
      ) : (
        <SwitchNote
          onClick={() => switchCode("shorts_only")}
          title="이미 소스가 있으신가요?"
          body="브랜드 보유 소스(촬영본·UGC·제품컷)로 전환 숏폼만 따로 받으실 수 있습니다."
          cta="숏폼 단독 가격 보기"
        />
      )}

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
