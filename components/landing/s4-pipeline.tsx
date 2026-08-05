import Image from "next/image";
import { Section, SectionHeading } from "@/components/ui/section";
import { PIPELINE_SHOTS } from "@/lib/portfolio";

const STEPS = [
  { title: "인플루언서 모집·배포", shot: PIPELINE_SHOTS[0] },
  { title: "클린 소스 확보", shot: PIPELINE_SHOTS[1] },
  { title: "전환형 숏폼 제작", shot: PIPELINE_SHOTS[2] },
  { title: "위너 소재 도출", shot: PIPELINE_SHOTS[3] },
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
            key={step.title}
            className="relative rounded-2xl border border-line bg-paper p-6"
          >
            <span className="font-display text-sm font-bold text-accent">
              0{i + 1}
            </span>
            <h3 className="mt-2 text-base leading-snug font-bold">{step.title}</h3>
            <div className="relative mt-5 aspect-[4/3] overflow-hidden rounded-xl bg-paper-alt">
              <Image
                src={step.shot}
                alt={`${step.title} 산출물`}
                fill
                sizes="(max-width: 640px) 100vw, 260px"
                className="object-cover"
              />
            </div>
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
