import type { Metadata } from "next";
import {
  JsonLd,
  breadcrumb,
  faqSchema,
  serviceSchema,
} from "@/components/seo/structured-data";
import { FAQ } from "@/lib/sns-brand";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Clients } from "@/components/landing/s-clients";
import { Reviews } from "@/components/landing/s11-reviews";
import { Hero } from "@/components/sns/s-hero";
import { Capability } from "@/components/sns/s-capability";
import { Cases } from "@/components/sns/s-cases";
import { Portfolio } from "@/components/sns/s-portfolio";
import { Process } from "@/components/sns/s-process";
import { Engagement, Team } from "@/components/sns/s-team";
import { Actions } from "@/components/sns/s-actions";
import { Faq, FinalCta } from "@/components/sns/s-faq";
import { Contact } from "@/components/sns/s-contact";

/**
 * /sns-brand — 브랜드 SNS 채널 커뮤니케이션. 리드 확보용 서비스 랜딩.
 *
 * **2026-08-11 피그마 와이어프레임이 이 페이지의 유일한 기준이다.**
 * 섹션 순서·카피 모두 그 문서를 따랐다. 거기 없는 섹션은 싣지 않는다.
 *
 * 순서: 히어로 → 역량 트랙 → 사례 4건 + 공식 블로그 관리 → 클라이언트 로고월
 *   → 최근 주요 포트폴리오 → SNS 채널 기본 프로세스 → 팀 → 파트너십 조건
 *   → 통합 브랜드 액션 → 후기 → FAQ → 파이널 CTA → 문의
 *
 * 2026-08-14: 채널을 별도 "채널 포트폴리오" 섹션으로 뽑았다가 **통째로 뺐다**.
 * 채널은 사례에서 떼면 남의 계정 목록으로 읽힌다 — 각 사례 카드 안으로 넣고,
 * 블로그 세 개는 사례 목록 끝에 "공식 블로그 관리" 칸을 하나 더 만들어 담았다.
 *
 * 뺀 것 — 포지셔닝(Position) 섹션. 와이어프레임 흐름에 없다. 그 메시지는
 * 히어로 헤드라인과 Actions 서브카피가 나눠 가진다.
 *
 * 카피는 lib/sns-brand.ts 한 곳에서만 고친다.
 */
export const metadata: Metadata = {
  // 루트 템플릿("| 해그로시 숏폼 스튜디오")은 이 페이지에 맞지 않는다 — 다른 서비스 라인이다
  title: { absolute: "브랜드 SNS 채널 커뮤니케이션 | 해그로시" },
  alternates: { canonical: "/sns-brand" },
  description:
    "브랜드 퍼널을 완성하는 SNS 채널 그로스 프로젝트. 단순 바이럴이 아닌, 팬덤과 고객 연결의 커뮤니케이션을 완성합니다 — 크래프톤·럽디·열다·트러스티푸드 성과 기록.",
  openGraph: {
    title: "브랜드 SNS 채널 커뮤니케이션 | 해그로시",
    description:
      "브랜드 퍼널을 완성하는 SNS 채널 그로스 프로젝트. 팬덤과 고객 연결의 커뮤니케이션을 완성합니다.",
    images: ["/sns/krafton-contents.jpg"],
    url: "/sns-brand",
  },
};

const SCHEMA = serviceSchema({
  path: "/sns-brand",
  name: "브랜드 SNS 채널 커뮤니케이션",
  description:
    "브랜드 SNS 채널의 기획·전략·운영. PM·컨텐츠·퍼널·퍼포먼스 4개 팀이 붙는 연 단위 채널 파트너십.",
  serviceType: "SNS 채널 기획·운영",
});

const CRUMBS = breadcrumb([
  { name: "해그로시", path: "/" },
  { name: "브랜드 SNS 채널", path: "/sns-brand" },
]);

export default function SnsBrandPage() {
  return (
    <>
      <JsonLd data={SCHEMA} />
      <JsonLd data={CRUMBS} />
      {/* FAQ 스키마 — 생성형 검색이 문답을 그대로 인용할 수 있게 한다 */}
      <JsonLd data={faqSchema([...FAQ])} />
      <SiteHeader cta={{ href: "#contact", label: "프로젝트 문의" }} />
      <main>
        <Hero />
        <Capability />
        <Cases />
        <Clients />
        <Portfolio />
        <Process />
        <Team />
        <Engagement />
        <Actions />
        <Reviews />
        <Faq />
        <FinalCta />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
