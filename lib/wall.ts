/**
 * S6 크리에이티브 월 자산 — 자동 스와이프 마퀴에 흐른다.
 * 같은 브랜드가 연달아 나오면 소재가 적어 보이므로 브랜드 라운드로빈으로 섞었다.
 */

export type WallItem = { src: string; video?: string; brand?: string };

/** 1:1 소셜·광고 크리에이티브 (6개 브랜드 교차) */
export const WALL_SQUARE: WallItem[] = [
  { src: "/portfolio/wall/sq-00.webp", brand: "핏플렉스" },
  { src: "/portfolio/wall/sq-01.webp", brand: "모엔" },
  { src: "/portfolio/wall/sq-03.webp", brand: "고초대졸닷컴" },
  { src: "/portfolio/wall/sq-09.webp", brand: "내친소" },
  { src: "/portfolio/wall/sq-15.webp", brand: "제로블럭" },
  { src: "/portfolio/wall/sq-19.webp", brand: "트러스티랩스" },
  { src: "/portfolio/wall/sq-10.webp", brand: "핏플렉스" },
  { src: "/portfolio/wall/sq-02.webp", brand: "모엔" },
  { src: "/portfolio/wall/sq-04.webp", brand: "고초대졸닷컴" },
  { src: "/portfolio/wall/sq-14.webp", brand: "내친소" },
  { src: "/portfolio/wall/sq-16.webp", brand: "제로블럭" },
  { src: "/portfolio/wall/sq-11.webp", brand: "핏플렉스" },
  { src: "/portfolio/wall/sq-05.webp", brand: "고초대졸닷컴" },
  { src: "/portfolio/wall/sq-17.webp", brand: "내친소" },
  { src: "/portfolio/wall/sq-20.webp", brand: "제로블럭" },
  { src: "/portfolio/wall/sq-12.webp", brand: "핏플렉스" },
  { src: "/portfolio/wall/sq-06.webp", brand: "고초대졸닷컴" },
  { src: "/portfolio/wall/sq-18.webp", brand: "내친소" },
  { src: "/portfolio/wall/sq-21.webp", brand: "제로블럭" },
  { src: "/portfolio/wall/sq-13.webp", brand: "핏플렉스" },
  { src: "/portfolio/wall/sq-07.webp", brand: "고초대졸닷컴" },
  { src: "/portfolio/wall/sq-08.webp", brand: "고초대졸닷컴" },
];

/** 16:9 유튜브 썸네일 */
export const WALL_WIDE: WallItem[] = [
  { src: "/portfolio/wall/yt-00.webp" },
  { src: "/portfolio/wall/yt-01.webp" },
  { src: "/portfolio/wall/yt-02.webp" },
  { src: "/portfolio/wall/yt-03.webp" },
  { src: "/portfolio/wall/yt-04.webp" },
  { src: "/portfolio/wall/yt-05.webp" },
  { src: "/portfolio/wall/yt-06.webp" },
  { src: "/portfolio/wall/yt-07.webp" },
  { src: "/portfolio/wall/yt-08.webp" },
  { src: "/portfolio/wall/yt-09.webp" },
  { src: "/portfolio/wall/yt-10.webp" },
  { src: "/portfolio/wall/yt-11.webp" },
  { src: "/portfolio/wall/yt-12.webp" },
  { src: "/portfolio/wall/yt-13.webp" },
  { src: "/portfolio/wall/yt-14.webp" },
  { src: "/portfolio/wall/yt-15.webp" },
  { src: "/portfolio/wall/yt-16.webp" },
];

/** 상세페이지·배너·카드뉴스·카톡 캡처 등 실제 게시 산출물 */
export const WALL_MISC: WallItem[] = [
  { src: "/portfolio/wall/dv-1200-600.webp" },
  { src: "/portfolio/wall/dv-240123_모엔샴푸_영상_건강시대PPLv04_썸네일.webp" },
  { src: "/portfolio/wall/dv-250-250.webp" },
  { src: "/portfolio/wall/dv-KakaoTalk_20231121_163615251.webp" },
  { src: "/portfolio/wall/dv-KakaoTalk_20240118_151938035.webp" },
  { src: "/portfolio/wall/dv-KakaoTalk_20240118_151938035_01.webp" },
  { src: "/portfolio/wall/dv-KakaoTalk_20240913_191305932_01.webp" },
  { src: "/portfolio/wall/dv-KakaoTalk_20240913_191305932_04.webp" },
  { src: "/portfolio/wall/dv-KakaoTalk_20240920_193931390_01.webp" },
  { src: "/portfolio/wall/dv-KakaoTalk_20240920_193931390_02.webp" },
  { src: "/portfolio/wall/dv-KakaoTalk_20250327_160943978_01.webp" },
  { src: "/portfolio/wall/dv-KakaoTalk_20250327_160943978_04.webp" },
  { src: "/portfolio/wall/dv-KakaoTalk_20250410_120301227.webp" },
  { src: "/portfolio/wall/dv-KakaoTalk_20250410_120301227_01.webp" },
  { src: "/portfolio/wall/dv-KakaoTalk_20250714_131510194.webp" },
  { src: "/portfolio/wall/dv-hwang_b_1200.webp" },
  { src: "/portfolio/wall/dv-hwang_c_a_1200.webp" },
  { src: "/portfolio/wall/dv-ㅈㅈㄹ.webp" },
  { src: "/portfolio/wall/dv-고초모음-001.webp" },
  { src: "/portfolio/wall/dv-대문배너.webp" },
  { src: "/portfolio/wall/dv-디맨드11.webp" },
  { src: "/portfolio/wall/dv-디맨드12.webp" },
  { src: "/portfolio/wall/dv-모비온_250x250.webp" },
  { src: "/portfolio/wall/dv-모엔_인스타그램_01_240116.webp" },
  { src: "/portfolio/wall/dv-모엔_인스타그램_02_240116.webp" },
  { src: "/portfolio/wall/dv-카드뉴스4-2_2.webp" },
  { src: "/portfolio/wall/dv-핏플렉스14.webp" },
  { src: "/portfolio/wall/dv-핏플렉스15.webp" },
];

/** 촬영 현장 스케치 */
export const WALL_SITE: WallItem[] = [
  { src: "/portfolio/wall/site-0.webp" },
  { src: "/portfolio/wall/site-1.webp" },
  { src: "/portfolio/wall/site-2.webp" },
  { src: "/portfolio/wall/site-3.webp" },
  { src: "/portfolio/wall/site-4.webp" },
  { src: "/portfolio/wall/site-5.webp" },
  { src: "/portfolio/wall/site-6.webp" },
  { src: "/portfolio/wall/site-7.webp" },
];

/**
 * 움직이는 배너 (원본 GIF -> mp4).
 * 2026-08-10 gif-4 를 뺐다 — gif-0 과 같은 소재다(문구·할인가까지 동일).
 * 이 넷은 크리에이티브 월의 **숏폼 그리드**에 함께 깔린다. 흐르는 밴드에는 이미지만 남긴다.
 */
export const WALL_MOTION: WallItem[] = [
  { src: "/portfolio/wall/gif-0.jpg", video: "/portfolio/wall/gif-0.mp4" },
  { src: "/portfolio/wall/gif-1.jpg", video: "/portfolio/wall/gif-1.mp4" },
  { src: "/portfolio/wall/gif-2.jpg", video: "/portfolio/wall/gif-2.mp4" },
  { src: "/portfolio/wall/gif-3.jpg", video: "/portfolio/wall/gif-3.mp4" },
];

/** 히어로 세로 컬럼용 — 전 자산 셔플 */
export const WALL_ALL: WallItem[] = [
  ...WALL_SQUARE, ...WALL_MISC, ...WALL_SITE, ...WALL_WIDE,
];
