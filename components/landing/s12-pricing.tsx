"use client";

import Link from "next/link";
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

/** 선택 상태 표식 — 카드가 여섯 장이라 표식이 없으면 뭘 골랐는지 안 보인다 */
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

function PlanCard({
  plan,
  tagline,
  active,
  onSelect,
  recommended,
}: {
  plan: Plan;
  tagline: string;
  active: boolean;
  onSelect: () => void;
  recommended?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-2xl border bg-paper transition-colors duration-200",
        active
          ? "border-ink bg-accent/[0.05]"
          : "border-line hover:border-ink/40",
      )}
    >
      {/* 카드 본문은 선택(라디오), CTA는 그 밖의 링크다 —
          label 안에 링크를 넣으면 링크를 눌러도 라디오가 같이 토글된다 */}
      <label className="flex flex-1 cursor-pointer flex-col p-6 pb-0">
        <input
          type="radio"
          name="plan"
          value={`${plan.code}-${plan.tier}`}
          checked={active}
          onChange={onSelect}
          className="sr-only"
        />

        <span className="flex items-center gap-2">
          <Dot active={active} />
          <span className="text-base font-bold">{plan.label}</span>
          {recommended && (
            <span className="rounded-full bg-ink px-2.5 py-0.5 text-[0.6875rem] font-bold text-paper">
              추천
            </span>
          )}
        </span>
        <span className="mt-1.5 block pl-6 text-xs text-muted">
          {plan.composition}
        </span>

        <span className="stat-figure mt-5 block text-3xl text-accent-deep">
          {formatKRW(plan.betaPrice)}
        </span>

        <span className="mt-3 block text-xs leading-[1.7] text-muted">
          {tagline}
        </span>

        {/* 총액만 보여주면 숏폼 편당 값이 가려진다 — 시딩 단가를 쪼개 적는다 */}
        {plan.shortsPrice != null && plan.seedingPrice != null && (
          <span className="mt-4 block space-y-1.5 rounded-xl border border-line bg-paper-alt px-3.5 py-3 text-xs text-muted">
            <span className="flex justify-between gap-3">
              <span>숏폼 기획제작 {plan.shortsCount}편</span>
              <span className="stat-figure">{formatKRW(plan.shortsPrice)}</span>
            </span>
            <span className="flex justify-between gap-3">
              <span>인플루언서 시딩 {plan.influencerCount}명</span>
              <span className="stat-figure">
                {formatKRW(plan.seedingPrice)}
              </span>
            </span>
          </span>
        )}

      </label>

      <div className="p-6 pt-5">
        <Link
          href={`/checkout/${plan.code}-${plan.tier}`}
          className={cn(
            "block rounded-full px-5 py-3 text-center text-xs font-bold transition-colors duration-200",
            active
              ? "bg-ink text-paper hover:bg-ink-soft"
              : "border border-ink/20 text-ink hover:border-ink",
          )}
        >
          이 플랜으로 시작하기
        </Link>
      </div>
    </div>
  );
}

function RowHeading({ title, note }: { title: string; note: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-xs text-muted sm:text-sm">{note}</p>
    </div>
  );
}

/**
 * S12. 가격 — Pricing
 *
 * 2026-08-10: 싱글과 패키지를 **가로 두 줄**로 나눈다.
 * 한 박스 안에 위아래로 묶어 뒀더니 같이 사는 구성처럼 읽혔다 —
 * 둘은 택일이다. 같은 줄에 놓인 셋(스타터·그로스·스케일)만 규모 비교 대상이다.
 * 1편 단품은 싱글 줄 위에 가로 한 줄로 따로 둔다.
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
        스타터·그로스·스케일 세 규모입니다. 숏폼 기획제작만 받는 싱글과,
        인플루언서 시딩까지 묶은 패키지 중 하나를 고르시면 됩니다.
      </p>

      <fieldset className="mt-10">
        <legend className="sr-only">플랜 선택</legend>

        {/* ── 싱글 플랜 ── */}
        <RowHeading
          title={`싱글 플랜 · ${PLAN_COPY.shorts_only.label}`}
          note="브랜드 보유 소스(촬영본·UGC·제품컷)로 바로 시작합니다."
        />

        {/* 첫 거래를 트는 자리 — 규모 비교에 끼우지 않고 줄 위에 따로 둔다 */}
        <div
          className={cn(
            "mt-5 flex flex-col gap-4 rounded-2xl border bg-paper transition-colors duration-200 sm:flex-row sm:items-center sm:justify-between",
            isActive(TRIAL)
              ? "border-ink bg-accent/[0.05]"
              : "border-line hover:border-ink/40",
          )}
        >
          <label className="min-w-0 flex-1 cursor-pointer p-6 pb-0 sm:pb-6">
            <input
              type="radio"
              name="plan"
              value={`${TRIAL.code}-${TRIAL.tier}`}
              checked={isActive(TRIAL)}
              onChange={() => select(TRIAL.code, TRIAL.tier)}
              className="sr-only"
            />
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
          </label>
          <div className="flex shrink-0 items-center gap-4 p-6 pt-0 sm:pt-6">
            <span className="stat-figure text-xl text-accent-deep">
              {formatKRW(TRIAL.betaPrice)}
            </span>
            <Link
              href={`/checkout/${TRIAL.code}-${TRIAL.tier}`}
              className={cn(
                "rounded-full px-5 py-3 text-xs font-bold whitespace-nowrap transition-colors duration-200",
                isActive(TRIAL)
                  ? "bg-ink text-paper hover:bg-ink-soft"
                  : "border border-ink/20 text-ink hover:border-ink",
              )}
            >
              이 플랜으로 시작하기
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          {PLAN_GROUPS.map((group) => {
            const plan = findPlan("shorts_only", group.shortsTier);
            return (
              <PlanCard
                key={group.key}
                plan={plan}
                tagline={PLAN_COPY.shorts_only.tagline}
                active={isActive(plan)}
                onSelect={() => select(plan.code, plan.tier)}
                recommended={"recommended" in group && group.recommended}
              />
            );
          })}
        </div>

        {/* ── 패키지 플랜 ── */}
        <div className="mt-14">
          <RowHeading
            title={`패키지 플랜 · ${PLAN_COPY.full.label}`}
            note="찍을 소스부터 없다면 인플루언서 시딩을 함께 붙입니다."
          />

          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            {PLAN_GROUPS.map((group) => {
              const plan = findPlan("full", group.fullTier);
              return (
                <PlanCard
                  key={group.key}
                  plan={plan}
                  tagline={PLAN_COPY.full.tagline}
                  active={isActive(plan)}
                  onSelect={() => select(plan.code, plan.tier)}
                  recommended={"recommended" in group && group.recommended}
                />
              );
            })}
          </div>
        </div>
      </fieldset>

      {/* 정책 노출 ②③④ — 두 구성이 한 화면에 있으니 해당 줄을 모두 남긴다 (PART E4) */}
      <ul className="mt-10 space-y-2 text-xs leading-[1.7] text-muted">
        {[
          POLICY.singleOrPackage,
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
