import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

/**
 * 로그인 — 이미 결제한 브랜드가 진행 현황을 보러 오는 입구.
 *
 * robots.ts 의 disallow 만으로는 색인 금지가 보장되지 않는다(크롤 차단과
 * 색인 금지는 다른 신호다). 결제·온보딩 화면과 같이 페이지에도 명시한다.
 */
export const metadata: Metadata = {
  title: "로그인",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
