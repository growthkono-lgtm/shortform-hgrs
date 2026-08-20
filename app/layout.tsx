import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import localFont from "next/font/local";
import { ORG, SERVICE } from "@/lib/constants";
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
    default: `${ORG.name} — 브랜드 채널 마케팅과 구매 전환 숏폼`,
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

  /**
   * 검색엔진 소유확인 태그. (2026-08-14)
   *
   * 환경변수로 빼 둔 이유: 값 하나 받자고 코드를 고치고 배포하는 건
   * 낭비다. Vercel 에 값만 넣고 재배포하면 붙는다. 값이 없으면
   * 태그 자체가 안 나가므로 빈 채로 둬도 아무 일도 일어나지 않는다.
   *
   * DNS(TXT 레코드) 대신 이 방식을 쓰는 이유: 후이즈 네임서버를 쓰고 있어
   * TXT 를 넣으려면 네임서버 호스팅 화면까지 들어가야 하는데, 메타 태그는
   * 값만 주시면 끝난다.
   */
  verification: {
    ...(process.env.GOOGLE_SITE_VERIFICATION
      ? { google: process.env.GOOGLE_SITE_VERIFICATION }
      : {}),
    ...(process.env.NAVER_SITE_VERIFICATION
      ? {
          other: {
            "naver-site-verification": process.env.NAVER_SITE_VERIFICATION,
          },
        }
      : {}),
  },
};

/**
 * 껍데기만 둔다 — html/body/서체.
 *
 * 회사를 드러내는 것(JSON-LD·상담 위젯)은 `app/(site)/layout.tsx` 로 내렸고,
 * 위 metadata 도 작업자 표면에서는 `app/work/layout.tsx` 가 통째로 덮어쓴다.
 * 여기에 브랜드를 다시 올리면 작업자 페이지 소스에 그대로 실린다.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${pyeojin.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper text-ink">
        {children}
      </body>
    </html>
  );
}
