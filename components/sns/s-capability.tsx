import { Cta } from "@/components/ui/cta";
import { CAPABILITY } from "@/lib/sns-brand";
import { Rich } from "./rich";

/**
 * 역량 — hgrs.io/partnership 의 "브랜드의 지속성에는…" 섹션을 옮긴 것.
 *
 * 원본은 스크롤에 맞춰 글자가 회색→검정으로 채워지는 리빌이었는데, 여기서는
 * 강조어만 골드 밑줄로 고정한다(.rich em). 스크롤 이펙트는 이 페이지 톤에서
 * 과하고, 리드 확보 화면에서는 문장이 먼저 읽히는 게 낫다.
 */
export function Capability() {
  return (
    <section id="capability" className="scroll-mt-16 bg-paper py-20 md:py-28">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <p className="eyebrow">Capability</p>

        <h2 className="mt-5 max-w-3xl text-[1.5rem] leading-[1.4] font-bold sm:text-[2.125rem] sm:leading-[1.35] lg:text-[2.75rem]">
          {CAPABILITY.title.map((line) => (
            <Rich key={line} as="span" html={line} className="block" />
          ))}
        </h2>

        {/* 상단 3분할 — 원문 그대로. 앞머리(굵게)와 뒷말(연하게)이 갈린다 */}
        <ul className="mt-14 grid gap-5 md:grid-cols-3">
          {CAPABILITY.primary.map((item) => (
            <li
              key={item.head}
              className="rounded-2xl border border-line bg-paper-alt p-7 sm:p-8"
            >
              <p className="text-[1.0625rem] leading-[1.6] font-bold text-ink sm:text-xl">
                {item.head}
              </p>
              <p className="mt-1.5 text-[1.0625rem] leading-[1.6] text-muted sm:text-xl">
                {item.tail}
              </p>
            </li>
          ))}
        </ul>

        {/* 지표 + 전문성 3줄 */}
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
          <dl className="grid gap-px overflow-hidden rounded-2xl bg-line sm:grid-cols-2 lg:grid-cols-1">
            {CAPABILITY.figures.map((f) => (
              <div key={f.label} className="bg-paper-alt px-7 py-7">
                <dt className="stat-figure text-[2rem] text-accent sm:text-[2.5rem]">
                  {f.figure}
                </dt>
                <dd className="mt-2 text-sm text-muted">{f.label}</dd>
              </div>
            ))}
          </dl>

          <ul className="grid gap-px overflow-hidden rounded-2xl bg-line">
            {CAPABILITY.secondary.map((item) => (
              <li key={item.head} className="bg-paper-alt px-7 py-6">
                <span className="text-[0.9375rem] leading-[1.7] font-bold text-ink sm:text-base">
                  {item.head}
                </span>
                <span className="text-[0.9375rem] leading-[1.7] text-muted sm:text-base">
                  {item.tail}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* 퍼널 — 원문의 5단계 깔때기. 폭을 줄여 가며 쌓아 형태로 읽히게 한다 */}
        <div className="mt-16 flex flex-col items-center gap-2.5">
          {CAPABILITY.funnel.steps.map((step, i) => (
            <div
              key={step}
              style={{ width: `${100 - i * 11}%` }}
              className="rounded-xl border border-accent/20 bg-accent/[0.06] py-3.5 text-center text-[0.8125rem] font-bold text-accent-deep sm:text-sm"
            >
              {step}
            </div>
          ))}
          <p className="mt-3 text-sm font-bold text-ink">
            {CAPABILITY.funnel.result}
          </p>
        </div>
      </div>

      {/* 전환 밴드 — 원본에서 이 섹션과 사례 그리드 사이에 놓인 다크 패널 */}
      <div className="mx-auto mt-20 w-full max-w-6xl px-5 sm:px-8">
        <div className="hero-night on-dark flex flex-wrap items-center justify-between gap-8 rounded-3xl px-8 py-12 text-white sm:px-12">
          <h3 className="max-w-xl text-[1.25rem] leading-[1.45] font-bold sm:text-[1.75rem] sm:leading-[1.4]">
            {CAPABILITY.band}
          </h3>
          <Cta href="#contact" variant="invert">
            {CAPABILITY.bandCta}
          </Cta>
        </div>
      </div>
    </section>
  );
}
