"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { DIAGNOSIS } from "@/lib/diagnosis";
import { useDiagnosis } from "./diagnosis-context";

/**
 * 플랜 진단 — 신청 폼 바로 앞.
 *
 * 홈페이지에 가격을 걸지 않기로 했으므로(2026-08-10), 이 섹션이
 * "무엇이 필요한지"를 잡아 주는 유일한 자리다. 질문 다섯 개가 곧 제안서다 —
 * 답을 고르는 동안 "이 사람들은 뭘 보는지"가 읽혀야 한다.
 *
 * 결과는 **구성만** 말한다. 금액도, 상담 유도도 넣지 않는다.
 * 다음 행동은 하나뿐이다 — 아래 신청 폼.
 */
export function Diagnosis() {
  const { answers, setAnswers, result } = useDiagnosis();
  const [step, setStep] = useState(0);

  const total = DIAGNOSIS.length;
  const done = step >= total;
  const question = DIAGNOSIS[Math.min(step, total - 1)];

  const choose = (value: string) => {
    setAnswers({ ...answers, [question.id]: value });
    setStep((s) => s + 1);
  };

  const reset = () => {
    setAnswers({});
    setStep(0);
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
            30초 · 답변은 신청하실 때만 함께 전달됩니다
          </p>
        </div>

        <div className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
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

                {/* 금액은 적지 않는다 — 구성까지만 말하고 나머지는 소개서로 보낸다 */}
                <div className="mt-6 rounded-2xl border border-gold/30 bg-gold/[0.07] p-5 sm:p-6">
                  <p className="text-xs text-white/50">필요한 구성</p>
                  <p className="mt-2 text-lg font-bold text-gold">
                    {result.plan.label}
                  </p>
                  <p className="mt-1 text-sm text-white/60">
                    {result.plan.composition}
                  </p>
                </div>

                <ul className="mt-6 space-y-2.5">
                  {result.notes.map((n) => (
                    <li
                      key={n}
                      className="flex gap-2.5 text-[0.8125rem] leading-[1.8] text-white/65"
                    >
                      <span
                        aria-hidden
                        className="mt-2 size-1 shrink-0 rounded-full bg-gold"
                      />
                      {n}
                    </li>
                  ))}
                </ul>

                {result.caveat && (
                  <p className="mt-5 rounded-xl border border-white/12 px-4 py-3 text-xs leading-[1.7] text-white/50">
                    {result.caveat}
                  </p>
                )}

                <Link
                  href="#apply"
                  className="mt-7 block rounded-full bg-white px-6 py-3.5 text-center text-sm font-bold text-ink transition-colors duration-200 hover:bg-white/85"
                >
                  이 구성으로 소개서 받기
                </Link>
                <p className="mt-3 text-center text-xs text-white/40">
                  구성·편수별 금액은 소개서로 보내드립니다
                </p>

                <button
                  type="button"
                  onClick={reset}
                  className="mt-5 block w-full text-center text-xs text-white/40 underline underline-offset-2 hover:text-white"
                >
                  다시 진단하기
                </button>
              </>
            )
          )}
        </div>
      </div>
    </section>
  );
}
