import { Section, SectionHeading } from "@/components/ui/section";
import { DataSlot } from "@/components/ui/slot";
import { MARKET_STATS } from "@/lib/landing-data";

/** S2. 시장 근거 — Market */
export function Market() {
  return (
    <Section eyebrow="Market" alt>
      <SectionHeading>
        숏폼은 선택이 아니라 <strong className="font-bold">매출의 기본값</strong>입니다
      </SectionHeading>

      <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
        {MARKET_STATS.map((stat, i) => (
          <div key={i} className="bg-paper p-7 sm:p-8">
            <p className="stat-figure text-4xl sm:text-5xl">
              {stat.pending ? (
                <DataSlot name={`market_${i + 1}`} />
              ) : (
                <>
                  {stat.figure}
                  {stat.unit && (
                    <span className="text-2xl sm:text-3xl">{stat.unit}</span>
                  )}
                </>
              )}
            </p>
            <p className="mt-4 text-sm leading-[1.7] text-ink-soft">
              {stat.pending ? "통계 문구 — 실데이터 입력 대기" : stat.caption}
            </p>
            <p className="mt-3 text-xs text-muted">
              {stat.pending ? (
                <span className="font-mono">출처 URL 필수</span>
              ) : (
                <a
                  href={stat.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2 hover:text-ink"
                >
                  출처: {stat.source}
                </a>
              )}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
