import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import localFont from "next/font/local";
import { ORG, SERVICE } from "@/lib/constants";
import {
  JsonLd,
  organization,
  website,
} from "@/components/seo/structured-data";
import { ChannelTalk } from "@/components/channel-talk";
import "./globals.css";

// 라틴 — hgrs.io 실측: DM Sans (400/500/600/700). Inter 아님.
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

// 한글 — hgrs.io 본문 서체. Pretendard 기반 재설계, SIL OFL
const pyeojin = localFont({
  variable: "--font-pyeojin",
  display: "swap",
  src: [
    {
      path: "./fonts/PyeojinGothic-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/PyeojinGothic-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/PyeojinGothic-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(SERVICE.url),
  title: {
    default: `${ORG.name} — 브랜드 SNS 채널과 구매 전환 숏폼`,
    template: `%s | 해그로시`,
  },
  alternates: { canonical: "/" },
  description: ORG.description,
  keywords: [
    "SNS 채널 운영",
    "브랜드 컨텐츠",
    "유튜브 채널 기획",
    "숏폼 제작",
    "퍼포먼스 마케팅",
    "컨텐츠 그로스",
    "해그로시",
  ],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: ORG.name,
    url: SERVICE.url,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${pyeojin.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper text-ink">
        {/* 사이트 전역 구조화 데이터 — 생성형 검색이 회사를 식별하는 근거 */}
        <JsonLd data={organization} />
        <JsonLd data={website} />
        {children}
        {/* 전 페이지 상담 위젯. pluginKey 미설정 시 렌더되지 않는다 (F11) */}
        <ChannelTalk />
      </body>
    </html>
  );
}
