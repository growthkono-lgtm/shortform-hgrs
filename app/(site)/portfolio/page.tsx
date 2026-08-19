import type { Metadata } from "next";
import {
  JsonLd,
  breadcrumb,
  serviceSchema,
} from "@/components/seo/structured-data";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Clients } from "@/components/landing/s-clients";
import { Portfolio } from "@/components/sns/s-portfolio";
import { Cases } from "@/components/sns/s-cases";
import { Actions } from "@/components/sns/s-actions";
import { PortfolioHero } from "@/components/sns/s-portfolio-hero";
import { FramerCases } from "@/components/sns/s-framer-cases";

/**
 * /portfolio — 성과 사례를 한 페이지로 모은다.
 *
 * 프레이머 시절 hgrs.io/portfolio 가 있던 자리다. 리다이렉트로 흘려보내지 않고
 * 같은 주소에 실제 페이지를 세운다 — 검색결과·명함에 이 URL 이 박혀 있고,
 * "성과 사례"는 그 자체로 찾아 들어오는 수요가 있다.
 *
 * 섹션은 전부 /sns-brand 와 같은 컴포넌트다. 한쪽을 고치면 양쪽이 같이 바뀐다.
 */
export const metadata: Metadata = {
  title: { absolute: "성과 사례 · 포트폴리오 | 해그로시" },
  description:
    "크래프톤·럽디·열다·트러스티푸드 등 30여 브랜드의 SNS 채널·컨텐츠 프로젝트 기록. 실제 편성한 롱폼 영상과 브랜드별 통합 액션 조합을 함께 봅니다.",
  alternates: { canonical: "/portfolio" },
  openGraph: {
    title: "성과 사례 · 포트폴리오 | 해그로시",
    description:
      "30여 브랜드의 SNS 채널·컨텐츠 프로젝트 기록. 실제 편성한 영상과 브랜드별 통합 액션 조합.",
    images: ["/sns/krafton-contents.jpg"],
    url: "/portfolio",
  },
};

const SCHEMA = serviceSchema({
  path: "/portfolio",
  name: "해그로시 성과 사례",
  description:
    "브랜드 SNS 채널·컨텐츠 프로젝트의 실제 성과 기록과 편성한 컨텐츠 모음.",
  serviceType: "브랜드 컨텐츠 · 채널 그로스",
});

const CRUMBS = breadcrumb([
  { name: "해그로시", path: "/" },
  { name: "성과 사례", path: "/portfolio" },
]);

export default function PortfolioPage() {
  return (
    <>
      <JsonLd data={SCHEMA} />
      <JsonLd data={CRUMBS} />
      <SiteHeader
        cta={{ href: "/sns-brand#contact", label: "프로젝트 문의" }}
      />
      <main>
        <PortfolioHero />
        <Clients />
        <Portfolio />
        <Cases />
        <FramerCases />
        <Actions />
      </main>
      <SiteFooter />
    </>
  );
}
