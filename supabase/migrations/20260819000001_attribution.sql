-- ─────────────────────────────────────────────────────────────
-- 유입 → 전환을 잇는다. (2026-08-19)
--
-- 사장님 질문: *"프로젝트신청이 들어온 한 건이 블로그 어떤 경로로 처음
-- 유입됐는지 알 수 있어?"*
--
-- 답은 **아니오** 였다. 지금까지 신청에 남는 건 IP 와 User-Agent 뿐이고,
-- 어느 페이지로 처음 들어왔는지·어디서 왔는지는 **기록한 적이 없다.**
-- 08-18 자보티바 두 건도 "폼이 /sns-brand 에 있었다" 까지만 알 수 있다.
-- 그건 유입 경로가 아니라 폼의 위치다.
--
-- 그래서 세 가지를 새로 만든다.
--
--   1. inquiries 의 첫 접점 칸 — 이 사람이 **처음 우리 사이트에 닿은 곳**
--   2. blog_visit          — 전환 전에 어떤 편들을 봤나 (어시스트)
--   3. blog_post_week      — 글별 성적을 **7일 단위**로 계속 갱신
--
-- 왜 blog_post_week 를 따로 두나: `blog_post_metric` 은 D+7·21·60 세 번만
-- 재는 고정 검침이라 "이번 주에 이 글로 몇 명이 들어와 몇 건이 됐나" 를
-- 볼 수 없다. 사장님이 원하는 건 깔때기의 **각 단 모수와 전환율**이고,
-- 그건 구간 값이어야 한다. 둘은 목적이 다르니 겹쳐 두는 게 맞다.
-- ─────────────────────────────────────────────────────────────

-- ── 1. 신청 한 건의 첫 접점 ────────────────────────────────────
alter table public.inquiries
  -- 브라우저에 심는 익명 방문자 id. 이름·이메일과 달리 **우리가 준 값**이라
  -- 사람을 특정하지 않는다. 이게 있어야 방문(익명)과 신청(실명)이 이어진다
  add column if not exists visitor_id text,
  -- 처음 착지한 경로. `/blog/xxx` 면 그 글이 데려온 것이다
  add column if not exists first_path text,
  -- 그때의 리퍼러 원문. 검색엔진인지 인스타인지 직접입력인지가 여기 남는다
  add column if not exists first_referrer text,
  add column if not exists first_at timestamptz,
  -- utm_* 파라미터 묶음. 광고를 돌릴 때를 위해 지금부터 받아 둔다
  add column if not exists utm jsonb,
  -- 첫 착지가 블로그였다면 그 회차. 글을 지워도 신청은 남아야 하므로 set null
  add column if not exists entry_post_id uuid
    references public.blog_post (id) on delete set null,
  -- 첫 착지는 아니지만 전환 전에 읽은 편들(어시스트). 순서대로
  add column if not exists assist_post_ids uuid[];

create index if not exists inquiries_entry_post_idx
  on public.inquiries (entry_post_id);
create index if not exists inquiries_visitor_idx
  on public.inquiries (visitor_id);

comment on column public.inquiries.first_path is
  '이 사람이 우리 사이트에 처음 착지한 경로 (2026-08-19부터 기록)';
comment on column public.inquiries.entry_post_id is
  '첫 착지가 블로그였다면 그 회차. 콘텐츠 → 전환을 잇는 유일한 실측 연결';

-- ── 2. 방문자별 블로그 조회 ────────────────────────────────────
-- `blog_view` 는 슬러그·날짜별 **합계**라 사람이 안 보인다. 합계로는
-- "이 신청자가 뭘 읽고 왔나" 를 영영 알 수 없다. 그래서 행을 따로 남긴다.
--
-- 방문자·글 한 쌍당 한 행이다. 같은 글을 열 번 봐도 한 행 — 조회수는 이미
-- blog_view 가 세고 있고, 여기서 궁금한 건 "봤나/안 봤나" 다.
create table if not exists public.blog_visit (
  visitor_id text not null,
  slug text not null,
  first_seen timestamptz not null default now(),
  -- 이 글이 그 사람의 **첫 착지**였나. 데려온 글과 지나가다 본 글은 다르다
  landing boolean not null default false,
  primary key (visitor_id, slug)
);

create index if not exists blog_visit_slug_idx on public.blog_visit (slug);
create index if not exists blog_visit_seen_idx on public.blog_visit (first_seen desc);

comment on table public.blog_visit is
  '방문자 × 글. 신청이 들어왔을 때 무엇을 읽고 왔는지 되짚는 용도 (2026-08-19)';

alter table public.blog_visit enable row level security;
-- 익명 방문 기록이다. 읽기는 어드민(service_role)만 — 공개할 값이 아니다
drop policy if exists "blog visit service only" on public.blog_visit;
create policy "blog visit service only" on public.blog_visit
  for all using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ── 3. 글별 주간 성적 ─────────────────────────────────────────
-- 깔때기 네 단을 한 줄에 모은다.
--
--   노출  검색 결과에 뜬 횟수      (Search Console)
--   클릭  거기서 눌린 횟수          (Search Console)
--   조회  우리 페이지가 열린 횟수    (blog_view, 실측)
--   전환  그 글로 들어와 신청한 건수 (inquiries.entry_post_id)
--
-- 클릭과 조회가 따로인 이유: 검색 말고도(인스타·직접·타사이트) 들어온다.
-- 둘을 하나로 뭉치면 어느 쪽이 일했는지 알 수 없다.
create table if not exists public.blog_post_week (
  post_id uuid not null references public.blog_post (id) on delete cascade,
  -- 그 주 월요일 (KST). 주가 열려 있는 동안 계속 덮어쓴다
  week_start date not null,
  impressions integer not null default 0,
  clicks integer not null default 0,
  -- 평균 게재순위. 노출이 0 이면 null — 0 위라고 적지 않는다
  position numeric(5, 1),
  views integer not null default 0,
  inquiries integer not null default 0,
  captured_at timestamptz not null default now(),
  primary key (post_id, week_start)
);

create index if not exists blog_post_week_week_idx
  on public.blog_post_week (week_start desc);

comment on table public.blog_post_week is
  '글별 7일 성적 — 노출·클릭·조회·전환 네 단. 매일 갱신되고 주가 바뀌면 새 행 (2026-08-19)';

alter table public.blog_post_week enable row level security;
create policy "post week readable"
  on public.blog_post_week for select using (true);
create policy "post week service write"
  on public.blog_post_week for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ── 방문 기록 upsert ──────────────────────────────────────────
-- /api/blog/view 가 부른다. 이미 본 글이면 아무것도 바꾸지 않는다 —
-- first_seen 은 **처음** 본 시각이어야 하고, landing 도 처음 값이 진짜다
create or replace function public.blog_visit_mark(
  p_visitor text, p_slug text, p_landing boolean
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.blog_visit (visitor_id, slug, landing)
  values (p_visitor, p_slug, p_landing)
  on conflict (visitor_id, slug) do nothing;
$$;

revoke all on function public.blog_visit_mark(text, text, boolean) from public;
grant execute on function public.blog_visit_mark(text, text, boolean) to service_role;
