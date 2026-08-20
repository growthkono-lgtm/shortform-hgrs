import type { Metadata } from "next";
import { JsonLd, breadcrumb } from "@/components/seo/structured-data";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Clients } from "@/components/landing/s-clients";
import {
  HomeChoice,
  HomeGrowth,
  HomeHero,
  HomeStory,
} from "@/components/home/sections";
import { ORG, SERVICE } from "@/lib/constants";

/**
 * hgrs.io 홈 — 2026-08-11 프레이머에서 이관.
 *
 * 문안은 프레이머 홈 그대로다(lib/home.ts). 바꾼 건 마지막 CTA 두 장뿐 —
 * 지금 실제로 열려 있는 두 랜딩을 가리킨다.
 *
 * 이 파일이 서던 자리에 있던 `redirect(/shortform)` 은 지웠다. 루트에 홈이 생겼으니
 * 더 이상 넘길 이유가 없다.
 */
export const metadata: Metadata = {
  title: {
    absolute: `${ORG.name} — 브랜드 포지셔닝과 스케일업을 구축하는 전략 프로그램`,
  },
  description:
    "글로벌 대기업부터 스타트업, 스몰 브랜드까지 30개 이상 조직의 목표 지표를 달성했습니다. 브랜드 채널 그로스와 구매 전환형 숏폼을 함께 굴리는 컨텐츠 그로스 집단.",
  alternates: { canonical: "/" },
  // openGraph 는 부모와 병합되지 않고 통째로 교체된다 —
  // 루트에 적어 둔 type·locale·siteName 이 여기서 사라지므로 다시 적는다
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: ORG.name,
    title: `${ORG.name} — 브랜드 포지셔닝과 스케일업`,
    description:
      "30개 이상 조직의 목표 지표를 달성한 컨텐츠 그로스 집단. 전략·기획·제작·운영을 한 팀으로.",
    url: SERVICE.url,
  },
};

const CRUMBS = breadcrumb([{ name: "해그로시", path: "/" }]);

export default function HomePage() {
  return (
    <>
      {/* Organization 은 app/(site)/layout.tsx 가 이미 내보낸다 — 여기서 또 내면 같은 @id 가 두 번 실린다 */}
      <JsonLd data={CRUMBS} />
      <SiteHeader
        cta={{ href: "/sns-brand#contact", label: "프로젝트 문의" }}
      />
      <main>
        <HomeHero />
        <Clients />
        <HomeStory />
        <HomeGrowth />
        <HomeChoice />
      </main>
      <SiteFooter />
    </>
  );
}
