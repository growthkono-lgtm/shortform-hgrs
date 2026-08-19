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

export type Clip = {
  slug: string;
  ratio: "9/16" | "1/1";
  /**
   * 어느 브랜드 소재인가. (2026-08-19 사장님이 직접 매칭해 주심)
   *
   * ⚠️ **랜딩의 크리에이티브 월에는 쓰지 않는다.** 거기는 브랜드명을 붙이지
   * 않기로 한 자리다(파일 머리말 참고). 이 값은 **소개서**에서만 쓴다 —
   * 소개서는 문의한 브랜드에게 나가는 문서라 "누구 것인지" 가 증빙이 된다.
   */
  brand?: string;
};

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
  // 브랜드는 2026-08-19 사장님이 그리드 순서대로 직접 매칭해 주신 값이다
  // (왼쪽 위 → 오른쪽, 아랫줄도 왼쪽 → 오른쪽으로 1~12)
  { slug: "riiid-momcafe", ratio: "9/16", brand: "리얼아카데미" },
  { slug: "pet-portion", ratio: "9/16", brand: "트러스티푸드" },
  { slug: "moen-shampoo-ppl", ratio: "9/16", brand: "모에브" },
  { slug: "bone-w40s", ratio: "9/16", brand: "내추럴헬스(블루헬스)" },
  { slug: "zeroblock-interview", ratio: "9/16", brand: "제로블럭" },
  { slug: "riiid-self-study", ratio: "9/16", brand: "리얼아카데미" },
  { slug: "seeding-patty", ratio: "9/16", brand: "트러스티푸드" },
  { slug: "pet-vet-pancreas", ratio: "9/16", brand: "트러스티푸드" },
  { slug: "bone-m50s", ratio: "9/16", brand: "내추럴헬스(블루헬스)" },
  { slug: "gaehogang-square", ratio: "1/1", brand: "트러스티푸드" },
  { slug: "pet-treats-plea", ratio: "9/16", brand: "트러스티푸드" },
  { slug: "riiid-parent-itv", ratio: "9/16", brand: "리얼아카데미" },
  // 13번째 — 소개서 그리드는 12칸이라 여기까지 안 내려온다
  { slug: "seeding-garnish", ratio: "9/16", brand: "트러스티푸드" },
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


/* ─────────────────────────────────────────────────────────────
 * 브랜드별 전체 소재 목록. (2026-08-19)
 *
 * 사장님: *"폴더에 있는 영상들 있잖아. 그거 소개서에 안 들어간 것도 꽤
 * 있을 거야. 소개서에는 다 넣어야 돼."* 실제로 `public/portfolio/clips` 에
 * 22편이 있는데 소개서 그리드는 12칸이라 **7편이 어디에도 안 나오고 있었다.**
 *
 * ⚠️ 브랜드 판정 근거를 갈라 둔다 —
 *  · 12편은 사장님이 그리드 순서대로 **직접 매칭**해 주신 값이다(WALL_CLIPS)
 *  · 나머지는 **파일명 접두어로 유추**했다. 접두어 규칙이 사장님 매칭과
 *    하나도 어긋나지 않아 그대로 따랐지만, 확인받은 값은 아니다.
 *      riiid- 리얼아카데미 · pet-/seeding-/gaehogang- 트러스티푸드
 *      bone- 내추럴헬스(블루헬스) · moen- 모에브
 *      zeroblock-/parkron- 제로블럭 · krafton- 크래프톤
 * ───────────────────────────────────────────────────────────── */

export type BrandClips = { brand: string; slugs: string[] };

export const CLIPS_BY_BRAND: BrandClips[] = [
  {
    brand: "리얼아카데미",
    slugs: [
      "riiid-momcafe",
      "riiid-self-study",
      "riiid-parent-itv",
      "riiid-report",
      "riiid-parent-empathy",
      "riiid-toefl-junior",
      "riiid-trial-reviews",
    ],
  },
  {
    brand: "트러스티푸드",
    slugs: [
      "pet-portion",
      "pet-vet-pancreas",
      "pet-treats-plea",
      "pet-custom-meal",
      "pet-dangterview-3",
      "seeding-patty",
      "seeding-garnish",
      "gaehogang-square",
    ],
  },
  { brand: "제로블럭", slugs: ["zeroblock-interview", "parkron-tpu"] },
  { brand: "내추럴헬스(블루헬스)", slugs: ["bone-w40s", "bone-m50s"] },
  { brand: "크래프톤", slugs: ["krafton-pnc-inonix", "krafton-pnc-salute"] },
  { brand: "모에브", slugs: ["moen-shampoo-ppl"] },
];

/** 등록된 소재가 전부 몇 편인가 — 누락 점검용 */
export const ALL_BRAND_CLIPS = CLIPS_BY_BRAND.flatMap((b) => b.slugs);
