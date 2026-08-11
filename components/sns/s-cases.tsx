"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { CASES, FEATURES, type Feature, type Figure } from "@/lib/sns-brand";
import { Rich } from "./rich";
import { useViewProgress } from "./use-view-progress";

/**
 * 브랜드별 성과 — 2026-08-11 2차 개편.
 *
 * 세 가지가 바뀌었다:
 *  1. **배경을 다크로.** 여기부터가 이 페이지의 본론인데 라이트 위 회색 본문이라
 *     더미텍스트처럼 읽혔다. 흰 글씨 + 라임 형광 강조로 주목도를 올린다.
 *  2. **문장이 한 줄씩 등장한다.** 스크롤 진행도에 맞춰 문단이 차례로 뜬다.
 *  3. **세로로 쌓지 않고 자동 스와이프.** 카드가 우측으로 계속 전환된다.
 *     (카드 안 도판도 같은 방식으로 한 장씩 넘어간다)
 */

const PLATE_MS = 3200;

/** 카드 안 도판 — 한 장씩 자동 전환 */
function PlateSwiper({ figures }: { figures: Figure[] }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (figures.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(
      () => setI((v) => (v + 1) % figures.length),
      PLATE_MS,
    );
    return () => clearInterval(t);
  }, [figures.length]);

  const figure = figures[i];
  if (!figure) return null;

  return (
    <figure>
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/12 bg-night-soft">
        {figures.map((f, idx) => (
          <Image
            key={f.src}
            src={f.src}
            alt={f.caption}
            fill
            sizes="(min-width: 1024px) 520px, 100vw"
            className={`object-cover transition-opacity duration-700 ${
              idx === i ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
      </div>
      <figcaption className="mt-2.5 text-xs leading-[1.7] text-white/50">
        {figure.caption}
      </figcaption>
    </figure>
  );
}

function Card({ feature }: { feature: Feature }) {
  // 문단이 차례로 뜬다 — 진행도 0→1 을 문단 수로 쪼갠다
  const { ref, p } = useViewProgress<HTMLDivElement>({ from: 0.85, to: 0.35 });
  const shown = Math.ceil(p * (feature.body.length + 1));

  const plates: Figure[] = [feature.hero, ...feature.figures];

  return (
    <article
      id={feature.id}
      ref={ref}
      className="min-w-0 scroll-mt-20 rounded-2xl border border-white/12 bg-white/[0.03] p-6 sm:p-8"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="eyebrow">{feature.category}</p>
        <p className="text-xs text-white/45">{feature.meta}</p>
      </div>

      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
        <div className="min-w-0">
          <h3 className="text-[1.25rem] leading-[1.45] font-bold text-white sm:text-[1.625rem]">
            {feature.title}
          </h3>

          <div className="mt-7 space-y-5">
            {feature.body.map((para, i) => (
              <Rich
                key={para.slice(0, 14)}
                html={para}
                className={`transition-all duration-700 ${
                  i === 0
                    ? "text-[1.0625rem] leading-[1.8] font-bold text-white sm:text-[1.1875rem]"
                    : "text-[1rem] leading-[1.9] text-white/80 sm:text-[1.0625rem]"
                } ${i < shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
              />
            ))}
          </div>

          <ul className="mt-9 grid gap-px overflow-hidden rounded-xl bg-white/12 sm:grid-cols-3">
            {feature.stats.map((stat) => (
              <li key={stat.v} className="bg-night px-4 py-4">
                <span className="block text-sm font-bold text-white">
                  {stat.v}
                </span>
                {stat.note && (
                  <span className="mt-1 block text-[0.6875rem] leading-[1.6] text-white/45">
                    ({stat.note})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0 space-y-6">
          <PlateSwiper figures={plates} />
          {feature.videos?.slice(0, 1).map((video) => (
            <figure key={video.id}>
              <a
                href={`https://www.youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noreferrer"
                className="group/v relative block aspect-video overflow-hidden rounded-xl border border-white/12 bg-night"
              >
                {/* 유튜브 썸네일은 유튜브에서 그대로 받는다 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
                  alt={video.title}
                  loading="lazy"
                  className="size-full object-cover transition-opacity duration-300 group-hover/v:opacity-80"
                />
                <span
                  aria-hidden
                  className="absolute inset-0 grid place-items-center"
                >
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
            </figure>
          ))}
        </div>
      </div>
    </article>
  );
}

export function Cases() {
  return (
    <section
      id="cases"
      className="on-dark scroll-mt-16 bg-night px-5 py-20 text-white sm:px-8 md:py-28"
    >
      <div className="mx-auto w-full max-w-6xl">
        <p className="eyebrow">Cases</p>
        <h2 className="mt-5 text-[1.5rem] leading-[1.35] font-bold sm:text-[2.125rem] sm:leading-[1.3] lg:text-[2.75rem]">
          {CASES.title[0]}
          <br />
          {CASES.title[1]}
          <br />
          <strong className="font-bold">{CASES.title[2]}</strong>
        </h2>
        <p className="mt-5 max-w-3xl text-[0.9375rem] leading-[1.85] text-white/55 sm:text-base">
          {CASES.lead}
        </p>

        {/* 사례는 넷 다 세로로 편다 — 접거나 넘기지 않는다.
            세로로 쌓이지 말아야 할 것은 카드 안 **도판**이고, 그건 PlateSwiper가 넘긴다 */}
        <div className="mt-12 space-y-6">
          {FEATURES.map((feature) => (
            <Card key={feature.id} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
