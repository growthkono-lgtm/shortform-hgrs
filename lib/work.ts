/**
 * 작업자 대시보드 — 어휘와 규칙의 단일 출처.
 *
 * ⚠️ 이 파일과 app/work/** 는 `lib/constants.ts`(SERVICE·ORG)를 **절대 import 하지 않는다.**
 * 작업자 표면에는 회사명·서비스명·도메인·금액이 한 글자도 나가지 않는다.
 */

export const WORK_APP = {
  name: "작업자 대시보드",
  short: "작업자 대시보드",
} as const;

// 단계 정의는 `lib/process.ts` 하나뿐이다. 여기서 다시 짓지 않고 그대로 내보낸다
export {
  WORK_STAGES,
  WORKER_STEPS,
  workerLabel,
  clientWorkLabel,
  workStageActor,
  sourcesDelivered,
  dueDateFor,
  type WorkStatus,
} from "./process";
import { WORK_STAGES as STAGES, type WorkStatus } from "./process";

export const workStageIndex = (status: string | null | undefined) =>
  STAGES.findIndex((s) => s.key === status);

/** 작업자가 지금 손댈 차례인 편 */
export const WORKER_TURN: readonly WorkStatus[] = ["study", "producing", "revising"];

/**
 * 작업자가 스스로 넘기는 전이. **검수 게이트는 없다** — 단계는 작업자가 민다.
 *
 * review 에서 앞으로 가는 길(→ revising / → done)은 클라이언트가 연다.
 * 작업자가 자기 결과물을 스스로 "확인 완료"로 넘길 수는 없어야 하기 때문이다.
 */
export const WORKER_TRANSITIONS: Record<string, WorkStatus | undefined> = {
  study: "producing",
  producing: "review",
  revising: "review",
};

export const WORKER_ACTION_LABEL: Record<string, string> = {
  study: "브리프 확인 완료 · 제작 시작",
  producing: "1차 완성본 제출",
  revising: "수정본 제출",
};

/** 제출하려면 결과물 링크가 있어야 하는 단계 */
export const NEEDS_WORK_URL: readonly WorkStatus[] = ["producing", "revising"];

/** 작업자가 지금 무엇을 하면 되는지 한 줄. 화면 맨 위에 그대로 쓴다 */
export const WORKER_GUIDE: Record<string, string> = {
  waiting:
    "아직 소스가 오지 않았습니다. 인플루언서 시딩이 끝나고 소스가 전달되면 메일로 알려드립니다.",
  study:
    "브랜드 정보를 읽고 전체 내용을 숙지해 주세요. 자료가 더 필요하면 아래에서 세부 분석을 돌릴 수 있습니다.",

  producing:
    "이 편의 컨텐츠를 기획하고 제작해 주세요. 구성은 담당자 재량입니다. 완성되면 링크를 넣고 제출합니다.",
  review: "제출 완료. 클라이언트 확인을 기다리는 중입니다.",
  revising: "수정 요청을 반영해 주세요. 반영본 링크를 넣고 다시 제출합니다.",
  done: "이 편은 마무리됐습니다.",
};

/**
 * 업로드 파일명 규칙 (2026-08-13 확정) —
 *   `{브랜드명}_#{편번호}_{컨텐츠명}_{완성날짜}_{v1|fin}`
 *
 * 예) `모엔_#03_수의사인터뷰_20260813_v1.mp4` → 수정 반영 후 `..._20260815_fin.mp4`
 *
 * 버전은 둘뿐이다. **v1 = 1차 완성본, fin = 최종본.** 중간 버전을 열어 두면
 * 폴더에 v2·v3·진짜최종 이 쌓이고 어느 게 납품본인지 아무도 모르게 된다.
 */
export function buildFileName(input: {
  brand: string;
  seq: number;
  title: string;
  final: boolean;
  date?: Date;
  ext?: string;
}) {
  const d = input.date ?? new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate(),
  ).padStart(2, "0")}`;
  // 공백·경로 구분자는 파일명을 깨뜨린다. 밑줄은 구분자라 본문에 못 쓴다
  const safe = (v: string) =>
    v.trim().replace(/[\\/:*?"<>|\s]+/g, "-").replace(/_+/g, "-");
  const parts = [
    safe(input.brand || "브랜드"),
    `#${String(input.seq).padStart(2, "0")}`,
    safe(input.title || "무제"),
    stamp,
    input.final ? "fin" : "v1",
  ];
  return parts.join("_") + (input.ext ? `.${input.ext}` : "");
}

/** 화면 아래에 그대로 깔아 주는 규칙 설명 */
export const FILE_NAME_GUIDE =
  "브랜드명_#편번호_컨텐츠명_완성날짜_버전 (1차는 v1, 최종은 fin). 예) 모엔_#03_수의사인터뷰_20260813_v1.mp4";

/** 프로젝트 폴더 이름 — 클라이언트가 가입할 때 쓴 브랜드명 + 신청한 플랜 */
export const projectFolderName = (brand: string, plan: string) =>
  [brand?.trim() || "브랜드", plan?.trim()].filter(Boolean).join("_");

/**
 * 링크 검증 — 작업자가 아무 문자열이나 붙여넣는 걸 막는다.
 */
export function isAllowedWorkUrl(raw: string) {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return false;
    return [
      "drive.google.com",
      "docs.google.com",
      "youtube.com",
      "www.youtube.com",
      "youtu.be",
      "vimeo.com",
      "player.vimeo.com",
      "notion.so",
      "www.notion.so",
      "frame.io",
      "dropbox.com",
      "www.dropbox.com",
    ].includes(url.hostname);
  } catch {
    return false;
  }
}

/** D-day 뱃지. 지난 건 음수로 돌려준다 */
export function daysLeft(due: string | null | undefined) {
  if (!due) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${due}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}
