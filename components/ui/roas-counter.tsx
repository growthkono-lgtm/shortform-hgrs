"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 피그마 지시: "그래프가 올라가고, ROAS가 10,20,30,40,50,300+까지 숫자가 변하는
 * 애니메이션을 영상 소재들 위 어딘가 적용".
 *
 * 지시대로 **정해진 단계만** 밟는다 (10→20→30→40→50→300+). 부드럽게 보간하면
 * 마지막 300+ 로 튀는 구간이 뭉개져 지시한 리듬이 사라진다.
 * 화면에 들어올 때 한 번만 돌고, 감속 설정이 켜져 있으면 최종값만 보여준다.
 */
const STEPS = ["10", "20", "30", "40", "50", "300+"] as const;

export function RoasCounter({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setStep(STEPS.length - 1);
      setDrawn(true);
      return;
    }

    let timers: ReturnType<typeof setTimeout>[] = [];
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setDrawn(true);
        // 마지막 300+ 앞에 한 박자 쉬어 "튀어오르는" 인상을 만든다
        const delays = [420, 840, 1260, 1680, 2280];
        timers = delays.map((d, i) =>
          setTimeout(() => setStep(i + 1), d),
        );
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  const last = step === STEPS.length - 1;

  return (
    <div
      ref={ref}
      className={`pointer-events-none rounded-2xl border border-line/60 bg-paper/90 px-5 py-4 shadow-[0_18px_44px_-18px_rgba(3,3,3,0.4)] backdrop-blur-md ${className ?? ""}`}
    >
      <div className="flex items-end gap-4">
        <div>
          <p className="font-display text-[0.625rem] tracking-[0.02em] text-muted uppercase">
            ROAS
          </p>
          <p
            className={`stat-figure tabular-nums transition-[font-size,color] duration-300 ${
              last ? "text-accent text-4xl sm:text-5xl" : "text-ink text-3xl sm:text-4xl"
            }`}
          >
            {STEPS[step]}
          </p>
        </div>

        {/* 우상향 라인 — 카운터와 같은 타이밍에 그려진다 */}
        <svg
          viewBox="0 0 96 44"
          className="h-11 w-24 shrink-0 overflow-visible"
          aria-hidden
        >
          <path
            d="M2 42 L20 34 L36 30 L52 22 L68 16 L94 2"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            style={{
              strokeDasharray: 1,
              strokeDashoffset: drawn ? 0 : 1,
              transition: "stroke-dashoffset 2.2s cubic-bezier(0.4,0,0.2,1)",
            }}
          />
          <circle
            cx="94"
            cy="2"
            r="3.5"
            fill="var(--color-accent)"
            style={{
              opacity: last ? 1 : 0,
              transition: "opacity 300ms ease",
            }}
          />
        </svg>
      </div>
    </div>
  );
}
