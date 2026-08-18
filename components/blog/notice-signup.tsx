"use client";

import { useActionState } from "react";

import { subscribe, type SubscribeState } from "@/app/(site)/blog/subscribe";

/**
 * 신규 콘텐츠 알림 신청 폼.
 *
 * 뉴스레터 폼이 아니다. 약속하는 게 다르니 문구도 달라야 한다 —
 * "주 1회 뉴스레터" 가 아니라 "새 글이 올라갈 때 한 통".
 * 지키지 못할 주기를 약속하면 첫 달에 신뢰를 잃는다.
 */
export function NoticeSignup({ source }: { source: string }) {
  const [state, action, pending] = useActionState<SubscribeState, FormData>(
    subscribe,
    null,
  );

  return (
    <div className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-6 sm:p-8">
      <h2 className="text-base font-bold">신규 컨텐츠 알림 받기</h2>
      <p className="mt-2 max-w-md text-[0.8125rem] leading-[1.8] text-ink/55">
        새 글이 올라갈 때 한 통 보내 드립니다. 정기 발송물은 따로 만들지 않고,
        밤에는 보내지 않습니다.
      </p>

      {state?.ok ? (
        <p className="mt-5 text-sm font-medium text-emerald-700">
          {state.message}
        </p>
      ) : (
        <form action={action} className="mt-5 flex flex-wrap gap-2">
          <input type="hidden" name="source" value={source} />
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="name@company.com"
            className="min-w-0 flex-1 rounded-full border border-ink/15 bg-paper px-5 py-2.5 text-sm focus:border-ink focus:outline-none"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-paper disabled:opacity-50"
          >
            {pending ? "신청 중" : "알림 받기"}
          </button>
        </form>
      )}

      {state && !state.ok && (
        <p className="mt-2.5 text-xs text-rose-700">{state.message}</p>
      )}
    </div>
  );
}
