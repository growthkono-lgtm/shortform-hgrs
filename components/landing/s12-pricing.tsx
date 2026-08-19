"use client";

import Link from "next/link";
import { Section, SectionHeading } from "@/components/ui/section";
import { cn } from "@/lib/cn";
import {
  AI_EFFICIENCY_NOTE,
  MODEL_OPTION,
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

        {/**
         * ⚠️ **내역을 쪼개 적지 않는다.** (2026-08-19)
         *
         * 앞 판은 "숏폼 X원 / 시딩 Y원" 으로 나눠 보여 줬다. 그런데 시딩
         * 금액을 인원으로 나누면 **우리가 인플루언서에게 주는 리워드가 그대로
         * 역산된다**(990,000 ÷ 20명 = 49,500원). 마진 역산을 막자고 정해 놓고
         * 가격표가 스스로 그걸 하고 있었다.
         *
         * 대신 **편당 단가**를 적는다. 고객이 실제로 비교하는 값은 총액이 아니라
         * 나눴을 때의 값이고, 그 값이 편수가 늘수록 싸지는 게 보여야 묶음을
         * 살 이유가 생긴다.
         */}
        {plan.unitPrice != null && plan.shortsCount > 1 && (
          <span className="mt-4 flex justify-between gap-3 rounded-xl border border-line bg-paper-alt px-3.5 py-3 text-xs text-muted">
            <span>숏폼 편당</span>
            <span className="stat-figure text-ink">
              {formatKRW(plan.unitPrice)}
            </span>
          </span>
        )}

        {/* 체험 티어 — 정가에서 깎아 주는 것이므로 원래 값을 같이 보여 준다 */}
        {plan.trialDiscount != null && (
          <span className="mt-4 flex justify-between gap-3 rounded-xl border border-line bg-paper-alt px-3.5 py-3 text-xs text-muted">
            <span>
              정가 <s className="stat-figure">{formatKRW(plan.listPrice)}</s>
            </span>
            <span className="stat-figure font-bold text-accent-deep">
              {Math.round(plan.trialDiscount * 100)}% 할인
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
        스타터·그로스·스케일 세 규모입니다. 숏폼 기획제작만 받는 <b>싱글</b>과,
        인플루언서 시딩까지 묶은 <b>멀티</b> 중 하나를 고르시면 됩니다.
      </p>

      {/* 헤드라인 밑 공통 명시 — 라인마다 "AI로 만듭니다" 를 반복하지 않고
          여기 한 번만 밝힌다 (2026-08-19 사장님 지시) */}
      <p className="mt-4 inline-block rounded-full border border-accent/40 bg-accent/[0.06] px-4 py-1.5 text-xs font-bold text-accent-deep">
        {AI_EFFICIENCY_NOTE}
      </p>

      {/* 가격부터 보면 "한 편에 얼마" 비교로 끌려간다 — 진단으로 되돌아갈 문을 열어 둔다 */}
      <Link
        href="#diagnosis"
        className="mt-5 inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2.5 text-xs font-bold transition-colors duration-200 hover:border-ink"
      >
        어떤 구성이 맞을지 모르겠다면 · 30초 진단
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="size-3.5 fill-none stroke-current stroke-2"
        >
          <path
            d="M5 12h14M13 6l6 6-6 6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>

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

        {/**
         * 출연 모델 섭외 — **싱글 플랜에만 붙는 옵션**이다. (2026-08-19)
         *
         * 사장님: *"출연 모델 기획 섭외형은 인당 35로 붙이고 섭외비를, 거기에
         * 기존 숏폼기획제작 금액이 붙으면 되는 거잖아. 별도 플랜으로 빼기엔
         * 애매해서."*
         *
         * 멀티 플랜에는 붙이지 않는다 — 그쪽은 시딩으로 이미 소재를 확보하므로
         * 두 방식을 겹쳐 팔면 고객이 무엇을 사는지 알 수 없게 된다.
         */}
        <div className="mt-8 rounded-2xl border border-line bg-paper-alt p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="text-sm font-bold">
              {MODEL_OPTION.label}
              <span className="ml-2 rounded-full border border-line bg-paper px-2.5 py-0.5 text-[0.6875rem] font-medium text-muted">
                싱글 플랜 옵션
              </span>
            </p>
            <p className="stat-figure text-lg text-accent-deep">
              인당 {formatKRW(MODEL_OPTION.unitPrice)}
            </p>
          </div>
          <p className="mt-3 text-xs leading-[1.8] text-muted">
            소재가 없고 사람이 나와야 전환되는 카테고리라면, 위 플랜에 인원 단위로 더합니다.
            인원 비례라 수량 할인은 없습니다.
          </p>
          <ul className="mt-4 grid gap-1.5 text-xs leading-[1.7] text-muted sm:grid-cols-3">
            {MODEL_OPTION.includes.map((line) => (
              <li key={line} className="flex gap-2">
                <span aria-hidden className="text-accent-deep">·</span>
                {line}
              </li>
            ))}
          </ul>
          <ul className="mt-4 space-y-1 border-t border-line pt-4 text-[0.6875rem] leading-[1.7] text-muted/80">
            {MODEL_OPTION.terms.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        {/* ── 멀티 플랜 (구 패키지 플랜) ──
            2026-08-19 사장님 지시로 이름을 바꿨다. "패키지" 는 무엇이 묶였는지
            말하지 않는데, "멀티" 는 소재 확보 경로가 하나 더 있다는 뜻이 된다 */}
        <div className="mt-14">
          <RowHeading
            title={`멀티 플랜 · ${PLAN_COPY.full.label}`}
            note="찍을 소스부터 없다면 인플루언서 시딩을 함께 붙입니다. 시딩 인원은 5·10·15명입니다."
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
          POLICY.modelOptionSingleOnly,
          POLICY.quoteOnlyShoot,
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
