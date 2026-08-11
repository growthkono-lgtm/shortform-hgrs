import type { Feature } from "@/lib/sns-brand";
import { SHORT_FEATURE } from "@/lib/sns-brand";
import {
  MagHeadline,
  Plate,
  PullQuote,
  Spread,
  StatStrip,
  VideoPlate,
} from "./mag";

/**
 * 피처 기사 — 케이스를 '포트폴리오 카드'가 아니라 **기사**로 싣는다.
 *
 * 본문은 해그로시 자사 원문(hgrs.io/portfolio/*)에서 발췌한 것이라
 * 문장을 여기서 손대지 않는다. 고칠 일이 있으면 lib/sns-brand.ts 를 고친다.
 *
 * 배치 순서: 머리글 → 제목·리드 → 히어로 도판 → 본문(중간에 풀 인용) →
 * 보조 도판 → 성과 스트립. 매거진 한 지면의 표준 흐름이다.
 */
export function FeatureArticle({
  feature,
  index,
}: {
  feature: Feature;
  index: number;
}) {
  // 풀 인용 자리는 원문에서 그 문장이 나온 위치를 따른다 (lib/sns-brand.ts)
  const before = feature.blocks.slice(0, feature.quoteAfter);
  const after = feature.blocks.slice(feature.quoteAfter);

  return (
    <article
      id={feature.id}
      className={`scroll-mt-20 py-16 sm:py-24 ${
        index % 2 === 0 ? "bg-paper-warm" : "bg-paper"
      }`}
    >
      <Spread>
        <MagHeadline
          label={feature.label}
          category={feature.category}
          meta={feature.meta}
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
          <h2 className="mag-serif text-[1.5rem] text-ink sm:text-[2rem] lg:text-[2.25rem]">
            {feature.title}
          </h2>
          <p className="border-l-2 border-gold pl-4 text-sm leading-[1.85] text-muted lg:pt-2">
            {feature.lead}
          </p>
        </div>

        <Plate figure={feature.hero} className="mt-10" priority={index === 0} />

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
          <div className="min-w-0">
            <p className="mag-serif text-[1.0625rem] leading-[1.85] text-ink sm:text-[1.1875rem]">
              {feature.intro}
            </p>

            <Blocks blocks={before} />
            <PullQuote>{feature.quote}</PullQuote>
            <Blocks blocks={after} />
          </div>

          {/* 사이드 — 도판과 영상. 본문을 읽는 동안 옆에서 '실물'이 따라온다 */}
          <aside className="min-w-0 space-y-8 lg:pt-2">
            {feature.figures.map((figure) => (
              <Plate key={figure.src} figure={figure} />
            ))}
            {feature.videos?.map((video) => (
              <VideoPlate key={video.id} id={video.id} title={video.title} />
            ))}
          </aside>
        </div>

        <StatStrip items={feature.stats} />
      </Spread>
    </article>
  );
}

function Blocks({ blocks }: { blocks: Feature["blocks"] }) {
  return (
    <>
      {blocks.map((block, i) => (
        <div key={block.heading ?? i} className="mt-10 first:mt-8">
          {block.heading && (
            <h3 className="mag-serif mb-4 text-[1.125rem] text-ink sm:text-[1.25rem]">
              {block.heading}
            </h3>
          )}
          <div className="mag-body">
            {block.paras.map((para) => (
              <p key={para.slice(0, 12)}>{para}</p>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

/**
 * 짧은 피처 — 원문 분량이 두 줄뿐인 케이스.
 * 앞의 셋과 같은 틀에 억지로 채우면 나머지 문장을 지어내야 한다. 지면을 줄인다.
 */
export function ShortFeature() {
  const f = SHORT_FEATURE;
  return (
    <article id={f.id} className="scroll-mt-20 bg-paper py-16 sm:py-24">
      <Spread>
        <MagHeadline label={f.label} category={f.category} meta={f.meta} />

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-2 lg:gap-14">
          <div>
            <h2 className="mag-serif text-[1.375rem] text-ink sm:text-[1.75rem]">
              {f.title}
            </h2>
            <p className="mt-5 border-l-2 border-gold pl-4 text-sm leading-[1.85] text-muted">
              {f.lead}
            </p>
            <div className="mag-body mt-7">
              <p>{f.body}</p>
            </div>
          </div>
          <Plate figure={f.hero} />
        </div>

        <StatStrip items={f.stats} />
      </Spread>
    </article>
  );
}
