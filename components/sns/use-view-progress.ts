"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 요소가 화면을 지나가는 진행도(0 → 1).
 *
 * 원래 CSS 스크롤 구동 애니메이션(`animation-timeline: view()`)으로 짰는데,
 * `CSS.supports`가 true를 돌려주면서도 ViewTimeline 이 활성화되지 않는 환경을
 * 만났다(timeline.currentTime === null → 애니메이션이 끝 상태로 고정).
 * 검증할 수 없는 효과를 페이지의 핵심 연출로 두지 않는다 — 직접 잰다.
 *
 * 규칙은 카운트업 훅과 같다: **초기값은 1(최종 상태)**이다.
 * JS가 안 돌면 그냥 완성된 도형이 보이고, 화면 밖에서 시작할 때만 0부터 올린다.
 */
export function useViewProgress<T extends HTMLElement = HTMLDivElement>({
  /** 진행 구간 — 요소 상단이 뷰포트 이 지점(0=바닥, 1=천장)을 지날 때 0 → 1 */
  from = 0.95,
  to = 0.45,
}: { from?: number; to?: number } = {}) {
  const ref = useRef<T>(null);
  const [p, setP] = useState(1);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let running = false;

    const measure = () => {
      raf = 0;
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // 요소 상단이 from → to 구간을 지나는 동안 0 → 1
      const t = (from - rect.top / vh) / (from - to);
      setP(Math.min(1, Math.max(0, t)));
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };

    // 화면 안에 있을 때만 스크롤을 듣는다 — 8개가 동시에 붙는 섹션이라 아낀다
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting === running) return;
        running = entry.isIntersecting;
        if (running) {
          window.addEventListener("scroll", onScroll, { passive: true });
          measure();
        } else {
          window.removeEventListener("scroll", onScroll);
        }
      },
      { rootMargin: "20% 0px 20% 0px" },
    );
    observer.observe(node);
    measure();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [from, to]);

  return { ref, p };
}
