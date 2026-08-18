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

/**
 * 숏폼 트랙 — **클라이언트가 보는 라벨**이다.
 *
 * key 는 `lib/work.ts` 의 WORK_STAGES 와 같은 값을 쓴다. 작업자가 편을 넘기면
 * DB 트리거가 가장 뒤처진 편의 상태를 projects.stage_b 로 밀어 넣고, 이 배열이
 * 그 값을 클라이언트 말로 옮긴다. 두 벌을 사람이 맞춰 누르지 않는다.
 */
export const SHORTS_STAGES = [
  { key: "study", label: "담당자 브랜드 압축 스터디중" },
  { key: "producing", label: "숏폼 기획제작 진행중" },
  { key: "review", label: "1차 완성본 컨펌 확인" },
  { key: "revising", label: "최종 수정요청 반영중" },
  { key: "done", label: "최종본 다운로드 / 확인" },
] as const;

export type SeedingStage = (typeof SEEDING_STAGES)[number]["key"];
export type ShortsStage = (typeof SHORTS_STAGES)[number]["key"];

/**
 * ⚠️ "전체 공정" 한 줄은 없앴다.
 *
 * 시딩(stage_a)과 숏폼(stage_b)은 **병렬로 도는 두 트랙**인데 이걸 순차 한 줄로 접으니
 * 시딩이 "모집중"인데도 전체 공정에서는 시딩이 완료(✓)로 찍히는 거짓 표시가 나왔다.
 * 두 트랙을 각자 그대로 보여 주는 게 정확하다.
 */

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
