import { Section, SectionHeading } from "@/components/ui/section";
import { LoopVideo } from "@/components/ui/loop-video";
import { OUTCOME_CASES } from "@/lib/landing-data";

/** S5. 성과 — Proof */
export function Proof() {
  return (
    <Section eyebrow="Proof">
      <SectionHeading>
        광고 계정에서 <strong className="font-bold">숫자가 바뀐 순간</strong>만
        모았습니다
      </SectionHeading>
      <p className="mt-5 max-w-2xl text-sm leading-[1.8] text-muted sm:text-base">
        아래는 브랜드가 직접 전해온 결과입니다. 저희가 산출한 추정치가 아닙니다.
      </p>

      <div className="mt-14 space-y-4">
        {OUTCOME_CASES.map((item) => (
          <article
            key={item.company}
            className="grid gap-8 rounded-2xl border border-line bg-paper p-6 sm:p-8 md:grid-cols-[1fr_minmax(0,220px)] md:items-center"
          >
            <div>
              <h3 className="text-xl leading-[1.4] font-bold sm:text-2xl">
                {item.headline}
              </h3>

              <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
                {item.metrics.map((metric) => (
                  <div key={metric.label}>
                    <dd className="stat-figure text-2xl sm:text-3xl">
                      {metric.value}
                    </dd>
                    <dt className="mt-1.5 font-display text-[0.6875rem] tracking-[0.02em] text-muted uppercase">
                      {metric.label}
                    </dt>
                  </div>
                ))}
              </dl>

              <blockquote className="mt-7 border-l-2 border-accent pl-4 text-sm leading-[1.85] text-muted">
                {item.quote}
              </blockquote>

              <p className="mt-4 text-xs">
                <span className="font-bold">{item.company}</span>
                {item.role && (
                  <span className="ml-2 text-muted">{item.role}</span>
                )}
              </p>
            </div>

            {item.video && item.poster && (
              <div className="relative mx-auto aspect-[9/16] w-full max-w-[200px] overflow-hidden rounded-xl border border-line bg-paper-alt">
                <LoopVideo
                  src={item.video}
                  poster={item.poster}
                  alt={`${item.company} 숏폼 소재`}
                />
              </div>
            )}
          </article>
        ))}
      </div>

      <p className="mt-10 text-xs leading-[1.7] text-muted">
        위 결과는 각 브랜드가 전한 실제 운영 성과이며, 브랜드·상품·예산에 따라
        달라질 수 있습니다. 동일한 성과를 보장하지 않습니다.
      </p>
    </Section>
  );
}
