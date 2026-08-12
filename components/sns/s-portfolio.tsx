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
 *
 * 2026-08-12: **모바일도 자동재생을 끈다.** 한 줄로 내려오다 보니 로딩 중인
 * iframe 아래로 썸네일이 비쳐 같은 컷이 겹쳐 보였고(사장님 지적), 셀룰러에서
 * 영상이 줄줄이 도는 것도 곤란하다. 좁은 화면에서는 눌러서 유튜브로 보낸다.
 */
function VideoTile({ id, title }: { id: string; title: string }) {
  const ref = useRef<HTMLLIElement>(null);
  const [live, setLive] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(min-width: 640px)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setLive(entry.isIntersecting);
        if (!entry.isIntersecting) setReady(false);
      },
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
      {/* 썸네일을 항상 깔아 둔다 — iframe 로딩 중 검은 사각형이 뜨던 원인 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`}
        alt={title}
        loading="lazy"
        className="absolute inset-0 size-full object-cover"
      />
      {live && (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&rel=0&playsinline=1&iv_load_policy=3`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture"
          onLoad={() => setReady(true)}
          className={`pointer-events-none absolute inset-0 size-full transition-opacity duration-500 ${
            ready ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* 제목은 아래에 얇게 — 영상이 주인공이라 위에 덮지 않는다.
          모바일에서는 아예 띄우지 않는다: 썸네일에 이미 큰 자막이 박혀 있어
          그 위에 우리 제목을 겹치면 둘 다 안 읽힌다. */}
      <a
        href={`https://www.youtube.com/watch?v=${id}`}
        target="_blank"
        rel="noreferrer"
        className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-transparent to-transparent p-3 opacity-0 transition-opacity duration-300 sm:group-hover:opacity-100"
      >
        <span className="text-xs leading-[1.5] font-bold text-white">
          {title}
        </span>
      </a>

      {/* 모바일 재생 표시 — 자동재생이 없으니 눌러야 열린다는 걸 알려준다 */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 grid place-items-center sm:hidden"
      >
        <span className="grid size-10 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm">
          <svg viewBox="0 0 24 24" className="ml-0.5 size-4" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
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

        {/* 모바일도 2열 — 한 줄로 세우면 14편이 끝없이 이어져 페이지가 늘어진다 */}
        <ul className="mt-12 grid grid-cols-2 gap-2.5 sm:gap-4">
          {PORTFOLIO.videos.map((video) => (
            <VideoTile key={video.id} id={video.id} title={video.title} />
          ))}

          {/* 홀수로 끝나면 마지막 칸이 빈다 — 거기에 "이게 전부가 아니다"를 적는다 */}
          <li className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-line">
            <span className="text-sm text-muted">{PORTFOLIO.note}</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
