"use client";

import { useState } from "react";
import { Section, SectionHeading } from "@/components/ui/section";
import { cn } from "@/lib/cn";
import { FULL_STEPS, SHORTS_ONLY_STEPS } from "@/lib/landing-data";
import { POLICY } from "@/lib/constants";

const TABS = [
  { key: "full", label: "풀 파이프라인 8단계", steps: FULL_STEPS },
  { key: "shorts_only", label: "숏폼 단독 5단계", steps: SHORTS_ONLY_STEPS },
] as const;

/** S9. 진행 프로세스 — Process (플랜 토글) */
export function Process() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("full");
  const steps = TABS.find((t) => t.key === tab)!.steps;

  return (
    <Section eyebrow="Process">
      <SectionHeading>
        결제 다음 날부터, <strong className="font-bold">무엇이 언제 오는지</strong>{" "}
        보입니다
      </SectionHeading>

      <div
        role="tablist"
        aria-label="플랜별 진행 프로세스"
        className="mt-8 inline-flex rounded-full border border-line p-1"
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-bold transition-colors duration-200",
              tab === t.key ? "bg-ink text-paper" : "text-muted hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ol className="mt-10 space-y-px overflow-hidden rounded-2xl border border-line bg-line">
        {steps.map((step, i) => (
          <li key={step.title} className="bg-paper p-6 sm:flex sm:items-start sm:gap-6">
            <span className="font-display shrink-0 text-sm font-bold text-accent">
              STEP {String(i + 1).padStart(2, "0")}
            </span>
            <div className="mt-2 flex-1 sm:mt-0">
              <h3 className="text-base font-bold">{step.title}</h3>
              {"note" in step && step.note && (
                <p className="mt-1 text-xs text-muted">{step.note}</p>
              )}
              {/* 정책 노출 ① — 모집·배포 스텝 카드 (PART E4) */}
              {"policy" in step && step.policy === "noIndividualEdit" && (
                <p className="mt-3 rounded-lg border border-accent/30 bg-accent/[0.06] px-3 py-2 text-xs leading-[1.7] text-accent-deep">
                  {POLICY.noIndividualEdit}
                </p>
              )}
            </div>
            <span className="mt-2 shrink-0 text-xs font-bold text-accent-deep sm:mt-0">
              {step.duration}
            </span>
          </li>
        ))}
      </ol>
    </Section>
  );
}
