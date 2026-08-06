"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 성장 사례용 우상향 연출 — 선이 그려지며 숫자가 목표치까지 올라간다.
 *
 * 성과 문장만 놓으면 "그래서 얼마나?"가 눈에 안 들어온다. 문장 옆에서 숫자가
 * 실제로 올라가야 성장으로 읽힌다. 화면에 들어올 때 한 번만 돈다.
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

const EASE = (t: number) => 1 - Math.pow(1 - t, 3);

export function GrowthMeter({ metrics }: { metrics: Metric[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0); // 0 → 1

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setP(1);
      return;
    }

    let raf = 0;
    let start = 0;
    const DURATION = 1600;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const tick = (now: number) => {
          if (!start) start = now;
          const t = Math.min(1, (now - start) / DURATION);
          setP(EASE(t));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

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
          style={{ opacity: p > 0.96 ? 1 : 0, transition: "opacity 250ms ease" }}
        />
      </svg>

      <dl className="mt-4 flex flex-wrap gap-x-10 gap-y-4">
        {metrics.map((m) => {
          const v = Math.round(m.to * p);
          return (
            <div key={m.label}>
              <dd className="stat-figure text-gold text-3xl tabular-nums sm:text-4xl">
                {m.prefix}
                {m.grouped ? v.toLocaleString("ko-KR") : v}
                {m.suffix}
              </dd>
              <dt className="mt-1.5 text-xs text-white/55">{m.label}</dt>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
