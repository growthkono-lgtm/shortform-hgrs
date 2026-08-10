"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { startSignUp, type AuthState } from "@/app/auth/actions";
import { Field, SubmitError } from "@/components/auth/field";
import { SubmitButton } from "@/components/auth/submit-button";

const initialState: AuthState = { error: null };

/**
 * 가입 = 플랜을 고르고 결제로 넘어가는 길목이다.
 * 비밀번호는 받지 않는다 — 회사 이메일로 인증번호를 받아 끝낸다.
 * next에는 결제 화면 경로가 실려 온다 (예: /checkout/shorts_only-10).
 */
export function SignUpForm() {
  const [state, formAction] = useActionState(startSignUp, initialState);
  const next = useSearchParams().get("next") ?? "/app";

  return (
    <>
      <p className="eyebrow">Sign Up</p>
      <h1 className="mt-4 text-3xl font-bold">가입하고 시작하기</h1>
      <p className="mt-3 text-sm leading-[1.7] text-muted">
        회사 이메일로 인증번호를 보내드립니다. 비밀번호는 만들지 않습니다.
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

        <label className="flex cursor-pointer items-start gap-3 text-sm text-muted">
          <input
            type="checkbox"
            name="marketing_opt_in"
            className="mt-0.5 size-4 shrink-0 accent-[var(--color-ink)]"
          />
          <span>
            숏폼·퍼포먼스 인사이트 뉴스레터 수신에 동의합니다.{" "}
            <span className="text-muted/80">(선택)</span>
          </span>
        </label>

        <SubmitButton>인증번호 받기</SubmitButton>

        <p className="text-xs leading-[1.7] text-muted">
          가입 시{" "}
          <Link href="/terms" className="underline underline-offset-2">
            이용약관
          </Link>
          과{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            개인정보처리방침
          </Link>
          에 동의하는 것으로 간주됩니다.
        </p>
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
