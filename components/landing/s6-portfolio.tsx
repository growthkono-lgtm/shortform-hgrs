"use client";

import Image from "next/image";
import { useState } from "react";
import { SectionHeading } from "@/components/ui/section";
import { LoopVideo } from "@/components/ui/loop-video";
import { Marquee } from "@/components/ui/marquee";
import { REELS, YOUTUBE, youtubeThumb, youtubeWatch } from "@/lib/portfolio";
import {
  WALL_MISC,
  WALL_MOTION,
  WALL_SITE,
  WALL_SQUARE,
  WALL_WIDE,
  type WallItem,
} from "@/lib/wall";

/** 마퀴 한 칸 — 높이는 행마다 고정, 폭은 비율대로 */
function Tile({
  item,
  ratio,
}: {
  item: WallItem;
  ratio: "9/16" | "1/1" | "16/9";
}) {
  const width = {
    "9/16": "w-[126px] sm:w-[158px]",
    "1/1": "w-56 sm:w-[280px]",
    "16/9": "w-[398px] sm:w-[498px]",
  }[ratio];

  return (
    <div
      className={`relative h-56 shrink-0 overflow-hidden rounded-xl bg-paper-alt sm:h-[280px] ${width}`}
    >
      {item.video ? (
        <LoopVideo src={item.video} poster={item.src} />
      ) : (
        // 월 자산은 이미 webp로 압축돼 있다. next/image를 쓰면 트랙 2벌 × 60장 =
        // 120건의 런타임 최적화 요청이 생겨 첫 렌더가 멎는다 (실측).
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.src}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
      )}
    </div>
  );
}

/** S6. 레퍼런스 포트폴리오 — Portfolio */
export function Portfolio() {
  const featured = REELS[0];
  const [openId, setOpenId] = useState<string | null>(null);

  // 세로 소재는 실제 재생본을 앞세운다
  const verticals = REELS.filter((r) => r.video);

  return (
    <section id="portfolio" className="scroll-mt-16 bg-paper-alt py-20 md:py-28">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <p className="eyebrow">Portfolio</p>
        <SectionHeading className="mt-5">
          말이 아니라 <strong className="font-bold">결과물</strong>로
          보여드립니다
        </SectionHeading>

        {/* ── 대표 소재 크게 ── */}
        <div className="mt-12 grid items-center gap-8 md:grid-cols-[minmax(0,300px)_1fr] lg:gap-14">
          <div className="relative mx-auto aspect-[9/16] w-full max-w-[300px] overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_24px_60px_-24px_rgba(3,3,3,0.35)]">
            {featured.video && (
              <LoopVideo
                src={featured.video}
                poster={featured.poster}
                alt={featured.caption}
              />
            )}
          </div>

          <div>
            <p className="font-display text-xs tracking-[0.02em] text-accent uppercase">
              Now Playing
            </p>
            <p className="mt-4 text-xl leading-[1.5] font-bold sm:text-2xl">
              {featured.caption}
            </p>
            <p className="mt-5 max-w-xl text-sm leading-[1.85] text-muted sm:text-base">
              같은 제품이라도 훅을 바꾸면 성과가 갈립니다. 후기·실험·비포애프터처럼
              구조가 다른 소재를 여러 벌 만들어 돌리고, 그중 이긴 소재를 남깁니다.
              아래는 실제로 집행된 소재들입니다.
            </p>

            <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-5">
              {[
                { v: "6", l: "브랜드" },
                { v: `${WALL_SQUARE.length + WALL_WIDE.length + WALL_MISC.length}+`, l: "게시 소재" },
                { v: "300+", l: "유튜브 영상 제작" },
              ].map((stat) => (
                <div key={stat.l}>
                  <dd className="stat-figure text-3xl">{stat.v}</dd>
                  <dt className="mt-1 text-xs text-muted">{stat.l}</dt>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* ── 크리에이티브 월 — 화면 끝까지, 자동으로 흐른다 ── */}
      <div className="mt-16 space-y-3">
        <Marquee durationSec={70}>
          <div className="flex gap-3">
            {verticals.map((reel) => (
              <Tile
                key={reel.poster}
                item={{ src: reel.poster, video: reel.video }}
                ratio="9/16"
              />
            ))}
            {WALL_SQUARE.slice(0, 11).map((item) => (
              <Tile key={item.src} item={item} ratio="1/1" />
            ))}
          </div>
        </Marquee>

        <Marquee durationSec={90} reverse>
          <div className="flex gap-3">
            {WALL_WIDE.map((item) => (
              <Tile key={item.src} item={item} ratio="16/9" />
            ))}
          </div>
        </Marquee>

        <Marquee durationSec={80}>
          <div className="flex gap-3">
            {WALL_MOTION.map((item) => (
              <Tile key={item.src} item={item} ratio="1/1" />
            ))}
            {WALL_SQUARE.slice(11).map((item) => (
              <Tile key={item.src} item={item} ratio="1/1" />
            ))}
            {WALL_MISC.map((item) => (
              <Tile key={item.src} item={item} ratio="1/1" />
            ))}
            {WALL_SITE.map((item) => (
              <Tile key={item.src} item={item} ratio="1/1" />
            ))}
          </div>
        </Marquee>
      </div>

      {/* ── 채널 컨텐츠 ── */}
      <div className="mx-auto mt-16 w-full max-w-6xl px-5 sm:px-8">
        <h3 className="text-lg font-bold">
          직접 기획·제작한 채널 컨텐츠{" "}
          <span className="ml-1 text-sm font-normal text-muted">
            눌러서 바로 재생됩니다
          </span>
        </h3>

        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {YOUTUBE.map((item) => (
            <li key={item.id}>
              {openId === item.id ? (
                <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
                  <iframe
                    className="size-full"
                    src={`https://www.youtube-nocookie.com/embed/${item.id}?autoplay=1&rel=0`}
                    title={item.title}
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setOpenId(item.id)}
                  className="group relative block aspect-video w-full overflow-hidden rounded-xl border border-line bg-paper"
                  aria-label={`${item.title} 재생`}
                >
                  <Image
                    src={youtubeThumb(item.id)}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 400px"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="grid size-14 place-items-center rounded-full bg-paper/85 backdrop-blur-sm transition-transform duration-200 group-hover:scale-110">
                      <span className="ml-1 border-y-[9px] border-l-[15px] border-y-transparent border-l-ink" />
                    </span>
                  </span>
                </button>
              )}

              <p className="font-display mt-3 text-[0.6875rem] tracking-[0.02em] text-accent uppercase">
                {item.channel}
              </p>
              <p className="mt-1 text-sm leading-snug font-bold">{item.title}</p>
              <p className="mt-1 text-xs leading-[1.6] text-muted">{item.role}</p>
              <a
                href={youtubeWatch(item.id)}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-xs text-muted underline underline-offset-2 hover:text-ink"
              >
                유튜브에서 보기
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
