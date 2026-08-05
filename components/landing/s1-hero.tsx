import { AssetSlot } from "@/components/ui/slot";
import { Cta } from "@/components/ui/cta";
import { cn } from "@/lib/cn";

/** S1. 히어로 — Winner Creative Program */
export function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pt-28 pb-20 sm:px-8 md:pt-36 md:pb-28">
      {/* 배경 [ASSET hero_grid] — 9:16 숏폼 6~8개 무한 스크롤 그리드 + 화이트 페이드 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="mx-auto flex h-full max-w-6xl gap-3 px-5 sm:px-8">
          {Array.from({ length: 6 }, (_, col) => (
            <div
              key={col}
              className={cn(
                "flex flex-1 flex-col gap-3",
                col % 2 === 1 && "-mt-20",
                col > 1 && "hidden sm:flex",
                col > 3 && "hidden lg:flex",
              )}
            >
              {Array.from({ length: 2 }, (_, row) => (
                <AssetSlot
                  key={row}
                  name={`hero_grid_${col * 2 + row + 1}`}
                  ratio="9/16"
                />
              ))}
            </div>
          ))}
        </div>
        {/* 위·아래로 흰색 페이드 — 카피 가독성 확보 */}
        <div className="absolute inset-0 bg-gradient-to-b from-paper via-paper/92 to-paper" />
        <div className="absolute inset-0 bg-gradient-to-r from-paper via-paper/80 to-paper/40" />
      </div>

      <div className="mx-auto w-full max-w-6xl">
        <p className="eyebrow">Winner Creative Program</p>

        <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/[0.07] px-3.5 py-1.5 text-xs font-bold text-accent-deep">
          <span className="size-1.5 rounded-full bg-accent" />
          Beta Open — 한정 가격
        </span>

        <h1 className="mt-6 max-w-4xl text-[2.125rem] leading-[1.24] font-bold sm:text-5xl lg:text-[3.75rem]">
          매출로 검증된 팀이 만드는,
          <br />
          위너 숏폼
        </h1>

        <p className="mt-7 max-w-2xl text-lg leading-[1.7] font-bold text-ink-soft sm:text-xl">
          인플루언서 바이럴부터 구매전환 소재까지 — 하나의 파이프라인, 결제 한 번으로
        </p>

        <p className="mt-4 max-w-2xl text-base leading-[1.75] text-muted">
          평균 프로젝트 단가 2천만원 이상의 전략 집단 해그로시가, 숏폼 소재 시스템만
          패키지로 열었습니다.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Cta href="#pricing">플랜 보기</Cta>
          <Cta href="/signup" variant="outline">
            무료 가입
          </Cta>
        </div>
      </div>
    </section>
  );
}
