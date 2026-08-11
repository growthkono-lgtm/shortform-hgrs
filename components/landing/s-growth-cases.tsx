import { LoopVideo } from "@/components/ui/loop-video";
import { GrowthMeter } from "@/components/ui/growth-meter";
import { GROWTH_CASES } from "@/lib/cases";

/**
 * 성장 사례 1~4.
 *
 * 배경을 검정으로 깐다 — 네 덩어리가 랜딩에서 가장 세게 읽혀야 하는 구간이고,
 * 소재(9:16 세로 영상)가 어두운 바탕에서 훨씬 또렷하다.
 * 소재를 브랜드당 두 편 두어 오른쪽 텍스트 열과 무게를 맞춘다.
 */
export function GrowthCases() {
  return (
    <section id="cases" className="on-dark scroll-mt-16 bg-night text-white">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        {/* 성과의 출처를 사례보다 먼저 밝힌다. 이 줄이 없으면 아래 네 덩어리가
            "이 패키지를 사면 나는 결과"로 읽힌다 — 사실이 아니고, 검증 단계에서
            제일 먼저 깨지는 대목이다. */}
        <div className="pt-16 pb-14 md:pt-20 md:pb-16">
          <p className="max-w-3xl border-l-2 border-gold pl-4 text-[0.9375rem] leading-[1.8] text-white/55 sm:pl-5 sm:text-base">
            아래 성과는 소재 제작을 포함한 풀 프로젝트 수행에서 나온 결과입니다.
            이 패키지는 그 프로젝트의 소재 제작 시스템을 동일하게 사용합니다.
          </p>
        </div>

        {GROWTH_CASES.map((c, i) => {
          const flipped = i % 2 === 1;

          return (
            <div
              key={c.title}
              className="grid items-center gap-8 border-t border-white/10 py-14 first:border-t-0 sm:gap-10 md:grid-cols-2 md:gap-14 md:py-20"
            >
              {/* 소재 — 두 편을 어긋나게 겹쳐 세로 여백을 메운다 */}
              <div
                className={`flex justify-center gap-4 ${flipped ? "md:order-2" : ""}`}
              >
                {c.media.map((m, mi) => (
                  <figure
                    key={m.poster}
                    className={`relative w-full max-w-[220px] overflow-hidden rounded-2xl bg-white/[0.06] shadow-[0_30px_70px_-30px_rgba(0,0,0,0.8)] ${
                      mi === 1 ? "mt-10 hidden sm:block" : ""
                    }`}
                    style={{ aspectRatio: m.aspect }}
                  >
                    {m.video ? (
                      <LoopVideo
                        src={m.video}
                        poster={m.poster}
                        alt={c.title}
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.poster}
                        alt={c.title}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 size-full object-cover"
                      />
                    )}
                  </figure>
                ))}
              </div>

              <div className={flipped ? "md:order-1" : ""}>
                <p className="eyebrow">Growth Case 0{i + 1}</p>

                <h2 className="mt-4 text-[1.375rem] leading-[1.35] font-bold sm:text-[1.75rem] sm:leading-[1.3]">
                  {c.title}
                  <span className="ml-2 text-base font-bold text-white/50 sm:text-lg">
                    ({c.scale})
                  </span>
                </h2>

                <p className="mt-6 border-l-2 border-gold pl-4 text-[1.0625rem] leading-[1.65] font-bold text-balance sm:mt-7 sm:pl-5 sm:text-xl sm:leading-[1.6]">
                  {c.result}
                </p>

                <p className="mt-5 inline-flex rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white/70">
                  {c.scope}
                </p>

                {c.metrics && <GrowthMeter metrics={c.metrics} />}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
