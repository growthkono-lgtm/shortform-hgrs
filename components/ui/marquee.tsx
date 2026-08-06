"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * 자동 스와이프 마퀴 — hgrs.io/partnership 의 크리에이티브 월 패턴.
 *
 * · 같은 벌을 copies 개 이어 붙여 끊김 없이 흐르게 한다
 * · 화면 밖이면 애니메이션을 멈춘다 (스크롤 부담 제거)
 * · hover 하면 멈춰서 하나를 자세히 볼 수 있게 한다
 * · prefers-reduced-motion 이면 흐르지 않고 가로 스크롤로 대체한다
 * · swipeOnMobile 이면 모바일에서는 아예 흐르지 않고 손가락으로 넘긴다
 */
export function Marquee({
  children,
  durationSec = 60,
  reverse,
  copies = 2,
  swipeOnMobile,
  className,
}: {
  children: React.ReactNode;
  durationSec?: number;
  reverse?: boolean;
  /**
   * 한 벌이 뷰포트보다 좁으면 두 벌로는 트랙 끝에 빈칸이 생긴다.
   * 칸이 커지면서 한 행의 개수가 줄었으므로 짧은 행은 3벌 이상을 넘긴다.
   */
  copies?: number;
  /** 숏폼처럼 "눌러서 봐야 하는" 행 — 모바일에서 자동 흐름을 끄고 스냅 스크롤로 바꾼다 */
  swipeOnMobile?: boolean;
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
      className={cn(
        "marquee group relative overflow-hidden",
        swipeOnMobile && "marquee-swipe",
        className,
      )}
    >
      {/*
        벌 사이 간격은 트랙이 아니라 각 벌의 pr-3 이 만든다.
        트랙에 gap 을 주면 트랙 폭이 (벌 × N + 간격 × N-1) 이 돼서
        한 벌만큼 흘리는 계산(-100%/N)이 매 바퀴 몇 px씩 어긋난다.
      */}
      <div
        className="marquee-track flex w-max"
        style={
          {
            "--marquee-copies": copies,
            animationDuration: `${durationSec}s`,
            animationDirection: reverse ? "reverse" : "normal",
            animationPlayState: active ? "running" : "paused",
          } as React.CSSProperties
        }
      >
        {Array.from({ length: copies }, (_, i) => (
          // 첫 벌만 스크린리더에 남긴다 — 나머지는 무한 루프용 복제본이다
          <div
            key={i}
            aria-hidden={i > 0}
            className="marquee-copy flex shrink-0 gap-3 pr-3"
          >
            {children}
          </div>
        ))}
      </div>
    </div>
  );
}
