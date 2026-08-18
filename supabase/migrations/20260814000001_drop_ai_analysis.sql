-- ─────────────────────────────────────────────────────────────
-- 2026-08-14 브랜드 AI 세부분석 제거
--
-- 쓸 사람이 없다. 작업자는 자기가 쓰던 AI 로 알아서 하고, 클라이언트는 그 결과를 볼 이유가 없다.
-- 아무도 안 누르는 버튼 하나가 남으면 그 버튼이 부르는 API 비용·상한·실패 처리까지
-- 계속 관리 대상으로 남는다. 기능을 지울 때는 저장 자리부터 지운다.
--
-- 브랜드 정보는 사람이 쓰는 두 칸(manual_note / client_note)만 남는다.
-- ─────────────────────────────────────────────────────────────

alter table public.work_briefs
  drop column if exists ai_analysis,
  drop column if exists ai_analysis_at;

comment on table public.work_briefs is
  '프로젝트 단위 브랜드 정보. manual_note(어드민 수기) → client_note(클라 코멘트) 순서로 읽힌다';
