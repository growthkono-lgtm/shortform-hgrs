"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Section, SectionHeading } from "@/components/ui/section";
import { cn } from "@/lib/cn";
import { LoopVideo } from "@/components/ui/loop-video";
import {
  BANNERS,
  PORTFOLIO_CATEGORIES,
  REELS,
  YOUTUBE,
  youtubeThumb,
  youtubeWatch,
} from "@/lib/portfolio";

/** S6. 레퍼런스 포트폴리오 — Portfolio */
export function Portfolio() {
  const [active, setActive] = useState<string>("전체");

  const { reels, youtube, banners } = useMemo(() => {
    const match = (category: string) =>
      active === "전체" || active === category;
    return {
      reels: REELS.filter((r) => match(r.category)),
      youtube: YOUTUBE.filter((y) => match(y.category)),
      banners: BANNERS.filter((b) => match(b.category)),
    };
  }, [active]);

  const empty =
    reels.length === 0 && youtube.length === 0 && banners.length === 0;

  return (
    <Section eyebrow="Portfolio" alt>
      <SectionHeading>
        말이 아니라 <strong className="font-bold">결과물</strong>로 보여드립니다
      </SectionHeading>

      <div className="mt-8 flex flex-wrap gap-2">
        {PORTFOLIO_CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActive(category)}
            aria-pressed={active === category}
            className={cn(
              "rounded-full border px-4 py-2 text-sm transition-colors duration-200",
              active === category
                ? "border-ink bg-ink text-paper"
                : "border-line text-muted hover:border-ink/40 hover:text-ink",
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {empty && (
        <p className="mt-10 rounded-2xl border border-line bg-paper p-8 text-center text-sm text-muted">
          해당 카테고리의 공개 가능한 산출물을 준비 중입니다.
        </p>
      )}

      {/* 1행 — 9:16 숏폼 */}
      {reels.length > 0 && (
        <div className="mt-10 -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
          <ul className="flex gap-4">
            {reels.map((reel, i) => (
              <li key={i} className="w-40 shrink-0 sm:w-48">
                <div className="relative aspect-[9/16] overflow-hidden rounded-xl border border-line bg-paper">
                  {reel.video ? (
                    <LoopVideo
                      src={reel.video}
                      poster={reel.poster}
                      alt={reel.caption}
                    />
                  ) : (
                    <Image
                      src={reel.poster}
                      alt={reel.caption}
                      fill
                      sizes="(max-width: 640px) 160px, 192px"
                      className="object-cover"
                    />
                  )}
                </div>
                <p className="mt-2 text-xs leading-[1.6] text-muted">
                  {reel.caption}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 2행 — 유튜브 */}
      {youtube.length > 0 && (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {youtube.map((item) => (
            <li key={item.id}>
              <a
                href={youtubeWatch(item.id)}
                target="_blank"
                rel="noreferrer"
                className="group block"
              >
                <div className="relative aspect-video overflow-hidden rounded-xl border border-line bg-paper">
                  <Image
                    src={youtubeThumb(item.id)}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 380px"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
                <p className="font-display mt-3 text-[0.6875rem] tracking-[0.02em] text-muted uppercase">
                  {item.channel}
                </p>
                <p className="mt-1 text-sm leading-snug font-bold">
                  {item.title}
                </p>
                <p className="mt-1 text-xs leading-[1.6] text-muted">
                  {item.role}
                </p>
              </a>
            </li>
          ))}
        </ul>
      )}

      {/* 3행 — 소셜·배너 */}
      {banners.length > 0 && (
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {banners.map((banner, i) => (
            <li
              key={i}
              className="relative aspect-square overflow-hidden rounded-xl border border-line bg-paper"
            >
              {banner.video ? (
                <LoopVideo src={banner.video} poster={banner.src} />
              ) : (
                <Image
                  src={banner.src}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, 260px"
                  className="object-cover"
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
