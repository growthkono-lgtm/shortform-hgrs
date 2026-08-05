import { Cta } from "@/components/ui/cta";
import { AssetSlot } from "@/components/ui/slot";
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
            <Cta href="#pricing">베타가로 시작하기</Cta>
          </div>
        </div>

        <AssetSlot
          name="team_or_workspace"
          ratio="4/3"
          hint="김포 오피스 / 작업 현장"
        />
      </div>
    </section>
  );
}
