import { ACTIONS } from "@/lib/sns-brand";

/**
 * 통합 마케팅 액션의 주요 예시 — hgrs.io/partnership 의 원형 다이어그램 그리드.
 *
 * 원본은 브랜드 이니셜을 가운데 큰 원에 두고 실행 항목 4개를 위성처럼 붙인 형태다.
 * 프레이머 도형을 이미지로 뜨지 않고 CSS로 다시 그렸다 — 반응형에서 글자가 깨지지 않고,
 * 항목이 바뀌어도 데이터만 고치면 되기 때문이다.
 *
 * 브랜드명은 원문대로 이니셜 표기를 유지한다.
 */

/**
 * 위성 4개 — 위/오른쪽/아래/왼쪽.
 * 위성과 가운데 원이 겹치는 구도라(원본이 그렇다) 글자를 원 한가운데 두면
 * 가운데 원에 먹힌다. 패딩으로 **바깥쪽으로 밀어** 겹치는 쪽을 비운다.
 */
const SATELLITES = [
  { pos: "left-1/2 top-0 -translate-x-1/2", pad: "pb-[42%]" },
  { pos: "right-0 top-1/2 -translate-y-1/2", pad: "pl-[33%]" },
  { pos: "left-1/2 bottom-0 -translate-x-1/2", pad: "pt-[42%]" },
  { pos: "left-0 top-1/2 -translate-y-1/2", pad: "pr-[33%]" },
];

function Diagram({
  brand,
  period,
  items,
}: {
  brand: string;
  period: string | null;
  items: readonly string[];
}) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[320px]">
      {/* 바깥 링 — 원본의 얇은 궤도선 */}
      <span
        aria-hidden
        className="absolute inset-[6%] rounded-full border border-white/12"
      />

      {items.map((item, i) => (
        <span
          key={item}
          className={`absolute grid size-[46%] place-items-center rounded-full bg-accent/80 px-2 text-center text-[0.625rem] leading-[1.35] font-bold text-white sm:text-[0.6875rem] ${SATELLITES[i].pos} ${SATELLITES[i].pad}`}
        >
          {item}
        </span>
      ))}

      {/* 가운데 — 브랜드 이니셜. 위성 위에 올라와야 원본과 같은 겹침이 난다 */}
      <span className="absolute inset-[30%] z-10 grid place-items-center rounded-full bg-accent text-white shadow-[0_0_50px_-8px_rgba(77,95,232,0.9)]">
        <span className="text-center">
          <span className="stat-figure block text-lg sm:text-xl">
            {brand}
            <span className="ml-0.5 text-[0.6875rem] font-normal text-white/70">
              브랜드
            </span>
          </span>
          {period && (
            <span className="mt-1 block text-[0.625rem] text-white/60">
              {period}
            </span>
          )}
        </span>
      </span>
    </div>
  );
}

export function Actions() {
  return (
    <section
      id="actions"
      className="on-dark scroll-mt-16 bg-night py-20 text-white md:py-28"
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <p className="eyebrow">Actions</p>
        <h2 className="mt-5 max-w-3xl text-[1.5rem] leading-[1.35] font-bold sm:text-[2.125rem] sm:leading-[1.3] lg:text-[2.75rem]">
          {ACTIONS.title}
        </h2>
        <p className="mt-5 max-w-2xl text-[0.9375rem] leading-[1.85] text-white/55 sm:text-base">
          채널 하나만 떼어 맡은 프로젝트도, 브랜드 전체를 함께 굴린 프로젝트도
          있습니다. 어떤 조합으로 붙었고 무엇이 남았는지만 정리했습니다.
        </p>

        <ul className="mt-16 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {ACTIONS.items.map((item, i) => (
            <li key={`${item.brand}-${i}`}>
              <Diagram
                brand={item.brand}
                period={item.period}
                items={item.items}
              />
              <ul className="mt-6 space-y-2 rounded-2xl border border-white/12 px-5 py-5">
                {item.results.map((line) => (
                  <li
                    key={line}
                    className="flex gap-2.5 text-[0.8125rem] leading-[1.7] text-white/75"
                  >
                    <span aria-hidden className="mt-0.5 shrink-0 text-gold">
                      ✓
                    </span>
                    {line}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>

        <p className="mt-14 text-center text-sm text-white/35">
          {ACTIONS.more}
        </p>
      </div>
    </section>
  );
}
