import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Hero } from "@/components/landing/s1-hero";
import { ServiceFlow } from "@/components/landing/s-service-flow";
import { Services } from "@/components/landing/s-services";
import { System } from "@/components/landing/s-system";
import { Clients } from "@/components/landing/s-clients";
import { GrowthCases } from "@/components/landing/s-growth-cases";
import { CreativeWall } from "@/components/landing/s-creative-wall";
import { Crew } from "@/components/landing/s-crew";
import { Reviews } from "@/components/landing/s11-reviews";
import { DiagnosisProvider } from "@/components/landing/diagnosis-context";
import { Diagnosis } from "@/components/landing/s-diagnosis";
import { Apply } from "@/components/landing/s-apply";
import { Beyond } from "@/components/landing/s-beyond";
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
 *
 * 추가한 것 — Crew(누가 만드나). 와이어프레임에는 없지만 FAQ 한 줄로 묻혀 있던
 * "숏폼 기획제작은 어떤 전문가가 하나요?"를 섹션으로 꺼낸 것이다. 소재를 다 보여준
 * 직후(CreativeWall) ~ 남의 말(Reviews) 앞이 이 질문이 실제로 떠오르는 자리다.
 *
 * 2026-08-07 랜딩 보강 — "풀 프로젝트를 하던 팀이 숏폼만 린하게 열었다"를 축으로 두 곳을 열었다:
 *  · System (Service ↔ Clients 사이) — 왜 이 가격에 이 퀄리티가 나오는가
 *  · Beyond (Pricing ↔ FAQ 사이)     — 브랜드 단위 프로젝트가 필요한 사람을 본진으로 보내는 갈림길
 *
 * 2026-08-10 **가격표(S12)를 화면에서 내렸다.** 편수 단가를 먼저 걸면 브랜드 상황과
 * 무관하게 "한 편에 얼마" 비교로 끌려간다. 대신 Diagnosis(국면 진단) → Apply(신청) 로
 * 잇고, 구성·금액은 소개서로 메일 발송한다. 컴포넌트(s12-pricing.tsx)와 결제 경로는
 * 지우지 않고 남겨 뒀다 — 가격을 다시 열 때 마운트만 되돌리면 된다.
 * Clients 로고월은 System을 끼우기 위해 s-services.tsx에서 s-clients.tsx로 분리했다.
 */
export default function LandingPage() {
  return (
    <DiagnosisProvider>
      <SiteHeader />
      <main>
        <Hero />
        <ServiceFlow />
        <Services />
        <System />
        <Clients />
        <GrowthCases />
        <CreativeWall />
        <Crew />
        <Reviews />
        <Diagnosis />
        <Apply />
        <Beyond />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </DiagnosisProvider>
  );
}
