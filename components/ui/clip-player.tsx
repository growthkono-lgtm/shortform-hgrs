"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * 숏폼 전체화면 플레이어.
 *
 * 크리에이티브 월은 "많이 만들었다"는 인상만 주면 되는 자리가 아니다 —
 * 클라이언트가 실제로 한 편을 끝까지 보고 판단하는 자리다. 그래서
 *  · 소리 켜고 컨트롤 붙여서 원본 그대로 재생한다 (월의 무음 루프와 다르다)
 *  · ← → 로 다음 소재로 바로 넘어간다. 닫았다 다시 여는 왕복을 없앤다
 *  · 마퀴 트랙이 will-change: transform 이라 fixed 의 containing block 이 된다.
 *    그래서 반드시 body 로 포털을 띄운다 — 안 그러면 오버레이가 행 안에 갇힌다.
 */
export function ClipPlayer({
  src,
  poster,
  position,
  total,
  onClose,
  onStep,
}: {
  src: string;
  poster: string;
  position: number;
  total: number;
  onClose: () => void;
  onStep: (delta: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);

  /**
   * 소리를 켠 채로 자동재생한다. 다만 브라우저가 이걸 막는 경우가 있다
   * (사이트 이용 이력이 없으면 클릭 직후여도 막힌다 — 크롬 실측).
   * 그때 멈춘 화면을 보여주는 게 제일 나쁘므로, 음소거로라도 일단 돌리고
   * "소리 켜기"를 띄운다.
   */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    setMuted(false);
    v.play().catch(() => {
      v.muted = true;
      setMuted(true);
      void v.play().catch(() => {});
    });
  }, [src]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onStep(1);
      if (e.key === "ArrowLeft") onStep(-1);
    };
    document.addEventListener("keydown", onKey);

    // 뒤 페이지가 같이 스크롤되지 않게 잠근다
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, onStep]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="숏폼 재생"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-ink/92 p-4 backdrop-blur-sm"
    >
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <video
          // key 를 바꿔 다음 소재로 넘어갈 때 <video> 를 새로 마운트한다.
          // src 만 갈면 브라우저가 이전 재생 위치를 물고 늘어진다.
          key={src}
          ref={videoRef}
          src={src}
          poster={poster}
          controls
          autoPlay
          loop
          playsInline
          className="max-h-[76vh] w-auto max-w-[min(430px,92vw)] rounded-2xl bg-black"
        />

        {muted && (
          <button
            type="button"
            onClick={() => {
              const v = videoRef.current;
              if (!v) return;
              v.muted = false;
              setMuted(false);
              void v.play();
            }}
            className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-ink/70 px-4 py-2 text-sm font-bold text-paper backdrop-blur-sm transition hover:bg-ink/85"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" strokeWidth={2} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5L6 9H3v6h3l5 4V5z" />
              <path d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13" />
            </svg>
            소리 켜기
          </button>
        )}
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-5 text-paper"
      >
        <StepButton label="이전 숏폼" onClick={() => onStep(-1)}>
          <path d="M15 6l-6 6 6 6" />
        </StepButton>
        <span className="w-16 text-center text-sm tabular-nums text-paper/70">
          {position} / {total}
        </span>
        <StepButton label="다음 숏폼" onClick={() => onStep(1)}>
          <path d="M9 6l6 6-6 6" />
        </StepButton>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-paper/15 text-paper transition hover:bg-paper/30"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" strokeWidth={2} stroke="currentColor">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>,
    document.body,
  );
}

function StepButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-11 place-items-center rounded-full bg-paper/15 transition hover:bg-paper/30"
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" strokeWidth={2} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  );
}
