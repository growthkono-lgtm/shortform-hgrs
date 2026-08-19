"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { formatKRW, PLAN_FAMILY, POLICY } from "@/lib/constants";
import { DIAGNOSIS } from "@/lib/diagnosis";
import { useDiagnosis } from "./diagnosis-context";

/**
 * 플랜 진단 — 신청 폼 바로 앞.
 *
 * 가격표를 화면에서 내렸으므로(2026-08-10) 이 섹션이 "무엇이 얼마인지"를 잡아 주는
 * 유일한 자리다. 질문 다섯 개가 곧 제안서다 — 답을 고르는 동안
 * "이 사람들은 뭘 보는지"가 읽혀야 한다.
 *
 * 결과 박스는 **구성 이름 + 설명 + 금액**까지 이 안에서 끝낸다.
 * 가격을 랜딩에서 내린 건 무차별 노출을 막으려는 것이지, 진단을 끝낸 사람에게
 * 숨기려는 게 아니다. 다른 편수 구성과 상세 안내만 소개서로 넘긴다.
 * 상담·문의 유도 장치는 두지 않는다 — 다음 행동은 신청 폼 하나뿐이다.
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
            지금 소재를 갈아야 할 때인지
            <br />
            <strong className="font-bold">1분이면 판별됩니다</strong>
          </h2>
          {/* 2026-08-19 사장님 지시: 접수 21건 중 현황 체크를 마치고 온 건이
              거의 없다("현황 체크 로그 없음"). 문구가 "체크/진단"으로 읽혀
              숙제처럼 느껴진다고 보고, 제목을 판별 결과 중심으로 바꾸고
              문항 수·소요 시간을 뱃지로, 완료 시 받는 것(편수·구성·예상
              금액)을 첫 문단으로 끌어올렸다. 로직·문항·판정은 그대로다. */}
          <p className="mt-4 inline-block rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5 text-xs font-bold tracking-wide text-gold">
            5문항 · 약 1분
          </p>
          {/* 2026-08-13 사장님 지시: "30초 · 답변은…" 안내 문구를 빼고,
              AI 제작 가능 여부와 단가 확인 경로를 문단으로 나눠 덧붙였다.
              단가를 페이지에 박지 않는 이유는 브랜드마다 소스 보유 상태가
              달라 확정가가 상담 단계에서만 나오기 때문이다. */}
          <div className="mt-5 flex max-w-lg flex-col gap-4 text-[0.9375rem] leading-[1.8] text-white/60 sm:text-base">
            <p>
              다섯 질문에 답하면 지금 필요한 편수·구성과 예상 금액이 그
              자리에서 나옵니다. 소스컷을 인플루언서 시딩으로 새로 확보해야
              하는 상황인지, 보유한 소스만으로 충분한지도 여기서 갈립니다.
            </p>
            <p>
              기획과 AI만으로도 제작은 가능합니다. 다만 광고 매출 성과는 명확한
              가이드라인과 필요한 소스컷을 토대로 기획이 함께 들어가야 결과로
              증명됩니다.
            </p>
            <p>
              세부 확정 단가는 신청 후 상담 단계(메일)에서 확인해 주세요.
            </p>
          </div>
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
                {/* "OO 국면" 같은 헤드라인은 붙이지 않는다 — 지어낸 문장처럼 읽힌다.
                    결과는 구성·설명·금액과 답변에서 나온 근거만으로 말한다 */}
                <p className="font-display mt-6 text-xs tracking-[0.14em] text-white/40 uppercase">
                  Result
                </p>
                {/* 지목한 구성은 이름만으로는 안 읽힌다 — 무엇을 하는 구성인지와 금액까지 이 박스에서 끝낸다.
                    가격표를 화면에서 내린 건 "무차별 노출"을 막으려는 것이지,
                    진단을 끝낸 사람에게 금액을 숨기려는 게 아니다. */}
                <div className="mt-6 rounded-2xl border border-gold/30 bg-gold/[0.07] p-5 sm:p-6">
                  <p className="text-xs text-white/50">필요한 구성</p>
                  <p className="mt-2 text-lg font-bold text-gold">
                    {PLAN_FAMILY[result.plan.code].label} · {result.plan.label}
                  </p>
                  <p className="mt-1 text-sm text-white/60">
                    {result.plan.composition}
                  </p>

                  {/* 2026-08-19 constants.ts 단가 재설계: 멀티 플랜의
                      shortsPrice·seedingPrice 를 삭제했다. 인원으로 나누면
                      인플루언서 리워드가 역산되기 때문이다. 이제 총액 하나만
                      보여준다 — 구성 내역은 바로 위 composition 줄이 이미
                      말하고 있어 따로 쪼갤 필요가 없다. */}
                  <div className="mt-5 border-t border-white/10 pt-4">
                    <p className="stat-figure text-3xl">
                      {formatKRW(result.plan.betaPrice)}
                    </p>
                    {result.plan.code === "shorts_only" ? (
                      <p className="mt-2 text-xs text-white/50">
                        전환 숏폼 {result.plan.shortsCount}편 · 편당{" "}
                        {formatKRW(
                          Math.round(
                            result.plan.betaPrice / result.plan.shortsCount,
                          ),
                        )}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs leading-[1.7] text-white/50">
                        {PLAN_FAMILY.full.scope}
                      </p>
                    )}
                    <p className="mt-2 text-[0.6875rem] text-white/35">
                      {POLICY.revisionOnce}
                    </p>
                  </div>
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
                  플랜 안내 바로 받기
                </Link>

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
