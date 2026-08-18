import type { Metadata } from "next";
import { WORK_APP } from "@/lib/work";

/**
 * 작업자 대시보드 — 브랜드가 없는 표면.
 *
 * 루트 레이아웃의 metadata 가 해그로시로 채워져 있으므로 **여기서 전부 덮어쓴다.**
 * 하나라도 빠뜨리면 상속돼서 페이지 소스에 남는다 — 특히 keywords, openGraph.siteName,
 * metadataBase(절대 URL 이 hgrs.io 로 찍힌다), title.template("%s | 해그로시").
 */
export const metadata: Metadata = {
  metadataBase: null,
  title: { default: WORK_APP.name, template: `%s | ${WORK_APP.short}` },
  description: "배정된 작업을 확인하고 결과물을 제출합니다.",
  keywords: [],
  alternates: { canonical: null },
  openGraph: { siteName: WORK_APP.name, title: WORK_APP.name, url: null },
  twitter: { card: "summary" },
  // 검색에 걸리면 분리한 의미가 없다
  robots: { index: false, follow: false, nocache: true },
  icons: { icon: "/work-icon.svg" },
};

export default function WorkRootLayout({ children }: LayoutProps<"/work">) {
  return <div className="flex min-h-dvh flex-col bg-paper-alt text-ink">{children}</div>;
}
