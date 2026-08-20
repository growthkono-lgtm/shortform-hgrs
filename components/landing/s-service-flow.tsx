import { LoopVideo } from "@/components/ui/loop-video";
import { RoasCounter } from "@/components/ui/roas-counter";
import { clipPoster, clipVideo } from "@/lib/clips";

/**
 * 신규 1·2·3 스텝 — 피그마 개편안이 기존 S3/S4/S5를 대체하는 자리.
 * 헤드라인은 전부 피그마 문구 그대로. 손대지 않는다.
 *
 * ⚠️ 소재는 스텝당 **한 편**이다. 앞서 세 편씩 깔았다가 벽지처럼 보여 되돌렸다.
 * 여기는 소재를 자랑하는 자리가 아니라 문장을 읽히게 하는 자리다.
 *
 * 배경은 라이트 → 인디고 → 다크 로 교차시켜 세 스텝이 한 덩어리로 뭉치지 않게 한다.
 */

type Tone = "light" | "indigo" | "night";

type Step = {
  no: string;
  kicker: string;
  headline: React.ReactNode;
  clip: string;
  tone: Tone;
  counter?: boolean;
};

const STEPS: Step[] = [
  {
    no: "1",
    kicker: "인플루언서 시딩&바이럴",
    headline: (
      <>
        요즘 브랜드의 필수 요소, 인플루언서 리뷰 배포,
        <br className="hidden sm:block" /> 그것만으로 매출이 올랐나요?
      </>
    ),
    clip: "riiid-parent-empathy",
    tone: "light",
  },
  {
    no: "2",
    kicker: "2차 활용 소스 컷 확보",
    headline: (
      <>
        “채널 바이럴했으면
        <br className="hidden sm:block" /> 광고 매출도 키우셔야죠!”
      </>
    ),
    clip: "seeding-patty",
    tone: "indigo",
  },
  {
    no: "3",
    kicker: "매출형 숏폼 기획제작",
    headline: (
      <>
        오가닉 채널 트래픽부터 <span className="whitespace-nowrap">구매·CPA</span> 특화형
        소재까지
        <br className="hidden sm:block" /> 한번에 해결해 드립니다.
      </>
    ),
    clip: "moen-shampoo-ppl",
    tone: "night",
    counter: true,
  },
];

const TONE: Record<Tone, { section: string; kicker: string; no: string }> = {
  light: {
    section: "bg-paper text-ink",
    kicker: "text-ink-soft",
    no: "text-accent",
  },
  indigo: {
    section: "on-dark bg-accent text-white",
    kicker: "text-white/75",
    no: "text-white",
  },
  night: {
    section: "on-dark bg-night text-white",
    kicker: "text-white/70",
    no: "text-gold",
  },
};

export function ServiceFlow() {
  return (
    <div id="flow" className="scroll-mt-16">
      {STEPS.map((step, i) => {
        const t = TONE[step.tone];
        const flipped = i % 2 === 1;

        return (
          <section key={step.no} className={t.section}>
            {/* 두 열을 반반으로 둔다. 한쪽을 280px로 고정하면 순서를 뒤집었을 때
                문장이 그 좁은 칸에 갇혀 세 줄로 쪼개진다 (한 번 그렇게 나왔다). */}
            <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-20 sm:px-8 md:grid-cols-[1.15fr_0.85fr] md:gap-16 md:py-28">
              <div className={flipped ? "md:order-2" : ""}>
                <p className="flex items-baseline gap-2.5">
                  <span className={`stat-figure text-3xl sm:text-4xl ${t.no}`}>
                    {step.no}
                  </span>
                  <span
                    className={`text-base font-bold sm:text-lg ${t.kicker}`}
                  >
                    {step.kicker}
                  </span>
                </p>

                <h2 className="mt-5 text-[1.5rem] leading-[1.4] font-bold text-balance sm:mt-6 sm:text-[2.25rem] sm:leading-[1.3] lg:text-[2.75rem]">
                  {step.headline}
                </h2>
              </div>

              <div className={`relative ${flipped ? "md:order-1" : ""}`}>
                <div className="relative mx-auto aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded-3xl shadow-[0_40px_90px_-35px_rgba(0,0,0,0.65)]">
                  <LoopVideo
                    src={clipVideo(step.clip)}
                    poster={clipPoster(step.clip)}
                  />
                </div>
                {step.counter && (
                  <RoasCounter className="absolute right-0 -bottom-4 sm:-right-6" />
                )}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
