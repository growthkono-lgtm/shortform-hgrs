"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { PLANS, type Plan, type PlanCode } from "@/lib/constants";

type PlanSelectionValue = {
  code: PlanCode;
  setCode: (code: PlanCode) => void;
  tier: string;
  setTier: (tier: string) => void;
  /** 현재 선택된 플랜 — 스티키 CTA 라벨이 이 값을 따라간다 (PART B) */
  selected: Plan;
  tiersForCode: Plan[];
};

const PlanSelectionContext = createContext<PlanSelectionValue | null>(null);

export function PlanSelectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // 숏폼 기획제작 단독이 기본이다. 시딩까지 묶인 금액을 먼저 보여주면
  // 실제로 파는 것(숏폼 편수)보다 총액이 앞서 읽혀 무조건 비싸 보인다.
  const [code, setCode] = useState<PlanCode>("shorts_only");
  const [tier, setTier] = useState<string>("10");

  const value = useMemo<PlanSelectionValue>(() => {
    const tiersForCode = PLANS.filter((plan) => plan.code === code);
    const selected =
      tiersForCode.find((plan) => plan.tier === tier) ??
      tiersForCode.find((plan) => plan.recommended) ??
      tiersForCode[0];
    return { code, setCode, tier, setTier, selected, tiersForCode };
  }, [code, tier]);

  return (
    <PlanSelectionContext value={value}>{children}</PlanSelectionContext>
  );
}

export function usePlanSelection() {
  const context = useContext(PlanSelectionContext);
  if (!context) {
    throw new Error("usePlanSelection must be used within PlanSelectionProvider");
  }
  return context;
}

/** 플랜 코드를 바꿀 때 해당 플랜의 추천 티어로 초기화 */
export function useSwitchPlanCode() {
  const { setCode, setTier } = usePlanSelection();
  return (next: PlanCode) => {
    setCode(next);
    const fallback =
      PLANS.find((plan) => plan.code === next && plan.recommended) ??
      PLANS.find((plan) => plan.code === next)!;
    setTier(fallback.tier);
  };
}
