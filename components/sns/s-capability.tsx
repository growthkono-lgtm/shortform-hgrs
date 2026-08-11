"use client";

import Image from "next/image";
import { useCountUp, countUpText } from "@/components/ui/use-count-up";
import { useViewProgress } from "./use-view-progress";
import { CAPABILITY } from "@/lib/sns-brand";
import { Rich } from "./rich";

/**
 * 역량 — hgrs.io/partnership 의 "브랜드의 지속성에는…" 섹션.
 *
 * 원본은 **가로로 흐르는 카드 트랙**이다. 헤드라인이 왼쪽에 서 있고, 스크롤에 맞춰
 * 카드 셋이 옆으로 밀려 세 번째 카드가 드러난다. 라벨은 카드마다 위/아래로 어긋나 붙는다.
 * 그 배치가 이 섹션의 감도 전부라, 텍스트 박스 3개로 옮기면 남는 게 없다.
 *
 * 트랙 이동은 CSS 스크롤 구동(globals.css `.cap-track`)이다. 미지원 브라우저에서는
 * 가로 스크롤로 직접 밀 수 있게 뷰포트에 overflow-x-auto 를 남겨 둔다.
 *
 * 숫자(200%+ / 88%+ / 163%)는 원본과 같이 카운트업한다 — 앱의 공용 훅을 쓴다.
 *
 * 2026-08-11: 퍼널 깔때기와 파트너십 밴드를 이 섹션에서 내렸다 — 채널 페이지
 * 맥락에서 문맥 없이 튀어나온다는 지적. 데이터는 lib 에 남겨 뒀다.
 */

function Figure({ to, suffix }: { to: number; suffix: string }) {
  const { ref, p } = useCountUp<HTMLSpanElement>({ duration: 1400 });
  return (
    <span ref={ref} className="stat-figure text-white">
      <span className="text-[2.75rem] sm:text-[3.5rem]">
        {countUpText(p, { to })}
      </span>
      <span className="ml-1 text-lg font-normal sm:text-xl">{suffix}</span>
    </span>
  );
}

/** 카드 라벨 — 앞머리는 굵게, 뒷말은 연하게 (원본 그대로) */
function Label({
  head,
  tail,
  className = "",
}: {
  head: string;
  tail: string;
  className?: string;
}) {
  return (
    <p className={`text-[0.9375rem] leading-[1.6] sm:text-base ${className}`}>
      <span className="font-bold text-ink">{head}</span>
      <span className="text-muted">{tail}</span>
    </p>
  );
}

export function Capability() {
  const [c1, c2, c3] = CAPABILITY.primary;
  const track = useViewProgress<HTMLDivElement>({ from: 0.9, to: 0.1 });

  return (
    <section id="capability" className="scroll-mt-16 bg-paper py-20 md:py-28">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <p className="eyebrow">Capability</p>
        <h2 className="mt-5 max-w-3xl text-[1.5rem] leading-[1.4] font-bold sm:text-[2.125rem] sm:leading-[1.35] lg:text-[2.75rem]">
          {CAPABILITY.title.map((line) => (
            <Rich key={line} as="span" html={line} className="block" />
          ))}
        </h2>
      </div>

      {/* 카드 트랙 */}
      <div
        ref={track.ref}
        className="mt-12 overflow-x-auto pb-2 lg:overflow-hidden"
      >
        <div
          className="cap-track flex w-max items-start gap-6 px-5 sm:px-8 lg:gap-10 lg:pl-[max(2rem,calc((100vw-72rem)/2+14rem))]"
          style={
            { "--cap-shift": "-26%", "--p": track.p } as React.CSSProperties
          }
        >
          {/* 1 — 고객 퍼널의 그로스 여정 / 라벨이 카드 왼쪽 위 */}
          <div className="flex shrink-0 items-start gap-5">
            <Label
              head={c1.head}
              tail={c1.tail}
              className="w-[7.5rem] pt-1 sm:w-40"
            />
            <figure className="relative aspect-square w-[16rem] overflow-hidden rounded-2xl bg-night sm:w-[22rem]">
              <Image
                src="/sns/cap-chart.jpg"
                alt="고객 퍼널 그로스 성과 추이"
                fill
                sizes="352px"
                className="object-cover"
              />
              {/* 좌상단 원형 썸네일 — 원본과 같은 자리 */}
              <span className="absolute top-4 left-4 size-[4.5rem] overflow-hidden rounded-full border border-white/25 sm:size-24">
                <Image
                  src="/sns/cap-thumb.jpg"
                  alt="브랜드 컨텐츠"
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </span>
              <figcaption className="absolute inset-0 grid place-items-center">
                <Figure to={200} suffix="%+" />
              </figcaption>
            </figure>
          </div>

          {/* 2 — 유튜브 컨텐츠 기획제작 / 라벨이 카드 아래 */}
          <div className="shrink-0">
            <div className="relative flex w-[20rem] items-stretch overflow-hidden rounded-2xl bg-night pb-14 sm:w-[28rem]">
              <a
                href="https://www.youtube.com/watch?v=63_0QN5MUXY"
                target="_blank"
                rel="noreferrer"
                className="relative m-4 block aspect-video w-1/2 overflow-hidden rounded-lg"
              >
                {/* 유튜브 썸네일은 유튜브에서 그대로 받는다 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://i.ytimg.com/vi/63_0QN5MUXY/hqdefault.jpg"
                  alt="배틀그라운드 이스포츠 공식 컨텐츠"
                  loading="lazy"
                  className="size-full object-cover"
                />
                <span
                  aria-hidden
                  className="absolute inset-0 grid place-items-center"
                >
                  <span className="grid size-9 place-items-center rounded-full bg-paper/90 text-ink">
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

              <div className="flex flex-1 flex-col items-center justify-center pr-4">
                <span className="stat-figure text-sm tracking-[0.18em] text-white sm:text-base">
                  KRAFTON
                </span>
                <Figure to={88} suffix="%+" />
              </div>

              {/* 로고 원형 — 원본처럼 카드 하단에 얹힌다 */}
              <div className="absolute bottom-4 left-4 flex gap-2.5">
                {["krafton", "yeolda", "real-class", "luvd"].map((slug) => (
                  <span
                    key={slug}
                    className="grid size-10 place-items-center rounded-full border border-white/20 bg-night-soft sm:size-12"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/logos/${slug}.png`}
                      alt=""
                      className="h-5 w-9 object-contain sm:h-6 sm:w-11"
                      style={{ filter: "brightness(0) invert(1)" }}
                    />
                  </span>
                ))}
              </div>
            </div>
            <Label head={c2.head} tail={c2.tail} className="mt-5 pl-1" />
          </div>

          {/* 3 — 광고 스케일업 / 라벨이 카드 왼쪽 위 */}
          <div className="flex shrink-0 items-start gap-5 pr-5 sm:pr-8">
            <Label
              head={c3.head}
              tail={c3.tail}
              className="w-[7.5rem] pt-1 sm:w-40"
            />
            <figure className="relative aspect-square w-[16rem] overflow-hidden rounded-2xl bg-night sm:w-[22rem]">
              {/* 원본 3번 카드의 그래프 소스는 프레이머에 남아 있지 않다.
                  같은 차트를 색만 돌려 쓴다 — 배경 장식이고 값은 아래 숫자가 말한다 */}
              <Image
                src="/sns/cap-chart.jpg"
                alt="광고 스케일업 ROAS 추이"
                fill
                sizes="352px"
                className="object-cover [filter:hue-rotate(265deg)_saturate(0.85)]"
              />
              <figcaption className="absolute inset-0 grid place-items-center">
                <Figure to={163} suffix="%" />
              </figcaption>
              <span className="absolute bottom-5 w-full text-center text-xs text-white/70">
                ROAS 초과 달성
              </span>
            </figure>
          </div>
        </div>
      </div>

      {/* 전문성 3줄 + 퍼널 */}
      <div className="mx-auto mt-20 w-full max-w-6xl px-5 sm:px-8">
        <ul className="grid gap-px overflow-hidden rounded-2xl bg-line md:grid-cols-3">
          {CAPABILITY.secondary.map((item) => (
            <li key={item.head} className="bg-paper-alt px-7 py-7">
              <span className="text-[0.9375rem] leading-[1.7] font-bold text-ink sm:text-base">
                {item.head}
              </span>
              <span className="text-[0.9375rem] leading-[1.7] text-muted sm:text-base">
                {item.tail}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
