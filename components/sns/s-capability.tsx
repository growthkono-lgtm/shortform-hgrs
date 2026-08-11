"use client";

import Image from "next/image";
import { useCountUp, countUpText } from "@/components/ui/use-count-up";
import { CAPABILITY } from "@/lib/sns-brand";
import { Rich } from "./rich";
import { useViewProgress } from "./use-view-progress";

/**
 * 역량 — hgrs.io/partnership "브랜드의 지속성에는…" 섹션.
 *
 * 원본은 **카드 여섯 장이 한 트랙에 이어 붙어** 스크롤에 맞춰 가로로 흐른다.
 * 처음엔 앞의 셋만 트랙에 넣고 나머지 셋(숏폼·데이터·CRM)을 아래 텍스트 띠로
 * 뺐다가, 원본대로 여섯 장을 한 줄에 합쳤다.
 * 라벨은 첫 카드만 옆, 나머지는 카드 아래에 붙는다 — 이것도 원본과 같다.
 *
 * 트랙 이동 진행도는 JS가 잰다(use-view-progress). 미지원·감속 설정에서는
 * 가로 스크롤로 직접 밀 수 있게 뷰포트에 overflow-x-auto 를 남겨 둔다.
 */

type Card = (typeof CAPABILITY.cards)[number];

function Figure({ to, suffix }: { to: number; suffix: string }) {
  const { ref, p } = useCountUp<HTMLSpanElement>({ duration: 1400 });
  return (
    <span ref={ref} className="stat-figure text-white">
      <span className="text-[2.5rem] sm:text-[3.25rem]">
        {countUpText(p, { to })}
      </span>
      <span className="ml-1 text-lg font-normal sm:text-xl">{suffix}</span>
    </span>
  );
}

/** 카드 라벨 — 앞머리는 굵게, 뒷말은 연하게 (원본 그대로) */
function Label({ card, className = "" }: { card: Card; className?: string }) {
  return (
    <p className={`text-[0.9375rem] leading-[1.6] sm:text-base ${className}`}>
      <span className="font-bold text-ink">{card.head}</span>
      <span className="text-muted">{card.tail}</span>
    </p>
  );
}

function Visual({ card }: { card: Card }) {
  if (card.kind === "youtube") {
    return (
      <div className="relative flex w-[20rem] items-stretch overflow-hidden rounded-2xl bg-night pb-14 sm:w-[27rem]">
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
          {card.figure !== null && (
            <Figure to={card.figure} suffix={card.suffix} />
          )}
        </div>
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
    );
  }

  if (card.kind === "vertical") {
    return (
      <a
        href="https://www.youtube.com/watch?v=Bsp_HBS8ckM"
        target="_blank"
        rel="noreferrer"
        className="relative block aspect-[9/16] w-[11rem] overflow-hidden rounded-2xl bg-night sm:w-[13rem]"
      >
        {/* 썸네일이 16:9라 세로 카드에서는 확대해 중앙만 쓴다 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://i.ytimg.com/vi/Bsp_HBS8ckM/hqdefault.jpg"
          alt="배틀그라운드 이스포츠 숏폼"
          loading="lazy"
          className="size-full scale-[1.8] object-cover"
        />
        <span aria-hidden className="absolute inset-0 grid place-items-center">
          <span className="grid size-11 place-items-center rounded-full bg-paper/90 text-ink">
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
    );
  }

  if (card.kind === "metrics") {
    return (
      <div className="relative w-[17rem] overflow-hidden rounded-2xl bg-night px-6 py-7 sm:w-[22rem] sm:px-8 sm:py-9">
        <span
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(70%_60%_at_15%_15%,color-mix(in_oklab,var(--color-accent)_35%,transparent),transparent_70%)]"
        />
        <dl className="relative space-y-5">
          {"metrics" in card &&
            card.metrics?.map((m) => (
              <div key={m.k} className="flex items-baseline gap-3">
                <dt className="w-24 shrink-0 text-xs text-white/55">{m.k}</dt>
                <dd className="stat-figure text-2xl text-white sm:text-[1.75rem]">
                  {m.v}
                  <span className="ml-0.5 text-xs font-normal text-white/70">
                    {m.u}
                  </span>
                </dd>
              </div>
            ))}
        </dl>
      </div>
    );
  }

  // chart / chart-green — 같은 차트를 색만 돌려 쓴다 (원본 3번 카드 소스는 프레이머에 없다)
  const green = card.kind === "chart-green";
  return (
    <figure className="relative aspect-square w-[15rem] overflow-hidden rounded-2xl bg-night sm:w-[21rem]">
      <Image
        src="/sns/cap-chart.jpg"
        alt={card.head}
        fill
        sizes="336px"
        className={
          green
            ? "object-cover [filter:hue-rotate(265deg)_saturate(0.85)]"
            : "object-cover"
        }
      />
      {card.id === "funnel" && (
        <span className="absolute top-4 left-4 size-[4.5rem] overflow-hidden rounded-full border border-white/25 sm:size-24">
          <Image
            src="/sns/cap-thumb.jpg"
            alt="브랜드 컨텐츠"
            fill
            sizes="96px"
            className="object-cover"
          />
        </span>
      )}
      <figcaption className="absolute inset-0 grid place-items-center">
        {card.figure !== null && (
          <Figure to={card.figure} suffix={card.suffix} />
        )}
      </figcaption>
      {card.note && (
        <span className="absolute right-5 bottom-6 text-xs text-white/70">
          {card.note}
        </span>
      )}
    </figure>
  );
}

export function Capability() {
  const track = useViewProgress<HTMLDivElement>({ from: 0.9, to: 0.05 });

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

      <div
        ref={track.ref}
        className="mt-12 overflow-x-auto pb-2 lg:overflow-hidden"
      >
        <div
          className="cap-track flex w-max items-start gap-6 px-5 sm:px-8 lg:gap-10 lg:pl-[max(2rem,calc((100vw-72rem)/2+13rem))]"
          style={
            { "--cap-shift": "-58%", "--p": track.p } as React.CSSProperties
          }
        >
          {CAPABILITY.cards.map((card) =>
            card.labelSide ? (
              // 첫 카드만 라벨이 옆에 붙는다 (원본과 동일)
              <div key={card.id} className="flex shrink-0 items-start gap-5">
                <Label card={card} className="w-[7.5rem] pt-1 sm:w-40" />
                <Visual card={card} />
              </div>
            ) : (
              <div key={card.id} className="shrink-0">
                <Visual card={card} />
                <Label card={card} className="mt-5 max-w-[17rem] pl-1" />
              </div>
            ),
          )}
          <div aria-hidden className="w-5 shrink-0 sm:w-8" />
        </div>
      </div>
    </section>
  );
}
