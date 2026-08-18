-- 문의 폼 선택지 확장. (2026-08-18)
--
-- 사장님 지시로 프로젝트 종류를 넷 + 상담후결정으로 늘린다.
--   숏폼 싱글 / 숏폼 패키지 / 브랜드 SNS 채널 턴키 / AI팀 구축 / 상담 후 결정
--
-- 옛 값 셋(shorts_only·full·unsure)은 **남긴다.** 그 값으로 접수된 문의가
-- 이미 있어서 지우면 과거 데이터가 제약을 위반한다. 새 폼은 신규 값만 보낸다.
--
-- 그리고 소개서 발송 직후 contact@h-grs.com 으로 나가는 내부 알림 메일을
-- 붙이면서 email_log 의 kind 에 inquiry_notice 를 추가한다. 이걸 빼면
-- 발송은 되는데 적재가 실패해 "보낸 적 없는 메일" 이 된다.
alter table public.inquiries drop constraint if exists inquiries_interest_check;
alter table public.inquiries add constraint inquiries_interest_check
  check (interest = any (array[
    'shorts_single', 'shorts_package', 'sns_turnkey', 'ai_team', 'consult',
    -- 2026-08-18 이전 접수건
    'shorts_only', 'full', 'unsure'
  ]));

alter table public.email_log drop constraint if exists email_log_kind_check;
alter table public.email_log add constraint email_log_kind_check
  check (kind = any (array[
    'brochure', 'project_start', 'stage', 'other', 'client_todo',
    'source_ready', 'work_remind', 'work_deadline', 'preview_ready',
    'final_ready', 'project_done',
    'inquiry_notice'
  ]));
