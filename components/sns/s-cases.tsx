import Image from "next/image";
import { Section, SectionHeading } from "@/components/ui/section";
import {
  CASES,
  FEATURES,
  SHORT_FEATURE,
  type Feature,
  type Figure,
} from "@/lib/sns-brand";
import { Rich } from "./rich";

/**
 * 브랜드별 성과 — 접힌 카드가 기본이고, "자세히 보기"를 눌러야 전문이 열린다.
 *
 * 넷을 다 펼쳐 두면 페이지가 13,000px를 넘는다. 스캔하는 사람은 성과 숫자만 보고
 * 지나가고, 진짜 검토하는 사람만 펼쳐 읽으면 된다. JS 없이 <details> 로 처리한다 —
 * 상태를 들고 있을 이유가 없고, 접힌 내용도 검색엔진에는 그대로 노출된다.
 */

function Plate({
  figure,
  className = "",
  crop,
}: {
  figure: Figure;
  className?: string;
  /** 접힌 카드에서는 비율을 고정해 자른다 — 1:1 이미지가 섞이면 왼쪽 열에 빈 공간이 크게 남는다 */
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

function Stats({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-6 grid gap-px overflow-hidden rounded-xl bg-line sm:grid-cols-3">
      {items.map((item) => (
        <li
          key={item}
          className="bg-paper-alt px-4 py-3.5 text-sm font-bold text-ink"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

/** 접힘/펼침 토글 — summary 안에서 열림 상태에 따라 문구가 바뀐다 */
function Toggle() {
  return (
    <span className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-ink/20 px-5 py-2.5 text-[0.8125rem] font-bold text-ink transition-colors duration-200 group-hover:border-ink group-hover:bg-ink/[0.03]">
      <span className="group-open:hidden">프로젝트 전문 보기</span>
      <span className="hidden group-open:inline">접기</span>
      <span
        aria-hidden
        className="transition-transform duration-200 group-open:rotate-180"
      >
        ↓
      </span>
    </span>
  );
}

function Card({ feature }: { feature: Feature }) {
  return (
    <details
      id={feature.id}
      className="group scroll-mt-20 overflow-hidden rounded-2xl border border-line bg-paper"
    >
      <summary className="cursor-pointer list-none p-6 marker:hidden sm:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="eyebrow">{feature.category}</p>
          <p className="text-xs text-muted">{feature.meta}</p>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-10">
          <div className="min-w-0">
            <h3 className="text-[1.25rem] leading-[1.4] font-bold sm:text-[1.5rem]">
              {feature.title}
            </h3>
            <p className="mt-4 border-l-2 border-gold pl-4 text-sm leading-[1.8] text-muted">
              {feature.lead}
            </p>
            <Rich
              html={feature.summary}
              className="mt-5 text-[0.9375rem] leading-[1.85] text-ink-soft"
            />
            <Stats items={feature.stats} />
            <Toggle />
          </div>

          <Plate figure={feature.hero} className="min-w-0 self-start" crop />
        </div>
      </summary>

      {/* 펼친 뒤 — 원문 전문과 나머지 도판 */}
      <div className="border-t border-line px-6 pb-8 sm:px-8">
        <div className="grid gap-10 pt-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
          <div className="min-w-0">
            <p className="text-[0.9375rem] leading-[1.9] font-bold text-ink sm:text-base">
              {feature.intro}
            </p>

            {feature.blocks.map((block, i) => (
              <div key={block.heading ?? i} className="mt-8">
                {block.heading && (
                  <h4 className="mb-3.5 text-base font-bold text-ink">
                    {block.heading}
                  </h4>
                )}
                {block.paras.map((para) => (
                  <p
                    key={para.slice(0, 12)}
                    className="mt-3.5 text-sm leading-[1.9] text-muted first:mt-0"
                  >
                    {para}
                  </p>
                ))}
              </div>
            ))}

            <blockquote className="mt-9 rounded-xl border border-accent/30 bg-accent/[0.06] p-6 text-[0.9375rem] leading-[1.75] font-bold text-ink sm:text-base">
              “{feature.quote}”
            </blockquote>
          </div>

          <div className="min-w-0 space-y-7">
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
                  {/* 유튜브 썸네일은 유튜브에서 그대로 받는다 — 이 CDN은 사라지지 않는다 */}
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
      </div>
    </details>
  );
}

/** 트러스티푸드 — 원문이 두 줄뿐이라 펼칠 게 없다. 접히지 않는 짧은 카드로 둔다 */
function ShortCard() {
  const f = SHORT_FEATURE;
  return (
    <div
      id={f.id}
      className="scroll-mt-20 overflow-hidden rounded-2xl border border-line bg-paper p-6 sm:p-8"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="eyebrow">{f.category}</p>
        <p className="text-xs text-muted">{f.meta}</p>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-10">
        <div className="min-w-0">
          <h3 className="text-[1.25rem] leading-[1.4] font-bold sm:text-[1.5rem]">
            {f.title}
          </h3>
          <p className="mt-4 border-l-2 border-gold pl-4 text-sm leading-[1.8] text-muted">
            {f.lead}
          </p>
          <Rich
            html={f.summary}
            className="mt-5 text-[0.9375rem] leading-[1.85] text-ink-soft"
          />
          <Stats items={f.stats} />
        </div>
        <Plate figure={f.hero} className="min-w-0 self-start" crop />
      </div>
    </div>
  );
}

export function Cases() {
  return (
    <Section eyebrow="Cases" id="cases">
      <SectionHeading>
        {CASES.title[0]}
        <br />
        <strong className="font-bold">{CASES.title[1]}</strong>
      </SectionHeading>
      <p className="mt-5 max-w-2xl text-[0.9375rem] leading-[1.8] text-muted sm:text-base">
        {CASES.lead}
      </p>

      <div className="mt-12 space-y-5">
        {FEATURES.map((feature) => (
          <Card key={feature.id} feature={feature} />
        ))}
        <ShortCard />
      </div>
    </Section>
  );
}
