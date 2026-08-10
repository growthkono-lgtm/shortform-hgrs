"use client";

import { useCallback, useState } from "react";
import { SectionHeading } from "@/components/ui/section";
import { ClipPlayer } from "@/components/ui/clip-player";
import { LoopVideo } from "@/components/ui/loop-video";
import { Marquee } from "@/components/ui/marquee";
import {
  WALL_MISC,
  WALL_MOTION,
  WALL_SITE,
  WALL_SQUARE,
  type WallItem,
} from "@/lib/wall";
import {
  WALL_CLIPS,
  YOUTUBE_SHORTS,
  YOUTUBE_LINKS,
  clipPoster,
  clipVideo,
  ytThumbFallback,
  ytThumbMax,
  ytWatch,
} from "@/lib/clips";

/**
 * 영상 한 칸 — 칸 전체가 재생 버튼이다.
 *
 * 흘러가는 칸을 눌러 보라는 건 애초에 말이 안 됐다. 여기서는 멈춰 있고,
 * 재생 버튼이 hover 와 무관하게 항상 떠 있다. 캡션·브랜드명은 붙이지 않는다.
 */
type GridTile =
  | { kind: "clip"; video: string; poster: string; ratio: "9/16" | "1/1" }
  | { kind: "short"; id: string; poster: string; label: string };

/**
 * 그리드에 세우는 영상.
 *
 * 2026-08-10: 정사각 배너 영상을 여기서 도로 뺐다. 9:16 칸에 1:1을 넣으면
 * 위아래가 검은 띠로 남아 소재가 아니라 여백이 먼저 보인다 — 배너는 아래 밴드가 제 자리다.
 * 대신 유튜브 쇼츠 두 편(조나단 인터뷰 / 핏플렉스)을 세로 칸으로 세운다.
 */
const GRID: GridTile[] = (() => {
  const clips: GridTile[] = WALL_CLIPS.map((c) => ({
    kind: "clip",
    video: clipVideo(c.slug),
    poster: clipPoster(c.slug),
    ratio: c.ratio,
  }));
  const shorts: GridTile[] = YOUTUBE_SHORTS.map((y) => ({
    kind: "short",
    id: y.id,
    poster: y.poster,
    label: y.label,
  }));

  // 쇼츠를 앞·중간에 하나씩 꽂는다. 뒤에 몰면 유튜브로 나가는 칸만 모인 줄이 생긴다
  const out = [...clips];
  out.splice(2, 0, shorts[0]);
  out.splice(9, 0, shorts[1]);
  return out;
})();

/** 라이트박스로 재생되는 건 파일 소재뿐이다 — 쇼츠 칸은 유튜브로 나간다 */
const PLAYABLE = GRID.filter(
  (t): t is Extract<GridTile, { kind: "clip" }> => t.kind === "clip",
);

/** 유튜브 쇼츠 칸 — 파일이 아니라 유튜브에 있는 소재라 눌렀을 때 유튜브로 넘긴다 */
function ShortCard({ id, poster, label }: { id: string; poster: string; label: string }) {
  return (
    <a
      href={`https://www.youtube.com/shorts/${id}`}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="group relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-ink-soft"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poster}
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 size-full object-cover"
      />
      <span className="pointer-events-none absolute inset-0 grid place-items-center bg-ink/0 transition-colors duration-300 group-hover:bg-ink/25">
        <span className="grid size-11 place-items-center rounded-full bg-paper/90 shadow-lg backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 sm:size-14">
          <svg viewBox="0 0 24 24" className="ml-0.5 size-5 fill-ink sm:ml-1 sm:size-6">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
    </a>
  );
}

function ClipCard({
  tile,
  onOpen,
}: {
  tile: Extract<GridTile, { kind: "clip" }>;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="영상 재생"
      className="group relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-ink-soft"
    >
      <LoopVideo
        src={tile.video}
        poster={tile.poster}
        // 정사각 소재를 세로 칸에 우겨 넣으면 좌우가 잘려 카피가 날아간다
        fit={tile.ratio === "1/1" ? "contain" : "cover"}
      />
      {/* 칸이 좁아진 모바일에서 버튼이 소재를 다 덮지 않게 크기를 줄인다 */}
      <span className="pointer-events-none absolute inset-0 grid place-items-center bg-ink/0 transition-colors duration-300 group-hover:bg-ink/25">
        <span className="grid size-11 place-items-center rounded-full bg-paper/90 shadow-lg backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 sm:size-14">
          <svg viewBox="0 0 24 24" className="ml-0.5 size-5 fill-ink sm:ml-1 sm:size-6">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
    </button>
  );
}

/* ── 롱폼 · 이미지 소재 밴드 ────────────────────────────────
   숏폼 그리드가 주인공이고 이쪽은 "이게 다가 아니다"를 깔아주는 배경이다.
   그래서 여기만 가로로 흐르게 두고, 롱폼을 이미지 사이사이에 끼워 넣어
   물량감이 끊기지 않게 한다. 높이는 고정, 폭만 비율대로. */

const BAND_TILE = "h-[132px] sm:h-[176px]";

type BandTile =
  | { kind: "yt"; id: string; label: string }
  | { kind: "img"; item: WallItem };

/**
 * 밴드에 흐르는 이미지.
 *
 * 정사각 배너 영상(WALL_MOTION)은 여기가 제 자리다 — 칸이 정사각이라 잘리지 않는다.
 * 나머지 이미지는 **절반만** 쓴다. 작은 칸을 빽빽하게 채우면 롱폼이 묻혀
 * "이미지만 잔뜩"으로 읽힌다. 수를 줄여 롱폼이 더 자주 오게 만든다.
 */
const BAND_IMAGES: WallItem[] = [
  ...WALL_MOTION,
  ...WALL_SQUARE.filter((_, i) => i % 2 === 0),
  ...WALL_MISC.filter((_, i) => i % 2 === 0),
  ...WALL_SITE.filter((_, i) => i % 2 === 0),
];

/** 롱폼을 이미지 사이에 고르게 끼운다 — 한쪽에 몰리면 흐름이 두 덩어리로 갈린다 */
const BAND: BandTile[] = (() => {
  const gap = Math.ceil(BAND_IMAGES.length / YOUTUBE_LINKS.length);
  const out: BandTile[] = [];
  let y = 0;
  BAND_IMAGES.forEach((item, i) => {
    out.push({ kind: "img", item });
    if ((i + 1) % gap === 0 && y < YOUTUBE_LINKS.length) {
      const v = YOUTUBE_LINKS[y++];
      out.push({ kind: "yt", id: v.id, label: v.label });
    }
  });
  while (y < YOUTUBE_LINKS.length) {
    const v = YOUTUBE_LINKS[y++];
    out.push({ kind: "yt", id: v.id, label: v.label });
  }
  return out;
})();

const BAND_ROW_A = BAND.filter((_, i) => i % 2 === 0);
const BAND_ROW_B = BAND.filter((_, i) => i % 2 === 1);

/** 이미지 소재 한 칸 — 정사각으로 잘라 흘린다. 캡션은 붙이지 않는다 */
function ImageTile({ item }: { item: WallItem }) {
  return (
    <div
      className={`relative aspect-square shrink-0 overflow-hidden rounded-xl bg-paper-alt ${BAND_TILE}`}
    >
      {item.video ? (
        <LoopVideo src={item.video} poster={item.src} />
      ) : (
        // 월 자산은 이미 압축돼 있다. next/image 를 쓰면 트랙 2벌 × 수십 장이
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

/** 밴드 안의 롱폼 칸 — 16:9 라 이미지 사이에서 가로로 튀어 리듬을 만든다 */
function BandYoutubeTile({ id, label }: { id: string; label: string }) {
  const [src, setSrc] = useState(ytThumbMax(id));

  return (
    <a
      href={ytWatch(id)}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className={`group relative aspect-video shrink-0 overflow-hidden rounded-xl bg-ink-soft ${BAND_TILE}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setSrc(ytThumbFallback(id))}
        className="absolute inset-0 size-full object-cover"
      />
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid size-10 place-items-center rounded-full bg-paper/85 backdrop-blur-sm sm:size-12">
          <svg viewBox="0 0 24 24" className="ml-0.5 size-4 fill-ink sm:size-5">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
    </a>
  );
}

function BandRow({ row, ...rest }: { row: BandTile[]; durationSec: number; reverse?: boolean }) {
  return (
    <Marquee copies={2} {...rest}>
      {row.map((t, i) =>
        t.kind === "yt" ? (
          <BandYoutubeTile key={`yt-${t.id}-${i}`} id={t.id} label={t.label} />
        ) : (
          <ImageTile key={`img-${t.item.src}`} item={t.item} />
        ),
      )}
    </Marquee>
  );
}

/**
 * 크리에이티브 월 — 피그마 "업종별 브랜드-컨텐츠 전략을 이끈 프로젝트 인사이트를
 * 숏폼으로 압축합니다" 자리.
 *
 * 구조는 **영상 그리드 + 이미지 밴드** 두 덩어리다.
 *
 *  · 영상(숏폼 + 움직이는 배너) — 클라이언트가 실제로 보고 판단하는 소재다. 그래서 흐르지 않는다.
 *    PC 3열 / 모바일 2열 그리드에 세워 두고, 칸 자체가 재생 버튼이다.
 *    가로로 흘리면 한 화면에 여러 개를 욱여넣게 되고, 흘러가는 칸은 누를 수가 없다.
 *  · 이미지 + 유튜브 롱폼 — "이게 다가 아니다"를 깔아주는 배경이다. 여기만 가로로 흐른다.
 *    소제목 없이 그리드에 바로 이어 붙인다 — 이름표를 달아 나누면 양쪽 다 빈약해 보인다.
 *
 * 캡션·브랜드명은 어느 쪽에도 붙이지 않는다 (사장님 지시).
 */
export function CreativeWall() {
  const [open, setOpen] = useState<number | null>(null);

  const step = useCallback((delta: number) => {
    setOpen((i) =>
      i === null ? i : (i + delta + PLAYABLE.length) % PLAYABLE.length,
    );
  }, []);
  const close = useCallback(() => setOpen(null), []);

  return (
    <section
      id="wall"
      className="scroll-mt-16 bg-paper py-20 md:py-28"
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <p className="eyebrow">Creative Wall</p>
        <SectionHeading className="mt-5">
          브랜드·퍼포먼스 마케팅에서 성과 달성을 위해 쌓아온
          <br />
          <strong className="font-bold">위너 숏폼 포트폴리오</strong>
        </SectionHeading>
        <p className="mt-5 text-sm text-muted">
          최근 진행한 캠페인 중 <strong className="font-bold text-ink">주요 위너
          소재만</strong> 추렸습니다.
        </p>
      </div>

      {/* 숏폼 — PC 3열, 모바일 2열. 한 편씩 세로로 쭉 내리면 스크롤이 말이 안 되게 길어진다 */}
      <div className="mx-auto mt-10 grid w-full max-w-6xl grid-cols-2 gap-2 px-5 sm:gap-4 sm:px-8 lg:grid-cols-3 md:mt-14">
        {GRID.map((tile) =>
          tile.kind === "short" ? (
            <ShortCard key={tile.id} id={tile.id} poster={tile.poster} label={tile.label} />
          ) : (
            <ClipCard
              key={tile.video}
              tile={tile}
              onOpen={() => setOpen(PLAYABLE.indexOf(tile))}
            />
          ),
        )}
      </div>

      {/* 이미지 소재 + 유튜브 롱폼 — 소제목 없이 그리드에 바로 이어 붙인다.
          따로 떼어 "유튜브 롱폼" 이라고 이름표를 달면 소재가 둘로 갈려 각각 빈약해 보인다. */}
      <div className="mt-4 space-y-3 sm:mt-6">
        <BandRow row={BAND_ROW_A} durationSec={150} />
        <BandRow row={BAND_ROW_B} durationSec={170} reverse />
      </div>


      {open !== null && (
        <ClipPlayer
          src={PLAYABLE[open].video}
          poster={PLAYABLE[open].poster}
          position={open + 1}
          total={PLAYABLE.length}
          onClose={close}
          onStep={step}
        />
      )}
    </section>
  );
}
