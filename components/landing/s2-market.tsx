import { Section, SectionHeading } from "@/components/ui/section";
import { MARKET_STATS } from "@/lib/landing-data";

/** S2. 시장 근거 — Market */
export function Market() {
  return (
    <Section eyebrow="Market" alt>
      <SectionHeading>
        숏폼은 선택이 아니라{" "}
        <strong className="font-bold">매출의 기본값</strong>
        입니다
      </SectionHeading>

      <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
        {MARKET_STATS.map((stat) => (
          <div key={stat.caption} className="flex flex-col bg-paper p-7 sm:p-8">
            <p className="stat-figure text-4xl sm:text-5xl">
              {stat.figure}
              {stat.unit && (
                <span className="text-2xl sm:text-3xl">{stat.unit}</span>
              )}
            </p>
            <p className="mt-4 flex-1 text-sm leading-[1.75] text-ink-soft">
              {stat.caption}
            </p>
            <a
              href={stat.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 text-xs text-muted underline underline-offset-2 hover:text-ink"
            >
              출처: {stat.source}
            </a>
          </div>
        ))}
      </div>
    </Section>
  );
}
