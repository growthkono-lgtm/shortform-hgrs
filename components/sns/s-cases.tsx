import Image from "next/image";
import { Section, SectionHeading } from "@/components/ui/section";
import { CASES, FEATURES, type Feature, type Figure } from "@/lib/sns-brand";

/**
 * 브랜드별 성과 — 2026-08-11 피그마 와이어프레임 기준으로 다시 짰다.
 *
 * 이전에는 hgrs.io/portfolio 원문을 길게 싣고 <details>로 접었는데, 사장님이
 * 본문을 세 문단으로 다시 쓰시면서 접을 이유가 사라졌다. 전부 펼쳐 둔다.
 * 성과 스트립은 괄호 설명이 붙는 경우가 있어 값/설명 두 줄로 렌더한다.
 */

function Plate({
  figure,
  className = "",
  crop,
}: {
  figure: Figure;
  className?: string;
  crop?: boolean;
}) {
  return (
    <figure className={className}>
      <div
        className={`overflow-hidden rounded-xl border border-line bg-paper ${
          crop ? "relative aspect-[4/3]" : ""
        }`}
      >
        <Image
          src={figure.src}
          alt={figure.caption}
          width={figure.width}
          height={figure.height}
          sizes="(min-width: 1024px) 520px, 100vw"
          className={
            crop ? "absolute inset-0 size-full object-cover" : "h-auto w-full"
          }
        />
      </div>
      <figcaption className="mt-2.5 text-xs leading-[1.7] text-muted">
        {figure.caption}
      </figcaption>
    </figure>
  );
}

function Card({ feature }: { feature: Feature }) {
  return (
    <article
      id={feature.id}
      className="scroll-mt-20 overflow-hidden rounded-2xl border border-line bg-paper p-6 sm:p-8"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="eyebrow">{feature.category}</p>
        <p className="text-xs text-muted">{feature.meta}</p>
      </div>

      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
        <div className="min-w-0">
          <h3 className="text-[1.25rem] leading-[1.45] font-bold sm:text-[1.5rem]">
            {feature.title}
          </h3>

          <div className="mt-6 space-y-4">
            {feature.body.map((para) => (
              <p
                key={para.slice(0, 14)}
                className="text-sm leading-[1.9] text-muted sm:text-[0.9375rem]"
              >
                {para}
              </p>
            ))}
          </div>

          {/* 성과 — 값 아래 괄호 설명이 붙는 항목이 있다 */}
          <ul className="mt-8 grid gap-px overflow-hidden rounded-xl bg-line sm:grid-cols-3">
            {feature.stats.map((stat) => (
              <li key={stat.v} className="bg-paper-alt px-4 py-4">
                <span className="block text-sm font-bold text-ink">
                  {stat.v}
                </span>
                {stat.note && (
                  <span className="mt-1 block text-[0.6875rem] leading-[1.6] text-muted">
                    ({stat.note})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0 space-y-6">
          <Plate figure={feature.hero} crop />
          {feature.figures.map((figure) => (
            <Plate key={figure.src} figure={figure} />
          ))}
          {feature.videos?.map((video) => (
            <figure key={video.id}>
              <a
                href={`https://www.youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noreferrer"
                className="group/v relative block aspect-video overflow-hidden rounded-xl border border-line bg-night"
              >
                {/* 유튜브 썸네일은 유튜브에서 그대로 받는다 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
                  alt={video.title}
                  loading="lazy"
                  className="size-full object-cover transition-opacity duration-300 group-hover/v:opacity-80"
                />
                <span
                  aria-hidden
                  className="absolute inset-0 grid place-items-center"
                >
                  <span className="grid size-12 place-items-center rounded-full bg-paper/90 text-ink">
                    <svg
                      viewBox="0 0 24 24"
                      className="ml-0.5 size-5"
                      fill="currentColor"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </span>
              </a>
              <figcaption className="mt-2.5 text-xs text-muted">
                {video.title}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </article>
  );
}

export function Cases() {
  return (
    <Section eyebrow="Cases" id="cases">
      <SectionHeading>
        {CASES.title[0]}
        <br />
        {CASES.title[1]}
        <br />
        <strong className="font-bold">{CASES.title[2]}</strong>
      </SectionHeading>
      <p className="mt-5 max-w-3xl text-[0.9375rem] leading-[1.8] text-muted sm:text-base">
        {CASES.lead}
      </p>

      <div className="mt-12 space-y-5">
        {FEATURES.map((feature) => (
          <Card key={feature.id} feature={feature} />
        ))}
      </div>
    </Section>
  );
}
