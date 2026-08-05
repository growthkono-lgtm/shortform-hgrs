import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function CheckoutFailPage({
  searchParams,
}: PageProps<"/checkout/fail">) {
  const { message, code } = await searchParams;

  return (
    <div className="mx-auto w-full max-w-lg px-5 py-20 text-center sm:px-8">
      <p className="eyebrow">Payment Failed</p>
      <h1 className="mt-5 text-3xl font-bold">결제가 완료되지 않았습니다</h1>

      <p className="mt-5 text-sm leading-[1.8] text-muted">
        {typeof message === "string" && message
          ? message
          : "결제 처리 중 문제가 발생했습니다. 다시 시도해 주세요."}
      </p>

      {typeof code === "string" && code && (
        <p className="mt-3 font-mono text-xs text-muted">코드: {code}</p>
      )}

      <p className="mt-8 rounded-xl border border-line bg-paper-alt px-4 py-3 text-xs leading-[1.7] text-muted">
        결제가 취소된 경우 금액은 청구되지 않습니다. 같은 문제가 반복되면 채널톡으로
        문의해 주세요.
      </p>

      <div className="mt-10 flex flex-col gap-3">
        <Link
          href="/#pricing"
          className="rounded-full bg-ink px-6 py-3.5 text-sm font-bold text-paper"
        >
          플랜 다시 고르기
        </Link>
        <Link href="/app" className="text-sm text-muted hover:text-ink">
          내 프로젝트로
        </Link>
      </div>
    </div>
  );
}
