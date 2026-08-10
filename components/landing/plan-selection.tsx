"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { PLANS, type Plan, type PlanCode } from "@/lib/constants";

type PlanSelectionValue = {
  code: PlanCode;
  tier: string;
  /** 요금 박스의 두 칸(단독/패키지) 중 하나를 고른다 */
  select: (code: PlanCode, tier: string) => void;
  /** 현재 선택된 플랜 — 스티키 CTA 라벨이 이 값을 따라간다 (PART B) */
  selected: Plan;
};

const PlanSelectionContext = createContext<PlanSelectionValue | null>(null);

export function PlanSelectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // 기본은 그로스 숏폼 단독이다. 시딩까지 묶인 금액을 먼저 선택해 두면
  // 실제로 파는 것(숏폼 편수)보다 총액이 앞서 읽혀 무조건 비싸 보인다.
  const [{ code, tier }, setSelection] = useState<{
    code: PlanCode;
    tier: string;
  }>({ code: "shorts_only", tier: "10" });

  const value = useMemo<PlanSelectionValue>(() => {
    const selected =
      PLANS.find((plan) => plan.code === code && plan.tier === tier) ??
      PLANS.find((plan) => plan.recommended) ??
      PLANS[0];
    return {
      code,
      tier,
      select: (nextCode, nextTier) =>
        setSelection({ code: nextCode, tier: nextTier }),
      selected,
    };
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
