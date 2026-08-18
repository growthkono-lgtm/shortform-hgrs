-- ─────────────────────────────────────────────────────────────
-- 2026-08-14 블로그 완전 자동화 — 사람이 누르는 버튼을 없앤다
--
-- 사장님 지시: "2편부터는 내가 아무것도 할 필요 없는. 컨펌도 할 필요 없는.
-- 그저 돈 얼마 나가고 발행이 됐고 조회수 나오고 이런 거 메일 리포트만 오는."
--
-- 그래서 세 가지가 필요해졌다.
--  1. 검수를 대신할 **교정 단계** — 검사식이 걸면 모델이 고쳐서 다시 낸다
--  2. 리포트에 실을 **조회수** — 지어내지 않으려면 우리가 세야 한다
--  3. cron 실패를 삼키고 남기는 **운영 로그** — 오류 메일 대신 리포트 한 통
-- ─────────────────────────────────────────────────────────────

-- ── 1. 교정 단계 ──────────────────────────────────────────────
--
-- write 가 끝나면 바로 done 이 아니라 polish 로 간다. polish 는 검사식을
-- 돌려 통과하면 승인 도장을 찍고, 걸리면 그 항목만 고쳐서 다시 검사한다.
-- 두 번 고쳐도 안 되면 승인 없이 눕힌다 — 미달 원고는 나가지 않는다.
alter table public.blog_job
  drop constraint if exists blog_job_stage_check;

alter table public.blog_job
  add constraint blog_job_stage_check
  check (stage in ('research', 'plan', 'verify', 'write', 'polish', 'done', 'failed'));

-- 몇 번 고쳤는지. 무한 교정으로 돈이 새는 것을 막는 카운터다
alter table public.blog_job
  add column if not exists revisions integer not null default 0;

-- 마지막 검사 결과. 리포트가 "왜 보류됐는지" 를 여기서 읽는다
alter table public.blog_job
  add column if not exists audit jsonb;

-- ── 2. 조회수 ─────────────────────────────────────────────────
--
-- 리포트에 조회수를 넣으려면 어딘가에서 숫자를 가져와야 하는데,
-- Search Console 은 아직 연결 전이고 추정치를 적는 것은 금지다.
-- [[feedback_no_fabricated_metrics]] 그래서 우리가 직접 센다.
--
-- 날짜별로 쪼개 두는 이유: 총합만 두면 "이번 주에 몇 번 읽혔나" 를
-- 영영 못 만든다. 하루 한 줄이면 한 편이 1년을 살아도 365줄이다.
create table if not exists public.blog_view (
  slug text not null,
  -- 한국 날짜. UTC 로 쪼개면 저녁 발행 글의 첫날 조회가 이틀로 갈린다
  day date not null,
  views integer not null default 0,
  primary key (slug, day)
);

create index if not exists blog_view_day_idx on public.blog_view (day desc);

alter table public.blog_view enable row level security;
-- 정책 없음 = 서비스 키로만 쓴다. 카운트는 서버 라우트를 거쳐 올라간다

/**
 * 조회 1 올리기 — 한 문장으로 끝내야 한다.
 *
 * select 로 읽고 update 로 쓰면 동시 요청이 겹칠 때 숫자가 샌다.
 * on conflict do update 는 행 잠금 안에서 한 번에 끝나 그럴 일이 없다.
 */
create or replace function public.blog_view_bump(p_slug text, p_day date)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.blog_view (slug, day, views)
  values (p_slug, p_day, 1)
  on conflict (slug, day)
  do update set views = public.blog_view.views + 1;
$$;

revoke all on function public.blog_view_bump(text, date) from public;
-- 서버(서비스 키)만 부른다. 공개 클라이언트가 직접 부르면 조회수를 부풀릴 수 있다

-- ── 3. 운영 로그 ──────────────────────────────────────────────
--
-- cron-job.org 는 응답이 2xx 가 아니면 **사장님께 오류 메일을 보낸다.**
-- 08-14 새벽에 그 메일이 여러 통 왔다. 자동화의 약속은 "리포트 한 통" 인데
-- 실패할 때마다 낯선 영문 메일이 오면 약속이 깨진다.
--
-- 그래서 cron 입구는 무슨 일이 있어도 200 을 돌려주고, 실패는 여기 적는다.
-- 저녁 리포트가 이 표를 읽어 "오늘 이런 게 걸렸습니다" 를 한 줄로 알린다.
create table if not exists public.blog_ops_log (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  route text not null,
  ok boolean not null,
  note text
);

-- 리포트는 늘 "최근 것부터, 실패만" 을 찾는다
create index if not exists blog_ops_log_recent_idx
  on public.blog_ops_log (at desc)
  where ok = false;

alter table public.blog_ops_log enable row level security;

-- ── 4. 리포트 발송 이력 ───────────────────────────────────────
--
-- 리포트 cron 도 5분마다 돈다. 이력이 없으면 하루에 열 통이 간다.
create table if not exists public.blog_report_log (
  day date primary key,
  sent_at timestamptz not null default now(),
  summary text
);

alter table public.blog_report_log enable row level security;
