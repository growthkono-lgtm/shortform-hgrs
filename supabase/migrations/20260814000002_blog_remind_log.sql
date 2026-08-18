-- 2026-08-14 발행일 사전 알림 중복 방지
-- cron 이 5분마다 도는데, 이 표가 없으면 11시부터 계속 메일이 나간다
create table if not exists public.blog_remind_log (
  day date primary key,
  sent_at timestamptz not null default now()
);
alter table public.blog_remind_log enable row level security;
