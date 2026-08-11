import Image from "next/image";
import { Cta } from "@/components/ui/cta";
import { HERO } from "@/lib/sns-brand";

/**
 * 우측 컬럼 — 실제 프로젝트 산출물 세 컷.
 * 숏폼 랜딩은 이 자리에 소재 영상을 흘리지만, 채널 프로젝트에서 보여줄 것은
 * 편성한 컨텐츠와 그걸 만든 기획 문서다. 스톡·목업을 쓰지 않는다.
 */
const HERO_SHOTS = [
  {
    src: "/sns/krafton-contents.jpg",
    alt: "배틀그라운드 공식 채널 편성 컨텐츠",
    span: true,
  },
  { src: "/sns/yeolda-shoot.jpg", alt: "브랜드 채널 컨텐츠 촬영 현장" },
  { src: "/sns/krafton-plan.png", alt: "채널 컨텐츠 기획안" },
];

/**
 * 히어로 — 숏폼 랜딩(S1)과 같은 다크 톤.
 * 매거진 커버가 아니라 서비스 랜딩의 첫 화면이다: 무엇을 파는지 + 전환 버튼이 먼저다.
 * 배경은 hgrs.io 시그니처(인디고·골드탄 교차 곡선) 그대로 .hero-night 을 쓴다.
 */
export function Hero() {
  return (
    <section className="hero-night on-dark relative overflow-hidden pt-24 pb-16 text-white sm:pt-28 sm:pb-20 md:pt-32 md:pb-24">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_minmax(0,440px)] lg:gap-16">
        {/* min-w-0 필수 — 그리드 기본값(min-width:auto)이라 안쪽 한 칸이 넓어지면
            열 전체가 밀려 나가고 섹션의 overflow-hidden 에 문장 끝이 잘린다 */}
        <div className="min-w-0">
          <p className="eyebrow">{HERO.eyebrow}</p>

          <h1 className="mt-5 text-[1.75rem] leading-[1.3] font-bold text-balance sm:mt-6 sm:text-[2.75rem] sm:leading-[1.24] lg:text-[3.375rem]">
            {HERO.title[0]}
            <br />
            {HERO.title[1]}
          </h1>

          <p className="mt-4 max-w-xl text-[0.9375rem] leading-[1.75] font-bold text-balance text-white/70 sm:mt-5 sm:text-xl sm:leading-[1.7]">
            <span className="block">{HERO.sub[0]}</span>
            <span className="block">{HERO.sub[1]}</span>
          </p>

          <p className="mt-6 max-w-xl text-sm leading-[1.85] text-white/55 sm:text-[0.9375rem]">
            {HERO.body}
          </p>

          {/* 숫자 셋 — 이 서비스가 무엇을 파는지(연 단위·팀 단위)를 버튼 앞에서 못박는다 */}
          <dl className="mt-10 grid max-w-2xl gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-3">
            {HERO.stats.map((s) => (
              <div key={s.label} className="bg-night px-5 py-5">
                <dt className="stat-figure text-2xl text-white sm:text-[1.75rem]">
                  {s.figure}
                </dt>
                <dd className="mt-2 text-xs leading-[1.6] text-white/55">
                  {s.label}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-9 flex flex-wrap gap-3">
            <Cta href="#contact" variant="invert">
              채널 프로젝트 문의
            </Cta>
            <Cta href="#cases" variant="outlineLight">
              브랜드별 성과 보기
            </Cta>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-2 gap-3">
          {HERO_SHOTS.map((shot) => (
            <div
              key={shot.src}
              className={`relative overflow-hidden rounded-2xl border border-white/10 bg-night-soft ${
                shot.span ? "col-span-2 aspect-[4/3]" : "aspect-square"
              }`}
            >
              <Image
                src={shot.src}
                alt={shot.alt}
                fill
                sizes="(min-width: 1024px) 440px, 100vw"
                priority
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
