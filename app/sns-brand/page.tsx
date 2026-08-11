import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Cover } from "@/components/sns/s-cover";
import { EditorsNote } from "@/components/sns/s-editors-note";
import { FeatureArticle, ShortFeature } from "@/components/sns/s-feature";
import { Archive, Method } from "@/components/sns/s-method";
import { Contact } from "@/components/sns/s-contact";
import { FEATURES } from "@/lib/sns-brand";

/**
 * /sns-brand — 브랜드 컨텐츠·SNS 채널의 기획·전략·운영.
 *
 * 서비스 소개 페이지가 아니라 **매거진 한 호를 읽는 경험**으로 만든다.
 * 케이스를 포트폴리오 카드가 아니라 피처 기사로 싣고, 방식(Method)은
 * 기사 네 편을 다 읽은 뒤에야 꺼낸다 — "이 사람들 진짜 컨텐츠를 만든다"가
 * 설명이 아니라 지면 자체로 읽혀야 하기 때문이다.
 *
 * 본문은 hgrs.io/portfolio 원문 발췌다. 카피는 lib/sns-brand.ts 한 곳에서만 고친다.
 */
export const metadata: Metadata = {
  // 루트 템플릿("| 해그로시 숏폼 스튜디오")은 이 페이지에 맞지 않는다 — 다른 서비스 라인이다
  title: { absolute: "브랜드 컨텐츠 · SNS 채널 기획전략 운영 | 해그로시" },
  description:
    "팔로워를 모으는 채널 말고, 팬과 매출을 만드는 채널. 크래프톤·럽디·열다·트러스티푸드 — 세일즈를 이해하는 에디터들이 성과에 필요한 작업만 하는 채널 기획·전략·운영 기록.",
  openGraph: {
    title: "브랜드 컨텐츠 · SNS 채널 | 해그로시",
    description:
      "팔로워를 모으는 채널 말고, 팬과 매출을 만드는 채널. 네 편의 피처로 읽는 채널 기획·전략·운영.",
    images: ["/sns/krafton-contents.jpg"],
  },
};

export default function SnsBrandPage() {
  return (
    <>
      <SiteHeader tone="paper" nav={{ href: "#contact", label: "프로젝트 문의" }} />
      <main className="bg-paper-warm">
        <Cover />
        <EditorsNote />
        {FEATURES.map((feature, i) => (
          <FeatureArticle key={feature.id} feature={feature} index={i} />
        ))}
        <ShortFeature />
        <Method />
        <Archive />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
