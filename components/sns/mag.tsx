import Image from "next/image";
import type { Figure } from "@/lib/sns-brand";

/**
 * 매거진 프리미티브 — /sns-brand 전용.
 * 카드·그림자 없이 **괘선과 여백만으로** 지면을 나눈다. 그게 에디토리얼의 문법이다.
 */

/** 지면 폭 — 본문은 좁게(읽기 폭), 이미지·머리글은 넓게 */
export function Spread({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-5xl px-5 sm:px-8 ${className}`}>
      {children}
    </div>
  );
}

/** 섹션 머리 — 라벨 / 카테고리 / 우측 메타를 한 줄 괘선 위에 앉힌다 */
export function MagHeadline({
  label,
  category,
  meta,
}: {
  label: string;
  category?: string;
  meta?: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-ink pt-3">
      <p className="mag-label">
        {label}
        {category && <span className="text-muted"> — {category}</span>}
      </p>
      {meta && <p className="text-xs text-muted">{meta}</p>}
    </div>
  );
}

/** 풀 인용 — 세리프 대형. 매거진에서 독자가 제일 먼저 훑는 자리다 */
export function PullQuote({
  children,
  source,
}: {
  children: React.ReactNode;
  source?: string;
}) {
  return (
    <figure className="mag-rise my-12 border-y border-line py-8 sm:my-14 sm:py-10">
      <blockquote className="mag-serif text-[1.25rem] text-ink sm:text-[1.625rem] sm:leading-[1.5]">
        <span aria-hidden className="mr-1 text-gold">
          &ldquo;
        </span>
        {children}
        <span aria-hidden className="ml-0.5 text-gold">
          &rdquo;
        </span>
      </blockquote>
      {source && (
        <figcaption className="mt-4 text-xs text-muted">— {source}</figcaption>
      )}
    </figure>
  );
}

/** 성과 스트립 — 숫자를 카드에 담지 않는다. 괘선으로만 나눈다 */
export function StatStrip({ items }: { items: readonly string[] }) {
  return (
    <ul className="mag-rise mt-10 grid gap-px overflow-hidden border-y border-line bg-line sm:grid-cols-3">
      {items.map((item) => (
        <li
          key={item}
          className="bg-paper-warm px-5 py-5 text-sm font-bold text-ink sm:text-[0.9375rem]"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

/** 도판 — 캡션이 본문이다. 무엇을 보고 있는지 말해주지 않는 이미지는 싣지 않는다 */
export function Plate({
  figure,
  priority,
  className = "",
}: {
  figure: Figure;
  priority?: boolean;
  className?: string;
}) {
  return (
    <figure className={`mag-rise ${className}`}>
      <div className="overflow-hidden border border-line bg-paper">
        <Image
          src={figure.src}
          alt={figure.caption}
          width={figure.width}
          height={figure.height}
          priority={priority}
          sizes="(min-width: 1024px) 900px, 100vw"
          className="h-auto w-full"
        />
      </div>
      <figcaption className="mt-2.5 border-t border-line pt-2.5 text-xs leading-[1.7] text-muted">
        {figure.caption}
      </figcaption>
    </figure>
  );
}

/**
 * 유튜브 — 썸네일만 먼저 깔고 누를 때 iframe을 붙인다(lite embed).
 * 매거진 한 지면에 임베드를 여러 개 그대로 두면 초기 로딩이 통째로 무너진다.
 */
export function VideoPlate({ id, title }: { id: string; title: string }) {
  return (
    <figure className="mag-rise">
      <a
        href={`https://www.youtube.com/watch?v=${id}`}
        target="_blank"
        rel="noreferrer"
        className="group relative block aspect-video overflow-hidden border border-line bg-night"
      >
        {/* 유튜브 썸네일은 유튜브에서 그대로 받는다 — 이 CDN은 사라지지 않는다 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
          alt={title}
          loading="lazy"
          className="size-full object-cover transition-opacity duration-300 group-hover:opacity-80"
        />
        <span
          aria-hidden
          className="absolute inset-0 grid place-items-center"
        >
          <span className="grid size-14 place-items-center rounded-full bg-paper/90 text-ink">
            <svg viewBox="0 0 24 24" className="ml-0.5 size-5" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </span>
      </a>
      <figcaption className="mt-2.5 border-t border-line pt-2.5 text-xs text-muted">
        {title}
      </figcaption>
    </figure>
  );
}
