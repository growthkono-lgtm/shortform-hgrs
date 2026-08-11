"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, type AuthState } from "@/app/auth/actions";
import { Field, SubmitError } from "@/components/auth/field";
import { SubmitButton } from "@/components/auth/submit-button";

const initialState: AuthState = { error: null };

export function LoginForm() {
  const [state, formAction] = useActionState(signIn, initialState);
  const next = useSearchParams().get("next") ?? "/app";

  return (
    <>
      <p className="eyebrow">Sign In</p>
      <h1 className="mt-4 text-3xl font-bold">로그인</h1>
      <p className="mt-3 text-sm leading-[1.7] text-muted">
        진행 중인 캠페인과 산출물을 확인하실 수 있습니다.
      </p>

      <form action={formAction} className="mt-10 space-y-5">
        <SubmitError message={state.error} />
        <input type="hidden" name="next" value={next} />

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
          autoComplete="current-password"
        />

        <SubmitButton>로그인</SubmitButton>
      </form>

      <p className="mt-5 text-center text-xs text-muted">
        비밀번호가 기억나지 않으시면{" "}
        <Link
          href="/login/code"
          className="underline underline-offset-2 hover:text-ink"
        >
          인증번호로 로그인
        </Link>
      </p>

      <p className="mt-8 text-center text-sm text-muted">
        아직 계정이 없으신가요?{" "}
        <Link
          href="/signup"
          className="font-bold text-ink underline underline-offset-2"
        >
          가입하기
        </Link>
      </p>
    </>
  );
}
