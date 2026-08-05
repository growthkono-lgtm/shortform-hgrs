"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * 세로로 흐르는 마퀴 — 히어로 우측 소재 컬럼.
 * 가로 마퀴와 같은 원리로 트랙을 두 벌 이어 붙인다.
 */
export function VerticalMarquee({
  children,
  durationSec = 50,
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
      { rootMargin: "100px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn("vmarquee overflow-hidden", className)}>
      <div
        className="vmarquee-track flex flex-col gap-3"
        style={{
          animationDuration: `${durationSec}s`,
          animationDirection: reverse ? "reverse" : "normal",
          animationPlayState: active ? "running" : "paused",
        }}
      >
        {children}
        <div aria-hidden className="flex flex-col gap-3">
          {children}
        </div>
      </div>
    </div>
  );
}
