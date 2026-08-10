"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { formatKRW, PARTNERSHIP_URL } from "@/lib/constants";
import {
  DIAGNOSIS,
  diagnose,
  type DiagAnswers,
} from "@/lib/diagnosis";

/**
 * 플랜 진단 — 가격표 바로 앞.
 *
 * 가격을 먼저 던지면 "숏폼 한 편에 얼마"라는 비교로 끌려간다. 그 앞에서
 * 지금 브랜드가 어느 국면인지 먼저 짚어야 편수·구성이 근거를 갖는다.
 * 질문 다섯 개가 곧 제안서다 — 답을 고르는 동안 "이 사람들은 뭘 보는지"가 읽혀야 한다.
 *
 * 마지막 판단은 헤드 상담으로 넘긴다(사장님 역할). 결과 카드의 두 번째 CTA가 그 문이다.
 */
export function Diagnosis() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<DiagAnswers>({});

  const total = DIAGNOSIS.length;
  const done = step >= total;
  const question = DIAGNOSIS[Math.min(step, total - 1)];
  const result = done ? diagnose(answers) : null;

  const choose = (value: string) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
    setStep((s) => s + 1);
  };

  const reset = () => {
    setAnswers({});
    setStep(0);
  };

  /** 헤드 상담 — 진단 결과를 그대로 들고 채널톡을 연다 */
  const askHead = () => {
    if (!result) return;
    const message = [
      "[플랜 진단 결과]",
      `추천 구성: ${result.plan.label} (${result.plan.composition})`,
      `진단: ${result.headline}`,
      ...result.notes.map((n) => `· ${n}`),
      "",
      "이 구성이 저희 브랜드에 맞는지 봐주실 수 있을까요?",
    ].join("\n");

    if (typeof window !== "undefined" && window.ChannelIO) {
      window.ChannelIO("openChat", undefined, message);
      return;
    }
    window.open(PARTNERSHIP_URL, "_blank", "noreferrer");
  };

  return (
    <section
      id="diagnosis"
      className="on-dark scroll-mt-16 bg-night py-20 text-white md:py-28"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,600px)] lg:gap-16">
        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <p className="eyebrow">Diagnosis</p>
          <h2 className="mt-5 text-[1.5rem] leading-[1.35] font-bold sm:text-[2.125rem] sm:leading-[1.3] lg:text-[2.75rem]">
            편수를 고르기 전에,
            <br />
            <strong className="font-bold">지금 어느 국면인지</strong>부터
            봅니다
          </h2>
          <p className="mt-5 max-w-lg text-[0.9375rem] leading-[1.8] text-white/60 sm:text-base">
            같은 10편이라도 소스가 있느냐, 소재가 말랐느냐에 따라 만들어야 할 것이
            달라집니다. 다섯 가지만 짚으면 필요한 구성이 나옵니다.
          </p>
          <p className="mt-6 text-xs leading-[1.7] text-white/40">
            30초 · 답변은 저장되지 않습니다
          </p>
        </div>

        {/* ── 진단 카드 ── */}
        <div className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          {/* 진행 바 */}
          <div className="flex gap-1.5">
            {DIAGNOSIS.map((q, i) => (
              <span
                key={q.id}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors duration-300",
                  i < step ? "bg-gold" : "bg-white/15",
                )}
              />
            ))}
          </div>

          {!done ? (
            <>
              <p className="font-display mt-6 text-xs tracking-[0.14em] text-white/40 uppercase">
                Q{step + 1} / {total}
              </p>
              <h3 className="mt-3 text-xl leading-[1.4] font-bold sm:text-2xl">
                {question.title}
              </h3>
              <p className="mt-3 text-[0.8125rem] leading-[1.8] text-white/50">
                {question.desc}
              </p>

              <div className="mt-6 space-y-2.5">
                {question.options.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => choose(o.value)}
                    className="flex w-full items-center gap-3 rounded-xl border border-white/12 bg-white/[0.03] px-5 py-4 text-left text-sm transition-colors duration-200 hover:border-white/40 hover:bg-white/[0.08]"
                  >
                    <span
                      aria-hidden
                      className="size-2 shrink-0 rounded-full bg-white/25"
                    />
                    <span className="min-w-0 leading-[1.6]">{o.label}</span>
                  </button>
                ))}
              </div>

              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="mt-6 text-xs text-white/40 underline underline-offset-2 hover:text-white"
                >
                  이전 질문
                </button>
              )}
            </>
          ) : (
            result && (
              <>
                <p className="font-display mt-6 text-xs tracking-[0.14em] text-white/40 uppercase">
                  Result
                </p>
                <h3 className="mt-3 text-xl leading-[1.4] font-bold sm:text-2xl">
                  {result.headline}
                </h3>

                {/* 추천 구성 */}
                <div className="mt-6 rounded-2xl border border-gold/30 bg-gold/[0.07] p-5 sm:p-6">
                  <p className="text-xs text-white/50">추천 구성</p>
                  <p className="mt-2 text-lg font-bold text-gold">
                    {result.plan.label}
                  </p>
                  <p className="mt-1 text-sm text-white/60">
                    {result.plan.composition}
                  </p>
                  <p className="stat-figure mt-4 text-2xl">
                    {formatKRW(result.plan.betaPrice)}
                  </p>
                  {result.plan.shortsPrice != null &&
                    result.plan.seedingPrice != null && (
                      <p className="mt-2 text-xs text-white/45">
                        숏폼 {result.plan.shortsCount}편{" "}
                        {formatKRW(result.plan.shortsPrice)} + 인플루언서 시딩{" "}
                        {result.plan.influencerCount}명{" "}
                        {formatKRW(result.plan.seedingPrice)}
                      </p>
                    )}
                </div>

                {/* 진단 근거 */}
                <ul className="mt-6 space-y-2.5">
                  {result.notes.map((n) => (
                    <li
                      key={n}
                      className="flex gap-2.5 text-[0.8125rem] leading-[1.8] text-white/65"
                    >
                      <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-gold" />
                      {n}
                    </li>
                  ))}
                </ul>

                {result.caveat && (
                  <p className="mt-5 rounded-xl border border-white/12 px-4 py-3 text-xs leading-[1.7] text-white/50">
                    {result.caveat}
                  </p>
                )}

                {/* 마지막 판단은 헤드가 받는다 */}
                <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
                  <Link
                    href={`/checkout/${result.plan.code}-${result.plan.tier}`}
                    className="flex-1 rounded-full bg-white px-6 py-3.5 text-center text-sm font-bold text-ink transition-colors duration-200 hover:bg-white/85"
                  >
                    이 구성으로 시작하기
                  </Link>
                  <button
                    type="button"
                    onClick={askHead}
                    className="flex-1 rounded-full border border-white/25 px-6 py-3.5 text-center text-sm font-bold text-white transition-colors duration-200 hover:border-white hover:bg-white/[0.08]"
                  >
                    헤드에게 직접 확인받기
                  </button>
                </div>

                <div className="mt-5 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={reset}
                    className="text-white/40 underline underline-offset-2 hover:text-white"
                  >
                    다시 진단하기
                  </button>
                  <Link
                    href="#pricing"
                    className="text-white/40 underline underline-offset-2 hover:text-white"
                  >
                    전체 플랜 보기
                  </Link>
                </div>
              </>
            )
          )}
        </div>
      </div>
    </section>
  );
}
