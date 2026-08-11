"use client";

import { countUpText, useCountUp } from "@/components/ui/use-count-up";

/**
 * 히어로 숫자칩 3개 — "숏폼만 파는 신생 팀"이 아니라는 걸 헤드라인 바로 밑에서 끝낸다.
 *
 * 스타일은 Crew 섹션의 숫자 스탯(30+/10/1)을 그대로 쓴다(.stat-figure + 골드탄).
 * 새 스타일을 만들지 않는다 — 같은 종류의 주장은 같은 모양으로 읽혀야 한다.
 *
 * 숫자는 초기 DOM에 최종값이 들어간다. 카운트업은 화면 밖에서 들어올 때만 붙는
 * progressive enhancement다 (use-count-up.ts 주석 참고). 히어로는 로드 시점에
 * 이미 화면 안이라 실제로는 정적으로 렌더된다 — 의도한 동작이다.
 */
const CHIPS = [
  { to: 30, suffix: "+", label: "브랜드 프로젝트 수행" },
  { to: 3, suffix: "억대", label: "연 거래액" },
  {
    to: 2000,
    prefix: "₩",
    suffix: "만",
    grouped: true,
    label: "평균 프로젝트 단가",
  },
] as const;

export function HeroStats() {
  const { ref, p } = useCountUp<HTMLDListElement>();

  return (
    // 모바일에서 세 칸을 정확히 3등분하면 "₩2,000만"이 칸보다 1~2px 넓어 줄이 깨진다.
    // 좁은 화면에서만 마지막 칸에 폭을 더 준다 (sm 이상은 그냥 3등분).
    <dl
      ref={ref}
      className="mt-7 grid max-w-xl grid-cols-[1fr_1fr_1.4fr] gap-px overflow-hidden rounded-2xl bg-white/12 sm:mt-8 sm:grid-cols-3"
    >
      {/* min-w-0 — nowrap 숫자가 트랙 최소폭을 밀어올려 열 전체가 넓어지던 걸 막는다 */}
      {CHIPS.map((c) => (
        <div
          key={c.label}
          className="min-w-0 bg-night/70 px-3 py-4 backdrop-blur-sm sm:px-5 sm:py-5"
        >
          <dt className="stat-figure text-gold text-lg whitespace-nowrap tabular-nums sm:text-3xl">
            {countUpText(p, c)}
          </dt>
          <dd className="mt-2 text-[0.6875rem] leading-[1.5] font-bold text-white/55 sm:text-xs">
            {c.label}
          </dd>
        </div>
      ))}
    </dl>
  );
}
