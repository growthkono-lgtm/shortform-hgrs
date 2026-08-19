"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Field, SubmitError } from "@/components/auth/field";
import { CONTACT } from "@/lib/sns-brand";
import { INQUIRY_CONSENTS, CONSENT_VERSION } from "@/lib/consents";
import { submitInquiry, type InquiryState } from "@/app/(site)/inquiry/actions";
import { INQUIRY_PLANS, VOLUMES, needsCount } from "@/lib/inquiry-plans";

const INITIAL: InquiryState = { ok: false, error: null };

/**
 * 문의 — 접수는 숏폼 랜딩과 **같은 서버 액션·같은 테이블**을 쓴다.
 *
 * ── 2026-08-18 개편 ──────────────────────────────────────────────────
 * 그전까지 이 폼은 `interest=unsure`·`volume=unknown` 을 **하드코딩해** 보냈다.
 * 팔 것이 숏폼 편수뿐이던 시절 스키마에 채널 문의를 억지로 끼워 넣은 것이다.
 *
 * 그 결과 08-18 첫 실사 문의가 어드민에 "관심 추천 요청 · 편수 미정" 으로
 * 찍혔다. **물어본 적이 없는데 고른 것처럼 보였다.** 사장님이 통화 전에 보는
 * 화면이 사실과 다르면 첫 마디가 어긋난다.
 *
 * 이제 실제로 묻는다. 선택지는 `lib/inquiry-plans.ts` 한 곳에서만 정의한다.
 * 어디서 들어온 문의인지는 여전히 diagnosis 스냅샷의 source 로 남긴다.
 * (제대로 하려면 inquiries 에 source 컬럼을 추가하는 게 맞다 — 도메인 이전 때 정리)
 */
const SOURCE = JSON.stringify({ source: "sns-brand", page: "/sns-brand" });

export function Contact() {
  const [state, formAction, isPending] = useActionState(submitInquiry, INITIAL);
  /** 이 페이지로 들어온 사람은 채널 운영을 보러 온 것이다. 그걸 기본으로 둔다 */
  const [interest, setInterest] = useState<string>("sns_turnkey");
  const [volume, setVolume] = useState<string>("unknown");
  const askCount = needsCount(interest);

  return (
    <section
      id="contact"
      className="scroll-mt-16 bg-paper-alt px-5 py-20 sm:px-8 md:py-28"
    >
      <div className="mx-auto w-full max-w-6xl">
        <p className="eyebrow">Contact</p>

        {state.ok ? (
          <div className="mt-8 rounded-3xl border border-line bg-paper py-16 text-center">
            <h2 className="text-2xl font-bold">문의가 접수되었습니다</h2>
            <p className="mt-5 text-sm leading-[1.9] text-muted">
              보내주신 채널 현황을 보고, 지금 필요한 작업 범위를 정리해
              회신드립니다. 영업일 기준 하루 정도 걸립니다.
            </p>
          </div>
        ) : (
          <>
            <h2 className="mt-5 max-w-3xl text-[1.5rem] leading-[1.35] font-bold sm:text-[2.125rem] sm:leading-[1.3] lg:text-[2.75rem]">
              다음 프로젝트가 될
              <br />
              <strong className="font-bold">브랜드를 찾습니다</strong>
            </h2>
            <p className="mt-5 max-w-2xl text-[0.9375rem] leading-[1.8] text-muted sm:text-base">
              {CONTACT.lead}
            </p>

            <form action={formAction} className="mt-12 max-w-2xl space-y-5">
              <SubmitError message={state.error} />

              <input type="hidden" name="diagnosis" value={SOURCE} />

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="회사 · 브랜드명"
                  name="company_name"
                  required
                  autoComplete="organization"
                  placeholder="(주)브랜드"
                />
                <Field
                  label="담당자 이름"
                  name="contact_name"
                  required
                  autoComplete="name"
                />
              </div>

              {/* 직함 — 자유 입력. 선택지를 만들면 전부 "기타" 로 몰린다 (2026-08-19) */}
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="직함"
                  name="contact_title"
                  autoComplete="organization-title"
                  placeholder="대표 · 마케팅 이사 · 팀장 …"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="이메일"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@company.com"
                  hint="이 주소로 회신드립니다"
                />
                <Field
                  label="연락처"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="010-0000-0000"
                />
              </div>

              <Field
                label="브랜드 · 운영 중인 채널 URL"
                name="brand_url"
                type="url"
                placeholder="https://"
                hint="유튜브·인스타그램·자사몰 중 아무거나 한 곳이면 됩니다"
              />

              <div>
                <p className="text-sm font-bold">
                  어떤 프로젝트를 찾으시나요
                  <span className="ml-1 text-accent">*</span>
                </p>
                <div className="mt-2 grid gap-2">
                  {INQUIRY_PLANS.map((p) => (
                    <label
                      key={p.value}
                      className="cursor-pointer rounded-2xl border border-line bg-paper px-4 py-3.5 transition-colors duration-200 hover:border-ink/40 has-checked:border-ink has-checked:bg-ink has-checked:text-paper"
                    >
                      <input
                        type="radio"
                        name="interest"
                        value={p.value}
                        checked={interest === p.value}
                        onChange={() => setInterest(p.value)}
                        className="sr-only"
                      />
                      <span className="block text-sm font-bold">{p.label}</span>
                      <span className="mt-1 block text-xs leading-[1.7] opacity-70">
                        {p.desc}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 편수는 숏폼 두 플랜에서만 묻는다. 채널 턴키는 편수 단위가 아니다 */}
              {askCount ? (
                <div>
                  <p className="text-sm font-bold">
                    예상 편수<span className="ml-1 text-accent">*</span>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {VOLUMES.map((v) => (
                      <label
                        key={v.value}
                        className="cursor-pointer rounded-full border border-line bg-paper px-4 py-2.5 text-sm transition-colors duration-200 hover:border-ink/40 has-checked:border-ink has-checked:bg-ink has-checked:text-paper"
                      >
                        <input
                          type="radio"
                          name="volume"
                          value={v.value}
                          checked={volume === v.value}
                          onChange={() => setVolume(v.value)}
                          className="sr-only"
                        />
                        {v.label}
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <input type="hidden" name="volume" value="unknown" />
              )}

              <div>
                <label htmlFor="message" className="block text-sm font-bold">
                  채널 현황과 목표
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  placeholder="지금 어떤 채널을 어떻게 운영하고 계신지, 6개월 뒤 무엇이 달라져 있어야 하는지 적어 주세요."
                  className="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm placeholder:text-muted/70 focus:border-ink focus:outline-none"
                />
              </div>

              <div className="space-y-3 rounded-2xl border border-line bg-paper p-5">
                {INQUIRY_CONSENTS.map((consent) => (
                  <details
                    key={consent.kind}
                    className="rounded-xl border border-line bg-paper-alt"
                  >
                    <summary className="flex cursor-pointer list-none items-start gap-3 p-4 text-sm">
                      <input
                        type="checkbox"
                        name={`consent_${consent.kind}`}
                        required={consent.required}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5 size-4 shrink-0 accent-[var(--color-ink)]"
                      />
                      <span className="flex-1 leading-[1.6]">
                        {consent.label}
                      </span>
                      <span className="mt-0.5 shrink-0 text-xs text-muted underline underline-offset-2">
                        전문
                      </span>
                    </summary>
                    <pre className="max-h-48 overflow-y-auto border-t border-line px-4 py-4 text-[0.6875rem] leading-[1.9] break-words whitespace-pre-wrap text-muted">
                      {consent.body}
                    </pre>
                  </details>
                ))}
                <p className="text-[0.6875rem] leading-[1.7] text-muted">
                  동의 시각과 문안 버전({CONSENT_VERSION})이 함께 기록됩니다.{" "}
                  <Link
                    href="/privacy"
                    className="underline underline-offset-2"
                  >
                    개인정보처리방침
                  </Link>
                </p>
              </div>

              <button
                type="submit"
            disabled={isPending}
                className="w-full rounded-full bg-ink px-6 py-4 text-sm font-bold text-paper transition-colors duration-200 hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "보내는 중…" : "프로젝트 문의하기"}
              </button>
            </form>
          </>
        )}

        {/* 갈림길 — 광고 소재만 필요한 방문자를 숏폼 쪽으로 보낸다.
            IMC 파트너십(프레이머) 링크는 뺐다 — 그 사이트를 더 쓰지 않는다 */}
        <Link
          href="/shortform"
          className="group mt-16 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-paper px-6 py-6 transition-colors duration-200 hover:border-ink/25"
        >
          <span className="min-w-0">
            <span className="eyebrow block">Shortform Studio</span>
            <span className="mt-2 block text-base font-bold text-ink">
              광고 소재가 먼저 필요하신가요?
            </span>
            <span className="mt-1.5 block text-xs leading-[1.7] text-muted">
              인플루언서 시딩부터 구매 전환형 숏폼까지 편수 단위로
            </span>
          </span>
          <span
            aria-hidden
            className="shrink-0 text-sm font-bold text-ink transition-transform duration-200 group-hover:translate-x-1"
          >
            →
          </span>
        </Link>
      </div>
    </section>
  );
}
