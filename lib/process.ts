/**
 * 공정 — **화면·DB·메일이 공유하는 단일 출처.** (2026-08-13 확정)
 *
 * 화면은 헤드라인 두 개로 갈린다.
 *
 *   「인플루언서 시딩」      1 컨텐츠 가이드라인 작업중 → 2 모집중
 *                          → 3 인플루언서 확정하기 → 4 제품 및 서비스 배송하기
 *                          → 5 소스컷 업로드/확인
 *   「전환형 숏폼 기획제작」  6 숏폼 기획제작 진행중 → 7 1차 완성본 컨펌 확인
 *                          → 8 최종 수정요청 반영중 → 9 최종본 다운로드/확인
 *
 * 앞 5칸은 `projects.stage_a`(준비 트랙), 뒤 4칸은 `deliverables.work_status`(편)가 정한다.
 * **둘 다 DB 값이라 화면끼리 어긋날 수 없다.**
 *
 * 이름은 두 벌이다 — 클라이언트는 "지금 뭐가 되고 있나", 작업자는 "내가 뭘 하나"로 읽는다.
 * 작업자에게 시딩 세부는 필요 없다. 소스가 왔는지 안 왔는지만 알면 되므로 한 칸으로 접는다.
 */

/**
 * 준비 트랙 — projects.stage_a 와 1:1.
 *
 * 1번은 **클라이언트가 하는 일**이다. 예전에 "컨텐츠 가이드라인 작업중"으로 적었는데
 * 그건 우리가 하는 일처럼 읽혔다. 화면의 단계 이름은 언제나 **그 단계에서 움직여야 할 사람의 일**로 적는다.
 */
export const PREP_STAGES = [
  { key: "guideline", client: "브랜드/제품 소개 작성", seedingOnly: true },
  { key: "recruiting", client: "모집중", seedingOnly: true },
  { key: "confirmed", client: "인플루언서 확정하기", seedingOnly: true },
  { key: "shipping", client: "제품 및 서비스 배송하기", seedingOnly: true },
  { key: "sources", client: "소스컷 업로드/확인", seedingOnly: false },
  // 전달이 끝나면 준비 트랙은 전부 완료로 그리고 제작 트랙으로 넘어간다
  { key: "delivered", client: "소스 전달 완료", seedingOnly: false },
] as const;

export type PrepStage = (typeof PREP_STAGES)[number]["key"];

/** 제작 트랙 — deliverables.work_status 와 1:1 */
export const WORK_STAGES = [
  {
    key: "study",
    client: "숏폼 기획제작 진행중",
    worker: "브랜드 정보 확인 및 전체 내용 숙지",
  },
  {
    key: "producing",
    client: "숏폼 기획제작 진행중",
    worker: "컨텐츠 기획제작중",
  },
  {
    key: "review",
    client: "1차 완성본 컨펌 확인",
    worker: "1차 완성본 컨펌 요청",
  },
  {
    key: "revising",
    client: "최종 수정요청 반영중",
    worker: "최종 수정 반영중",
  },
  {
    key: "done",
    client: "최종본 다운로드 / 확인",
    worker: "최종본 다운로드 전달",
  },
] as const;

export type WorkStatus = (typeof WORK_STAGES)[number]["key"];

/** 클라이언트 화면의 제작 트랙 — study·producing 은 한 칸으로 합쳐 보인다 */
export const CLIENT_WORK_STEPS = [
  { key: "producing", label: "숏폼 기획제작 진행중" },
  { key: "review", label: "1차 완성본 컨펌 확인" },
  { key: "revising", label: "최종 수정요청 반영중" },
  { key: "done", label: "최종본 다운로드 / 확인" },
] as const;

/** 작업자 화면 — 시딩 세부는 "소스 확보중" 한 칸으로 접는다 */
export const WORKER_STEPS = [
  { key: "waiting", label: "소스 대기" },
  { key: "study", label: "브랜드 정보 확인 및 전체 내용 숙지" },
  { key: "producing", label: "컨텐츠 기획제작중" },
  { key: "review", label: "1차 완성본 컨펌 요청" },
  { key: "revising", label: "최종 수정 반영중" },
  { key: "done", label: "최종본 다운로드 전달" },
] as const;

const prepIndex = (stage: string | null | undefined) =>
  PREP_STAGES.findIndex((s) => s.key === stage);

/**
 * ⚠️ **되돌리기도 건너뛰기도 없다.** (2026-08-13 확정)
 *
 * 단계는 한 방향으로만, 한 칸씩 간다. 이미 지난 단계는 무엇을 확정했는지 **읽을 수만** 있다.
 * 되돌릴 수 있게 두면 이미 나간 알림 메일과 화면이 어긋나고, 건너뛰게 두면
 * 소스 없이 제작이 시작되는 식으로 앞 단계의 전제가 깨진다.
 */

/** 소스 전달이 끝났는가 — 이게 준비 트랙과 제작 트랙을 가르는 유일한 선이다 */
export const sourcesDelivered = (stageA: string | null | undefined) =>
  stageA === "delivered";

/** 이 플랜에서 실제로 보여 줄 준비 단계 (화면이 쓰는 형태로) */
export const prepSteps = (
  hasSeeding: boolean,
): readonly { key: string; label: string }[] =>
  PREP_STAGES.filter((s) => s.key !== "delivered")
    .filter((s) => hasSeeding || !s.seedingOnly)
    .map((s) => ({ key: s.key, label: s.client }));

/** 준비 단계 한 칸의 상태 */
export function prepState(
  key: string,
  stageA: string | null | undefined,
): "done" | "active" | "todo" {
  if (sourcesDelivered(stageA)) return "done";
  const now = prepIndex(stageA);
  const me = prepIndex(key);
  if (me < now) return "done";
  if (me === now) return "active";
  return "todo";
}

const workIndex = (status: string | null | undefined) =>
  WORK_STAGES.findIndex((s) => s.key === status);

/** 제작 단계 한 칸의 상태. 소스 전달 전이면 전부 대기다 */
export function workState(
  key: string,
  status: string | null | undefined,
  delivered: boolean,
): "done" | "active" | "todo" {
  if (!delivered) return "todo";
  // 클라이언트 화면은 study 를 따로 그리지 않는다 — producing 칸이 대신 받는다
  const now = Math.max(workIndex(status), 1);
  const me = workIndex(key);
  if (me < now) return "done";
  if (me === now) return "active";
  return "todo";
}

export const clientWorkLabel = (status: string | null | undefined) =>
  WORK_STAGES.find((s) => s.key === status)?.client ?? "—";

export const workerLabel = (status: string | null | undefined) =>
  WORK_STAGES.find((s) => s.key === status)?.worker ?? "—";

/** 지금 공이 누구에게 있는지 */
export const workStageActor = (status: string | null | undefined) =>
  status === "review" ? "client" : status === "done" ? "none" : "worker";

/**
 * 편별 마감 — **주당 2건 기준.**
 * 소스 전달 시점에서 1·2편은 +7일, 3·4편은 +14일 … 로 순차로 밀린다.
 */
export function dueDateFor(deliveredAt: Date, seq: number) {
  const weeks = Math.ceil(seq / 2);
  const d = new Date(deliveredAt);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

/** 화면에 그대로 쓰는 작업 기한 안내 */
export const DUE_RULE = "주 2편 기준 · 편당 7일";
