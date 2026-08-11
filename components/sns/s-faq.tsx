import { Section, SectionHeading } from "@/components/ui/section";
import { Cta } from "@/components/ui/cta";
import { ARCHIVE, FAQ, FINAL_CTA } from "@/lib/sns-brand";

/** FAQ — hgrs.io/partnership 원문 발췌 (문안은 lib/sns-brand.ts) */
export function Faq() {
  return (
    <Section eyebrow="FAQ" alt>
      <SectionHeading>자주 묻는 질문</SectionHeading>

      <div className="mt-10 overflow-hidden rounded-2xl border border-line bg-paper">
        {FAQ.map((faq, i) => (
          <details
            key={faq.q}
            className={i > 0 ? "border-t border-line" : undefined}
          >
            <summary className="cursor-pointer list-none px-6 py-5 text-base font-bold marker:hidden hover:bg-paper-alt">
              {faq.q}
            </summary>
            <p className="px-6 pb-6 text-sm leading-[1.8] text-muted">
              {faq.a}
            </p>
          </details>
        ))}
      </div>

      {/* 브런치북 — 페이지 밖으로 나가는 링크는 이 한 자리로만 모은다 */}
      <a
        href={ARCHIVE.href}
        target="_blank"
        rel="noreferrer"
        className="group mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-paper px-6 py-6"
      >
        <span className="min-w-0">
          <span className="eyebrow block">Archive</span>
          <span className="mt-2 block text-base font-bold group-hover:underline group-hover:underline-offset-4">
            {ARCHIVE.title}
          </span>
          <span className="mt-1.5 block text-xs leading-[1.7] text-muted">
            디렉터가 직접 쓰는 마케팅 노하우 연재
          </span>
        </span>
        <span className="shrink-0 text-sm font-bold text-ink">
          {ARCHIVE.cta}
          <span
            aria-hidden
            className="ml-1.5 inline-block transition-transform duration-200 group-hover:translate-x-1"
          >
            →
          </span>
        </span>
      </a>
    </Section>
  );
}

/** 파이널 CTA — 폼 바로 앞. 갈림길(숏폼·IMC)도 여기서 한 번에 정리한다 */
export function FinalCta() {
  return (
    <section className="px-5 py-20 sm:px-8 md:py-24">
      <div className="mx-auto w-full max-w-6xl">
        <div className="hero-night on-dark overflow-hidden rounded-3xl px-8 py-14 text-white sm:px-12 sm:py-16">
          <p className="eyebrow">Start</p>
          <h2 className="mt-5 text-[1.625rem] leading-[1.32] font-bold sm:text-[2.25rem]">
            {FINAL_CTA.title[0]}
            <br />
            <strong className="font-bold">{FINAL_CTA.title[1]}</strong>
          </h2>
          <p className="mt-5 max-w-xl text-[0.9375rem] leading-[1.85] text-white/65">
            {FINAL_CTA.body}
          </p>
          <div className="mt-9">
            <Cta href="#contact" variant="invert">
              대면 미팅 신청하기
            </Cta>
          </div>
        </div>
      </div>
    </section>
  );
}
