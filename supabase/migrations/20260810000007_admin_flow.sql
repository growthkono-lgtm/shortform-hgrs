-- ─────────────────────────────────────────────────────────────
-- 2026-08-10 (5차) 어드민 운영 플로우
--
-- 흐름이 확정됐다.
--   진단/신청 → 가입 → 이메일 인증 → 내 프로젝트(빈 상태)
--   → [어드민] 신청 리스트에서 "적용 시작" 클릭
--   → projects 생성 + 시작 메일 발송 → 클라이언트가 단계를 본다
--
-- 결제(orders)를 거치지 않고 어드민이 직접 플랜을 적용하는 경로가 생겼다.
-- 그래서 projects.order_id 를 nullable 로 풀고 plan_id / inquiry_id 를 직접 단다.
-- ─────────────────────────────────────────────────────────────

-- ── projects ── 결제 없이도 만들어진다
alter table public.projects alter column order_id drop not null;
alter table public.projects
  add column if not exists plan_id uuid references public.plans (id) on delete restrict;
alter table public.projects
  add column if not exists inquiry_id uuid references public.inquiries (id) on delete set null;
-- 적용 시작 시각. 기획제작 요청 확정 기한(D-7)의 기준점이다
alter table public.projects add column if not exists started_at timestamptz;

create index if not exists projects_plan_id_idx on public.projects (plan_id);
create index if not exists projects_inquiry_id_idx on public.projects (inquiry_id);

-- 기존 행 이관: 주문 경유로 만들어진 프로젝트에 plan_id·started_at 채우기
update public.projects p
set plan_id = o.plan_id,
    started_at = coalesce(p.started_at, o.paid_at, p.created_at)
from public.orders o
where o.id = p.order_id and p.plan_id is null;

comment on column public.projects.started_at is '플랜 적용 시작. D-7(기획제작 요청 확정 기한) 기준점';
comment on column public.projects.order_id is '결제 경유일 때만. 어드민 직접 적용은 null';

-- ── inquiries ── 어느 프로젝트로 이어졌는지
alter table public.inquiries
  add column if not exists project_id uuid references public.projects (id) on delete set null;
alter table public.inquiries add column if not exists applied_at timestamptz;
alter table public.inquiries drop constraint if exists inquiries_status_check;
alter table public.inquiries add constraint inquiries_status_check
  check (status in ('new', 'sent', 'contacted', 'applied', 'closed'));

comment on column public.inquiries.status is 'new 접수 / sent 소개서 발송 / contacted 회신 / applied 플랜 적용 / closed 종료';

-- ── influencer_candidates ── 1차 선정 심사용 채널 후보
-- 지표는 외부 플랫폼에서 뽑아 어드민이 직접 넣는다(자동 수집 아님).
-- 클라이언트는 이 목록에서 고르고, 확정은 어드민이 한다.
create table if not exists public.influencer_candidates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  channel_url text not null,
  channel_name text not null,
  platform text not null default 'instagram'
    check (platform in ('instagram', 'youtube', 'tiktok', 'blog', 'etc')),
  thumbnail_url text,
  follower_count integer,
  content_count integer,
  avg_views integer,
  avg_comments integer,
  avg_likes integer,
  -- 평균 CPV(원). 소수점을 쓰지 않는다 — 화면에 원 단위로만 찍는다
  avg_cpv integer,
  note text,
  -- 클라이언트가 고른 후보
  selected boolean not null default false,
  selected_at timestamptz,
  -- 어드민이 최종 확정한 후보(단가 확인 후)
  confirmed boolean not null default false,
  -- "MM/DD 기준" 표기용
  snapshot_at timestamptz not null default now(),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists influencer_candidates_project_idx
  on public.influencer_candidates (project_id, sort_order);

comment on table public.influencer_candidates is '시딩 1차 선정 심사 목록. 지표는 어드민 수기 입력(외부 플랫폼 기준)';

-- ── project_guidelines ── 플랜 적용 후 클라이언트가 채우는 컨텐츠 가이드라인
-- 브랜드 프로필(brand_profiles)은 계정 단위 재사용 자산이고, 이건 캠페인 단위 입력이다
create table if not exists public.project_guidelines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects (id) on delete cascade,
  brand_intro text,
  target text,
  usp text,
  price_range text,
  tone text,
  forbidden text,
  reference_urls text,
  extra text,
  submitted_at timestamptz,
  updated_at timestamptz not null default now()
);

create trigger project_guidelines_set_updated_at
  before update on public.project_guidelines
  for each row execute function public.set_updated_at();

comment on table public.project_guidelines is '캠페인 단위 컨텐츠 가이드라인. 플랜 적용 직후 클라이언트가 채운다';

-- ── deliverables ── 미리보기를 임베드 URL로도 받는다
alter table public.deliverables add column if not exists preview_url text;
alter table public.deliverables add column if not exists title text;
alter table public.deliverables add column if not exists final_drive_link text;

comment on column public.deliverables.preview_url is '1차 완성본 미리보기 임베드 URL(드라이브·유튜브 등). 어드민이 직접 넣는다';

-- ── drive_grants ── 시딩 결과물과 최종 납품을 구분
alter table public.drive_grants
  add column if not exists kind text not null default 'final'
  check (kind in ('seeding', 'final'));
alter table public.drive_grants alter column expires_at drop not null;

comment on column public.drive_grants.kind is 'seeding 인플루언서 결과물 / final 최종 납품본';

-- ── email_log ── 자동 발송 이력. 발송 실패를 어드민에서 눈으로 확인한다
create table if not exists public.email_log (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('brochure', 'project_start', 'stage', 'other')),
  to_email text not null,
  subject text not null,
  inquiry_id uuid references public.inquiries (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  status text not null default 'sent' check (status in ('sent', 'failed', 'skipped')),
  error text,
  created_at timestamptz not null default now()
);

create index if not exists email_log_created_idx on public.email_log (created_at desc);

comment on table public.email_log is '자동 메일 발송 이력. skipped = 발송 키 미설정으로 건너뜀';

-- ── RLS ──
alter table public.influencer_candidates enable row level security;
alter table public.project_guidelines enable row level security;
alter table public.email_log enable row level security;

-- 후보 목록: 자기 프로젝트 것만 조회. 선택 토글도 server route 경유라 정책은 select만 연다
drop policy if exists "influencer_candidates_select_own" on public.influencer_candidates;
create policy "influencer_candidates_select_own" on public.influencer_candidates
  for select to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.user_id = (select auth.uid()) or (select private.is_admin()))
    )
  );

drop policy if exists "project_guidelines_select_own" on public.project_guidelines;
create policy "project_guidelines_select_own" on public.project_guidelines
  for select to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.user_id = (select auth.uid()) or (select private.is_admin()))
    )
  );

drop policy if exists "email_log_select_admin" on public.email_log;
create policy "email_log_select_admin" on public.email_log
  for select to authenticated
  using ((select private.is_admin()));
