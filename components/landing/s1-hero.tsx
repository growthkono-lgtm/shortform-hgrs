import { HeroStats } from "@/components/landing/hero-stats";
import { LoopVideo } from "@/components/ui/loop-video";
import { Marquee } from "@/components/ui/marquee";
import { VerticalMarquee } from "@/components/ui/vertical-marquee";
import { WALL_CLIPS, clipPoster, clipVideo } from "@/lib/clips";

/**
 * S1. 히어로 — 2026-08-06 피그마 개편안 + hgrs.io 히어로 톤 계승.
 *
 * · 배경은 다크. 인디고·골드탄 두 곡선이 교차하는 hgrs.io 시그니처를 그대로 쓴다.
 * · 우측 컬럼 지시는 "영상 소재만 나오도록" — 배너·캡처 이미지는 넣지 않는다.
 * · 여기는 자세히 보는 자리가 아니라 암시하는 자리다. 그래서 **빠르게** 흐른다.
 */

function Cell({ slug, aspect }: { slug: string; aspect: string }) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-xl bg-night-soft"
      style={{ aspectRatio: aspect }}
    >
      <LoopVideo src={clipVideo(slug)} poster={clipPoster(slug)} />
    </div>
  );
}

/** 3개 컬럼에 소재를 라운드로빈으로 흩어 같은 컬럼에 몰리지 않게 한다 */
const column = (index: number) => WALL_CLIPS.filter((_, i) => i % 3 === index);

export function Hero() {
  const columns = [
    { cells: column(0), duration: 20 },
    { cells: column(1), duration: 26, reverse: true },
    { cells: column(2), duration: 23 },
  ];

  return (
    <section className="hero-night on-dark relative overflow-hidden pt-24 pb-16 text-white sm:pt-28 sm:pb-20 md:pt-32 md:pb-28">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_minmax(0,480px)] lg:gap-16">
        {/* min-w-0 필수 — 그리드 아이템 기본값(min-width:auto)이라 안쪽에서 한 칸이라도
            트랙보다 넓어지면(성과 숫자 줄이 그렇다) 열 전체가 밀려 나가고,
            섹션의 overflow-hidden 에 문장 끝이 잘린다. 모바일에서 서브카피가 잘리던 원인. */}
        <div className="min-w-0">
          <p className="eyebrow">Scaleup Shortform Studio</p>

          <h1 className="mt-5 text-[1.75rem] leading-[1.3] font-bold text-balance sm:mt-6 sm:text-[2.75rem] sm:leading-[1.24] lg:text-[3.375rem]">
            대기업부터 스타트업까지
            <br />
            숏폼 부스팅 프로젝트
          </h1>


          {/* 두 줄 고정 — 한 줄로 흘리면 모바일에서 끝이 잘린다.
              <br> 대신 블록 두 개로 두어야 폭이 좁아져도 줄이 섞이지 않는다. */}
          <p className="mt-4 max-w-xl text-[0.9375rem] leading-[1.75] font-bold text-balance text-white/70 sm:mt-5 sm:text-xl sm:leading-[1.7]">
            <span className="block">인플루언서 시딩과 채널 바이럴</span>
            <span className="block">그리고 구매 전환형 광고 소재를 한번에!</span>
          </p>

          <HeroStats />

          <div className="mt-8 flex flex-wrap gap-2.5 sm:mt-10 sm:gap-3">
            <a
              href="#diagnosis"
              className="inline-flex items-center justify-center rounded-full bg-accent px-7 py-3.5 text-sm font-bold text-white transition-colors duration-200 hover:bg-accent-deep"
            >
              30초 진단받기
            </a>
            <a
              href="#services"
              className="inline-flex items-center justify-center rounded-full border border-white/25 px-7 py-3.5 text-sm font-bold text-white transition-colors duration-200 hover:border-white/60 hover:bg-white/[0.06]"
            >
              서비스 안내
            </a>
          </div>
        </div>

        {/* 소재 컬럼 — 세로로 빠르게 흐른다. 영상만 */}
        <div
          aria-hidden
          className="relative hidden h-[560px] grid-cols-3 gap-3 lg:grid"
        >
          {columns.map((col, ci) => (
            <VerticalMarquee
              key={ci}
              durationSec={col.duration}
              reverse={col.reverse}
              className="h-full"
            >
              {col.cells.map((c) => (
                <Cell
                  key={c.slug}
                  slug={c.slug}
                  aspect={c.ratio === "1/1" ? "1 / 1" : "9 / 16"}
                />
              ))}
            </VerticalMarquee>
          ))}

          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-night to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-night to-transparent" />
        </div>

        {/* 모바일 — 가로로 계속 흐른다.
            예전엔 overflow-x-auto 라 손으로 밀어야 소재가 보였다. 히어로는
            "영상이 많다"를 암시하는 자리라 가만히 있어도 흘러야 한다. */}
        {/* min-w-0 필수 — 이 안의 마퀴 트랙은 3천 px가 넘는다. 그리드 아이템 기본값
            (min-width:auto)이면 트랙이 그 폭까지 벌어지고, 왼쪽 텍스트 열까지 같이
            끌려 나가 섹션 overflow-hidden 에 문장 끝이 잘린다. 모바일 잘림의 진짜 원인. */}
        <div aria-hidden className="-mx-5 min-w-0 overflow-hidden lg:hidden">
          <Marquee durationSec={28}>
            <div className="flex gap-3 pr-3">
              {WALL_CLIPS.map((c) => (
                <div key={c.slug} className="w-28 shrink-0 sm:w-32">
                  <Cell
                    slug={c.slug}
                    aspect={c.ratio === "1/1" ? "1 / 1" : "9 / 16"}
                  />
                </div>
              ))}
            </div>
          </Marquee>
        </div>
      </div>
    </section>
  );
}
