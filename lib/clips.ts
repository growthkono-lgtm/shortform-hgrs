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
  /* 2026-08-20 — 열다(@jipjeongmo) 숏폼 19편 중 대표 4편. 세로 썸네일(oardefault) */
  {
    id: "BgAU2oW5ckY",
    poster: "/portfolio/shorts-yt/BgAU2oW5ckY.jpg",
    label: "열다 · 집안일에 치일 땐",
  },
  {
    id: "W_M6MQyUogo",
    poster: "/portfolio/shorts-yt/W_M6MQyUogo.jpg",
    label: "열다 · 안 무너지는 티셔츠 개는 법",
  },
  {
    id: "D0PC_mlKanY",
    poster: "/portfolio/shorts-yt/D0PC_mlKanY.jpg",
    label: "열다 · 전문가가 옷 개는 방법",
  },
  {
    id: "f_8pVjfuRwU",
    poster: "/portfolio/shorts-yt/f_8pVjfuRwU.jpg",
    label: "열다 · 유지되는 이불 정리법",
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
  { id: "AjeXTq75hiw", label: "열다 · 드레스룸 한 방에", kind: "long" },
  { id: "LTyFU4KVtb8", label: "열다 · 정리의 시작은 분리배출", kind: "long" },
  { id: "AFaI-wjsb5o", label: "열다 · 베란다를 홈카페로", kind: "long" },
  { id: "rN8u7D8R9ds", label: "열다 · 장난감 가득한 거실", kind: "long" },
];

export const INSTAGRAM_LINKS = [
  { code: "DJDs43Tv0sD", label: "우비 댕터뷰" },
  { code: "DJ_KuU5vGyD", label: "강아지 MBTI" },
  // 2026-08-20 사장님이 지목한 릴스
  { code: "DNZxJ7cv1-N", label: "코엑스 펫페어 현장" },
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

const LOCAL_CLIPS: BrandClips[] = [
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
  { brand: "내추럴헬스", slugs: ["bone-w40s", "bone-m50s"] }, // 옛 표기 "내추럴헬스(블루헬스)" — 드라이브분과 합치려고 통일
  { brand: "크래프톤", slugs: ["krafton-pnc-inonix", "krafton-pnc-salute"] },
  { brand: "모에브", slugs: ["moen-shampoo-ppl"] },
];


/* ─────────────────────────────────────────────────────────────
 * 구글 드라이브에서 받아 온 소재 38편. (2026-08-20)
 *
 * rclone 으로 공유 드라이브 5개 폴더(영상 207편 / 8.0GB)를 받고, 원본 촬영본
 * `(Footage)` 61편과 `삭제` 파일을 뺀 완성 소재 149편 중 **브랜드 균형을 맞춰**
 * 골랐다(캠페인 폴더를 돌아가며 뽑아 한 캠페인에 몰리지 않게).
 * 720×1280 · h264 crf28 로 변환해 `public/portfolio/clips/` 에 넣었다.
 *
 * ⚠️ 슬러그 뒤 네 글자는 원본 경로 해시다. macOS 한글 파일명이 NFD(자모 분리)
 * 라 그냥 슬러그화하면 한글이 통째로 날아가고 이름이 겹친다 — NFC 정규화 +
 * 해시로 막았다.
 *
 * 목적은 **편당 4프레임을 뽑아 직접 보고** 매겼다. 근거 자막을 줄마다 적어 뒀다.
 * ───────────────────────────────────────────────────────────── */
export const DRIVE_CLIPS: BrandClips[] = [
  { brand: "내추럴헬스", slugs: [
    "bone-d-3가지-25초-9-16비율-3ccd",
    "bone-d-3가지-40초-9-16비율-a57b",
    "bone-d-40대00칼슘-1분-9132",
    "bone-d-40대00칼슘-30초-324f",
    "bone-d-40대여성-9b9a",
    "bone-d-50대-f4c1",
    "bone-d-50대골다공증남편-dcb5",
    "bone-d-릴스-모비코사-스토리형-260310-c164",
    "bone-d-릴스-모비코사-원료-100세즐기기-260309-85d8",
    "bone-d-릴스-모비코사-원료-이점설명-260309-aa9d",
    "bone-d-모비코사-관절통증-a00a",
    "bone-d-모비코사-아프다면-e089",
  ] },
  { brand: "리얼아카데미", slugs: [
    "riiid-d-0205-맘카페-세로형-1160",
    "riiid-d-7일키트-언박싱-2-e74d",
    "riiid-d-ai학부모-대치동-c621",
    "riiid-d-kakaotalk-20251118-202339219-d72e",
    "riiid-d-겨울방학-무제한스피킹-3f83",
    "riiid-d-겨울방학중등대비-63b7",
    "riiid-d-내향적인아이공부법-9c09",
    "riiid-d-리얼아카데미게임-4a03",
    "riiid-d-모두0원-2dcb",
    "riiid-d-이걸다0원-109c",
    "riiid-d-자기주도2-1-ccac",
    "riiid-d-찾습니다-314a",
  ] },
  { brand: "트러스티푸드", slugs: [
    "trusty-d-강아지-사료-기초대사량-계산이-틀릴-수-있습니다-bf06",
    "trusty-d-강아지-사료-저지방만-고집하면-영양-불균형-4e14",
    "trusty-d-늑대의-후손-강아지-사료-이렇게-줘야-합니다-e123",
    "trusty-d-부부싸움-6c45",
    "trusty-d-쇼츠-건사료-보관-24c2",
    "trusty-d-쇼츠-짧은-버전-반려견-영양처방식-배분-f610",
    "trusty-d-트러스티랩-반려동물-필독사전-사료-종류-ep-1-쇼츠-1-v-2-cc59",
    "trusty-d-트러스티랩-반려동물-필독사전-사료-종류-ep-1-쇼츠-2-v-1-53fc",
    "trusty-d-트러스티랩-반려동물-필독사전-사료-종류-ep-2-쇼츠-1-v-2-dd56",
    "trusty-d-트러스티랩-반려동물-필독사전-사료-종류-ep-2-쇼츠-2-v-1-4da4",
    "trusty-d-트러스티랩-반려동물-필독사전-사료-종류-ep-2-쇼츠-3-v-1-0a20",
    "trusty-d-트러스티랩-반려동물-필독사전-사료-종류-ep-2-쇼츠-4-v-1-2d9b",
  ] },
  { brand: "페로와모이", slugs: [
    "pero-d-8월-4차-스파이더맨-06d0",
    "pero-d-8월5차-아침이-왔다잖아-18ca",
  ] },
];


/**
 * 소개서에서 빼는 소재. (2026-08-20 사장님 지시)
 *
 * *"동일 인물들이 나란히 너무 자주나오는건 좀 섞어서 중복없어보이게끔해."*
 * 아래 둘은 **같은 편의 길이만 다른 버전**이라 그리드에 나란히 놓이면
 * 같은 장면이 두 번 나온 것처럼 보인다. 긴 쪽만 남긴다.
 * 파일은 지우지 않는다 — 홈페이지 /portfolio 에는 그대로 있다.
 */
export const DECK_EXCLUDE = new Set<string>([
  "bone-d-3가지-25초-9-16비율-3ccd", //   40초 버전과 같은 편
  "bone-d-40대00칼슘-30초-324f", //       1분 버전과 같은 편
]);

/** 로컬 + 드라이브 — 브랜드별로 합친 목록 */
export const CLIPS_BY_BRAND: BrandClips[] = (() => {
  const m = new Map<string, string[]>();
  for (const b of [...LOCAL_CLIPS, ...DRIVE_CLIPS])
    m.set(b.brand, [...(m.get(b.brand) ?? []), ...b.slugs]);
  return [...m].map(([brand, slugs]) => ({ brand, slugs }));
})();

/** 등록된 소재가 전부 몇 편인가 — 누락 점검용 */
export const ALL_BRAND_CLIPS = CLIPS_BY_BRAND.flatMap((b) => b.slugs);

/* ─────────────────────────────────────────────────────────────
 * 소재의 **목적** — 브랜드가 아니라 이걸로 묶어 보여 준다. (2026-08-20)
 *
 * 사장님: *"브랜드로 나누기보다 너가 영상을 보고 영상의 목적(후기형,
 * 인터뷰형, 스토리형 등등) 넣으면 되고."*
 *
 * 브랜드로 묶으면 한 장에 두세 브랜드밖에 안 보여 "그 업종 전문"으로 읽힌다.
 * 목적으로 묶으면 **"우리는 이런 각을 만든다"** 가 보인다.
 *
 * ⚠️ 판정 근거: 22편 전부 ffmpeg 로 4프레임씩 뽑아 **실제로 보고** 정했다
 * (자막·화자·구성). 파일명 추측이 아니다. 근거를 각 줄에 적어 둔다.
 * ───────────────────────────────────────────────────────────── */

export type ClipPurpose =
  | "인터뷰형"
  | "후기형"
  | "정보·근거형"
  | "비교·실증형"
  | "스토리형"
  | "시딩·UGC형"
  | "프로모션형"
  | "브랜디드 바이럴";

/** 장표에 나가는 순서 — 설득이 강한 것부터 */
export const PURPOSE_ORDER: ClipPurpose[] = [
  "인터뷰형",
  "후기형",
  "정보·근거형",
  "비교·실증형",
  "스토리형",
  "시딩·UGC형",
  "프로모션형",
  "브랜디드 바이럴",
];

export const CLIP_PURPOSE: Record<string, ClipPurpose> = {
  // 사람이 정면으로 말한다
  "riiid-parent-itv": "인터뷰형", //      다크 배경 학부모 정면 인터뷰
  "riiid-report": "인터뷰형", //          같은 인터뷰 소스 · "맞벌이라 … 추천드려요"
  "pet-dangterview-3": "인터뷰형", //     자체 IP "댕터뷰 EP.03 뿌슈"
  "zeroblock-interview": "인터뷰형", //   BEFORE/AFTER + 사용자 "진짜 층간소음 70%까지"

  // 써 본 사람의 말·별점·입소문
  "riiid-parent-empathy": "후기형", //    "밥 먹어~ 소리도 안 들려요" + 별점 5
  "riiid-momcafe": "후기형", //           "요즘 맘카페에서 입소문나고 있는"
  "riiid-trial-reviews": "후기형", //     "학원 싫은 아이도 재밌있게" + 무료체험 유도

  // 전문가·성분·데이터로 설득
  "pet-vet-pancreas": "정보·근거형", //   수의사 가운 · "췌장염 저지방 식이 성분"
  "pet-portion": "정보·근거형", //        "반려견 영양처방식 배분해 볼까요?"
  "bone-m50s": "정보·근거형", //          "어골함량 99.5% 이상" 성분 클로즈업
  "moen-shampoo-ppl": "정보·근거형", //   "아기 엄마들이 극찬한 탈모 예방 성분"
  "riiid-self-study": "정보·근거형", //   "교육부가 권장한 1일 1영작"

  // 눈으로 확인시킨다
  "parkron-tpu": "비교·실증형", //        프리미엄형 vs TPU형 나란히
  "riiid-toefl-junior": "비교·실증형", // "TOEFL Junior 720 → 865"

  // 상황에서 문제를 발견시킨다
  "bone-w40s": "스토리형", //             피아노 치는 손 → "앉아서 일하다 보니 뼈 걱정"
  "pet-custom-meal": "스토리형", //       정육점 현장 브이로그 → 영양식 만들기

  // 인플루언서가 실제로 쓴다
  "seeding-patty": "시딩·UGC형", //       펫페어 현장 · "주인아!!!"
  "seeding-garnish": "시딩·UGC형", //     산책 중 간식 · "사람 관절에도 좋다는"

  // 가격·특가로 민다
  "pet-treats-plea": "프로모션형", //     "역대급 특가 26% 대용량 패티세트"
  "gaehogang-square": "프로모션형", //    "10,500원 50% OFF" 배너 고정

  // 브랜드 IP 콘텐츠
  "krafton-pnc-inonix": "브랜디드 바이럴", // PNC 2024 HIGHLIGHTS
  "krafton-pnc-salute": "브랜디드 바이럴", // PNC 2024 HIGHLIGHTS

  /* ── 드라이브에서 받아 온 38편 (프레임 확인 후 분류) ── */
  "bone-d-3가지-25초-9-16비율-3ccd": "정보·근거형", // 서울대 약사가 알려주는 칼슘 영양제 고를 때 체크할 3가지
  "bone-d-3가지-40초-9-16비율-a57b": "정보·근거형", // 같은 편 40초 버전
  "bone-d-40대00칼슘-1분-9132": "정보·근거형", // 40대라면 꼭 알아야 할 칼슘 · 뼈 도식
  "bone-d-40대00칼슘-30초-324f": "정보·근거형", // 같은 편 30초 버전
  "bone-d-40대여성-9b9a": "스토리형", // 피아노 치는 손 → 앉아서 일하다 보니 뼈 걱정
  "bone-d-50대-f4c1": "정보·근거형", // KALSIO 패키지 개봉 · 성분 라벨
  "bone-d-50대골다공증남편-dcb5": "스토리형", // 50대 골다공증 걱정 · 앉아서 일하는 남편
  "bone-d-릴스-모비코사-스토리형-260310-c164": "후기형", // 한 알로 무릎 관절에 힘이 딱 붙는 느낌
  "bone-d-릴스-모비코사-원료-100세즐기기-260309-85d8": "정보·근거형", // 100세까지 등산 골프 즐기기 · 원료
  "bone-d-릴스-모비코사-원료-이점설명-260309-aa9d": "정보·근거형", // 등산 동호회 · 뉴질랜드 청정해역 원료
  "bone-d-모비코사-관절통증-a00a": "정보·근거형", // 관절 통증 수술이 답이 아닙니다 · COX-2 도식
  "bone-d-모비코사-아프다면-e089": "정보·근거형", // 우리 몸이 보내는 SOS 신호, 염증
  "riiid-d-0205-맘카페-세로형-1160": "후기형", // 요즘 맘카페에서 입소문나고 있는
  "riiid-d-7일키트-언박싱-2-e74d": "정보·근거형", // 7일 키트 언박싱 · 무료교재 신청
  "riiid-d-ai학부모-대치동-c621": "정보·근거형", // 요즘 대치동 초등학생들이 학원 1개만 안 다니는 이유
  "riiid-d-kakaotalk-20251118-202339219-d72e": "정보·근거형", // 퀴즈 · 원어민 무제한 스피킹
  "riiid-d-겨울방학-무제한스피킹-3f83": "정보·근거형", // 원어민과 무제한 스피킹, 영작으로 서술형대비까지
  "riiid-d-겨울방학중등대비-63b7": "프로모션형", // 겨울방학 중등 영어 대비 0원으로 시작하기
  "riiid-d-내향적인아이공부법-9c09": "스토리형", // 대문자I 내향적인 아이 맞춤형 공부법
  "riiid-d-리얼아카데미게임-4a03": "프로모션형", // 만화영화로 재밌게 배우는 초등영어 · 교재 증정
  "riiid-d-모두0원-2dcb": "프로모션형", // 어학원 대신 선택한 초등영어 · 모두 0원
  "riiid-d-이걸다0원-109c": "프로모션형", // 초등영어 0원에 이걸 다 할 수 있다고?
  "riiid-d-자기주도2-1-ccac": "정보·근거형", // 자기주도 학습 화면
  "riiid-d-찾습니다-314a": "프로모션형", // 영어 못 하는 초등학생 찾습니다
  "trusty-d-강아지-사료-기초대사량-계산이-틀릴-수-있습니다-bf06": "정보·근거형", // 알려지지 않은 강아지 기초대사량의 진실
  "trusty-d-강아지-사료-저지방만-고집하면-영양-불균형-4e14": "정보·근거형", // 강아지 저지방 식단 계속 유지하면 안 됩니다
  "trusty-d-늑대의-후손-강아지-사료-이렇게-줘야-합니다-e123": "정보·근거형", // 늑대의 후손에게 사료 주는 방법
  "trusty-d-부부싸움-6c45": "스토리형", // 반려견 키우다 부부가 싸우는 이유
  "trusty-d-쇼츠-건사료-보관-24c2": "정보·근거형", // 건사료 보관법 가장 많이 틀리는 부분
  "trusty-d-쇼츠-짧은-버전-반려견-영양처방식-배분-f610": "정보·근거형", // 반려견 영양처방식 배분해 볼까요
  "trusty-d-트러스티랩-반려동물-필독사전-사료-종류-ep-1-쇼츠-1-v-2-cc59": "정보·근거형", // 필독사전 · 사료 교체 타이밍
  "trusty-d-트러스티랩-반려동물-필독사전-사료-종류-ep-1-쇼츠-2-v-1-53fc": "정보·근거형", // 필독사전 · 전 연령 사료 정말 괜찮을까
  "trusty-d-트러스티랩-반려동물-필독사전-사료-종류-ep-2-쇼츠-1-v-2-dd56": "정보·근거형", // 필독사전 · 건사료 속 숨어있는 독
  "trusty-d-트러스티랩-반려동물-필독사전-사료-종류-ep-2-쇼츠-2-v-1-4da4": "정보·근거형", // 필독사전 · 건강과 편리 둘 다 잡는 사료
  "trusty-d-트러스티랩-반려동물-필독사전-사료-종류-ep-2-쇼츠-3-v-1-0a20": "정보·근거형", // 필독사전 · 캔 사료의 진실
  "trusty-d-트러스티랩-반려동물-필독사전-사료-종류-ep-2-쇼츠-4-v-1-2d9b": "정보·근거형", // 필독사전 · 생식 사료 정말 안전할까
  "pero-d-8월-4차-스파이더맨-06d0": "브랜디드 바이럴", // 캐릭터 애니메이션 · 스파이더맨 편
  "pero-d-8월5차-아침이-왔다잖아-18ca": "브랜디드 바이럴", // 같은 편 다른 버전
};

/** 목적 순 → 그 안에서는 등록 순. 장표는 이 순서로 채운다 */
export const CLIPS_BY_PURPOSE = PURPOSE_ORDER.map((purpose) => ({
  purpose,
  slugs: ALL_BRAND_CLIPS.filter((s) => CLIP_PURPOSE[s] === purpose),
}));
