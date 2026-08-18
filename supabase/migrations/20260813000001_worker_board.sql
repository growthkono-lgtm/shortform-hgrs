-- ─────────────────────────────────────────────────────────────
-- 2026-08-13 작업자 대시보드
--
-- 영상 기획·제작 작업자가 쓰는 별도 표면을 만든다.
-- 이 표면은 **우리 회사·서비스·가격의 존재를 알려주지 않는다.**
-- 그래서 규칙이 하나 있다 —
--
--   작업자에게 나가는 데이터는 profiles / plans / orders / inquiries 를
--   **한 번도 조인하지 않는다.** 화면에서 숨기는 게 아니라 쿼리에 넣지 않는다.
--
-- 그 대가로 두 가지가 새로 필요하다.
--  1) 프로젝트를 부를 이름 — 브랜드명 대신 work_code (W-0001)
--  2) 브랜드 식별정보를 걷어낸 작업 브리프 — work_briefs (클라 가이드라인의 파생물)
--
-- 작업 단위는 프로젝트가 아니라 **편(deliverables 행)** 이다.
-- 편마다 담당자가 다를 수 있고, 클라 피드백도 편 단위로 돌아온다.
-- ─────────────────────────────────────────────────────────────

-- ── 롤 ── brand / admin 에 worker 를 더한다
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('brand', 'admin', 'worker'));

comment on column public.profiles.role is
  'brand 클라이언트 / admin 운영자 / worker 외부 작업자(작업자 대시보드 전용)';

-- 작업자 판별. is_admin 과 같은 이유로 private 스키마의 security definer 다
create or replace function private.is_worker()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'worker'
  );
$$;

revoke execute on function private.is_worker() from public, anon;
grant execute on function private.is_worker() to authenticated;

-- ── projects.work_code ── 작업자가 프로젝트를 부르는 유일한 이름
-- 브랜드명·회사명·플랜명이 들어가면 안 된다. 순번만 쓴다.
create sequence if not exists public.work_code_seq as integer start 1;

alter table public.projects
  add column if not exists work_code text unique;

update public.projects
set work_code = 'W-' || lpad(nextval('public.work_code_seq')::text, 4, '0')
where work_code is null;

-- 새 프로젝트는 DB 가 채운다. 앱 코드에 두면 언젠가 null 인 행이 생긴다
alter table public.projects
  alter column work_code
  set default 'W-' || lpad(nextval('public.work_code_seq')::text, 4, '0');

comment on column public.projects.work_code is
  '작업자 표면에서 쓰는 프로젝트 표기. 브랜드·플랜을 유추할 수 있는 문자열 금지';

-- ── work_briefs ── 브랜드 식별정보를 걷어낸 작업 지시서
--
-- project_guidelines(클라 원본)를 그대로 주면 상호·제품명·사이트가 다 실린다.
-- AI 로 한 번 걸러 만든 뒤 어드민이 검수하고, published_at 이 찍혀야 작업자에게 보인다.
-- 검수 전에는 작업자 화면에 "브리프 준비중"만 뜬다.
create table if not exists public.work_briefs (
  project_id uuid primary key references public.projects (id) on delete cascade,
  -- 브랜드명이 아니라 카테고리로 부른다. 예) 반려견 영양처방식
  category text,
  offer text,
  target text,
  usp text,
  tone text,
  forbidden text,
  must_include text,
  reference_note text,
  -- 시딩 소스컷을 어떻게 쓸지에 대한 지시
  source_note text,
  ai_generated_at timestamptz,
  ai_model text,
  -- 어드민 검수 완료 시각. null 이면 작업자에게 보이지 않는다
  published_at timestamptz,
  updated_at timestamptz not null default now()
);

drop trigger if exists work_briefs_set_updated_at on public.work_briefs;
create trigger work_briefs_set_updated_at
  before update on public.work_briefs
  for each row execute function public.set_updated_at();

comment on table public.work_briefs is
  '작업자용 브리프. 상호·브랜드명·도메인 등 식별정보를 제거한 파생본. published_at 이후에만 노출';

-- ── deliverables ── 편 단위 작업 상태
--
-- 기존 status 는 **클라이언트가 보는 값**이다(producing/preview/revision/approved).
-- work_status 는 **작업자와 우리가 보는 값**이고 둘은 승인 시점에만 만난다.
-- 한 컬럼으로 합치지 않는 이유: 작업자가 제출했다고 클라에게 바로 나가면 안 된다.
alter table public.deliverables
  add column if not exists assignee_id uuid references public.profiles (id) on delete set null;

alter table public.deliverables
  add column if not exists work_status text not null default 'brief';

alter table public.deliverables drop constraint if exists deliverables_work_status_check;
alter table public.deliverables add constraint deliverables_work_status_check check (
  work_status in (
    'brief',       -- 브리프 확인 (배정 직후)
    'planning',    -- 기획 작성중
    'plan_review', -- 기획안 검수중 (우리)
    'producing',   -- 제작중
    'submitted',   -- 제출 검수중 (우리)
    'delivered',   -- 클라이언트 검토중
    'revising',    -- 수정 반영중
    'done'         -- 완료
  )
);

alter table public.deliverables
  add column if not exists plan_note text,
  add column if not exists work_url text,
  add column if not exists due_date date,
  add column if not exists revision_round integer not null default 0,
  add column if not exists worker_updated_at timestamptz;

comment on column public.deliverables.work_status is
  '작업자 트랙. 클라이언트가 보는 status 와 별개 — 승인 시점에만 동기화한다';
comment on column public.deliverables.work_url is '작업자가 올린 결과물 링크. 승인되면 preview_url 로 복사된다';
comment on column public.deliverables.assignee_id is 'profiles.role = worker. 배정되지 않은 편은 작업자에게 보이지 않는다';

-- 작업자 대시보드의 기본 쿼리: 내 배정분을 마감 순으로
create index if not exists deliverables_assignee_idx
  on public.deliverables (assignee_id, due_date)
  where assignee_id is not null;

-- 어드민 검수 큐: 손이 필요한 것만
create index if not exists deliverables_work_status_idx
  on public.deliverables (work_status, worker_updated_at desc);

-- ── work_notes ── 우리 ↔ 작업자 대화. 반려 사유도 여기 남는다
create table if not exists public.work_notes (
  id uuid primary key default gen_random_uuid(),
  deliverable_id uuid not null references public.deliverables (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete restrict,
  -- 화면에서 좌우를 가르는 값. profiles 를 조인하지 않으려고 비정규화했다
  author_role text not null check (author_role in ('admin', 'worker')),
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists work_notes_deliverable_idx
  on public.work_notes (deliverable_id, created_at);
create index if not exists work_notes_author_idx on public.work_notes (author_id);

comment on table public.work_notes is
  '편 단위 작업 메모. 작업자에게 보이므로 브랜드명·금액을 적지 않는다';

-- ── drive_grants.label ── 소스 폴더가 여러 개일 때 작업자가 구분할 이름
alter table public.drive_grants add column if not exists label text;
comment on column public.drive_grants.label is '작업자 화면에 뜨는 폴더 이름. 브랜드명 금지';

-- ── 기존 프로젝트 편 채우기 ──
-- 편 행이 있어야 배정을 걸 수 있다. 지금까지는 어드민이 저장할 때만 만들어졌다.
insert into public.deliverables (project_id, seq)
select p.id, s.seq
from public.projects p
join public.plans pl on pl.id = p.plan_id
cross join lateral generate_series(1, greatest(coalesce(pl.shorts_count, 0), 0)) as s(seq)
on conflict (project_id, seq) do nothing;

-- ── RLS ──
-- 작업자 표면은 서버 액션(service_role)으로만 읽고 쓴다. 브라우저에서 Supabase 를
-- 직접 부르지 않으므로 authenticated 롤에는 아무것도 열지 않는다.
alter table public.work_briefs enable row level security;
alter table public.work_notes enable row level security;

drop policy if exists work_briefs_select_admin on public.work_briefs;
create policy work_briefs_select_admin on public.work_briefs
  for select to authenticated
  using ((select private.is_admin()));

drop policy if exists work_notes_select_admin on public.work_notes;
create policy work_notes_select_admin on public.work_notes
  for select to authenticated
  using ((select private.is_admin()));

-- deliverables 는 기존 정책(브랜드 = 자기 프로젝트)을 그대로 둔다.
-- 작업자에게 열지 않는 이유: 열면 assignee 가 아닌 편까지 anon 키로 긁을 수 있다.
