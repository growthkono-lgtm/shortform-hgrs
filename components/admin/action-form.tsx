"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/cn";
import type { ActionState } from "@/app/admin/actions";

const INITIAL: ActionState = { ok: false, message: null };

function Submit({
  children,
  variant = "solid",
  className,
}: {
  children: React.ReactNode;
  variant?: "solid" | "outline" | "ghost";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "shrink-0 rounded-lg px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-colors disabled:opacity-50",
        variant === "solid" && "bg-ink text-paper hover:bg-ink-soft",
        variant === "outline" && "border border-ink/20 hover:border-ink",
        variant === "ghost" && "text-muted hover:text-ink",
        className,
      )}
    >
      {pending ? "처리 중…" : children}
    </button>
  );
}

/**
 * 어드민 폼 공통 껍데기.
 *
 * 화면마다 useActionState 를 다시 쓰지 않게 한 겹으로 묶었다.
 * 결과 메시지는 폼 바로 아래에 붙는다 — 어느 버튼의 결과인지 헷갈리면 안 된다.
 */
export function ActionForm({
  action,
  children,
  label,
  variant,
  className,
  inline,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children?: React.ReactNode;
  label: string;
  variant?: "solid" | "outline" | "ghost";
  className?: string;
  /** 버튼만 오른쪽에 붙이는 한 줄 폼 */
  inline?: boolean;
}) {
  const [state, formAction] = useActionState(action, INITIAL);

  return (
    <form
      action={formAction}
      className={cn(inline ? "flex items-center gap-2" : "space-y-3", className)}
    >
      {children}
      <Submit variant={variant}>{label}</Submit>
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
