"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/cn";
import type { WorkActionState } from "@/app/work/actions";

const INITIAL: WorkActionState = { ok: false, message: null };

function Submit({
  children,
  variant = "solid",
}: {
  children: React.ReactNode;
  variant?: "solid" | "outline";
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "shrink-0 rounded-lg px-4 py-2.5 text-sm font-bold whitespace-nowrap transition-colors disabled:opacity-50",
        variant === "solid" && "bg-ink text-white hover:bg-ink-soft",
        variant === "outline" &&
          "border border-line bg-paper text-ink hover:border-ink",
      )}
    >
      {pending ? "처리 중…" : children}
    </button>
  );
}

/**
 * 작업자 화면 폼 공통 껍데기.
 *
 * 어드민의 ActionForm 과 모양이 비슷하지만 **일부러 따로 둔다.**
 * 그쪽은 `@/app/admin/actions` 의 타입과 브랜드 색 토큰을 물고 있어서,
 * 재사용하면 작업자 표면이 우리 쪽 코드에 다시 붙는다.
 */
export function WorkForm({
  action,
  children,
  label,
  variant,
  className,
  inline,
  secondary,
}: {
  action: (
    prev: WorkActionState,
    formData: FormData,
  ) => Promise<WorkActionState>;
  children?: React.ReactNode;
  label: string;
  variant?: "solid" | "outline";
  className?: string;
  inline?: boolean;
  /**
   * 같은 입력을 다른 액션으로 보내는 두 번째 버튼 (예: 임시 저장).
   *
   * 별도 폼으로 빼지 않는 이유 — 긴 기획 텍스트를 두 폼이 나눠 가질 수 없다.
   * `form` 속성으로 바깥 입력을 끌어오는 방법도 한 폼만 가리킬 수 있어서 안 된다.
   */
  secondary?: { action: (formData: FormData) => Promise<void>; label: string };
}) {
  const [state, formAction] = useActionState(action, INITIAL);

  return (
    <form
      action={formAction}
      className={cn(inline ? "flex items-center gap-2" : "space-y-3", className)}
    >
      {children}
      <div className="flex flex-wrap items-center gap-2">
        <Submit variant={variant}>{label}</Submit>
        {secondary && (
          <button
            type="submit"
            formAction={secondary.action}
            className="shrink-0 rounded-lg border border-line bg-paper px-4 py-2.5 text-sm font-bold text-ink transition-colors hover:border-ink"
          >
            {secondary.label}
          </button>
        )}
      </div>
      {state.message && (
        <p
          className={cn(
            "text-xs leading-[1.6]",
            inline && "w-full",
            state.ok ? "text-accent-deep" : "text-red-600",
          )}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
