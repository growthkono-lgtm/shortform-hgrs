import type { Metadata } from "next";
import { DM_Sans, Noto_Serif_KR } from "next/font/google";
import localFont from "next/font/local";
import { SERVICE } from "@/lib/constants";
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
    { path: "./fonts/PyeojinGothic-Light.woff2", weight: "300", style: "normal" },
    { path: "./fonts/PyeojinGothic-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/PyeojinGothic-Bold.woff2", weight: "700", style: "normal" },
  ],
});

/**
 * 세리프 — /sns-brand("브랜드 컨텐츠 매거진") 전용 헤드라인 서체.
 * 랜딩(숏폼)과 결을 의도적으로 다르게 가져가되 컬러 토큰은 공유한다.
 * subsets 에 'korean' 은 없다 — 구글이 한글을 이름 없는 unicode-range 로 쪼개 내려주기 때문이다.
 * latin 만 지정해도 한글 face 가 함께 받아진다 (렌더 확인 완료).
 */
const notoSerifKr = Noto_Serif_KR({
  variable: "--font-noto-serif-kr",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
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
      className={`${pyeojin.variable} ${dmSans.variable} ${notoSerifKr.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper text-ink">
        {children}
        {/* 전 페이지 상담 위젯. pluginKey 미설정 시 렌더되지 않는다 (F11) */}
        <ChannelTalk />
      </body>
    </html>
  );
}
