-- 2026-08-21 발송 확인 — "보냈다" 가 아니라 "도착했다" 까지 본다
--
-- 사장님 질문: *"소개서발송이 문의들어올때 잘갔는지, 내가 재발송 누를때
-- 잘갔는지 확인할수있나?"*
--
-- 지금까지 email_log 에 남던 sent 는 **Resend 가 접수했다** 는 뜻이지
-- 상대 메일함에 들어갔다는 뜻이 아니었다. 반송(bounce)·스팸 신고는 접수
-- 이후에 일어나고, 그건 Resend 쪽에만 남아 있었다. 그 결과를 끌어와
-- 어드민 한 줄에서 같이 보이게 한다.
--
--   provider_id          Resend 메일 ID. 이게 없으면 나중에 도달 확인을 못 한다
--   delivery             Resend 의 last_event (delivered / bounced / opened …)
--   delivery_checked_at  마지막으로 물어본 시각. 안 물어본 건과 구분한다
alter table public.email_log add column if not exists provider_id text;
alter table public.email_log add column if not exists delivery text;
alter table public.email_log add column if not exists delivery_checked_at timestamptz;

comment on column public.email_log.provider_id is 'Resend 메일 ID — 도달 확인 조회 키';
comment on column public.email_log.delivery is 'Resend last_event. null = 아직 확인 안 함';

-- blocked 추가 — **2분 중복차단으로 실제로는 안 나간 건.**
-- 그동안 이 경우는 아무 기록도 남기지 않고 화면에는 성공으로 돌려줬다.
-- 화면과 실제가 어긋나는 자리는 여기 하나뿐이었고, 그래서 없앤다.
alter table public.email_log drop constraint if exists email_log_status_check;
alter table public.email_log add constraint email_log_status_check
  check (status in ('sent', 'failed', 'skipped', 'scheduled', 'blocked'));
comment on column public.email_log.status is
  'sent 접수 / failed 실패 / skipped 키 미설정 / scheduled 조용시간 예약 / blocked 중복이라 안 보냄';
