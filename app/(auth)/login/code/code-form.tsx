"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { codeLogin, type SignUpState } from "@/app/auth/actions";
import { Field, SubmitError } from "@/components/auth/field";
import { SubmitButton } from "@/components/auth/submit-button";

const INITIAL: SignUpState = { step: 1, email: "", error: null, notice: null };

/** 인증번호 로그인 — 비밀번호를 잊었거나, 비밀번호 없이 만들어진 계정의 입구 */
export function CodeLoginForm() {
  const [state, formAction] = useActionState(codeLogin, INITIAL);
  const next = useSearchParams().get("next") ?? "/app";

  return (
    <>
      <p className="eyebrow">Sign In</p>
      <h1 className="mt-4 text-3xl font-bold">인증번호로 로그인</h1>
      <p className="mt-3 text-sm leading-[1.7] text-muted">
        가입하신 이메일로 6자리 인증번호를 보내드립니다.
      </p>

      <form action={formAction} className="mt-10 space-y-5">
        <SubmitError message={state.error} />
        {state.notice && (
          <p className="rounded-xl border border-line bg-paper-alt px-4 py-3 text-sm text-muted">
            {state.notice}
          </p>
        )}
        <input type="hidden" name="next" value={next} />

        {state.step === 1 ? (
          <>
            <Field
              label="이메일"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@company.com"
            />
            <SubmitButton name="intent" value="send">
              인증번호 받기
            </SubmitButton>
            <button
              type="submit"
              name="intent"
              value="have_code"
              className="block w-full text-center text-xs text-muted underline underline-offset-2 hover:text-ink"
            >
              이미 인증번호를 받았어요
            </button>
          </>
        ) : (
          <>
            <p className="text-sm leading-[1.8] text-muted">
              <span className="font-bold text-ink">{state.email}</span> 으로 6자리
              인증번호를 보냈습니다.
            </p>
            <div>
              <label htmlFor="token" className="block text-sm font-bold">
                인증번호
              </label>
              <input
                id="token"
                name="token"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                autoFocus
                placeholder="000000"
                className="stat-figure mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 text-center text-2xl tracking-[0.4em] placeholder:text-muted/40 focus:border-ink focus:outline-none"
              />
            </div>
            <SubmitButton name="intent" value="verify">
              로그인
            </SubmitButton>
            <button
              type="submit"
              name="intent"
              value="resend"
              className="block w-full text-center text-xs text-muted underline underline-offset-2 hover:text-ink"
            >
              인증번호 다시 받기
            </button>
          </>
        )}
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        <Link href="/login" className="font-bold text-ink underline underline-offset-2">
          비밀번호로 로그인
        </Link>
      </p>
    </>
  );
}
