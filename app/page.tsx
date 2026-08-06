import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PlanSelectionProvider } from "@/components/landing/plan-selection";
import { Hero } from "@/components/landing/s1-hero";
import { ServiceFlow } from "@/components/landing/s-service-flow";
import { Services } from "@/components/landing/s-services";
import { GrowthCases } from "@/components/landing/s-growth-cases";
import { CreativeWall } from "@/components/landing/s-creative-wall";
import { Reviews } from "@/components/landing/s11-reviews";
import { Pricing } from "@/components/landing/s12-pricing";
import { Faq } from "@/components/landing/s13-faq";
import { FinalCta } from "@/components/landing/s14-final-cta";

/**
 * 섹션 구성은 2026-08-06 피그마 개편안의 **오른쪽 열(신규 와이어프레임)이 유일한 기준**이다.
 * 그 전에 만들어 둔 섹션이라도 와이어프레임에 없으면 싣지 않는다.
 *
 * 삭제한 것 — 전부 와이어프레임에 없음:
 *  · S2 Market   (76.1% / 10→35% / 5.7%)  ← 피그마에 "해당 섹션 삭제" 명시
 *  · S7 Formats  (성과가 검증된 전환 포맷으로만 제작합니다)
 *  · S8 WhyHgrs  (숏폼 외주가 아니라, 전략 집단의 시스템입니다)
 *  · S9 Process  (결제 다음 날부터, 무엇이 언제 오는지 보입니다)
 *  · S10 ForYou  (이런 국면에 있다면, 맞습니다)
 * 되살리려면 파일이 아니라 와이어프레임을 먼저 고칠 것.
 *
 * 배경 톤은 라이트 ↔ 인디고 ↔ 다크로 교차시킨다. 성장 사례는 다크로 몰아 세게 읽히게 한다.
 */
export default function LandingPage() {
  return (
    <PlanSelectionProvider>
      <SiteHeader />
      <main>
        <Hero />
        <ServiceFlow />
        <Services />
        <GrowthCases />
        <CreativeWall />
        <Reviews />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </PlanSelectionProvider>
  );
}
