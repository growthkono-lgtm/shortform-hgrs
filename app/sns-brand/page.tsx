import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Clients } from "@/components/landing/s-clients";
import { Reviews } from "@/components/landing/s11-reviews";
import { Hero } from "@/components/sns/s-hero";
import { Method, Pov } from "@/components/sns/s-pov";
import { Engagement, Team } from "@/components/sns/s-team";
import { Cases } from "@/components/sns/s-cases";
import { Capability } from "@/components/sns/s-capability";
import { Actions } from "@/components/sns/s-actions";
import { Faq, FinalCta } from "@/components/sns/s-faq";
import { Contact } from "@/components/sns/s-contact";

/**
 * /sns-brand — 브랜드 SNS 채널 커뮤니케이션. **리드 확보용 서비스 랜딩**이다.
 *
 * 처음엔 매거진 형식으로 만들었다가 되돌렸다 — 읽을거리가 아니라 연 단위 계약을
 * 파는 화면이기 때문이다. 서체·색·배경은 숏폼 랜딩과 완전히 같은 시스템을 쓴다
 * (같은 회사의 다른 서비스 라인으로 읽혀야 한다).
 *
 * 순서(2026-08-11): **성과와 업무 범위를 먼저 보여주고** 방식·팀·계약을 뒤에 둔다.
 * 로고월 → 역량(숫자) → 통합 브랜드 액션(범위) → 사례(깊이) → 포지셔닝 → 방식 → 팀 → 계약.
 * 우리가 누구인지 설명하기 전에 무엇을 해냈는지가 먼저 읽혀야 한다.
 *
 * 케이스 원문은 접어 둔다(Cases). 넷을 다 펼치면 페이지가 13,000px을 넘고,
 * 스캔하는 방문자가 계약 조건까지 도달하지 못한다.
 *
 * Capability / Actions 두 섹션은 hgrs.io/partnership 에서 옮긴 것이다 —
 * 사장님이 캡처로 지정한 섹션인데 1차 구축에서 빠졌다가 복구했다.
 *
 * 로고월(Clients)과 후기(Reviews)는 숏폼 랜딩 컴포넌트를 그대로 가져다 쓴다.
 * 카피는 lib/sns-brand.ts 한 곳에서만 고친다.
 */
export const metadata: Metadata = {
  // 루트 템플릿("| 해그로시 숏폼 스튜디오")은 이 페이지에 맞지 않는다 — 다른 서비스 라인이다
  title: { absolute: "브랜드 SNS 채널 커뮤니케이션 | 해그로시" },
  description:
    "팔로워를 모으는 채널 말고, 팬과 매출을 만드는 채널. PM·컨텐츠·퍼널·퍼포먼스 4개 팀이 붙는 연 단위 채널 파트너십 — 크래프톤·럽디·열다·트러스티푸드 성과 기록.",
  openGraph: {
    title: "브랜드 SNS 채널 커뮤니케이션 | 해그로시",
    description:
      "팔로워를 모으는 채널 말고, 팬과 매출을 만드는 채널. 4개 팀이 붙는 연 단위 채널 파트너십.",
    images: ["/sns/krafton-contents.jpg"],
  },
};

export default function SnsBrandPage() {
  return (
    <>
      <SiteHeader nav={{ href: "#contact", label: "프로젝트 문의" }} />
      <main>
        <Hero />
        <Clients />
        <Capability />
        <Actions />
        <Cases />
        <Pov />
        <Method />
        <Team />
        <Engagement />
        <Reviews />
        <Faq />
        <FinalCta />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
