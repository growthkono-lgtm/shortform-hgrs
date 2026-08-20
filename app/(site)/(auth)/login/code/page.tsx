import type { Metadata } from "next";
import { Suspense } from "react";
import { CodeLoginForm } from "./code-form";

/**
 * 로그인 코드 확인 — 메일로 받은 코드를 입력하는 화면.
 *
 * robots.ts 의 disallow 만으로는 색인 금지가 보장되지 않는다(크롤 차단과
 * 색인 금지는 다른 신호다). 결제·온보딩 화면과 같이 페이지에도 명시한다.
 */
export const metadata: Metadata = {
  title: "로그인 코드 확인",
  robots: { index: false, follow: false },
};

export default function CodeLoginPage() {
  return (
    <Suspense>
      <CodeLoginForm />
    </Suspense>
  );
}
