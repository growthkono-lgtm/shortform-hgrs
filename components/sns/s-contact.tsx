"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, SubmitError } from "@/components/auth/field";
import { CONTACT } from "@/lib/sns-brand";
import { INQUIRY_CONSENTS, CONSENT_VERSION } from "@/lib/consents";
import { submitInquiry, type InquiryState } from "@/app/inquiry/actions";

const INITIAL: InquiryState = { ok: false, error: null };

/**
 * 문의 — 접수는 숏폼 랜딩과 **같은 서버 액션·같은 테이블**을 쓴다.
 *
 * inquiries 테이블의 interest/volume 은 숏폼 편수 기준으로 만들어져 있어
 * 채널 문의에는 맞는 값이 없다. 스키마를 건드리지 않고 고정값(unsure/unknown)을 넣되,
 * **어디서 들어온 문의인지는 diagnosis(jsonb) 스냅샷에 source 로 남긴다.**
 * 화면에 태그를 노출하지 않으면서 어드민에서는 구분된다.
 * (제대로 하려면 inquiries 에 source 컬럼을 추가하는 게 맞다 — 도메인 이전 때 정리)
 */
const SOURCE = JSON.stringify({ source: "sns-brand", page: "/sns-brand" });

export function Contact() {
  const [state, formAction] = useActionState(submitInquiry, INITIAL);

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

              {/* 숏폼 편수 기준 필드 — 채널 문의에는 물어볼 값이 아니라 고정한다 */}
              <input type="hidden" name="interest" value="unsure" />
              <input type="hidden" name="volume" value="unknown" />
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
                className="w-full rounded-full bg-ink px-6 py-4 text-sm font-bold text-paper transition-colors duration-200 hover:bg-ink-soft"
              >
                프로젝트 문의하기
              </button>
            </form>
          </>
        )}

        {/* 갈림길 — 이 페이지가 답이 아닌 방문자를 제자리로 보낸다 */}
        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl bg-line sm:grid-cols-2">
          <Link
            href="/"
            className="group bg-paper-alt px-6 py-7 transition-colors duration-200 hover:bg-paper"
          >
            <p className="eyebrow">Shortform Studio</p>
            <p className="mt-2.5 text-base font-bold text-ink">
              광고 소재가 먼저 필요하신가요?
              <span
                aria-hidden
                className="ml-1.5 inline-block transition-transform duration-200 group-hover:translate-x-1"
              >
                →
              </span>
            </p>
            <p className="mt-2 text-xs leading-[1.7] text-muted">
              인플루언서 시딩부터 구매 전환형 숏폼까지 편수 단위로
            </p>
          </Link>
          <a
            href="https://hgrs.io/partnership"
            target="_blank"
            rel="noreferrer"
            className="group bg-paper-alt px-6 py-7 transition-colors duration-200 hover:bg-paper"
          >
            <p className="eyebrow">IMC Partnership</p>
            <p className="mt-2.5 text-base font-bold text-ink">
              브랜드 전체 프로젝트가 필요하신가요?
              <span
                aria-hidden
                className="ml-1.5 inline-block transition-transform duration-200 group-hover:translate-x-1"
              >
                →
              </span>
            </p>
            <p className="mt-2 text-xs leading-[1.7] text-muted">
              전략·컨텐츠·퍼널·퍼포먼스를 한 팀으로 붙이는 액셀러레이팅
            </p>
          </a>
        </div>
      </div>
    </section>
  );
}
