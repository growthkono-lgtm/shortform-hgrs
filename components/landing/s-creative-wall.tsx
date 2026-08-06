"use client";

import { useState } from "react";
import { SectionHeading } from "@/components/ui/section";
import { LoopVideo } from "@/components/ui/loop-video";
import { Marquee } from "@/components/ui/marquee";
import {
  INSTAGRAM_LINKS,
  WALL_CLIPS,
  YOUTUBE_LINKS,
  clipPoster,
  clipVideo,
  igUrl,
  ytThumbFallback,
  ytThumbMax,
  ytWatch,
} from "@/lib/clips";
import {
  WALL_MISC,
  WALL_MOTION,
  WALL_SITE,
  WALL_SQUARE,
  type WallItem,
} from "@/lib/wall";

const WIDTHS = {
  "9/16": "w-[126px] sm:w-[158px]",
  "1/1": "w-56 sm:w-[280px]",
  "16/9": "w-[398px] sm:w-[498px]",
} as const;

/** 마퀴 한 칸 — 행마다 높이 고정, 폭은 비율대로. 캡션은 붙이지 않는다 */
function Tile({
  item,
  ratio,
}: {
  item: WallItem;
  ratio: keyof typeof WIDTHS;
}) {
  return (
    <div
      className={`relative h-56 shrink-0 overflow-hidden rounded-xl bg-paper-alt sm:h-[280px] ${WIDTHS[ratio]}`}
    >
      {item.video ? (
        <LoopVideo src={item.video} poster={item.src} />
      ) : (
        // 월 자산은 이미 압축돼 있다. next/image를 쓰면 트랙 2벌 × 수십 장이
        // 전부 런타임 최적화 요청이 돼 첫 렌더가 멎는다 (실측).
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

/** 유튜브 칸 — 썸네일은 i.ytimg.com 직결. maxres 없는 영상은 hq로 떨어뜨린다 */
function YoutubeTile({ id, label }: { id: string; label: string }) {
  const [src, setSrc] = useState(ytThumbMax(id));

  return (
    <a
      href={ytWatch(id)}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className={`group relative h-56 shrink-0 overflow-hidden rounded-xl bg-ink-soft sm:h-[280px] ${WIDTHS["16/9"]}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setSrc(ytThumbFallback(id))}
        className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid size-12 place-items-center rounded-full bg-paper/85 backdrop-blur-sm">
          <svg viewBox="0 0 24 24" className="ml-0.5 size-5 fill-ink">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
    </a>
  );
}

/**
 * 크리에이티브 월 — 피그마 "업종별 브랜드-컨텐츠 전략을 이끈 프로젝트 인사이트를
 * 숏폼으로 압축합니다" 자리. hgrs.io 파트너십 페이지의 월 패턴을 따른다.
 *
 * 성장 사례에 쓴 2편을 뺀 실사 소재 15편 + 유튜브 롱폼/쇼츠 + 기존 게시 산출물이
 * 전부 여기로 흐른다. 설명은 붙이지 않는다 — 물량 자체가 메시지다.
 */
export function CreativeWall() {
  return (
    <section
      id="wall"
      className="scroll-mt-16 overflow-hidden bg-paper py-20 md:py-28"
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <p className="eyebrow">Creative Wall</p>
        <SectionHeading className="mt-5">
          브랜드·퍼포먼스 마케팅에서 성과 달성을 위해 쌓아온
          <br />
          <strong className="font-bold">위너 숏폼 포트폴리오</strong>
        </SectionHeading>
      </div>

      <div className="mt-14 space-y-3">
        {/* 1행 — 실사 세로 소재 (직접 인코딩한 원본 15편) */}
        <Marquee durationSec={80}>
          <div className="flex gap-3">
            {WALL_CLIPS.map((c) => (
              <Tile
                key={c.slug}
                item={{ src: clipPoster(c.slug), video: clipVideo(c.slug) }}
                ratio={c.ratio}
              />
            ))}
          </div>
        </Marquee>

        {/* 2행 — 유튜브 롱폼·쇼츠 (역방향으로 흘려 단조로움을 깬다) */}
        <Marquee durationSec={95} reverse>
          <div className="flex gap-3">
            {YOUTUBE_LINKS.map((v, i) => (
              <YoutubeTile key={`${v.id}-${i}`} id={v.id} label={v.label} />
            ))}
          </div>
        </Marquee>

        {/* 3행 — 1:1 소셜·광고 크리에이티브 */}
        <Marquee durationSec={90}>
          <div className="flex gap-3">
            {WALL_SQUARE.map((item) => (
              <Tile key={item.src} item={item} ratio="1/1" />
            ))}
          </div>
        </Marquee>

        {/* 4행 — 배너·카드뉴스·촬영 스케치 + 움직이는 배너 */}
        <Marquee durationSec={110} reverse>
          <div className="flex gap-3">
            {[...WALL_MOTION, ...WALL_MISC, ...WALL_SITE].map((item) => (
              <Tile key={item.src} item={item} ratio="1/1" />
            ))}
          </div>
        </Marquee>
      </div>

      <div className="mx-auto mt-10 w-full max-w-6xl px-5 sm:px-8">
        <p className="text-xs text-muted">
          인스타그램 릴스로도 이어집니다 —{" "}
          {INSTAGRAM_LINKS.map((ig, i) => (
            <span key={ig.code}>
              {i > 0 && " · "}
              <a
                href={igUrl(ig.code)}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-accent underline underline-offset-4"
              >
                {ig.label}
              </a>
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
