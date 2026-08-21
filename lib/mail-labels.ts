/** 메일 화면에서 쓰는 한글 라벨 — 어드민 여러 곳이 같은 말을 쓰게 한 곳에 둔다 */

export const MAIL_KIND_LABEL: Record<string, string> = {
  brochure: "소개서",
  project_start: "프로젝트 시작",
  stage: "단계 안내",
  client_todo: "브랜드 할 일",
  source_ready: "소스 준비됨",
  work_remind: "작업 알림",
  work_deadline: "마감 알림",
  preview_ready: "1차본 안내",
  final_ready: "최종본 안내",
  project_done: "프로젝트 종료",
  inquiry_notice: "문의 알림(내부)",
  other: "기타",
};

/**
 * 발송 상태 — **화면에 뜬 말과 실제가 어긋나지 않게** 쓴다.
 * 특히 blocked 는 "성공" 이 아니다. 중복이라 **안 나간 것**이다.
 */
export const MAIL_STATUS_LABEL: Record<
  string,
  { text: string; tone: "good" | "bad" | "wait" }
> = {
  sent: { text: "발송 접수", tone: "good" },
  scheduled: { text: "예약됨", tone: "wait" },
  blocked: { text: "중복이라 안 보냄", tone: "wait" },
  skipped: { text: "건너뜀(키 없음)", tone: "bad" },
  failed: { text: "실패", tone: "bad" },
};
