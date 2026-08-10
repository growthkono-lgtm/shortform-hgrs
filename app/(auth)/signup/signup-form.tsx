"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { signUp, type AuthState } from "@/app/auth/actions";
import { Field, SubmitError } from "@/components/auth/field";
import { SubmitButton } from "@/components/auth/submit-button";
import { CONSENT_LIST, CONSENT_VERSION } from "@/lib/consents";

const initialState: AuthState = { error: null };

/**
 * 가입 = 플랜을 고르고 결제로 넘어가는 길목이다.
 * 이메일 + 비밀번호로 우리 DB에 회원을 남긴다(소셜 로그인 없음).
 * next에는 결제 화면 경로가 실려 온다 (예: /checkout/shorts_only-10).
 */
export function SignUpForm() {
  const [state, formAction] = useActionState(signUp, initialState);
  const next = useSearchParams().get("next") ?? "/app";

  return (
    <>
      <p className="eyebrow">Sign Up</p>
      <h1 className="mt-4 text-3xl font-bold">가입하고 시작하기</h1>
      <p className="mt-3 text-sm leading-[1.7] text-muted">
        회사 이메일로 가입합니다. 마지막에 인증번호로 이메일만 한 번 확인합니다.
      </p>

      <form action={formAction} className="mt-10 space-y-5">
        <SubmitError message={state.error} />
        <input type="hidden" name="next" value={next} />

        <Field
          label="회사 이메일"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@company.com"
          hint="개인 메일(gmail·naver 등)은 사용할 수 없습니다"
        />
        <Field
          label="비밀번호"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          hint="8자 이상"
        />
        <Field
          label="비밀번호 확인"
          name="password_confirm"
          type="password"
          required
          autoComplete="new-password"
        />
        <Field
          label="회사명"
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
        <Field
          label="직책"
          name="job_title"
          required
          autoComplete="organization-title"
          placeholder="마케팅 팀장"
        />

        {/* 동의 — 전문을 접어서 같은 화면에 둔다. 링크로 빼면 읽지 않고 넘어간다 */}
        <div className="space-y-3 rounded-2xl border border-line bg-paper-alt p-5">
          {CONSENT_LIST.map((consent) => (
            <details
              key={consent.kind}
              className="rounded-xl border border-line bg-paper"
            >
              <summary className="flex cursor-pointer list-none items-start gap-3 p-4 text-sm">
                {/* 체크박스는 summary 토글과 겹치지 않게 클릭을 따로 받는다 */}
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
              <pre className="max-h-56 overflow-y-auto border-t border-line px-4 py-4 text-[0.6875rem] leading-[1.9] whitespace-pre-wrap text-muted">
                {consent.body}
              </pre>
            </details>
          ))}

          <p className="text-[0.6875rem] leading-[1.7] text-muted">
            동의 시각과 동의하신 문안 버전({CONSENT_VERSION})이 기록됩니다. 전체
            내용은{" "}
            <Link href="/terms" className="underline underline-offset-2">
              이용약관
            </Link>
            ·
            <Link href="/privacy" className="underline underline-offset-2">
              개인정보처리방침
            </Link>
            에서 확인하실 수 있습니다.
          </p>
        </div>

        <SubmitButton>가입하고 인증번호 받기</SubmitButton>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-bold text-ink underline underline-offset-2">
          로그인
        </Link>
      </p>
    </>
  );
}
