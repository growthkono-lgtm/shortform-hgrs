"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Section, SectionHeading } from "@/components/ui/section";
import { Field, SubmitError } from "@/components/auth/field";
import { cn } from "@/lib/cn";
import { POLICY } from "@/lib/constants";
import { INQUIRY_CONSENTS, CONSENT_VERSION } from "@/lib/consents";
import { submitInquiry, type InquiryState } from "@/app/inquiry/actions";
import { useDiagnosis } from "./diagnosis-context";

const INITIAL: InquiryState = { ok: false, error: null };

const INTERESTS = [
  { value: "shorts_only", label: "숏폼 기획제작만" },
  { value: "full", label: "숏폼 + 인플루언서 시딩" },
  { value: "unsure", label: "추천받고 싶어요" },
];

const VOLUMES = [
  { value: "v1", label: "1편" },
  { value: "v5", label: "5편" },
  { value: "v10", label: "10편" },
  { value: "v20", label: "20편 이상" },
  { value: "unknown", label: "미정" },
];

/**
 * 제어형 라디오 — 진단에서 고른 값이 그대로 눌려 있어야 한다.
 * defaultChecked 로 두면 진단을 뒤늦게 마쳤을 때 폼이 이미 마운트돼 있어 반영되지 않는다.
 */
function Radios({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {options.map((o) => (
        <label
          key={o.value}
          className="cursor-pointer rounded-full border border-line bg-paper px-4 py-2.5 text-sm transition-colors duration-200 hover:border-ink/40 has-checked:border-ink has-checked:bg-ink has-checked:text-paper"
        >
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="sr-only"
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}

/**
 * 신청 — 랜딩의 유일한 전환 경로.
 *
 * 2026-08-10 가격표를 화면에서 내렸다. 편수 단가를 먼저 걸면 "한 편에 얼마" 비교로
 * 끌려가고, 브랜드 상황과 무관하게 숫자만 남는다. 대신 여기서 접수를 받고
 * 구성·금액이 담긴 소개서를 이메일로 보낸다.
 *
 * 진단을 마친 방문자는 답변·추천 구성이 hidden 으로 함께 실린다.
 */
export function Apply() {
  const [state, formAction] = useActionState(submitInquiry, INITIAL);
  const { answers, result } = useDiagnosis();

  /**
   * 관심 구성·편수는 **마지막 진단값이 기본**이고, 사용자가 직접 고르면 그 값이 이긴다.
   * 진단을 다시 하면 직접 고른 값은 버린다 — 렌더 중 상태 조정(React 공식 패턴)으로 처리한다.
   * useEffect 로 동기화하면 한 프레임 늦게 반영되고 연쇄 렌더가 난다.
   */
  const fromDiagnosis = result
    ? {
        interest: result.plan.code as string,
        volume:
          result.plan.shortsCount >= 20
            ? "v20"
            : result.plan.shortsCount >= 10
              ? "v10"
              : result.plan.shortsCount >= 5
                ? "v5"
                : "v1",
      }
    : null;

  const [seenResult, setSeenResult] = useState(result);
  const [picked, setPicked] = useState<{ interest?: string; volume?: string }>({});
  if (seenResult !== result) {
    setSeenResult(result);
    setPicked({});
  }

  const interest = picked.interest ?? fromDiagnosis?.interest ?? "unsure";
  const volume = picked.volume ?? fromDiagnosis?.volume ?? "unknown";

  if (state.ok) {
    return (
      <Section eyebrow="Apply" alt id="apply">
        <div className="mx-auto max-w-xl rounded-3xl border border-line bg-paper p-8 text-center sm:p-12">
          <span
            aria-hidden
            className="mx-auto grid size-12 place-items-center rounded-full bg-accent text-xl text-white"
          >
            ✓
          </span>
          <h2 className="mt-6 text-2xl font-bold">신청이 접수되었습니다</h2>
          <p className="mt-4 text-sm leading-[1.9] text-muted">
            입력하신 이메일로 브랜드 상황에 맞는 구성과 금액을 정리해
            보내드립니다. 확인에 영업일 기준 하루 정도 걸립니다.
          </p>
          <p className="mt-6 text-xs leading-[1.7] text-muted">
            메일이 보이지 않으면 스팸함을 확인해 주세요.
          </p>
        </div>
      </Section>
    );
  }

  return (
    <Section eyebrow="Apply" alt id="apply">
      <SectionHeading>
        브랜드 상황에 맞는 구성으로
        <br />
        <strong className="font-bold">플랜을 안내해 드립니다</strong>
      </SectionHeading>

      <p className="mt-6 max-w-2xl text-[0.9375rem] leading-[1.8] text-muted sm:text-lg">
        같은 편수라도 소스 보유 여부와 소재 상태에 따라 구성이 달라집니다. 아래
        정보만 남겨 주시면 편수별 구성과 금액을 정리해 이메일로 보내드립니다.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] lg:gap-14">
        <form action={formAction} className="min-w-0 space-y-5">
          <SubmitError message={state.error} />

          {/* 진단을 마쳤다면 답변과 추천 구성을 그대로 실어 보낸다 */}
          <input
            type="hidden"
            name="diagnosis"
            value={
              result
                ? JSON.stringify({
                    answers,
                    plan: {
                      code: result.plan.code,
                      tier: result.plan.tier,
                      label: result.plan.label,
                      composition: result.plan.composition,
                    },
                    headline: result.headline,
                    blurbs: result.blurbs,
                  })
                : ""
            }
          />

          {result && (
            <p className="rounded-xl border border-accent/40 bg-accent/[0.06] px-4 py-3 text-xs leading-[1.7] text-accent-deep">
              진단 결과(<strong className="font-bold">{result.plan.label}</strong>{" "}
              · {result.plan.composition})가 함께 전달됩니다.
            </p>
          )}

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
              hint="이 주소로 플랜 안내를 보내드립니다"
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
            label="브랜드 · 상세페이지 URL"
            name="brand_url"
            type="url"
            placeholder="https://"
            hint="있으면 브랜드에 맞춘 예시를 담아 드립니다"
          />

          <div>
            <p className="text-sm font-bold">
              관심 구성<span className="ml-1 text-accent">*</span>
            </p>
            <Radios
              name="interest"
              options={INTERESTS}
              value={interest}
              onChange={(v) => setPicked((p) => ({ ...p, interest: v }))}
            />
          </div>

          <div>
            <p className="text-sm font-bold">
              예상 편수<span className="ml-1 text-accent">*</span>
            </p>
            <Radios
              name="volume"
              options={VOLUMES}
              value={volume}
              onChange={(v) => setPicked((p) => ({ ...p, volume: v }))}
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-bold">
              남기실 말
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              placeholder="현재 소재 상황, 일정, 궁금한 점 등 자유롭게 적어 주세요."
              className={cn(
                "mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm",
                "placeholder:text-muted/70 focus:border-ink focus:outline-none",
              )}
            />
          </div>

          {/* 동의 — 전문을 접어서 같은 화면에 둔다 */}
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
                  <span className="flex-1 leading-[1.6]">{consent.label}</span>
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
              <Link href="/privacy" className="underline underline-offset-2">
                개인정보처리방침
              </Link>
            </p>
          </div>

          <button
            type="submit"
            className="w-full rounded-full bg-ink px-6 py-3.5 text-sm font-bold text-paper transition-colors duration-200 hover:bg-ink-soft"
          >
            플랜 안내 받기
          </button>
        </form>

        {/* 신청 전에 알아야 할 것들 — 폼 옆에 붙여 둔다 */}
        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-line bg-paper p-6">
            <p className="eyebrow">플랜 안내에 담기는 것</p>
            <ul className="mt-5 space-y-4 text-sm">
              {[
                ["브랜드 맞춤 구성 제안", "소스 보유 상황과 소재 상태에 맞춘 편수·구성"],
                ["편수별 금액", "싱글·패키지 전 구간 단가와 시딩 단가 분리 표기"],
                ["제작 사례", "같은 카테고리에서 진행한 소재와 성과 흐름"],
              ].map(([title, body]) => (
                <li key={title} className="flex gap-3">
                  <span
                    aria-hidden
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent"
                  />
                  <span>
                    <span className="block font-bold">{title}</span>
                    <span className="mt-0.5 block text-xs leading-[1.7] text-muted">
                      {body}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <ul className="mt-5 space-y-2 text-xs leading-[1.7] text-muted">
            {[POLICY.revisionOnce, POLICY.usagePeriod, POLICY.sourceRequired].map(
              (line) => (
                <li key={line} className="flex gap-2">
                  <span aria-hidden className="text-accent">
                    ·
                  </span>
                  {line}
                </li>
              ),
            )}
          </ul>
        </aside>
      </div>
    </Section>
  );
}
