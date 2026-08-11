"use client";

import Image from "next/image";
import { useState } from "react";

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

/**
 * 숏폼 세로 카드 — 원본은 카드 안에서 화살표로 넘기는 유튜브 3편 슬라이더다.
 * 썸네일은 maxresdefault(레터박스 없음)를 9:16 박스에 object-cover 로 넣는다.
 * hqdefault 를 쓰면 검은 여백이 같이 들어와 확대 크롭을 해야 하고, 그러면 구도가 깨진다.
 */
function ShortsSlider({ ids }: { ids: readonly string[] }) {
  const [i, setI] = useState(0);
  const id = ids[i] ?? ids[0];
  if (!id) return null;

  return (
    <div className="relative aspect-[9/16] w-[12rem] overflow-hidden rounded-2xl bg-night sm:w-[15rem]">
      <a
        href={`https://www.youtube.com/watch?v=${id}`}
        target="_blank"
        rel="noreferrer"
        className="block size-full"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://i.ytimg.com/vi_webp/${id}/maxresdefault.webp`}
          alt="숏폼 컨텐츠"
          loading="lazy"
          className="size-full object-cover"
        />
        <span aria-hidden className="absolute inset-0 grid place-items-center">
          <span className="grid size-12 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm">
            <svg
              viewBox="0 0 24 24"
              className="ml-0.5 size-5"
              fill="currentColor"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </span>
      </a>
      {ids.length > 1 && (
        <button
          type="button"
          onClick={() => setI((v) => (v + 1) % ids.length)}
          aria-label="다음 숏폼"
          className="absolute right-3 bottom-3 grid size-9 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M9 6l6 6-6 6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
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
    return <ShortsSlider ids={"videos" in card ? card.videos : []} />;
  }

  if (card.kind === "metrics") {
    return (
      <div className="relative w-[17rem] overflow-hidden rounded-2xl bg-[#0b1020] px-6 py-8 sm:w-[22rem] sm:px-8 sm:py-10">
        {/* 교차하는 화살표 — 원본 카드의 그래픽을 SVG로 다시 그렸다 */}
        <svg
          aria-hidden
          viewBox="0 0 340 220"
          className="absolute inset-0 size-full"
          preserveAspectRatio="none"
        >
          <defs>
            <marker
              id="ah-g"
              markerWidth="6"
              markerHeight="6"
              refX="4"
              refY="3"
              orient="auto"
            >
              <path d="M0 0 L6 3 L0 6 z" fill="#a3d94a" />
            </marker>
            <marker
              id="ah-p"
              markerWidth="6"
              markerHeight="6"
              refX="4"
              refY="3"
              orient="auto"
            >
              <path d="M0 0 L6 3 L0 6 z" fill="#c9a2e8" />
            </marker>
            <marker
              id="ah-b"
              markerWidth="6"
              markerHeight="6"
              refX="4"
              refY="3"
              orient="auto"
            >
              <path d="M0 0 L6 3 L0 6 z" fill="#4d8fe8" />
            </marker>
          </defs>
          <path
            d="M6 214 L330 12"
            stroke="#a3d94a"
            strokeWidth="4"
            fill="none"
            markerEnd="url(#ah-g)"
          />
          <path
            d="M40 214 L318 42"
            stroke="#c9a2e8"
            strokeWidth="2"
            fill="none"
            markerEnd="url(#ah-p)"
          />
          <path
            d="M60 26 L322 200"
            stroke="#4d8fe8"
            strokeWidth="2"
            fill="none"
            markerEnd="url(#ah-b)"
          />
          <path
            d="M0 110 H340 M240 0 V220"
            stroke="#ffffff"
            strokeOpacity="0.12"
            strokeWidth="1"
          />
        </svg>

        {/* 화살표가 라벨 위를 지나가 글자가 묻힌다 — 왼쪽에 얇은 스크림을 깐다 */}
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-3/5 bg-gradient-to-r from-[#0b1020] via-[#0b1020]/85 to-transparent"
        />
        <dl className="relative space-y-6">
          {"metrics" in card &&
            card.metrics?.map((m) => (
              <div key={m.k} className="flex items-baseline gap-2.5">
                <dt className="text-[0.8125rem] text-white/80">{m.k}</dt>
                <dd className="stat-figure text-[1.75rem] text-white sm:text-[2rem]">
                  {m.v}
                  <span className="ml-0.5 text-xs font-normal text-white/85">
                    {m.u}
                  </span>
                </dd>
              </div>
            ))}
        </dl>
      </div>
    );
  }

  if (card.kind === "line") {
    return (
      <figure className="relative aspect-square w-[15rem] overflow-hidden rounded-2xl bg-[linear-gradient(150deg,#05070f_0%,#0b1020_45%,#1e3a8a_100%)] sm:w-[19rem]">
        {/* 라임 꺾은선 — 원본 카드 그래픽 */}
        <svg
          aria-hidden
          viewBox="0 0 300 300"
          className="absolute inset-0 size-full"
        >
          <polyline
            points="14,214 52,180 76,196 104,166 148,150 182,150 224,96 286,44"
            fill="none"
            stroke="#a3d94a"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {[
            [14, 214],
            [52, 180],
            [76, 196],
            [104, 166],
            [148, 150],
            [182, 150],
            [224, 96],
            [286, 44],
          ].map(([x, y]) => (
            <rect
              key={`${x}-${y}`}
              x={x - 3}
              y={y - 3}
              width="6"
              height="6"
              fill="#0b1020"
              stroke="#a3d94a"
              strokeWidth="1.5"
            />
          ))}
        </svg>
        <figcaption className="absolute bottom-6 left-6 flex items-baseline gap-3">
          {card.figure !== null && (
            <Figure to={card.figure} suffix={card.suffix} />
          )}
          {card.note && (
            <span className="text-xs leading-[1.5] text-white/85">
              ROAS
              <span className="block">초과 달성</span>
            </span>
          )}
        </figcaption>
      </figure>
    );
  }

  // chart — 원본 1번 카드(차트 배경 + 중앙 카운터 + 좌상단 원형 썸네일)
  return (
    <figure className="relative aspect-square w-[15rem] overflow-hidden rounded-2xl bg-night sm:w-[21rem]">
      <Image
        src="/sns/cap-chart.jpg"
        alt={card.head}
        fill
        sizes="336px"
        className="object-cover"
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
