-- ─────────────────────────────────────────────────────────────
-- RLS — brand는 자기 데이터만 읽는다.
--
-- 원칙 (PART F3):
--  · brand에게는 SELECT만 연다. 쓰기·상태전이는 전부 server route가 service_role로 수행
--    → service_role은 RLS를 우회하므로 별도 정책 불필요
--  · 예외 2개(검수 수정요청, 약관 동의)도 server route를 거친다.
--    클라이언트가 직접 stage를 밀 수 있으면 상태 머신이 무너지기 때문
--  · auth.uid()는 (select auth.uid())로 감싼다 — 행마다 재호출되면 대량 조회에서 느려진다
-- ─────────────────────────────────────────────────────────────

-- 어드민 판별용. profiles 정책이 profiles를 다시 참조하면 무한 재귀가 나므로
-- security definer로 RLS를 우회해 조회한다
create schema if not exists private;

create or replace function private.is_admin()
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
      and role = 'admin'
  );
$$;

revoke execute on function private.is_admin() from public, anon, authenticated;

-- ── profiles ──
alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));

-- 연락처·회사명 정도는 본인이 직접 고칠 수 있게 한다.
-- role만은 못 바꾸도록 with check로 고정
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and role = (select p.role from public.profiles p where p.id = (select auth.uid()))
  );

-- ── brand_profiles ──
alter table public.brand_profiles enable row level security;

create policy brand_profiles_select_own on public.brand_profiles
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

-- ── plans ── 공개 상품 정보. 비로그인 랜딩에서도 읽어야 한다
alter table public.plans enable row level security;

create policy plans_select_active on public.plans
  for select to anon, authenticated
  using (active = true);

-- ── orders ──
alter table public.orders enable row level security;

create policy orders_select_own on public.orders
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

-- ── projects ──
alter table public.projects enable row level security;

create policy projects_select_own on public.projects
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

-- ── influencer_posts ── 소속 프로젝트의 소유자만
alter table public.influencer_posts enable row level security;

create policy influencer_posts_select_own on public.influencer_posts
  for select to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1 from public.projects p
      where p.id = influencer_posts.project_id
        and p.user_id = (select auth.uid())
    )
  );

-- ── deliverables ──
alter table public.deliverables enable row level security;

create policy deliverables_select_own on public.deliverables
  for select to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1 from public.projects p
      where p.id = deliverables.project_id
        and p.user_id = (select auth.uid())
    )
  );

-- ── revision_requests ──
alter table public.revision_requests enable row level security;

create policy revision_requests_select_own on public.revision_requests
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

-- ── agreements ──
alter table public.agreements enable row level security;

create policy agreements_select_own on public.agreements
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

-- ── drive_grants ──
alter table public.drive_grants enable row level security;

create policy drive_grants_select_own on public.drive_grants
  for select to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1 from public.projects p
      where p.id = drive_grants.project_id
        and p.user_id = (select auth.uid())
    )
  );
