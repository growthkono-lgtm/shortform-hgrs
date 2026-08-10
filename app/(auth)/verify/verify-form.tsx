"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { verifyCode, type AuthState } from "@/app/auth/actions";
import { SubmitError } from "@/components/auth/field";
import { SubmitButton } from "@/components/auth/submit-button";

const initialState: AuthState = { error: null };

/** 가입·로그인 공통 인증번호 입력 화면 */
export function VerifyForm() {
  const [state, formAction] = useActionState(verifyCode, initialState);
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const next = params.get("next") ?? "/app";

  return (
    <>
      <p className="eyebrow">Verify</p>
      <h1 className="mt-4 text-3xl font-bold">인증번호를 입력해 주세요</h1>
      <p className="mt-4 text-sm leading-[1.8] text-muted">
        {email ? (
          <>
            <span className="font-bold text-ink">{email}</span> 으로 6자리
            인증번호를 보냈습니다.
          </>
        ) : (
          "입력하신 주소로 6자리 인증번호를 보냈습니다."
        )}
      </p>

      <form action={formAction} className="mt-8 space-y-5">
        <SubmitError message={state.error} />
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="next" value={next} />

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
            placeholder="000000"
            className="stat-figure mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 text-center text-2xl tracking-[0.4em] placeholder:text-muted/40 focus:border-ink focus:outline-none"
          />
        </div>

        <SubmitButton>인증하고 계속하기</SubmitButton>
      </form>

      <p className="mt-6 rounded-xl border border-line bg-paper-alt px-4 py-3 text-xs leading-[1.7] text-muted">
        메일이 보이지 않으면 스팸함을 확인해 주세요. 인증번호는 발송 후 1시간
        동안 유효합니다.
      </p>

      <p className="mt-8 text-center text-sm text-muted">
        번호가 오지 않았나요?{" "}
        <Link href="/login" className="font-bold text-ink underline underline-offset-2">
          다시 받기
        </Link>
      </p>
    </>
  );
}
