/**
 * 실제 산출물 데이터 (PART D / PART G).
 *
 * 자산 출처: 해그로시 실제 제작물 — consultant-sgh 프로젝트에 정리돼 있던 것을
 * public/portfolio/ 로 옮겨 왔다.
 *  · shorts/   9:16 숏폼 스틸 (480×854)
 *  · social/   1:1 소셜·배너 크리에이티브
 *  · youtube/  16:9 유튜브 썸네일
 *  · production/ 촬영 현장
 *  · reel.mp4  브랜드 SNS 컨텐츠 릴 (6.4MB)
 */

export type Reel = {
  /** 9:16 스틸. 영상이 도착하면 video를 채운다 */
  poster: string;
  video?: string;
  category: PortfolioCategory;
  caption: string;
};

export type PortfolioCategory = "펫" | "리빙" | "뷰티" | "브랜드";

/**
 * 실제 보유 자산에 있는 카테고리만 노출한다.
 * 헬스·푸드·패션 소재가 도착하면 여기와 REELS/BANNERS에 함께 추가한다 —
 * 빈 카테고리 탭은 클릭했을 때 아무것도 없어 신뢰를 깎는다.
 */
export const PORTFOLIO_CATEGORIES = ["전체", "리빙", "펫", "뷰티", "브랜드"] as const;

/**
 * S6 1행 — 9:16 숏폼. **재생되는 소재를 앞에 둔다.**
 *
 * 포맷 분류는 파일명이 아니라 실제 영상 첫 화면을 확인해 붙였다.
 * (예: `tpu 비교.mp4`는 비교 영상이 아니라 평점·리뷰를 내세운 후기형이다)
 *
 * ⚠️ 브랜드명 표기는 게시 동의를 받은 범위에서만 유지할 것.
 */
export const REELS: Reel[] = [
  {
    video: "/portfolio/reels/zeroblock-itv.mp4",
    poster: "/portfolio/reels/zeroblock-itv.jpg",
    category: "리빙",
    caption: "제로블럭 · 비포애프터형 — 시공 전후를 한 화면에",
  },
  {
    video: "/portfolio/reels/tpu-compare.mp4",
    poster: "/portfolio/reels/tpu-compare.jpg",
    category: "리빙",
    caption: "제로블럭 · 후기형 — 평점 4.92와 실제 리뷰를 전면에",
  },
  {
    video: "/portfolio/reels/white-bg-01.mp4",
    poster: "/portfolio/reels/white-bg-01.jpg",
    category: "리빙",
    caption: "제로블럭 · 제품 실험형 — 직접 눌러 보여주는 내구성 훅",
  },
  {
    video: "/portfolio/reels/dangterview-3.mp4",
    poster: "/portfolio/reels/dangterview-3.jpg",
    category: "펫",
    caption: "트러스티랩스 · 인터뷰형 — 반려견 사연으로 여는 시리즈",
  },
  {
    video: "/portfolio/reels/moen-ppl.mp4",
    poster: "/portfolio/reels/moen-ppl.jpg",
    category: "뷰티",
    caption: "모엔 · 문제제기형 — 산후 탈모 원리부터 짚고 들어가는 훅",
  },
  {
    poster: "/portfolio/shorts/sh-02.webp",
    category: "펫",
    caption: "트러스티랩스 · 트푸터뷰 EP.03",
  },
  {
    poster: "/portfolio/shorts/sh-04.webp",
    category: "펫",
    caption: "트러스티랩스 · 제품 라인업 소개",
  },
];

/** S6 2행 — 유튜브. 해그로시가 기획·제작한 실제 채널 컨텐츠 */
export type YoutubeItem = {
  id: string;
  channel: string;
  title: string;
  role: string;
  category: PortfolioCategory;
};

export const YOUTUBE: YoutubeItem[] = [
  {
    id: "jVBusZBaCA8",
    channel: "배틀그라운드 이스포츠",
    title: "배그 아버지와 선수들의 식사 데이트",
    role: "크래프톤 대표이사 출연 · 팬덤 토크 포맷 기획",
    category: "브랜드",
  },
  {
    id: "Bsp_HBS8ckM",
    channel: "배틀그라운드 이스포츠",
    title: "제 다음 팀은 00입니다 | 배그 극장 EP2",
    role: "세계관 오리지널 시리즈 · 선수 IP 브랜딩",
    category: "브랜드",
  },
  {
    id: "AjeXTq75hiw",
    channel: "집 정리의 모든 것 (열다)",
    title: "드레스룸 한 방에 정리하는 법",
    role: "인물 중심 브랜딩 · 첫 편부터 알고리즘 탑승",
    category: "브랜드",
  },
  {
    id: "LCQywT3a2pQ",
    channel: "트러스티랩스",
    title: "췌장염과 피부 고민 있는 짱구의 이야기",
    role: "사연 기반 온드 컨텐츠 · 리드에서 매출로",
    category: "펫",
  },
  {
    id: "IzXDfxBQw5A",
    channel: "트러스티랩스",
    title: "재료는 줄이고 영양은 꽉 채운 맞춤 식단",
    role: "시리즈 편성으로 팬층 확보 · 광고 소재 Multi-Use",
    category: "펫",
  },
  {
    id: "kzeeO2rTa8c",
    channel: "리데이트 (Luv.D)",
    title: "술 좋아하는 사람만 걸러도 연애가 편해진다?",
    role: "상담사 전문가 브랜딩 · 상담 DB 확보 컨텐츠",
    category: "브랜드",
  },
];

/** S6 3행 — 1:1 소셜·배너 크리에이티브 */
export const BANNERS: {
  src: string;
  video?: string;
  category: PortfolioCategory;
}[] = [
  {
    src: "/portfolio/reels/gaehogang-sq.jpg",
    video: "/portfolio/reels/gaehogang-sq.mp4",
    category: "펫",
  },
  { src: "/portfolio/social/sq-00.webp", category: "브랜드" },
  { src: "/portfolio/social/sq-01.webp", category: "브랜드" },
  { src: "/portfolio/social/sq-02.webp", category: "브랜드" },
  { src: "/portfolio/social/sq-03.webp", category: "브랜드" },
  { src: "/portfolio/social/sq-04.webp", category: "브랜드" },
  { src: "/portfolio/social/sq-05.webp", category: "브랜드" },
  { src: "/portfolio/social/sq-06.webp", category: "브랜드" },
  { src: "/portfolio/social/sq-07.webp", category: "브랜드" },
];

/**
 * S1 히어로 배경 그리드 — 9:16 **스틸**.
 *
 * 스펙 PART C는 영상 그리드를 요구하지만 스틸로 간다.
 * 이 그리드는 화이트 페이드로 덮여 거의 안 보이는 배경인데,
 * 여기서 영상 6개를 동시에 자동재생하면 첫 화면 로딩과 모바일 데이터를
 * 그대로 태운다. 재생은 포트폴리오·포맷 섹션에서 한다.
 */
export const HERO_GRID = [
  "/portfolio/reels/zeroblock-itv.jpg",
  "/portfolio/shorts/sh-01.webp",
  "/portfolio/reels/tpu-compare.jpg",
  "/portfolio/shorts/sh-02.webp",
  "/portfolio/reels/moen-ppl.jpg",
  "/portfolio/shorts/sh-04.webp",
];

/**
 * 그로스 실행 화면 — SEO 구조도, 검색 결과 점유, 서치콘솔 지표 등.
 *
 * ⚠️ 촬영 현장 사진이 아니다. 이전에 "촬영 현장"으로 잘못 표기했다가 바로잡았다.
 * 김포 오피스 실사진이 들어오면 그때 촬영 인프라 근거로 따로 쓴다.
 */
export const GROWTH_SHOTS = [
  "/portfolio/production/pr-00.webp",
  "/portfolio/production/pr-01.webp",
  "/portfolio/production/pr-02.webp",
  "/portfolio/production/pr-03.webp",
  "/portfolio/production/pr-04.webp",
  "/portfolio/production/pr-05.webp",
];

/** S4 파이프라인 4스텝 썸네일 */
export const PIPELINE_SHOTS = [
  "/portfolio/production/pr-01.webp",
  "/portfolio/shorts/sh-02.webp",
  "/portfolio/shorts/sh-04.webp",
  "/portfolio/social/sq-03.webp",
];

/**
 * S7 포맷 6종 대표 스틸.
 *
 * ⚠️ 실제로 그 포맷인 소재만 연결한다. 아무 소재나 붙이면 포맷 메뉴판 자체가
 * 거짓말이 되고, "성과가 검증된 포맷으로만 제작한다"는 문장의 근거가 무너진다.
 * 비어 있는 셋(전문가형·비교형·문제제기형)은 해당 소재가 도착하면 채운다.
 * — 비교형 후보: Drive의 `tpu 비교.mp4`
 */
export const FORMAT_SHOTS: Record<
  string,
  { video: string; poster: string } | undefined
> = {
  // 제로블럭 소재 앞부분 — 평점 4.92와 실제 리뷰 캡처
  후기형: {
    video: "/portfolio/reels/fmt-review.mp4",
    poster: "/portfolio/reels/fmt-review.jpg",
  },
  // 원어민 강사가 카메라에 직접 설명하는 구간을 세로로 잘라 씀
  전문가형: {
    video: "/portfolio/reels/fmt-expert.mp4",
    poster: "/portfolio/reels/fmt-expert.jpg",
  },
  "제품 실험형": {
    video: "/portfolio/reels/white-bg-01.mp4",
    poster: "/portfolio/reels/white-bg-01.jpg",
  },
  // 같은 소재 후반부 — "어떤 매트든" 하며 경쟁 제품과 나란히 두는 구간
  비교형: {
    video: "/portfolio/reels/fmt-compare.mp4",
    poster: "/portfolio/reels/fmt-compare.jpg",
  },
  문제제기형: {
    video: "/portfolio/reels/moen-ppl.mp4",
    poster: "/portfolio/reels/moen-ppl.jpg",
  },
  비포애프터형: {
    video: "/portfolio/reels/zeroblock-itv.mp4",
    poster: "/portfolio/reels/zeroblock-itv.jpg",
  },
};

/**
 * S5 성과 케이스 대표 스틸.
 *
 * ⚠️ 여기 이미지는 지표가 채워지는 순간 **그 성과를 낸 실제 소재**로 교체해야 한다.
 * 다른 브랜드 소재를 성과 옆에 두면 그 소재가 낸 결과처럼 읽힌다.
 */
export const PROOF_POSTERS: (string | undefined)[] = [
  undefined,
  undefined,
  undefined,
];

export const youtubeThumb = (id: string) => `/portfolio/video/${id}.jpg`;
export const youtubeWatch = (id: string) => `https://www.youtube.com/watch?v=${id}`;
