import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyForm } from "./verify-form";

/** 인증번호 화면은 검색에 걸릴 이유가 없다 */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
