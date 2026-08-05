import { SectionHeading } from "@/components/ui/section";
import { Marquee } from "@/components/ui/marquee";
import { REVIEWS, type Review } from "@/lib/reviews";

function Card({ review }: { review: Review }) {
  return (
    <figure className="flex w-[300px] shrink-0 flex-col justify-between rounded-2xl border border-line bg-paper p-6 sm:w-[360px]">
      <blockquote
        className="text-sm leading-[1.85] text-ink-soft [&_em]:font-bold [&_em]:text-ink [&_em]:not-italic"
        // 후기 본문의 강조 구간(em)만 렌더한다. 원문은 lib/reviews.ts 에서 관리
        dangerouslySetInnerHTML={{ __html: review.body }}
      />
      <figcaption className="mt-6 flex items-center gap-2 border-t border-line pt-4 text-xs">
        <span className="font-bold">{review.company}</span>
        {review.role && <span className="text-muted">{review.role}</span>}
      </figcaption>
    </figure>
  );
}

/** S11. 고객 후기 — Reviews */
export function Reviews() {
  const half = Math.ceil(REVIEWS.length / 2);
  const rows = [REVIEWS.slice(0, half), REVIEWS.slice(half)];

  return (
    <section className="scroll-mt-16 py-20 md:py-28">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <p className="eyebrow">Reviews</p>
        <SectionHeading className="mt-5">
          함께한 브랜드들이 <strong className="font-bold">남긴 말</strong>
        </SectionHeading>
        <p className="mt-5 max-w-2xl text-sm leading-[1.8] text-muted sm:text-base">
          해그로시 프로젝트를 마친 뒤 받은 실제 후기입니다. 계약상 브랜드명은
          이니셜로 표기했습니다.
        </p>
      </div>

      <div className="mt-12 space-y-3">
        {rows.map((row, i) => (
          <Marquee key={i} durationSec={i === 0 ? 90 : 105} reverse={i === 1}>
            <div className="flex gap-3">
              {row.map((review) => (
                <Card key={review.company + review.body.slice(0, 12)} review={review} />
              ))}
            </div>
          </Marquee>
        ))}
      </div>
    </section>
  );
}
