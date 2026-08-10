/**
 * 진행 단계 어휘 — 화면·DB·어드민이 공유하는 단일 출처.
 *
 * 캠페인은 두 트랙으로 굴러간다.
 *  · 인플루언서 시딩(stage_a) — 패키지 플랜에만 있다. 싱글 플랜은 null = 해당없음
 *  · 숏폼 기획제작(stage_b)   — 모든 플랜에 있다
 *
 * key는 DB check 제약과 1:1이다. 여기 배열 순서가 곧 진행 순서이며,
 * 대시보드는 이 순서로 완료/현재/예정을 계산한다. 순서를 바꾸면 마이그레이션도 같이 고칠 것.
 */

export const SEEDING_STAGES = [
  { key: "guideline", label: "컨텐츠 가이드라인 작업중" },
  { key: "recruiting", label: "모집중" },
  { key: "confirmed", label: "확정" },
  { key: "shipping", label: "제품 및 서비스 배송중" },
  { key: "producing", label: "컨텐츠 제작중" },
  { key: "live", label: "채널 라이브 확인" },
] as const;

export const SHORTS_STAGES = [
  { key: "source", label: "소스컷 확인중" },
  { key: "planning", label: "기획중" },
  { key: "produced", label: "제작완료" },
  { key: "revising", label: "최종수정 반영중" },
  { key: "download", label: "다운로드하기" },
] as const;

export type SeedingStage = (typeof SEEDING_STAGES)[number]["key"];
export type ShortsStage = (typeof SHORTS_STAGES)[number]["key"];

/** 싱글 플랜에서 시딩 트랙 자리에 대신 놓는 문구 */
export const SEEDING_NONE = "해당없음";

export const TRACK_LABEL = {
  seeding: "인플루언서 시딩",
  shorts: "숏폼 기획제작",
} as const;

/** 신규 프로젝트의 시작 단계 */
export const FIRST_SEEDING_STAGE: SeedingStage = SEEDING_STAGES[0].key;
export const FIRST_SHORTS_STAGE: ShortsStage = SHORTS_STAGES[0].key;

/** 마지막 단계(다운로드하기)에 도달하면 진행이 끝난 것으로 본다 */
export const LAST_SHORTS_STAGE: ShortsStage =
  SHORTS_STAGES[SHORTS_STAGES.length - 1].key;

export const stageLabel = (stage: string | null | undefined) =>
  [...SEEDING_STAGES, ...SHORTS_STAGES].find((s) => s.key === stage)?.label ??
  SEEDING_NONE;

/** 현재 단계의 0-based 인덱스. 못 찾으면 -1 */
export const stageIndex = (
  stages: readonly { key: string }[],
  stage: string | null | undefined,
) => stages.findIndex((s) => s.key === stage);
