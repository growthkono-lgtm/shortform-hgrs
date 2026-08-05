"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp, type AuthState } from "@/app/auth/actions";
import { Field, SubmitError } from "@/components/auth/field";
import { SubmitButton } from "@/components/auth/submit-button";

const initialState: AuthState = { error: null };

export default function SignUpPage() {
  const [state, formAction] = useActionState(signUp, initialState);

  return (
    <>
      <p className="eyebrow">Sign Up</p>
      <h1 className="mt-4 text-3xl font-bold">무료 가입</h1>
      <p className="mt-3 text-sm leading-[1.7] text-muted">
        가입은 무료입니다. 구독료 없이, 결제하신 프로젝트만 진행됩니다.
      </p>

      <form action={formAction} className="mt-10 space-y-5">
        <SubmitError message={state.error} />

        <Field
          label="이메일"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@company.com"
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
          label="회사명"
          name="company_name"
          required
          autoComplete="organization"
          placeholder="(주)브랜드"
        />
        <Field
          label="담당자명"
          name="contact_name"
          required
          autoComplete="name"
        />
        <Field
          label="연락처"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="010-0000-0000"
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

        <SubmitButton>가입하고 시작하기</SubmitButton>

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
