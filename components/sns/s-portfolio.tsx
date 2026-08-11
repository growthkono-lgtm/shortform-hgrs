import Image from "next/image";
import { PORTFOLIO } from "@/lib/sns-brand";

/**
 * 최근 주요 포트폴리오 — 실제로 편성·제작한 컨텐츠 타일.
 *
 * 로고월(누구와 했나) 다음에 "무엇을 만들었나"를 눈으로 보여주는 자리다.
 * 유튜브 썸네일은 유튜브에서 그대로 받고(그 CDN은 사라지지 않는다), 현장·산출물
 * 이미지는 프로젝트 원본을 쓴다. 스톡 이미지는 넣지 않는다.
 */
export function Portfolio() {
  return (
    <section
      id="portfolio"
      className="scroll-mt-16 bg-paper-alt py-20 md:py-28"
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <p className="eyebrow">Portfolio</p>
        <h2 className="mt-5 text-[1.5rem] leading-[1.35] font-bold sm:text-[2.125rem] lg:text-[2.75rem]">
          {PORTFOLIO.title}
        </h2>

        <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {PORTFOLIO.videos.map((id) => (
            <li
              key={id}
              className="relative aspect-square overflow-hidden rounded-xl bg-night"
            >
              <a
                href={`https://www.youtube.com/watch?v=${id}`}
                target="_blank"
                rel="noreferrer"
                className="group block size-full"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://i.ytimg.com/vi_webp/${id}/maxresdefault.webp`}
                  alt="브랜드 채널 컨텐츠"
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span
                  aria-hidden
                  className="absolute inset-0 grid place-items-center"
                >
                  <span className="grid size-10 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm">
                    <svg
                      viewBox="0 0 24 24"
                      className="ml-0.5 size-4"
                      fill="currentColor"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </span>
              </a>
            </li>
          ))}

          {PORTFOLIO.shots.map((shot) => (
            <li
              key={shot.src}
              className="relative aspect-square overflow-hidden rounded-xl bg-night"
            >
              <Image
                src={shot.src}
                alt={shot.alt}
                fill
                sizes="(min-width: 1024px) 280px, 50vw"
                className="object-cover"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
