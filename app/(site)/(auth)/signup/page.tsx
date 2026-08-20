import type { Metadata } from "next";
import { Suspense } from "react";
import { SignUpForm } from "./signup-form";

/**
 * 회원가입 — 결제 길목에서만 필요한 계정 생성 화면.
 *
 * robots.ts 의 disallow 만으로는 색인 금지가 보장되지 않는다(크롤 차단과
 * 색인 금지는 다른 신호다). 결제·온보딩 화면과 같이 페이지에도 명시한다.
 */
export const metadata: Metadata = {
  title: "회원가입",
  robots: { index: false, follow: false },
};

/** 폼이 next 쿼리(결제로 돌아갈 경로)를 읽어야 해서 Suspense로 감싼다 */
export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}
