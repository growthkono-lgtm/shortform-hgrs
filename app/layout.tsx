import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { SERVICE } from "@/lib/constants";
import { ChannelTalk } from "@/components/channel-talk";
import "./globals.css";

// 라틴 — hgrs.io는 Inter / Inter Display 사용
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// 한글 — hgrs.io 본문 서체. Pretendard 기반 재설계, SIL OFL
const pyeojin = localFont({
  variable: "--font-pyeojin",
  display: "swap",
  src: [
    { path: "./fonts/PyeojinGothic-Light.woff2", weight: "300", style: "normal" },
    { path: "./fonts/PyeojinGothic-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/PyeojinGothic-Bold.woff2", weight: "700", style: "normal" },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(SERVICE.url),
  title: {
    default: `${SERVICE.name} — 매출로 검증된 팀이 만드는, 위너 숏폼`,
    template: `%s | ${SERVICE.name}`,
  },
  description:
    "인플루언서 바이럴부터 구매전환 소재까지 — 하나의 파이프라인, 결제 한 번으로. 평균 프로젝트 단가 2천만원 이상의 전략 집단 해그로시가 숏폼 소재 시스템만 패키지로 열었습니다.",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: SERVICE.name,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${pyeojin.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper text-ink">
        {children}
        {/* 전 페이지 상담 위젯. pluginKey 미설정 시 렌더되지 않는다 (F11) */}
        <ChannelTalk />
      </body>
    </html>
  );
}
