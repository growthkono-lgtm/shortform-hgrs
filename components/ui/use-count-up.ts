"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 카운트업 공통 규칙 — **초기 DOM에는 언제나 최종값이 들어간다**.
 *
 * 예전 구현은 useState(0)으로 시작해 화면에 들어올 때 목표치까지 올렸다.
 * 그래서 JS가 안 도는 환경(검색 크롤러, 카카오·슬랙 링크 미리보기, 일부 인앱브라우저)에서
 * 성과 숫자가 전부 `0주 / ▼0위 / 0배 / ₩0만`으로 노출됐다. 성과 섹션이 통째로 0인 페이지가
 * 링크로 돌아다닌 셈이다.
 *
 * 그래서 진행도 p의 초기값은 1(=최종값)이다. 애니메이션은 progressive enhancement로만 붙는다:
 *
 *   · 마운트 시점에 이미 화면 안에 있는 요소 → 애니메이션을 걸지 않는다.
 *     SSR HTML이 이미 최종값을 그려 놓은 뒤라, 여기서 0으로 되돌리면
 *     사용자 눈에는 "숫자가 나왔다가 0으로 튀는" 깜빡임이 된다. 그 값은 그냥 둔다.
 *   · 아직 화면 밖인 요소(성장 사례 등 대부분) → 0으로 되돌린 뒤 스크롤로 들어올 때 올린다.
 *     되돌리는 순간 화면 밖이라 깜빡임이 보이지 않는다.
 *   · 감속 설정(prefers-reduced-motion) → 최종값 그대로.
 */

const EASE = (t: number) => 1 - Math.pow(1 - t, 3);

export function useCountUp<T extends HTMLElement = HTMLDivElement>({
  duration = 1600,
  threshold = 0.35,
}: { duration?: number; threshold?: number } = {}) {
  const ref = useRef<T>(null);
  /** 0 → 1. SSR·초기 렌더는 1(최종값)에서 출발한다 */
  const [p, setP] = useState(1);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = node.getBoundingClientRect();
    const alreadyVisible = rect.top < window.innerHeight && rect.bottom > 0;
    if (alreadyVisible) return;

    setP(0);

    let raf = 0;
    let start = 0;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const tick = (now: number) => {
          if (!start) start = now;
          const t = Math.min(1, (now - start) / duration);
          setP(EASE(t));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold },
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [duration, threshold]);

  return { ref, p };
}

/** 진행도 p에서 실제로 찍힐 숫자 문자열 */
export function countUpText(
  p: number,
  { to, prefix, suffix, grouped }: { to: number; prefix?: string; suffix?: string; grouped?: boolean },
) {
  const v = Math.round(to * p);
  return `${prefix ?? ""}${grouped ? v.toLocaleString("ko-KR") : v}${suffix ?? ""}`;
}
