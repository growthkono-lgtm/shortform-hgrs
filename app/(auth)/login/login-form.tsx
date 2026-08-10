"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { startSignIn, type AuthState } from "@/app/auth/actions";
import { Field, SubmitError } from "@/components/auth/field";
import { SubmitButton } from "@/components/auth/submit-button";

const initialState: AuthState = { error: null };

/** 로그인도 비밀번호 없이 인증번호로 한다 — 가입 때 비밀번호를 만들지 않았다 */
export function LoginForm() {
  const [state, formAction] = useActionState(startSignIn, initialState);
  const next = useSearchParams().get("next") ?? "/app";

  return (
    <>
      <p className="eyebrow">Sign In</p>
      <h1 className="mt-4 text-3xl font-bold">로그인</h1>
      <p className="mt-3 text-sm leading-[1.7] text-muted">
        가입하신 회사 이메일로 인증번호를 보내드립니다.
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
        />

        <SubmitButton>인증번호 받기</SubmitButton>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        아직 계정이 없으신가요?{" "}
        <Link href="/signup" className="font-bold text-ink underline underline-offset-2">
          가입하기
        </Link>
      </p>
    </>
  );
}
