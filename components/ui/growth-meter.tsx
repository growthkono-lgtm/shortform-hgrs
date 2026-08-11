"use client";

import { countUpText, useCountUp } from "@/components/ui/use-count-up";

/**
 * 성장 사례용 우상향 연출 — 선이 그려지며 숫자가 목표치까지 올라간다.
 *
 * 성과 문장만 놓으면 "그래서 얼마나?"가 눈에 안 들어온다. 문장 옆에서 숫자가
 * 실제로 올라가야 성장으로 읽힌다. 화면에 들어올 때 한 번만 돈다.
 *
 * 숫자의 초기값은 0이 아니라 **최종값**이다 — 이유는 use-count-up.ts 주석 참고.
 * (JS 없는 환경에서 성과가 전부 0으로 노출되던 문제)
 *
 * 색은 골드탄이다. 인디고는 CTA·넘버링이 가져가고, 성과 지표는 골드가 맡는다 —
 * 두 브랜드색이 각자 역할을 갖게 하는 편이 아무 데나 섞는 것보다 세다.
 */

export type Metric = {
  label: string;
  /** 최종값 (숫자만) */
  to: number;
  /** 앞뒤 표기 — "₩", "배", "만원" 등 */
  prefix?: string;
  suffix?: string;
  /** 천 단위 구분 */
  grouped?: boolean;
};

export function GrowthMeter({ metrics }: { metrics: Metric[] }) {
  const { ref, p } = useCountUp();

  return (
    <div ref={ref} className="mt-8">
      {/* 우상향 선 — 숫자와 같은 타이밍으로 그려진다 */}
      <svg
        viewBox="0 0 320 56"
        className="h-12 w-full max-w-[320px]"
        aria-hidden
      >
        <path
          d="M2 54 L54 46 L106 40 L158 28 L210 22 L262 12 L318 2"
          fill="none"
          stroke="var(--color-gold)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          style={{ strokeDasharray: 1, strokeDashoffset: 1 - p }}
        />
        <circle
          cx="318"
          cy="2"
          r="4"
          fill="var(--color-gold)"
          style={{
            opacity: p > 0.96 ? 1 : 0,
            transition: "opacity 250ms ease",
          }}
        />
      </svg>

      <dl className="mt-4 flex flex-wrap gap-x-10 gap-y-4">
        {metrics.map((m) => (
          <div key={m.label}>
            <dd className="stat-figure text-gold text-3xl tabular-nums sm:text-4xl">
              {countUpText(p, m)}
            </dd>
            <dt className="mt-1.5 text-xs text-white/55">{m.label}</dt>
          </div>
        ))}
      </dl>
    </div>
  );
}
