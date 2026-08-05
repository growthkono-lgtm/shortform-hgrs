import { Section, SectionHeading } from "@/components/ui/section";
import { PhoneMockup } from "@/components/ui/phone-mockup";
import { DataSlot } from "@/components/ui/slot";
import { PROOF_CASES, PROOF_CASE_HINTS } from "@/lib/landing-data";
import { PROOF_POSTERS } from "@/lib/portfolio";
import { POLICY } from "@/lib/constants";

const METRIC_ROWS = [
  { label: "After ROAS", unit: "%", liftLabel: "약 n배" },
  { label: "After CTR", unit: "%", liftLabel: "" },
  { label: "After CPA", unit: "원", liftLabel: "% 절감" },
];

/** S5. 성과 비포애프터 — Proof (핵심 섹션) */
export function Proof() {
  return (
    <Section eyebrow="Proof">
      <SectionHeading>
        광고 계정에서 <strong className="font-bold">숫자가 바뀐 순간</strong>만
        모았습니다
      </SectionHeading>

      <div className="mt-14 space-y-16">
        {PROOF_CASES.map((proofCase, i) => (
          <article
            key={i}
            className="grid items-start gap-8 border-t border-line pt-12 md:grid-cols-[minmax(0,260px)_1fr] md:gap-12"
          >
            <PhoneMockup
              src={proofCase.pending ? null : proofCase.video}
              poster={PROOF_POSTERS[i]}
              alt={`성과 케이스 ${i + 1} 대표 소재`}
              slotName={`case${i + 1}_video`}
            />

            <div>
              <p className="text-sm font-bold text-accent-deep">
                {proofCase.pending ? (
                  <>
                    <DataSlot name={`case${i + 1}_category`} />
                    <span className="ml-2 font-normal text-muted">
                      제안: {PROOF_CASE_HINTS[i]}
                    </span>
                  </>
                ) : (
                  proofCase.categoryLabel
                )}
              </p>

              <dl className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
                {METRIC_ROWS.map((metric, mi) => (
                  <div key={metric.label} className="bg-paper p-6">
                    <dt className="font-display text-xs tracking-[0.02em] text-muted uppercase">
                      {metric.label}
                    </dt>
                    <dd className="stat-figure mt-3 text-3xl sm:text-4xl">
                      {proofCase.pending ? (
                        <DataSlot name={`case${i + 1}_${metric.label.split(" ")[1].toLowerCase()}`} />
                      ) : (
                        <>
                          {proofCase.metrics[mi]?.after}
                          <span className="text-xl">{metric.unit}</span>
                        </>
                      )}
                    </dd>
                    <p className="mt-2 text-xs text-muted">
                      {proofCase.pending
                        ? metric.liftLabel || "상승폭"
                        : proofCase.metrics[mi]?.lift}
                    </p>
                  </div>
                ))}
              </dl>

              {/* 전후 기간 그래프 [DATA case{n}_series] */}
              <div className="mt-5 rounded-2xl border border-dashed border-line bg-paper-alt p-6">
                <p className="font-display text-[0.6875rem] tracking-[0.02em] text-muted uppercase">
                  Data
                </p>
                <p className="mt-1 font-mono text-xs text-ink-soft">
                  case{i + 1}_series — 전후 기간 그래프
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-12 text-xs leading-[1.7] text-muted">{POLICY.noGuarantee}</p>
    </Section>
  );
}
