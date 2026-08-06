import { Cta } from "@/components/ui/cta";
import { LoopVideo } from "@/components/ui/loop-video";
import { PRICE_RATIONALE } from "@/lib/constants";

/** S14. 파이널 CTA */
export function FinalCta() {
  return (
    <section className="px-5 py-20 sm:px-8 md:py-28">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 rounded-3xl border border-line bg-paper-alt p-8 sm:p-12 md:grid-cols-[1fr_minmax(0,380px)]">
        <div>
          <p className="eyebrow">Start</p>
          <h2 className="mt-5 text-[1.75rem] leading-[1.3] font-bold sm:text-4xl">
            다음 달 광고 소재,
            <br />
            아직도 없으신가요?
          </h2>
          <p className="mt-5 max-w-lg text-sm leading-[1.8] text-muted">
            {PRICE_RATIONALE}
          </p>
          <div className="mt-8">
            <Cta href="#pricing">플랜 보고 시작하기</Cta>
          </div>
        </div>

        <div className="relative mx-auto aspect-[9/16] w-full max-w-[280px] overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_20px_50px_-24px_rgba(3,3,3,0.35)]">
          <LoopVideo
            src="/portfolio/reels/white-bg-01.mp4"
            poster="/portfolio/reels/white-bg-01.jpg"
            alt="제로블럭 제품 실험형 숏폼"
          />
        </div>
      </div>
    </section>
  );
}
