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
  // 4행으로 깐다 — 2행이면 한 화면에서 카드가 듬성듬성해 섹션이 비어 보인다
  const ROWS = 4;
  const per = Math.ceil(REVIEWS.length / ROWS);
  const rows = Array.from({ length: ROWS }, (_, i) =>
    REVIEWS.slice(i * per, (i + 1) * per),
  ).filter((r) => r.length);

  return (
    <section className="scroll-mt-16 py-20 md:py-28">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <p className="eyebrow">Reviews</p>
        <SectionHeading className="mt-5">
          실제 <strong className="font-bold">클라이언트 후기</strong>
        </SectionHeading>
        <p className="mt-5 max-w-2xl text-sm leading-[1.8] text-muted sm:text-base">
          평균 2천만원 (최소 5백 ~ 최대 2억) 프로젝트를 진행하며 얻어온
          후기입니다.
        </p>
      </div>

      <div className="mt-12 space-y-3">
        {rows.map((row, i) => (
          <Marquee key={i} durationSec={72 + i * 11} reverse={i % 2 === 1}>
            <div className="flex gap-3">
              {row.map((review) => (
                <Card
                  key={review.company + review.body.slice(0, 12)}
                  review={review}
                />
              ))}
            </div>
          </Marquee>
        ))}
      </div>
    </section>
  );
}
