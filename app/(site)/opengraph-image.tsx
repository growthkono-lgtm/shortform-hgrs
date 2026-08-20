import { OG_SIZE, renderOgCard } from "@/lib/og-card";

/**
 * 공개 사이트의 **기본** 공유 이미지.
 *
 * 라우트 그룹에 두면 아래 페이지 중 자기 그림이 없는 곳이 전부 이걸 쓴다 —
 * 홈·법적 고지 등. 자기 그림이 있는 곳(`/sns-brand`·`/portfolio` 의
 * `openGraph.images`, `/blog/[slug]` 의 opengraph-image)은 그대로 자기 것을 쓴다.
 *
 * `app/` 루트가 아니라 `(site)` 에 두는 이유: 루트에 두면 작업자 대시보드
 * (`/work`)까지 해그로시 카드가 붙는다. 그 표면은 브랜드를 감춘다.
 */
export const alt = "해그로시 — 브랜드 채널 그로스와 구매 전환 숏폼";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return renderOgCard({
    label: "해그로시",
    title: "브랜드 포지셔닝과 스케일업을 구축하는 전략 프로그램",
    sub: "30개 이상 조직의 목표 지표를 달성한 컨텐츠 그로스 집단",
  });
}
