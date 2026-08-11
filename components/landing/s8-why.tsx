import Image from "next/image";
import { Section, SectionHeading } from "@/components/ui/section";
import { TRUST_COUNTERS } from "@/lib/landing-data";
import { GROWTH_SHOTS } from "@/lib/portfolio";
import { COMPANY } from "@/lib/constants";

/** A1 3기둥 — hgrs.io 1·2·3 넘버링 카드 패턴 */
const PILLARS = [
  {
    title: "경험 기반 위너 기획",
    body: "실제 매출 성과로 검증된 경험을 바탕으로, 팔리는 구조의 숏폼만 기획·납품합니다.",
  },
  {
    title: "업계 Top 바이럴 전문가 시스템",
    body: "업계 최상위 바이럴 영상을 담당해 온 전문가들이 브랜드마다 시스템으로 투입됩니다.",
  },
  {
    title: "하이엔드 인프라의 개방",
    body: "평균 프로젝트 단가 2천만원 이상으로 운영해 온 전략 인프라를, 숏폼 영역만 합리적 가격으로 제공합니다.",
  },
];

/** S8. Why HGRS — 3기둥 신뢰 섹션 */
export function WhyHgrs() {
  return (
    <Section eyebrow="Why HGRS" alt>
      <SectionHeading>
        숏폼 외주가 아니라,{" "}
        <strong className="font-bold">전략 집단의 시스템</strong>
        입니다
      </SectionHeading>

      <ol className="mt-12 grid gap-8 md:grid-cols-3">
        {PILLARS.map((pillar, i) => (
          <li key={pillar.title} className="border-t border-ink pt-6">
            {/* hgrs.io 넘버링 — 액센트 #B88C8C */}
            <span className="font-display text-2xl leading-none font-bold text-accent">
              {i + 1}
            </span>
            <h3 className="mt-4 text-lg leading-snug font-bold">
              {pillar.title}
            </h3>
            <p className="mt-3 text-sm leading-[1.8] text-muted">
              {pillar.body}
            </p>
          </li>
        ))}
      </ol>

      {/* 카운터 — hgrs.io "90%" 스타일 */}
      <dl className="mt-16 grid gap-8 border-t border-line pt-12 sm:grid-cols-2 lg:grid-cols-4">
        {TRUST_COUNTERS.map((counter) => (
          <div key={counter.key}>
            <dd className="stat-figure text-3xl sm:text-4xl">
              {counter.value}
              <span className="text-2xl">{counter.suffix}</span>
            </dd>
            <dt className="mt-3 text-sm font-bold">{counter.label}</dt>
            <p className="font-display text-[0.6875rem] tracking-[0.02em] text-muted uppercase">
              {counter.en}
            </p>
            {/* 자체 집계 수치는 기준을 함께 밝힌다 */}
            {counter.note && (
              <p className="mt-1.5 text-[0.6875rem] leading-[1.5] text-muted">
                {counter.note}
              </p>
            )}
          </div>
        ))}
      </dl>

      <div className="mt-12 rounded-2xl border border-line bg-paper p-6 sm:p-8">
        <p className="text-base font-bold sm:text-lg">
          소재만 찍는 게 아니라, 성과가 나는 구조를 함께 봅니다
        </p>
        <p className="mt-2 max-w-2xl text-sm leading-[1.75] text-muted">
          검색 점유·유입 구조·전환 지표까지 들여다보며 어떤 소재가 필요한지
          역산합니다. {COMPANY.address}의 {COMPANY.addressLabel}에서 기획부터
          촬영·편집까지 이어집니다.
        </p>

        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {GROWTH_SHOTS.map((shot, i) => (
            <li
              key={shot}
              className="relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-paper-alt"
            >
              <Image
                src={shot}
                alt={`그로스 실행 화면 ${i + 1}`}
                fill
                sizes="(max-width: 640px) 50vw, 180px"
                className="object-contain p-1"
              />
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
