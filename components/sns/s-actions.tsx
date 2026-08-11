import { ACTIONS } from "@/lib/sns-brand";
import { BrandOrbit } from "./brand-orbit";

/**
 * 통합 브랜드 액션의 주요 예시 — hgrs.io/partnership 섹션(원문 제목의 "마케팅"은
 * 사장님 지시로 "브랜드"로 바꿨다).
 *
 * 원본과 같은 구성이다: **맨 앞 한 건은 크게** 놓고 파트가 모여드는 애니메이션으로
 * "나뉘어 있던 업무가 합쳐져 전략이 된다"를 보여준 뒤, 나머지를 그리드로 깐다.
 * 여덟 건을 처음부터 같은 크기로 늘어놓으면 그 뜻이 사라진다.
 */
export function Actions() {
  const [featured, ...rest] = ACTIONS.items;

  return (
    <section
      id="actions"
      className="on-dark scroll-mt-16 overflow-hidden bg-night py-20 text-white md:py-28"
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <p className="eyebrow">Actions</p>
        <h2 className="mt-5 max-w-3xl text-[1.5rem] leading-[1.35] font-bold sm:text-[2.125rem] sm:leading-[1.3] lg:text-[2.75rem]">
          {ACTIONS.title}
        </h2>
        <p className="mt-5 max-w-2xl text-[0.9375rem] leading-[1.85] text-white/55 sm:text-base">
          채널·컨텐츠·광고·CRM은 따로 굴러가면 각자의 지표만 남습니다.
          브랜드마다 어떤 파트를 붙여 하나의 전략으로 묶었는지, 그리고 무엇이
          남았는지만 정리했습니다.
        </p>
      </div>

      {/* 대표 한 건 — 파트가 모여드는 자리 */}
      <div className="relative mt-16 sm:mt-20">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-[70%] bg-[radial-gradient(60%_60%_at_50%_35%,color-mix(in_oklab,var(--color-accent)_28%,transparent),transparent_70%)]"
        />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
          <BrandOrbit
            brand={featured.brand}
            period={featured.period}
            items={featured.items}
            size="lg"
          />

          {/* 흩어진 위성이 지나가는 자리라 본문을 위로 올려 둔다 */}
          <div className="relative z-10 min-w-0">
            <p className="eyebrow">Featured</p>
            <ul className="mt-5 space-y-3">
              {featured.items.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-[0.9375rem] font-bold text-white/85"
                >
                  <span
                    aria-hidden
                    className="size-2 shrink-0 rounded-full bg-accent"
                  />
                  {item}
                </li>
              ))}
            </ul>
            <ul className="mt-8 space-y-2.5 border-t border-white/15 pt-7">
              {featured.results.map((line) => (
                <li
                  key={line}
                  className="flex gap-2.5 text-sm leading-[1.75] text-white/70"
                >
                  <span aria-hidden className="mt-0.5 shrink-0 text-gold">
                    ✓
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 나머지 */}
      <div className="mx-auto mt-24 w-full max-w-6xl px-5 sm:px-8">
        <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((item, i) => (
            <li key={`${item.brand}-${i}`}>
              <BrandOrbit
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
