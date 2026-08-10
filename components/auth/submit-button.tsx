"use client";

import { useFormStatus } from "react-dom";

/**
 * name/value를 받는 이유 — 가입 폼은 한 <form>에서 단계를 넘긴다.
 * 어느 버튼으로 제출했는지가 `intent`로 서버 액션에 실려야 다음 단계를 안다.
 */
export function SubmitButton({
  children,
  name,
  value,
}: {
  children: React.ReactNode;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      className="w-full rounded-full bg-ink px-6 py-3.5 text-sm font-bold text-paper transition-colors duration-200 hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "처리 중…" : children}
    </button>
  );
}
