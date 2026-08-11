import Image from "next/image";
import { Section, SectionHeading } from "@/components/ui/section";
import { METHOD, POV } from "@/lib/sns-brand";
import { Rich } from "./rich";

/**
 * 포지셔닝 — "우리는 어떤 팀인가".
 *
 * 2026-08-11 개편: 대행사 대비표를 걷어냈다. **비교를 거는 순간 대행사 리스트
 * 안으로 들어간다.** 비교 대신 선언으로 간다 — 인하우스 안의 또 다른 인하우스 팀.
 *
 * 배경도 라이트에서 다크(브랜드 그라디언트)로 바꿨다. 이 페이지에서 유일하게
 * "우리가 누구인가"만 말하는 자리라 집중도가 필요하다.
 */
export function Pov() {
  return (
    <section
      id="pov"
      className="hero-night on-dark scroll-mt-16 py-20 text-white md:py-28"
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <p className="eyebrow">Position</p>

        {/* 줄바꿈을 고정한다 — 이 문장은 두 줄로 떨어져야 힘이 산다 */}
        <h2 className="mt-6 text-[1.75rem] leading-[1.32] font-bold text-balance sm:text-[2.5rem] sm:leading-[1.28] lg:text-[3.25rem]">
          <span className="block text-white/45">{POV.title[0]}</span>
          <span className="block">{POV.title[1]}</span>
        </h2>

        <p className="mt-7 max-w-2xl text-[1.0625rem] leading-[1.7] font-bold text-white/85 sm:text-xl">
          {POV.sub}
        </p>

        <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] lg:gap-16">
          <div className="min-w-0 space-y-5">
            {POV.body.map((para) => (
              <Rich
                key={para.slice(0, 14)}
                html={para}
                className="text-[0.9375rem] leading-[1.95] text-white/65 sm:text-base"
              />
            ))}

            <blockquote className="!mt-10 border-l-2 border-gold pl-5 text-[1.0625rem] leading-[1.7] font-bold text-white sm:text-xl">
              “{POV.quote}”
              <cite className="mt-3 block text-xs font-normal not-italic text-white/40">
                — {POV.quoteNote}
              </cite>
            </blockquote>
          </div>

          {/* 우리 축만 세운다 — 남과 비교하는 칸은 두지 않는다 */}
          <dl className="grid min-w-0 gap-px overflow-hidden rounded-2xl bg-white/10">
            {POV.pillars.map((pillar) => (
              <div
                key={pillar.k}
                className="grid gap-1 bg-night px-6 py-6 sm:grid-cols-[72px_minmax(0,1fr)] sm:items-baseline sm:gap-5"
              >
                <dt className="eyebrow !text-[0.6875rem]">{pillar.k}</dt>
                <dd className="text-[0.9375rem] leading-[1.6] font-bold text-white sm:text-base">
                  {pillar.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

/**
 * 방식 — 3개 모듈. 필요한 것만 골라 붙는다는 게 이 서비스의 판매 논리다.
 * 모듈마다 **실제 프로젝트 산출물**을 한 장씩 붙였다 — 글로만 설명하면
 * "무슨 일을 하는지"가 안 그려진다는 지적을 반영한 것이다.
 */
export function Method() {
  return (
    <Section eyebrow="Method" id="method">
      <SectionHeading>
        성과에 필요한 작업만 하는,
        <br />
        <strong className="font-bold">덕션 시스템</strong>
      </SectionHeading>
      <p className="mt-5 max-w-2xl text-[0.9375rem] leading-[1.8] text-muted sm:text-base">
        {METHOD.lead}
      </p>

      <ol className="mt-12 grid gap-5 md:grid-cols-3">
        {METHOD.modules.map((m) => (
          <li
            key={m.no}
            className="overflow-hidden rounded-2xl border border-line bg-paper"
          >
            <figure className="relative aspect-[16/10] border-b border-line bg-paper-alt">
              <Image
                src={m.shot.src}
                alt={m.shot.cap}
                fill
                sizes="(min-width: 768px) 380px, 100vw"
                className="object-cover"
              />
            </figure>
            <div className="p-7 sm:p-8">
              <span className="stat-figure grid size-8 place-items-center rounded-full bg-accent text-xs text-white">
                {m.no}
              </span>
              <h3 className="mt-5 text-lg font-bold">{m.title}</h3>
              <p className="mt-3.5 text-sm leading-[1.85] text-muted">
                {m.body}
              </p>
              <p className="mt-5 border-t border-line pt-4 text-xs leading-[1.7] text-muted">
                {m.shot.cap}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-8 text-sm leading-[1.8] text-muted">{METHOD.footnote}</p>
    </Section>
  );
}
