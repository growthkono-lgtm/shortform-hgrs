/**
 * 편집 설정 — **선택바로 고르고, 기본값은 고정.** (2026-08-16 신설)
 *
 * 사장님 지시: *"영상의 템포 조절과 자막 위치 조절도 선택바가 있고
 * 기본 설정은 고정되어 있고 해야 할 것 같아."*
 *
 * 지금까지 이 값들은 `adfilm-spec.ts` 안에 상수로 박혀 있어서, 한 편만 다르게
 * 가려면 코드를 고쳐야 했다. 그러면 결국 아무도 안 바꾸고, 모든 영상이 같은
 * 리듬으로 나온다. 값을 밖으로 꺼내되 **기본값은 우리 규격에 고정**한다.
 *
 * ⚠️ 기본값은 취향이 아니라 실측이다. 컷 1.8초·나레이션 8.5자/초는 레퍼런스
 * 광고를 역산해서 얻은 값이고, **사운드의 공백이 곧 이탈**이라 하한이 있다.
 * 느리게 고르는 건 가능하지만 그건 광고가 아니라 브랜드 필름 쪽 선택이다.
 */

export type Option<T> = {
  key: string;
  label: string;
  value: T;
  /** 이 선택이 무엇을 바꾸는지 — 어드민 선택바 밑에 그대로 붙는다 */
  note: string;
};

/** 컷이 바뀌는 속도. 짧을수록 정보량이 늘고 이탈이 준다 */
export const TEMPO_OPTIONS: Option<number>[] = [
  { key: "fast", label: "빠름 1.4초", value: 1.4, note: "훅·전환 소재. 30초에 21컷" },
  { key: "default", label: "기본 1.8초", value: 1.8, note: "우리 규격. 30초에 17컷", },
  { key: "slow", label: "느림 2.4초", value: 2.4, note: "브랜드 필름·시니어 타깃. 30초에 12컷" },
];

/** 나레이션 밀도(자/초). 낮으면 여백이 생기고, 여백은 이탈이다 */
export const NARRATION_OPTIONS: Option<number>[] = [
  { key: "rapid", label: "속사포 9.5자/초", value: 9.5, note: "정보량 최대. 자막 없으면 안 들린다" },
  { key: "default", label: "기본 8.5자/초", value: 8.5, note: "우리 규격. 30초에 12문장" },
  { key: "easy", label: "여유 7.0자/초", value: 7.0, note: "시니어·전문 설명. 대신 분량이 준다" },
];

/** 문장과 문장 사이 침묵 */
export const GAP_OPTIONS: Option<number>[] = [
  { key: "tight", label: "붙임 0.08초", value: 0.08, note: "숨 쉴 틈 없이 이어진다" },
  { key: "default", label: "기본 0.12초", value: 0.12, note: "우리 규격" },
  { key: "breath", label: "여유 0.25초", value: 0.25, note: "한 문장씩 곱씹게 한다" },
];

/** 자막이 화면 어디에 앉는가 — 세로 위치(0=최상단, 1=최하단) */
export const CAPTION_POSITION_OPTIONS: Option<number>[] = [
  { key: "top", label: "상단", value: 0.14, note: "얼굴이 화면 아래쪽에 있을 때" },
  { key: "middle", label: "중앙", value: 0.5, note: "제품컷·인포그래픽. 인물컷에는 안 쓴다" },
  { key: "lower", label: "하단 올림", value: 0.72, note: "인스타 UI(하단 아이콘)를 피한다" },
  { key: "bottom", label: "하단", value: 0.84, note: "우리 규격. 기본값" },
];

/** 자막 줄 수 */
export const CAPTION_LINES_OPTIONS: Option<number>[] = [
  { key: "one", label: "1층", value: 1, note: "우리 규격. 8~11자로 끊어 1.2~2초마다 교체" },
  { key: "two", label: "2층", value: 2, note: "긴 문장을 통째로 보여 줄 때만. 시선이 분산된다" },
];

export type FilmSettings = {
  /** 컷 목표 길이(초) */
  tempo: number;
  /** 나레이션 밀도(자/초) */
  narrationCps: number;
  /** 문장 간격(초) */
  gap: number;
  /** 자막 세로 위치 (0~1) */
  captionY: number;
  /** 자막 줄 수 */
  captionLines: number;
};

/**
 * 기본값 — 아무것도 안 고르면 이 값으로 간다.
 * 우리 규격 그대로이며, 여기를 바꾸는 것은 규격을 바꾸는 일이다.
 */
export const DEFAULT_SETTINGS: FilmSettings = {
  tempo: 1.8,
  narrationCps: 8.5,
  gap: 0.12,
  captionY: 0.84,
  captionLines: 1,
};

/** 선택값을 설정으로 — 어드민 선택바가 이 함수를 부른다 */
export function settingsFrom(choice: Partial<Record<keyof FilmSettings, string>>): FilmSettings {
  const pick = <T>(opts: Option<T>[], key: string | undefined, fallback: T): T =>
    (key ? opts.find((o) => o.key === key)?.value : undefined) ?? fallback;

  return {
    tempo: pick(TEMPO_OPTIONS, choice.tempo, DEFAULT_SETTINGS.tempo),
    narrationCps: pick(NARRATION_OPTIONS, choice.narrationCps, DEFAULT_SETTINGS.narrationCps),
    gap: pick(GAP_OPTIONS, choice.gap, DEFAULT_SETTINGS.gap),
    captionY: pick(CAPTION_POSITION_OPTIONS, choice.captionY, DEFAULT_SETTINGS.captionY),
    captionLines: pick(CAPTION_LINES_OPTIONS, choice.captionLines, DEFAULT_SETTINGS.captionLines),
  };
}

/**
 * 이 설정에서 한 컷에 들어갈 수 있는 글자 수.
 *
 * 대본을 쓸 때 이 값을 넘기면 말이 컷을 넘어간다 — 그게 v10 에서 자막과
 * 소리가 어긋난 원인 중 하나였다. 검사식이 이 값으로 센다.
 */
export function charsPerShot(s: FilmSettings, seconds: number): number {
  return Math.floor((seconds - s.gap) * s.narrationCps);
}

/** 30초에 몇 컷이 들어가는가 — 선택바 옆에 바로 보여 준다 */
export function cutsIn(s: FilmSettings, totalSeconds = 30): number {
  return Math.round(totalSeconds / s.tempo);
}
