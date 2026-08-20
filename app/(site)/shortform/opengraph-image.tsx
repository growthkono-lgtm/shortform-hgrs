import { OG_SIZE, renderOgCard } from "@/lib/og-card";

/** 사이트맵 우선순위 1인데 공유 이미지가 없던 페이지. 문구는 히어로와 같게 둔다 */
export const alt = "해그로시 숏폼 스튜디오 — 구매 전환형 광고 소재";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return renderOgCard({
    label: "숏폼 스튜디오",
    title: "대기업부터 스타트업까지 숏폼 부스팅 프로젝트",
    sub: "인플루언서 시딩과 채널 바이럴, 그리고 구매 전환형 광고 소재를 한번에",
  });
}
