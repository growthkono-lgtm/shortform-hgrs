/**
 * 원본 영상 자산 — `영상모음2, 유튜브링크/` 17편을 720p H.264로 인코딩한 결과.
 *
 * 이 중 riiid-report / parkron-tpu 두 편은 성장 사례 대표 소재로 따로 쓰이고,
 * **나머지 15편은 전부 크리에이티브 월에 그냥 깔린다.**
 * 사장님 지시: 월에 들어가는 소재에는 캡션·브랜드명을 붙이지 않는다.
 *
 * 파일명 주의 — 원본 파일명이 내용과 다른 것이 셋 있었다. 첫 프레임을 직접 확인해 바로잡았다.
 *  · 맘카페_세로형.mov  → 뤼이드 리얼 아카데미 소재 (riiid-momcafe)
 *  · 40대여성.mp4       → 탈모가 아니라 뼈 건강 (bone-w40s)
 *  · 빌고빌었는데.mp4    → 탈모가 아니라 펫 사료 (pet-treats-plea)
 */

export type Clip = { slug: string; ratio: "9/16" | "1/1" };

const P = "/portfolio/clips";

/** 성장 사례·스텝 섹션에 쓰여 월에서는 빼는 소재 */
export const CASE_CLIPS = [
  "riiid-report",
  "parkron-tpu",
  "riiid-parent-empathy",
] as const;

/**
 * 크리에이티브 월·히어로에 흐르는 세로/정사각 실사 소재.
 *
 * 2026-08-10 세 편을 덜어냈다. 원본이 같은 배리에이션을 나란히 깔면
 * 소재가 많아 보이는 게 아니라 **밑천이 얕아 보인다**(사장님 지적).
 *  · riiid-toefl-junior  — riiid-momcafe 와 프레임이 완전히 같다. 자막 카피만 다르다
 *  · krafton-pnc-salute  — krafton-pnc-inonix 와 같은 하이라이트 템플릿. 선수만 다르다
 *  · riiid-trial-reviews — riiid-self-study 와 같은 "아이+태블릿" 구도
 * 2026-08-10 추가로 두 편 더 뺐다(사장님 지목): pet-dangterview-3 / krafton-pnc-inonix.
 * 대신 zeroblock-interview(제로블럭 정리수납 인터뷰) 한 편을 새로 넣었다.
 * 파일은 지우지 않았다. 다시 살릴 땐 아래 배열에 넣으면 된다.
 *
 * 2026-08-10 pet-custom-meal 도 뺐다(사장님 지목). 유튜브 쇼츠 2편과 합쳐 15칸 —
 * 3열 기준으로 딱 5행이 떨어진다.
 *
 * 순서도 손댔다 — 같은 브랜드가 이웃하지 않게 흩는다.
 */
export const WALL_CLIPS: Clip[] = [
  { slug: "riiid-momcafe", ratio: "9/16" },
  { slug: "pet-portion", ratio: "9/16" },
  { slug: "moen-shampoo-ppl", ratio: "9/16" },
  { slug: "bone-w40s", ratio: "9/16" },
  { slug: "zeroblock-interview", ratio: "9/16" },
  { slug: "riiid-self-study", ratio: "9/16" },
  { slug: "seeding-patty", ratio: "9/16" },
  { slug: "pet-vet-pancreas", ratio: "9/16" },
  { slug: "bone-m50s", ratio: "9/16" },
  { slug: "gaehogang-square", ratio: "1/1" },
  { slug: "pet-treats-plea", ratio: "9/16" },
  { slug: "riiid-parent-itv", ratio: "9/16" },
  { slug: "seeding-garnish", ratio: "9/16" },
];

export const clipVideo = (slug: string) => `${P}/${slug}.mp4`;
export const clipPoster = (slug: string) => `${P}/${slug}.jpg`;

/**
 * 유튜브 롱폼 — 2026-08-10부터 **숏폼 그리드 바로 아래 그리드**로 세운다.
 * 흐르는 밴드에 섞어 두면 눌러 볼 수 있는 소재라는 게 읽히지 않는다.
 * 3열 3행으로 떨어지게 9편만 건다(PWS 스케치·하이라이트 2편 제외).
 *
 * 썸네일은 i.ytimg.com 을 그대로 건다 — 파일로 내려받아 두면 원본 영상을
 * 교체할 때마다 같이 갈아야 해서 어긋난다. maxres 가 없는 영상이 있어
 * onError 로 hq 로 떨어뜨린다 (Tile 참고).
 */
export type VideoLink = {
  id: string;
  label: string;
  kind: "long" | "short";
};

/**
 * 유튜브 **쇼츠** — 크리에이티브 월 그리드에 세로 칸으로 세운다.
 * 파일로 가진 소재가 아니라 유튜브에 올라간 것이라 눌렀을 때 유튜브로 넘긴다.
 * 썸네일은 세로(oardefault/oar2)를 내려받아 `/portfolio/shorts-yt/` 에 두었다 —
 * 기본 hqdefault 는 16:9라 세로 칸에서 위아래가 잘린다.
 */
export const YOUTUBE_SHORTS: { id: string; poster: string; label: string }[] = [
  {
    id: "BdGKoiPITZ0",
    poster: "/portfolio/shorts-yt/BdGKoiPITZ0.jpg",
    label: "크래프톤 · 조나단 인터뷰",
  },
  {
    id: "TJGx4iZBgTI",
    poster: "/portfolio/shorts-yt/TJGx4iZBgTI.jpg",
    label: "핏플렉스 쇼츠 캠페인",
  },
];

// 위 두 편은 그리드로 올라갔으므로 아래 롱폼 목록에서는 뺀다 (같은 화면에 두 번 나오지 않게)
export const YOUTUBE_LINKS: VideoLink[] = [
  { id: "jVBusZBaCA8", label: "크래프톤 · PNC 2024 식사 데이트", kind: "long" },
  { id: "Yy9K61hUC3Y", label: "핏플렉스 브랜드 영상", kind: "long" },
  { id: "Bsp_HBS8ckM", label: "크래프톤 · 배그 극장 EP2", kind: "long" },
  { id: "aEbmZ3H5EWo", label: "크래프톤 · 배그 극장 EP1", kind: "long" },
  { id: "_h3PLQlhs1s", label: "크래프톤 · PNC 2024 EP2", kind: "long" },
  { id: "f5QK9Hik2C8", label: "크래프톤 · PNC 2024 EP1", kind: "long" },
  { id: "XmX0iYOTUGE", label: "열다 · 주방 정리 노하우", kind: "long" },
  { id: "EU26OQv6ATE", label: "열다 · 이사 전 정리정돈", kind: "long" },
  { id: "6gfORrmxY2Q", label: "열다 · 신발장 정리", kind: "long" },
];

export const INSTAGRAM_LINKS = [
  { code: "DJDs43Tv0sD", label: "우비 댕터뷰" },
  { code: "DJ_KuU5vGyD", label: "강아지 MBTI" },
];

export const ytThumbMax = (id: string) =>
  `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
export const ytThumbFallback = (id: string) =>
  `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
export const ytWatch = (id: string) => `https://www.youtube.com/watch?v=${id}`;
export const igUrl = (code: string) => `https://www.instagram.com/reel/${code}/`;
