import Image from "next/image";
import { Section, SectionHeading } from "@/components/ui/section";
import { PROCESS } from "@/lib/sns-brand";

/**
 * SNS 채널 기본 프로세스 — 네 항목.
 *
 * 이전 "덕션 시스템" 3모듈을 2026-08-11 와이어프레임 문안으로 갈아 끼웠다.
 * 항목마다 실제 프로젝트 산출물을 한 장씩 붙인다 — 글로만 두면 무슨 일을
 * 하는지가 안 그려진다는 지적을 반영한 것이고, 그 원칙은 그대로 가져간다.
 */
export function Process() {
  return (
    <Section eyebrow="Process" id="process">
      <SectionHeading>
        <strong className="font-bold">{PROCESS.title}</strong>
      </SectionHeading>

      <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PROCESS.items.map((item) => (
          <li
            key={item.no}
            className="overflow-hidden rounded-2xl border border-line bg-paper"
          >
            <figure className="relative aspect-[16/10] border-b border-line bg-paper-alt">
              <Image
                src={item.shot.src}
                alt={item.shot.cap}
                fill
                sizes="(min-width: 1024px) 280px, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
            </figure>
            <div className="p-6 sm:p-7">
              <span className="stat-figure grid size-8 place-items-center rounded-full bg-accent text-xs text-white">
                {item.no}
              </span>
              <h3 className="mt-5 text-base font-bold sm:text-lg">
                {item.title}
              </h3>
              <p className="mt-3.5 text-sm leading-[1.85] text-muted">
                {item.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
