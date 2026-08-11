import Image from "next/image";
import Link from "next/link";
import { HOME_CHOICE, HOME_GROWTH, HOME_HERO, HOME_STORY } from "@/lib/home";

/**
 * hgrs.io 홈 섹션들 — 프레이머 홈을 그대로 옮긴 것.
 *
 * 히어로 배경은 앱에 이미 있는 `.hero-night` 을 쓴다. 그 클래스 자체가
 * hgrs.io 히어로의 교차하는 두 곡선(인디고·골드탄)에서 뽑아 온 것이라
 * 새로 만들 필요가 없다.
 *
 * Project Story / Hacking Growth 좌우 그라디언트 이미지는 프레이머 CDN 에서
 * 개별 파일을 찾지 못해 CSS 그라디언트로 다시 그렸다. 원본 파일을 주시면 교체한다.
 */

export function HomeHero() {
  return (
    <section className="hero-night on-dark relative overflow-hidden pt-28 pb-20 text-center text-white sm:pt-36 sm:pb-28">
      <div className="mx-auto w-full max-w-4xl px-5 sm:px-8">
        <h1 className="text-[2rem] leading-[1.18] font-normal tracking-[-0.02em] sm:text-[3.25rem] lg:text-[4rem]">
          {HOME_HERO.title.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h1>

        <p className="mt-7 text-[0.9375rem] font-bold text-white/80 sm:mt-9 sm:text-base">
          {HOME_HERO.sub}
        </p>

        <div className="mt-12 grid gap-3 sm:mt-14 sm:grid-cols-2 sm:items-stretch">
          <div className="rounded-2xl bg-white/[0.08] px-8 py-8 text-left backdrop-blur-sm">
            <p className="stat-figure text-[2.75rem] text-white sm:text-[3.25rem]">
              {HOME_HERO.stat.figure}
            </p>
            <p className="mt-2 text-xs text-white/60 sm:text-sm">
              {HOME_HERO.stat.label}
            </p>
          </div>

          <div className="grid gap-3">
            {HOME_HERO.ctas.map((cta) => (
              <Link
                key={cta.href}
                href={cta.href}
                className={
                  cta.primary
                    ? "flex flex-1 items-center justify-center gap-2 rounded-2xl bg-paper px-6 py-4 text-sm font-bold text-ink transition-colors hover:bg-paper/85"
                    : "flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white/15 px-6 py-4 text-sm font-bold text-white transition-colors hover:bg-white/25"
                }
              >
                {cta.label}
                <span aria-hidden className="text-xs opacity-70">
                  ↗
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomeStory() {
  return (
    <section className="on-dark bg-night text-white">
      <div className="grid lg:grid-cols-2">
        {/* 좌측 그라디언트 판 — 원본의 블루→옐로우 웨이브 */}
        <div className="relative min-h-[22rem] overflow-hidden lg:min-h-[40rem]">
          <span
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(180deg,#3b3fd8_0%,#4f5bd5_35%,#b8a83c_78%,#d9cf62_100%)]"
          />
          <span
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-1/3 bg-[radial-gradient(120%_100%_at_30%_100%,rgba(255,255,255,0.55),transparent_60%)] blur-2xl"
          />
          <p className="absolute top-10 right-10 text-xs font-bold text-white/90 sm:top-14 sm:right-14 sm:text-sm">
            {HOME_STORY.label}
          </p>
        </div>

        <div className="px-5 py-16 sm:px-12 lg:py-24">
          <p className="text-[0.9375rem] leading-[1.75] text-white/40 sm:text-base">
            {HOME_STORY.question.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
          <p className="mt-5 text-[1.0625rem] leading-[1.75] font-bold text-white sm:text-xl">
            {HOME_STORY.answer.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>

          <div className="mt-16 space-y-7 sm:mt-24">
            {HOME_STORY.blocks.map((block, i) => (
              <p
                key={i}
                className="text-[0.9375rem] leading-[1.8] font-bold text-white sm:text-base"
              >
                {block.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
            ))}
          </div>

          <div className="mt-20 sm:mt-28">
            <p className="text-[0.9375rem] font-bold text-white sm:text-base">
              {HOME_STORY.closing.lead}
            </p>
            <p className="mt-5 text-[0.9375rem] leading-[1.8] font-bold text-white sm:text-base">
              {HOME_STORY.closing.body.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomeGrowth() {
  return (
    <section className="bg-paper">
      <div className="grid lg:grid-cols-2">
        <div className="order-2 px-5 py-16 sm:px-12 lg:order-1 lg:py-24">
          <p className="text-sm text-muted">{HOME_GROWTH.intro}</p>
          <p className="mt-4 text-[1.0625rem] leading-[1.6] font-bold text-ink sm:text-xl">
            {HOME_GROWTH.lead.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>

          <ol className="mt-20 space-y-20 sm:mt-28 sm:space-y-28">
            {HOME_GROWTH.items.map((item) => (
              <li key={item.no} className="flex gap-5">
                <span className="stat-figure shrink-0 text-sm text-gold-deep">
                  {item.no}
                </span>
                <div className="min-w-0">
                  <p className="text-[0.9375rem] leading-[1.6] font-bold text-ink sm:text-base">
                    {item.title.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </p>
                  <p className="mt-3 text-sm leading-[1.8] font-bold text-muted">
                    {item.body.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* 우측 그라디언트 판 — 원본의 핑크/베이지 웨이브 */}
        <div className="relative order-1 min-h-[18rem] overflow-hidden lg:order-2 lg:min-h-[40rem]">
          <span
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(160deg,#a08c86_0%,#c6ada4_45%,#e6cfc4_100%)]"
          />
          <span
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-2/3 bg-[radial-gradient(120%_90%_at_70%_100%,rgba(255,255,255,0.5),transparent_60%)] blur-3xl"
          />
          <p className="absolute top-10 left-10 text-xs font-bold text-white/90 sm:top-14 sm:left-14 sm:text-sm">
            {HOME_GROWTH.label}
          </p>
        </div>
      </div>
    </section>
  );
}

export function HomeChoice() {
  return (
    <section className="bg-night px-5 py-20 text-white sm:px-8 md:py-28">
      <div className="mx-auto w-full max-w-6xl">
        <h2 className="text-center text-[1.5rem] leading-[1.35] font-bold sm:text-[2.125rem]">
          {HOME_CHOICE.title}
        </h2>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {HOME_CHOICE.cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group relative flex min-h-[20rem] flex-col justify-end overflow-hidden rounded-2xl border border-white/12 p-7 sm:min-h-[24rem] sm:p-9"
            >
              <Image
                src={card.shot}
                alt=""
                fill
                sizes="(min-width: 768px) 560px, 100vw"
                className="object-cover opacity-25 transition-transform duration-700 group-hover:scale-105"
              />
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-night via-night/80 to-night/40"
              />

              <span className="relative">
                <span className="block text-xs text-white/55">
                  {card.kicker}
                </span>
                <span className="mt-2.5 block text-[1.25rem] leading-[1.4] font-bold sm:text-[1.5rem]">
                  {card.title}
                </span>
                <span className="mt-7 flex items-center justify-center gap-1.5 rounded-full bg-paper px-6 py-3 text-sm font-bold text-ink transition-colors group-hover:bg-paper/85">
                  {card.cta}
                  <span aria-hidden>→</span>
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
