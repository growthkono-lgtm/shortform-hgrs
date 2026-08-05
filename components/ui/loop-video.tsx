"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * 뷰포트에 들어올 때만 로드·재생하는 무음 루프 영상.
 *
 * 랜딩에는 숏폼이 10개 넘게 깔리는데, 전부 autoplay로 두면 브라우저가
 * 동시에 디코딩하다 스크롤이 멎는다(실측으로 확인). 그래서
 *  · 화면 밖에서는 <video>를 아예 만들지 않고 poster만 그린다
 *  · 들어오면 마운트해서 재생, 나가면 정지하고 언마운트한다
 */
export function LoopVideo({
  src,
  poster,
  alt,
  className,
}: {
  src: string;
  poster: string;
  alt?: string;
  className?: string;
}) {
  const holderRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = holderRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      // 조금 미리 붙여 스크롤 중 빈 화면이 보이지 않게
      { rootMargin: "200px 0px", threshold: 0.01 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={holderRef} className={cn("relative size-full", className)}>
      {/* poster는 항상 깔아둔다 — 영상 로드 전/후 모두 빈 화면이 없게 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poster}
        alt={alt ?? ""}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 size-full object-cover"
      />
      {visible && (
        <video
          className="absolute inset-0 size-full object-cover"
          src={src}
          poster={poster}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          controlsList="nodownload"
        />
      )}
    </div>
  );
}
