import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PlanSelectionProvider } from "@/components/landing/plan-selection";
import { StickyCta } from "@/components/landing/sticky-cta";
import { Hero } from "@/components/landing/s1-hero";
import { Market } from "@/components/landing/s2-market";
import { Problem } from "@/components/landing/s3-problem";
import { Pipeline } from "@/components/landing/s4-pipeline";
import { Proof } from "@/components/landing/s5-proof";
import { Portfolio } from "@/components/landing/s6-portfolio";
import { Formats } from "@/components/landing/s7-formats";
import { WhyHgrs } from "@/components/landing/s8-why";
import { Process } from "@/components/landing/s9-process";
import { ForYou } from "@/components/landing/s10-for-you";
import { Reviews } from "@/components/landing/s11-reviews";
import { Pricing } from "@/components/landing/s12-pricing";
import { Faq } from "@/components/landing/s13-faq";
import { FinalCta } from "@/components/landing/s14-final-cta";

/** 섹션 순서는 PART C 고정 — 임의로 바꾸지 않는다 */
export default function LandingPage() {
  return (
    <PlanSelectionProvider>
      <SiteHeader />
      <main>
        <Hero />
        <Market />
        <Problem />
        <Pipeline />
        <Proof />
        <Portfolio />
        <Formats />
        <WhyHgrs />
        <Process />
        <ForYou />
        <Reviews />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
      <StickyCta />
    </PlanSelectionProvider>
  );
}
