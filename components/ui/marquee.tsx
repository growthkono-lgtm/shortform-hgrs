"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * 자동 스와이프 마퀴 — hgrs.io/partnership 의 크리에이티브 월 패턴.
 *
 * · 트랙을 두 벌 이어 붙여 끊김 없이 흐르게 한다
 * · 화면 밖이면 애니메이션을 멈춘다 (스크롤 부담 제거)
 * · hover 하면 멈춰서 하나를 자세히 볼 수 있게 한다
 * · prefers-reduced-motion 이면 흐르지 않고 가로 스크롤로 대체한다
 */
export function Marquee({
  children,
  durationSec = 60,
  reverse,
  className,
}: {
  children: React.ReactNode;
  durationSec?: number;
  reverse?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { rootMargin: "150px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("marquee group relative overflow-hidden", className)}
    >
      <div
        className="marquee-track flex w-max gap-3"
        style={{
          animationDuration: `${durationSec}s`,
          animationDirection: reverse ? "reverse" : "normal",
          animationPlayState: active ? "running" : "paused",
        }}
      >
        {children}
        {/* 두 번째 벌 — 이어 붙여 무한 루프처럼 보이게. 스크린리더에는 숨긴다 */}
        <div aria-hidden className="flex gap-3">
          {children}
        </div>
      </div>
    </div>
  );
}
