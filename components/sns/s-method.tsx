import { ARCHIVE, METHOD } from "@/lib/sns-brand";
import { MagHeadline, Spread } from "./mag";

/**
 * Method — 네 편의 기사에서 공통으로 읽히는 방식을 뒤늦게 이름 붙인다.
 * 서비스 소개를 앞에 세우지 않는 게 이 페이지의 전제다. 사례가 먼저다.
 */
export function Method() {
  return (
    <section id="method" className="scroll-mt-20 bg-night py-16 text-paper sm:py-24">
      <Spread>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-white/40 pt-3">
          <p className="mag-label text-gold">Method</p>
          <p className="text-xs text-white/50">해그로시 채널 프로젝트</p>
        </div>

        <div className="mt-8 grid gap-7 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
          <h2 className="mag-serif text-[1.5rem] sm:text-[2rem] lg:text-[2.25rem]">
            {METHOD.title}
          </h2>
          <p className="text-[0.9375rem] leading-[1.95] text-white/70 lg:pt-2">
            {METHOD.lead}
          </p>
        </div>

        <ol className="mt-14 grid gap-px bg-white/15 sm:grid-cols-3">
          {METHOD.modules.map((m) => (
            <li key={m.no} className="bg-night px-1 py-7 sm:px-6">
              <p className="mag-serif text-2xl text-gold">{m.no}</p>
              <h3 className="mag-serif mt-3 text-lg text-paper">{m.title}</h3>
              <p className="mt-3.5 text-sm leading-[1.9] text-white/65">
                {m.body}
              </p>
            </li>
          ))}
        </ol>

        <p className="mt-10 border-t border-white/20 pt-6 text-sm leading-[1.85] text-white/70">
          {METHOD.footnote}
        </p>
      </Spread>
    </section>
  );
}

/** Archive — 브런치북. 페이지 밖으로 나가는 링크는 이 한 자리로 모은다 */
export function Archive() {
  const archive = ARCHIVE;
  return (
    <section className="bg-paper py-16 sm:py-24">
      <Spread>
        <MagHeadline label={archive.label} meta="디렉터가 직접 쓰는 마케팅 노하우 연재" />
        <a
          href={archive.href}
          target="_blank"
          rel="noreferrer"
          className="group mt-8 grid gap-4 border-b border-line pb-8 sm:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] sm:gap-10"
        >
          <div>
            <h2 className="mag-serif text-[1.375rem] text-ink group-hover:underline group-hover:underline-offset-4 sm:text-[1.75rem]">
              {archive.title}
            </h2>
            <p className="mt-4 text-sm leading-[1.9] text-muted">{archive.body}</p>
          </div>
          <p className="self-end text-sm font-bold text-ink sm:text-right">
            {archive.cta}
            <span
              aria-hidden
              className="ml-1.5 inline-block transition-transform duration-200 group-hover:translate-x-1"
            >
              →
            </span>
          </p>
        </a>
      </Spread>
    </section>
  );
}
