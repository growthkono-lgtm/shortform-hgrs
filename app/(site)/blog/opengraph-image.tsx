import { OG_SIZE, renderOgCard } from "@/lib/og-card";

/** 목록 페이지용. 글 상세는 각자 `[slug]/opengraph-image.tsx` 를 쓴다 */
export const alt = "해그로시 인사이트 — 숏폼·브랜드 채널 판단 기준";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return renderOgCard({
    label: "인사이트",
    title: "숏폼과 브랜드 채널을 매출로 잇는 판단 기준",
    sub: "플랫폼 공식 발표와 공개 통계, 실제 집행 사례를 근거로 정리합니다",
  });
}
