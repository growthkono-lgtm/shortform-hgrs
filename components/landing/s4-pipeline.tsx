import { Section, SectionHeading } from "@/components/ui/section";
import { AssetSlot } from "@/components/ui/slot";

const STEPS = [
  { title: "인플루언서 모집·배포", asset: "pipeline_1" },
  { title: "클린 소스 확보", asset: "pipeline_2" },
  { title: "전환형 숏폼 제작", asset: "pipeline_3" },
  { title: "위너 소재 도출", asset: "pipeline_4" },
];

/** S4. 솔루션 파이프라인 — Pipeline */
export function Pipeline() {
  return (
    <Section eyebrow="Pipeline" alt>
      <SectionHeading>
        그래서 HGRS는 <strong className="font-bold">바이럴과 전환을 한 파이프라인</strong>
        으로 묶었습니다
      </SectionHeading>

      <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <li
            key={step.asset}
            className="relative rounded-2xl border border-line bg-paper p-6"
          >
            <span className="font-display text-sm font-bold text-accent">
              0{i + 1}
            </span>
            <h3 className="mt-2 text-base leading-snug font-bold">{step.title}</h3>
            <AssetSlot
              name={step.asset}
              ratio="9/16"
              className="mt-5 max-h-44"
              hint="실산출물 썸네일"
            />
            {i < STEPS.length - 1 && (
              <span
                aria-hidden
                className="absolute top-1/2 -right-3 hidden text-line lg:block"
              >
                →
              </span>
            )}
          </li>
        ))}
      </ol>
    </Section>
  );
}
