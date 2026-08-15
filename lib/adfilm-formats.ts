/**
 * 영상 유형 분류 — 2026-08-15 신설. 사장님 확정.
 *
 * ── 왜 이 파일이 생겼나 ───────────────────────────────────────────────
 * 지금까지 우리는 **한 종류만** 만들었다. `FILM_TONE` 한 줄이
 *   *"손에 든 스마트폰으로 찍은 듯한 미세한 흔들림. 광고로 보이면 실패다"*
 * 로 고정돼 있어서, 무슨 제품이 오든 실사 UGC 하나로 갔다.
 *
 * 그게 왜 문제냐면 — **매번 가장 어려운 싸움만 걸게 된다.** 실사는
 * "실물 같은가"를 통과해야 하고, 그 판정은 볼 때마다 달라진다. 그래서
 * 편차가 생기고, 편차가 있으면 **상품이 아니다.**
 *
 * 벤치마크(CCFM 콘크리트파머스)가 공개한 6포맷 중 실사는 하나뿐이었다.
 * 나머지는 종이콜라주·3D원료·픽셀아트·슬라임ASMR이다. 미감 취향이 아니라
 * 계산이다 — 비실사는 ①"실물 같지 않다"는 지적이 성립하지 않고
 * ②사람에 따른 편차가 안 생기고 ③가상인물 표시 규제 밖이고
 * ④기획 컨펌이 필요 없어 납기가 준다.
 *
 * ── 이 파일이 정하는 것 ───────────────────────────────────────────────
 * 유형마다 **샷 구성 · 레퍼런스 슬롯 · 오디오 방식 · 검사 항목**이 고정된다.
 * 기획자가 고르는 건 유형 하나뿐이고, 나머지는 따라온다.
 * 그래야 "편차 없는 균일한 퀄리티"를 계약서에 쓸 수 있다.
 */

/**
 * 규제 표기 — 2026년에 새로 생긴 의무다. 유형마다 걸리는 게 다르다.
 *
 * · AI기본법 (2026-01-22 시행) — 생성형 AI 결과물에 **AI 생성 사실 표시**
 * · 공정위 「추천·보증 등에 관한 표시·광고 심사지침」 개정 —
 *   *"인공지능 등을 기반으로 실제와 구분하기 어려운 가상의 인물"* 을 쓰면
 *   **'가상인물' 표시** 의무. 위반 시 시정명령·과징금·형사처벌.
 *   적용 제외: 명백한 만화·일러스트 캐릭터, 라이선스 보유 디지털휴먼, 단순 보정.
 *
 * → 그래서 **얼굴이 나오는 유형만** 가상인물 표기가 붙는다. 손만 나오거나
 *   비실사면 AI 표기만 하면 된다. 이건 법 해석이라 계약 전에 확인이 필요하지만,
 *   규격에서 미리 갈라 두면 나중에 유형째로 고칠 일이 없다.
 */
export type Labeling = "ai" | "ai+virtual";

/**
 * 컷을 어떻게 이어 만드는가 — 2026-08-16 신설. **이번 실패의 핵심이다.**
 *
 * ── 무슨 일이 있었나 ──────────────────────────────────────────────────
 * v9(펠리웨이 40초)를 5초 컷 8개로 만들었는데, 컷마다 **독립 생성**했다.
 * 결과: 사장님 지적 — *"사람이 한 사람이 말하고 이어야 되는 거 아니야?
 * 갑자기 다른 사람이 나오는 것 같네"*, *"발음이 글자와 다르고 자연스럽게
 * 끊어 읽는 게 아니라 로봇 같아."*
 *
 * 얼굴 레퍼런스를 3장 넣어도 안 잡힌다. 독립 생성은 매번 처음부터 만드니까
 * 조금씩 다른 사람이 조금씩 다르게 말한다. **프롬프트로 못 고치는 문제다.**
 *
 * ── 해법: 체인 ────────────────────────────────────────────────────────
 * Seedance 2.0 은 `reference-to-video` 에 `video_urls` 로 직전 컷을 넣으면
 * *"마지막 프레임뿐 아니라 움직임·조명·구도의 궤적 전체를 읽어"* 이어 붙인다.
 * sora-2 의 `extensions` 와 같은 물건이고, 우리가 안 쓰고 있었다.
 *
 * 덤으로 **비디오 레퍼런스가 붙으면 단가가 0.6배**다($0.30→$0.18/초).
 * 품질은 오르고 값은 내려간다.
 *
 * ⚠️ 그래서 이건 취향이 아니라 **유형의 필수 속성**이다. 사람이 말하는
 * 유형에서 체인을 안 쓰면 상품이 안 된다.
 */
export type ShotChaining =
  /** 첫 컷만 독립 생성하고, 나머지는 직전 컷을 이어받는다. 화자·조명·톤이 유지된다 */
  | "chain"
  /** 컷마다 독립 생성. 장면이 서로 달라도 되는 유형에서만 */
  | "independent";

/** 화면의 소리가 어디서 오는가 — 립싱크 필요 여부를 이게 정한다 */
export type AudioMode =
  /** 화면 속 인물이 직접 말한다. 립싱크가 맞아야 한다 */
  | "onscreen"
  /** 화면 밖 목소리. 입이 안 보이므로 시간축이 자유롭다 */
  | "voiceover"
  /** 말이 없다. 자막과 사운드디자인만 */
  | "silent";

/** 레퍼런스 슬롯 — 이 유형을 만들려면 무엇을 받아야 하는가 */
export type RefSlot = {
  key: string;
  label: string;
  /** 최소 장수. 이만큼 없으면 생성으로 못 넘어간다 */
  min: number;
  max: number;
  kind: "image" | "video" | "audio";
  why: string;
};

export type ShotSlot = {
  no: number;
  role: string;
  /** 이 샷이 화면에 반드시 담아야 하는 것. 프롬프트의 뼈대가 된다 */
  must: string;
  /** 초. 생성 모델이 5초 단위라 5의 배수로 잡는다 */
  seconds: number;
};

export type AdFormat = {
  key: string;
  label: string;
  purpose: "conversion" | "trust" | "awareness";
  /** 실사인가 — 규제와 난이도를 가르는 축 */
  photoreal: boolean;
  minSeconds: number;
  maxSeconds: number;
  audio: AudioMode;
  /** 컷을 이어 만드는가. 사람이 말하는 유형은 chain 이 아니면 화자가 바뀐다 */
  chaining: ShotChaining;
  labeling: Labeling;
  refs: RefSlot[];
  shots: ShotSlot[];
  /** 이 유형이 실패하는 지점. 검사식이 여기를 본다 */
  watchFor: string[];
  brief: string;
};

/* ── 공통 레퍼런스 슬롯 ────────────────────────────────────────────────
 * 제품은 어느 유형이든 실물이어야 한다. AI 가 그린 제품은 납품하지 않는다 —
 * 라벨이 매번 달라지고, 그건 상표 문제이자 클라이언트 컨펌 문제다. */
const PRODUCT_REFS: RefSlot[] = [
  {
    key: "product_angles",
    label: "제품 실물 각도컷",
    min: 4,
    max: 8,
    kind: "image",
    why: "각도를 여러 장 주면 모델이 형태를 고정한다. 한 장만 주면 뒷면을 지어낸다",
  },
  {
    key: "product_label",
    label: "라벨·패키지 클로즈업",
    min: 1,
    max: 2,
    kind: "image",
    why: "글자가 깨지면 그 컷은 통째로 못 쓴다. 클로즈업을 따로 받아 합성한다",
  },
];

const SPACE_REF: RefSlot = {
  key: "space",
  label: "공간 레퍼런스",
  min: 1,
  max: 3,
  kind: "image",
  why: "한국 실내가 아니면 이질감이 먼저 보인다. 장소를 지정해 고정한다",
};

const TALENT_REF: RefSlot = {
  key: "talent_face",
  label: "화자 얼굴 고정컷",
  min: 3,
  max: 6,
  kind: "image",
  why: "컷마다 얼굴이 바뀌면 그 순간 광고가 아니라 오류가 된다. 롱폼일수록 치명적",
};

/**
 * 유형 6종.
 *
 * 순서에 뜻이 있다 — 위 셋은 실사(어렵고 비싸고 규제가 붙는다),
 * 아래 셋은 비실사(편차가 안 생기고 규제 밖이다). 신규 브랜드는
 * 아래쪽부터 파는 게 유리하다.
 */
export const AD_FORMATS: AdFormat[] = [
  {
    key: "ugc",
    label: "UGC 인물형",
    purpose: "conversion",
    photoreal: true,
    minSeconds: 25,
    maxSeconds: 40,
    audio: "onscreen",
    chaining: "chain",
    labeling: "ai+virtual",
    refs: [...PRODUCT_REFS, TALENT_REF, SPACE_REF],
    shots: [
      { no: 1, role: "훅", must: "화자가 겪는 문제 상황. 제품은 안 보인다", seconds: 5 },
      { no: 2, role: "공감·심화", must: "증상이 하나 더. 화자 얼굴 정면", seconds: 5 },
      { no: 3, role: "발견", must: "제품을 처음 손에 드는 장면", seconds: 5 },
      { no: 4, role: "사용법", must: "몇 초 만에 끝나는지가 보여야 한다", seconds: 5 },
      { no: 5, role: "변화", must: "가장 그림이 되는 한 장면. 설명 없이 보인다", seconds: 5 },
      { no: 6, role: "호명·행동", must: "화자가 카메라를 보고 말한다", seconds: 5 },
    ],
    watchFor: [
      "컷마다 화자 얼굴이 바뀐다 — 레퍼런스 장수를 늘린다",
      "한국어 대사가 길면 입이 어긋난다 — 한 줄 5~10단어로 끊는다",
      "존댓말 어미가 음절을 잡아먹는다. 해요체로 짧게",
    ],
    brief:
      "전환율이 가장 높지만 가장 어렵다. 얼굴과 입이 동시에 맞아야 한다. 규제 표기가 둘 다 붙는다.",
  },
  {
    key: "product",
    label: "제품 클로즈업형",
    purpose: "conversion",
    photoreal: true,
    minSeconds: 15,
    maxSeconds: 30,
    audio: "voiceover",
    chaining: "independent",
    labeling: "ai",
    refs: [...PRODUCT_REFS, SPACE_REF],
    shots: [
      { no: 1, role: "질감", must: "제품 표면·재질이 가득 찬 화면", seconds: 5 },
      { no: 2, role: "형태", must: "제품 전체가 한눈에. 라벨은 합성으로 얹는다", seconds: 5 },
      { no: 3, role: "맥락", must: "실제로 놓이는 자리", seconds: 5 },
      { no: 4, role: "행동", must: "손이 제품을 집는다. 얼굴은 안 나온다", seconds: 5 },
    ],
    watchFor: [
      "AI 가 라벨 글자를 지어낸다 — 라벨은 반드시 실물 합성",
      "제품 비율이 컷마다 달라진다 — 각도컷을 4장 이상",
    ],
    brief:
      "얼굴이 없어 가상인물 표기가 빠진다. 짧고 싸고 편차가 적다. 첫 유료 상품으로 가장 안전하다.",
  },
  {
    key: "demo",
    label: "사용 시연형",
    purpose: "conversion",
    photoreal: true,
    minSeconds: 25,
    maxSeconds: 40,
    audio: "voiceover",
    chaining: "chain",
    labeling: "ai",
    refs: [...PRODUCT_REFS, SPACE_REF],
    shots: [
      { no: 1, role: "전(前)", must: "문제 상태. 같은 각도·같은 자리", seconds: 5 },
      { no: 2, role: "사용", must: "손이 제품을 쓰는 전 과정", seconds: 5 },
      { no: 3, role: "경과", must: "시간이 흘렀다는 신호", seconds: 5 },
      { no: 4, role: "후(後)", must: "1번과 **같은 각도·같은 자리.** 대비가 전부다", seconds: 5 },
    ],
    watchFor: [
      "전/후 컷의 각도가 다르면 대비가 죽는다 — 같은 레퍼런스 이미지를 두 샷에 넣는다",
      "효능을 단정하면 표시광고법에 걸린다. 변화만 보여 주고 말로 단정하지 않는다",
    ],
    brief: "얼굴 없이 설득력이 가장 높은 유형. 전/후 각도 일치가 성패를 가른다.",
  },
  {
    key: "ingredient",
    label: "원료·성분 3D형",
    purpose: "trust",
    photoreal: false,
    minSeconds: 15,
    maxSeconds: 30,
    audio: "voiceover",
    chaining: "independent",
    labeling: "ai",
    refs: [
      PRODUCT_REFS[1],
      {
        key: "ingredient_ref",
        label: "원료·성분 참고 이미지",
        min: 1,
        max: 4,
        kind: "image",
        why: "무엇을 입체로 만들 것인지 지정한다. 없으면 모델이 아무거나 만든다",
      },
    ],
    shots: [
      { no: 1, role: "원료 등장", must: "성분이 공간에 떠오른다", seconds: 5 },
      { no: 2, role: "구조", must: "확대되며 내부 구조가 보인다", seconds: 5 },
      { no: 3, role: "결합", must: "제품 형태로 모인다", seconds: 5 },
    ],
    watchFor: ["과학적 사실처럼 보이는 도식을 지어내지 않는다 — 근거 있는 것만"],
    brief:
      "**AI 티가 강점이 되는 유형.** 건기식·화장품처럼 설명이 필요한 카테고리에서 실사보다 잘 먹는다. 규제 밖이고 편차가 거의 없다.",
  },
  {
    key: "infographic",
    label: "정보 그래픽형",
    purpose: "trust",
    photoreal: false,
    minSeconds: 20,
    maxSeconds: 35,
    audio: "voiceover",
    chaining: "independent",
    labeling: "ai",
    refs: [PRODUCT_REFS[1]],
    shots: [
      { no: 1, role: "질문", must: "숫자 하나가 크게", seconds: 5 },
      { no: 2, role: "비교", must: "둘을 나란히", seconds: 5 },
      { no: 3, role: "결론", must: "제품이 답으로 놓인다", seconds: 5 },
    ],
    watchFor: [
      "화면 안 글자는 모델이 못 쓴다 — 전부 편집에서 얹는다",
      "수치는 출처가 있는 것만. 블로그 규격과 같은 기준",
    ],
    brief:
      "생성을 가장 적게 쓰는 유형. 우리가 블로그에서 이미 잘하는 일이라 원가가 제일 싸다.",
  },
  {
    key: "story",
    label: "브랜드 스토리형",
    purpose: "awareness",
    photoreal: true,
    minSeconds: 60,
    maxSeconds: 90,
    audio: "onscreen",
    chaining: "chain",
    labeling: "ai+virtual",
    refs: [...PRODUCT_REFS, TALENT_REF, SPACE_REF],
    shots: [
      { no: 1, role: "장면 1", must: "인물과 공간 소개", seconds: 5 },
      { no: 2, role: "장면 2", must: "갈등·필요", seconds: 5 },
      { no: 3, role: "장면 3", must: "제품과의 만남", seconds: 5 },
      { no: 4, role: "장면 4", must: "변화", seconds: 5 },
      { no: 5, role: "장면 5", must: "일상이 된 뒤", seconds: 5 },
      { no: 6, role: "장면 6", must: "브랜드 한 줄", seconds: 5 },
    ],
    watchFor: [
      "**롱폼의 전부는 일관성이다.** 컷이 늘수록 인물이 흐른다",
      "앞 컷의 마지막 프레임을 다음 컷의 첫 프레임으로 넘긴다(first/last-frame)",
      "컷이 많아질수록 자막 어긋남이 누적된다 — 타임라인을 손으로 쓰지 않는다",
    ],
    brief:
      "유일한 롱폼. 한 번에 긴 영상을 뽑는 모델은 없으므로 5초 조각을 이어 붙인다. 일관성 제어가 전부다.",
  },
];

export type AdFormatKey = (typeof AD_FORMATS)[number]["key"];

export function adFormat(key: string): AdFormat {
  const found = AD_FORMATS.find((f) => f.key === key);
  if (!found) {
    throw new Error(
      `알 수 없는 영상 유형: ${key} (${AD_FORMATS.map((f) => f.key).join(", ")} 중 하나)`,
    );
  }
  return found;
}

/** 이 유형이 필요로 하는 생성 초. 조각 수 × 5초 */
export function sourceSeconds(f: AdFormat): number {
  return f.shots.reduce((s, x) => s + x.seconds, 0);
}

/**
 * 화면에 박아야 하는 고지 문구. 규제가 요구하는 표시를 유형에서 자동으로 뽑는다.
 * 사람이 기억해서 넣는 구조면 언젠가 빠진다.
 */
export function disclosureText(f: AdFormat): string {
  return f.labeling === "ai+virtual"
    ? "AI 생성 영상 · 등장인물은 실존하지 않는 가상인물입니다"
    : "AI 생성 영상";
}
