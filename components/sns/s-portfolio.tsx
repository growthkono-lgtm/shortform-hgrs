"use client";

import { useEffect, useRef, useState } from "react";
import { PORTFOLIO } from "@/lib/sns-brand";

/**
 * 최근 주요 포트폴리오 — 롱폼 영상을 **자동재생·음소거로 전부 틀어 둔다**.
 *
 * 유튜브 iframe 17개를 처음부터 붙이면 페이지가 무너진다. 화면에 들어온 타일만
 * iframe 으로 바꾸고(IntersectionObserver), 나가면 썸네일로 되돌려 재생을 끊는다.
 * 그래서 스크롤을 따라 "보이는 것만" 돌아간다.
 *
 * 감속 설정(prefers-reduced-motion)이 켜져 있으면 자동재생하지 않고 썸네일만 둔다 —
 * 자동재생 영상이 17개 도는 화면은 그 설정을 켠 사람에게 특히 괴롭다.
 */
function VideoTile({ id, title }: { id: string; title: string }) {
  const ref = useRef<HTMLLIElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => setLive(entry.isIntersecting),
      { rootMargin: "10% 0px 10% 0px", threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <li
      ref={ref}
      className="group relative aspect-video overflow-hidden rounded-xl bg-night"
    >
      {live ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&rel=0&playsinline=1`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture"
          className="pointer-events-none absolute inset-0 size-full scale-[1.35]"
        />
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`}
          alt={title}
          loading="lazy"
          className="size-full object-cover"
        />
      )}

      {/* 제목은 아래에 얇게 — 영상이 주인공이라 위에 덮지 않는다 */}
      <a
        href={`https://www.youtube.com/watch?v=${id}`}
        target="_blank"
        rel="noreferrer"
        className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-transparent to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      >
        <span className="text-xs leading-[1.5] font-bold text-white">
          {title}
        </span>
      </a>
    </li>
  );
}

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

        <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PORTFOLIO.videos.map((video) => (
            <VideoTile key={video.id} id={video.id} title={video.title} />
          ))}
        </ul>
      </div>
    </section>
  );
}
