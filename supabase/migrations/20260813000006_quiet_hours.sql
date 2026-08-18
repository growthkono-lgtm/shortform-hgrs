-- 2026-08-13 (6차) 조용시간 — KST 20:00~10:00 발송 금지, 그 시간 알림은 다음 10시로 예약
alter table public.email_log drop constraint if exists email_log_status_check;
alter table public.email_log add constraint email_log_status_check
  check (status in ('sent', 'failed', 'skipped', 'scheduled'));
comment on column public.email_log.status is
  'sent 발송 / failed 실패 / skipped 키 미설정 / scheduled 조용시간이라 예약';
