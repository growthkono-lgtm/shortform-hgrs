import { Cta } from "@/components/ui/cta";
import { LoopVideo } from "@/components/ui/loop-video";
import { VerticalMarquee } from "@/components/ui/vertical-marquee";
import { REELS } from "@/lib/portfolio";
import { WALL_ALL } from "@/lib/wall";

/** 세로 컬럼 한 칸 */
function Cell({
  src,
  video,
  ratio,
}: {
  src: string;
  video?: string;
  ratio: "9/16" | "1/1";
}) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl bg-paper-alt ${
        ratio === "9/16" ? "aspect-[9/16]" : "aspect-square"
      }`}
    >
      {video ? (
        <LoopVideo src={video} poster={src} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
      )}
    </div>
  );
}

/** 컬럼 하나를 채울 소재 — 세로 숏폼과 정사각 소재를 섞는다 */
function buildColumn(offset: number, count: number) {
  const videos = REELS.filter((r) => r.video);
  const cells: { src: string; video?: string; ratio: "9/16" | "1/1" }[] = [];

  for (let i = 0; i < count; i++) {
    const idx = offset + i;
    // 3칸마다 실제 재생 숏폼을 끼워 넣어 "영상이 흐르는" 인상을 만든다
    if (i % 3 === 0) {
      const reel = videos[(offset + i) % videos.length];
      cells.push({ src: reel.poster, video: reel.video, ratio: "9/16" });
    } else {
      const item = WALL_ALL[idx % WALL_ALL.length];
      cells.push({ src: item.src, ratio: "1/1" });
    }
  }
  return cells;
}

/** S1. 히어로 — Winner Creative Program */
export function Hero() {
  const columns = [
    { cells: buildColumn(0, 9), duration: 55 },
    { cells: buildColumn(9, 9), duration: 70, reverse: true },
    { cells: buildColumn(18, 9), duration: 62 },
  ];

  return (
    <section className="relative overflow-hidden pt-24 pb-16 md:pt-28 md:pb-24">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_minmax(0,520px)] lg:gap-12">
        {/* 카피 */}
        <div>
          <p className="eyebrow">Winner Creative Program</p>

          <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/[0.07] px-3.5 py-1.5 text-xs font-bold text-accent-deep">
            <span className="size-1.5 rounded-full bg-accent" />
            Beta Open — 한정 가격
          </span>

          <h1 className="mt-6 text-[2.125rem] leading-[1.24] font-bold sm:text-5xl lg:text-[3.5rem]">
            매출로 검증된 팀이 만드는,
            <br />
            위너 숏폼
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-[1.7] font-bold text-ink-soft sm:text-xl">
            인플루언서 바이럴부터 구매전환 소재까지 — 하나의 파이프라인, 결제 한
            번으로
          </p>

          <p className="mt-4 max-w-xl text-base leading-[1.75] text-muted">
            평균 프로젝트 단가 2천만원 이상의 전략 집단 해그로시가, 숏폼 소재
            시스템만 패키지로 열었습니다.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Cta href="#pricing">플랜 보기</Cta>
            <Cta href="/signup" variant="outline">
              무료 가입
            </Cta>
          </div>
        </div>

        {/* 소재 컬럼 — 세로로 계속 흐른다 */}
        <div
          aria-hidden
          className="relative hidden h-[560px] grid-cols-3 gap-3 lg:grid"
        >
          {columns.map((col, ci) => (
            <VerticalMarquee
              key={ci}
              durationSec={col.duration}
              reverse={col.reverse}
              className="h-full"
            >
              {col.cells.map((cell, i) => (
                <Cell key={`${ci}-${i}`} {...cell} />
              ))}
            </VerticalMarquee>
          ))}

          {/* 위아래 페이드 — 컬럼이 잘린 느낌 대신 흘러가는 느낌을 준다 */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-paper to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-paper to-transparent" />
        </div>

        {/* 모바일 — 가로로 한 줄 */}
        <div
          aria-hidden
          className="-mx-5 flex gap-3 overflow-x-auto px-5 lg:hidden"
        >
          {REELS.filter((r) => r.video).map((reel) => (
            <div key={reel.poster} className="w-32 shrink-0">
              <Cell src={reel.poster} video={reel.video} ratio="9/16" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
