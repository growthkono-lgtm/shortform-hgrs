"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { signUpStep, type SignUpState } from "@/app/auth/actions";
import { Field, SubmitError } from "@/components/auth/field";
import { SubmitButton } from "@/components/auth/submit-button";
import { CONSENT_LIST, CONSENT_VERSION } from "@/lib/consents";
import { cn } from "@/lib/cn";

// "use server" 파일은 async 함수만 export할 수 있어 초기 상태는 여기 둔다
const INITIAL: SignUpState = { step: 1, email: "", error: null, notice: null };

const STEPS = ["이메일 인증", "정보 입력", "완료"];

function Steps({ current }: { current: number }) {
  return (
    <ol className="mt-8 flex items-center gap-2 text-xs">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = current > n;
        const active = current === n;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "grid size-5 shrink-0 place-items-center rounded-full text-[0.625rem] font-bold",
                active && "bg-ink text-paper",
                done && "bg-accent text-white",
                !active && !done && "bg-paper-alt text-muted",
              )}
            >
              {done ? "✓" : n}
            </span>
            <span className={cn(active ? "font-bold text-ink" : "text-muted")}>
              {label}
            </span>
            {n < STEPS.length && (
              <span aria-hidden className="mx-1 h-px w-4 bg-line" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * 가입 = 플랜을 고르고 결제로 넘어가는 길목이다.
 * 이메일 인증을 먼저 끝내고 나머지를 채운다 — 인증 안 되는 주소로 정보를 다 쓰게 하면
 * 마지막에 되돌려야 한다. next에는 결제 화면 경로가 실려 온다.
 */
export function SignUpForm() {
  const [state, formAction] = useActionState(signUpStep, INITIAL);
  const next = useSearchParams().get("next") ?? "/app";

  return (
    <>
      <p className="eyebrow">Sign Up</p>
      <h1 className="mt-4 text-3xl font-bold">가입하고 시작하기</h1>
      <p className="mt-3 text-sm leading-[1.7] text-muted">
        이메일 인증을 먼저 마친 뒤 정보를 입력하시면 가입이 완료됩니다.
      </p>

      <Steps current={state.step} />

      <form action={formAction} className="mt-8 space-y-5">
        <SubmitError message={state.error} />
        {state.notice && (
          <p className="rounded-xl border border-line bg-paper-alt px-4 py-3 text-sm text-muted">
            {state.notice}
          </p>
        )}
        <input type="hidden" name="next" value={next} />

        {/* ── 1단계: 이메일 ── */}
        {state.step === 1 && (
          <>
            <Field
              label="이메일"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@company.com"
              hint="업무용 이메일을 권장합니다. 이 주소로 진행 상황을 안내드립니다"
            />
            <SubmitButton name="intent" value="send">
              인증번호 받기
            </SubmitButton>
          </>
        )}

        {/* ── 2단계: 인증번호 ── */}
        {state.step === 2 && (
          <>
            <p className="text-sm leading-[1.8] text-muted">
              <span className="font-bold text-ink">{state.email}</span> 으로
              6자리 인증번호를 보냈습니다.
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
              인증 확인
            </SubmitButton>

            <div className="flex justify-center gap-5 text-xs text-muted">
              <button
                type="submit"
                name="intent"
                value="resend"
                className="underline underline-offset-2 hover:text-ink"
              >
                인증번호 다시 받기
              </button>
              <button
                type="submit"
                name="intent"
                value="edit_email"
                className="underline underline-offset-2 hover:text-ink"
              >
                이메일 다시 입력
              </button>
            </div>

            <p className="rounded-xl border border-line bg-paper-alt px-4 py-3 text-xs leading-[1.7] text-muted">
              메일이 보이지 않으면 스팸함을 확인해 주세요. 인증번호는 발송 후
              1시간 동안 유효합니다.
            </p>
          </>
        )}

        {/* ── 3단계: 나머지 정보 + 동의 ── */}
        {state.step === 3 && (
          <>
            <p className="flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/[0.06] px-4 py-3 text-sm font-bold text-accent-deep">
              <span
                aria-hidden
                className="grid size-5 shrink-0 place-items-center rounded-full bg-accent text-[0.625rem] text-white"
              >
                ✓
              </span>
              {state.email} 인증 완료
            </p>

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
                    {/* 체크박스 클릭이 summary 토글로 번지지 않게 막는다 */}
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
                동의 시각과 동의하신 문안 버전({CONSENT_VERSION})이 기록됩니다.
                전체 내용은{" "}
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

            <SubmitButton name="intent" value="complete">
              가입 완료하기
            </SubmitButton>
          </>
        )}
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
