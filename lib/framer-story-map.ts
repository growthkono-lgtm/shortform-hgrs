/**
 * 프레이머 포트폴리오 항목 ↔ 정리해서 쓴 고객 이야기 글의 연결. (2026-08-20)
 *
 * 프레이머 원문은 요약 두 줄 + 긴 본문이라 목록에서 고르기 어려웠다. 사장님:
 * *"제목 톤이나 형식, 썸네일 등은 (고객 이야기를) 따라해서 반영하고 안에
 * 내용은 좀 덜어내면서 전달해도 좋을듯."* 그래서 본문이 있는 항목은 전부
 * `/blog` 의 고객 이야기로 다시 썼고, 카드는 그 글로 보낸다.
 *
 * 여기 없는 항목은 프레이머에 요약 두 줄만 있던 것들이다. 없는 내용을 지어
 * 글로 만들지 않는다 — 카드로만 남긴다.
 *
 * 키는 프레이머 슬러그, 값은 blog_post.slug 다.
 */
export const FRAMER_STORY: Record<string, string> = {
  크래프톤: "story-krafton-pubg-esports",
  럽디: "story-lovedy-growth-funnel",
  열다: "story-yeolda-o2o-youtube",
  트러스티푸드: "story-trusty-food-imc",
  리얼클래스: "story-realclass-scaleup",
  모에브: "story-moev-launch-roas",
  왈라: "story-walla-b2b-seo",
  "파크론-제로블럭": "story-parkron-zeroblock",
  "롯데렌탈-그린카": "story-lotte-greencar",
  핏플렉스: "story-fitflex",
  주왕산가든: "story-juwangsan-garden",
  디맨드: "story-dmand-gochodaejol",
  사이버다임: "story-cyberdigm-seo",
  허웰: "story-herwell-irvinelab",
  바나코: "story-banaco",
  삼분의일: "story-sambunui-il",
  뮤디트: "story-mudit-crm",
  내친소: "story-naechinso",
};

export const storyOf = (slug: string): string | undefined => FRAMER_STORY[slug];
