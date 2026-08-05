-- ─────────────────────────────────────────────────────────────
-- HGRS 숏폼 부스팅 — 초기 스키마 (마스터 스펙 PART F3)
--
-- 원칙:
--  · brand는 자기 user_id 행만 select. 쓰기·상태전이는 전부 server route(service_role) 경유
--  · 결제 금액은 서버에서 plans 기준 재검증 — 클라이언트 금액 불신
--  · RLS 정책의 auth.uid()는 (select auth.uid())로 감싸 행마다 재호출되지 않게 한다
--  · FK 컬럼에는 전부 인덱스 (Postgres가 자동 생성하지 않음)
-- ─────────────────────────────────────────────────────────────

-- ── profiles ── auth.users 1:1 확장
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  company_name text not null,
  contact_name text not null,
  phone text,
  role text not null default 'brand' check (role in ('brand', 'admin')),
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'auth.users 확장. role=admin은 대시보드에서 수동 승격';
comment on column public.profiles.marketing_opt_in is '뉴스레터 수신 동의 — 저장만, 발송은 추후';

-- ── brand_profiles ── 최초 1회 작성 후 전 주문이 재사용 (PART E1)
create table public.brand_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  brand_name text not null,
  source_url text,
  -- 그로스 AI가 구조화한 확정본: 브랜드소개/USP/타겟/가격대/톤앤매너/금지표현/경쟁맥락
  profile jsonb not null default '{}'::jsonb,
  -- AI 분석 원본 (URL 크롤 결과·업로드 파일 추출 텍스트) — 재분석용 보관
  profile_raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index brand_profiles_user_id_idx on public.brand_profiles (user_id);

-- ── plans ── 상품 마스터. 정가 확정 시 이 테이블만 고치면 전 화면 반영 (PART G)
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null check (code in ('full', 'shorts_only')),
  tier text not null,
  label text not null,
  composition text not null,
  influencer_count integer not null default 0 check (influencer_count >= 0),
  shorts_count integer not null check (shorts_count > 0),
  list_price integer not null check (list_price > 0),
  beta_price integer not null check (beta_price > 0),
  -- 헤드 전략 리뷰 제공 티어 (스케일 / 플랜2 20편) — 베타 한정
  head_review boolean not null default false,
  recommended boolean not null default false,
  sort_order integer not null default 0,
  -- 스케일 티어는 챌린지비 재검산 후 게시 → false로 두면 랜딩에서 숨김 (PART I-2)
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint plans_code_tier_unique unique (code, tier),
  constraint plans_beta_lte_list check (beta_price <= list_price)
);

comment on column public.plans.active is 'false면 랜딩·결제에서 제외. 스케일 티어 비공개 런칭 옵션에 사용';

-- ── orders ── 결제 (PART F4)
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  plan_id uuid not null references public.plans (id) on delete restrict,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'canceled', 'refunded')),
  -- 토스 결제위젯 연동 값
  toss_payment_key text,
  toss_order_id text not null unique,
  -- 서버가 plans.beta_price로 재검증한 확정 금액
  amount integer not null check (amount > 0),
  paid_at timestamptz,
  -- 세금계산서 발행용 (어드민 수동 발행)
  biz_reg_number text,
  tax_invoice_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_user_id_idx on public.orders (user_id);
create index orders_plan_id_idx on public.orders (plan_id);
create index orders_status_idx on public.orders (status);
-- 동일 결제키 중복 승인 차단
create unique index orders_toss_payment_key_idx
  on public.orders (toss_payment_key)
  where toss_payment_key is not null;

-- ── projects ── 진행 파이프라인 상태 머신 (PART E2)
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete restrict,
  brand_profile_id uuid references public.brand_profiles (id) on delete set null,
  type text not null check (type in ('full', 'shorts_only')),
  -- A 구간: 플랜2(shorts_only)는 null
  stage_a text check (stage_a in ('waiting', 'reviewing', 'recruiting', 'distributed')),
  -- B 구간: 항상 진행
  stage_b text not null default 'guideline'
    check (stage_b in ('guideline', 'targeting', 'producing', 'review', 'final', 'done')),
  recruit_deadline date,
  campaign_input jsonb not null default '{}'::jsonb,
  guideline_ai jsonb,
  guideline_confirmed_at timestamptz,
  head_review_status text
    check (head_review_status in ('available', 'requested', 'scheduled', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- 플랜1은 stage_a 필수, 플랜2는 반드시 null
  constraint projects_stage_a_matches_type check (
    (type = 'full' and stage_a is not null)
    or (type = 'shorts_only' and stage_a is null)
  )
);

create index projects_user_id_idx on public.projects (user_id);
create index projects_brand_profile_id_idx on public.projects (brand_profile_id);
-- 어드민 리스트: 단계 필터 + 체류일 정렬
create index projects_stage_b_updated_idx on public.projects (stage_b, updated_at desc);
create index projects_head_review_idx on public.projects (head_review_status)
  where head_review_status is not null;

-- ── influencer_posts ── 인스타 수집 스냅샷 (PART F5)
create table public.influencer_posts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  instagram_url text,
  content_url text,
  handle text not null,
  thumbnail_url text,
  follower_count integer,
  post_count integer,
  -- "MM/DD 기준" 표기용. 실시간 재조회하지 않는다
  snapshot_at timestamptz,
  posted_at timestamptz,
  created_at timestamptz not null default now()
);

create index influencer_posts_project_id_idx on public.influencer_posts (project_id);

comment on column public.influencer_posts.snapshot_at is '수집 시점. 대시보드에 "MM/DD 기준"으로 노출';

-- ── deliverables ── 숏폼 산출물 (PART F6)
create table public.deliverables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  -- index는 예약어라 seq로
  seq integer not null check (seq > 0),
  -- ffmpeg 워터마크 번인 프록시 (Storage). 원본은 절대 여기 두지 않는다
  preview_path text,
  final_drive_file_id text,
  status text not null default 'producing'
    check (status in ('producing', 'preview', 'revision', 'approved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint deliverables_project_seq_unique unique (project_id, seq)
);

create index deliverables_project_id_idx on public.deliverables (project_id);

-- ── revision_requests ── 수정 요청 (무상 1회)
create table public.revision_requests (
  id uuid primary key default gen_random_uuid(),
  deliverable_id uuid not null references public.deliverables (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete restrict,
  message text not null,
  round integer not null default 1 check (round > 0),
  created_at timestamptz not null default now(),
  -- 무상 라운드는 딜리버러블당 1회 — DB에서 강제
  constraint revision_requests_deliverable_round_unique unique (deliverable_id, round)
);

create index revision_requests_deliverable_id_idx on public.revision_requests (deliverable_id);
create index revision_requests_user_id_idx on public.revision_requests (user_id);

-- ── agreements ── 최종 확인 약관 동의 (PART F8)
create table public.agreements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete restrict,
  terms_version text not null,
  agreed_at timestamptz not null default now(),
  ip_address inet,
  -- 다운로드일 + 5개월 (인플루언서 출연 컷 포함 소재 광고 사용기간)
  usage_expires_at date not null
);

create index agreements_project_id_idx on public.agreements (project_id);
create index agreements_user_id_idx on public.agreements (user_id);

-- ── drive_grants ── Google Drive 전달 + 14일 만료 (PART F7)
create table public.drive_grants (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  drive_folder_id text not null,
  drive_link text not null,
  granted_at timestamptz not null default now(),
  -- 발급 + 14일. expirationTime 미지원 시 Cron이 이 값으로 스캔해 권한 삭제
  expires_at timestamptz not null,
  revoked boolean not null default false
);

create index drive_grants_project_id_idx on public.drive_grants (project_id);
-- Cron 만료 스캔용
create index drive_grants_expiry_sweep_idx on public.drive_grants (expires_at)
  where revoked = false;

-- ─────────────────────────────────────────────────────────────
-- updated_at 자동 갱신
-- ─────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger brand_profiles_set_updated_at
  before update on public.brand_profiles
  for each row execute function public.set_updated_at();

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create trigger deliverables_set_updated_at
  before update on public.deliverables
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 가입 시 profiles 자동 생성
-- 가입 폼의 회사명·담당자명·연락처는 raw_user_meta_data로 전달받는다
-- ─────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, company_name, contact_name, phone, marketing_opt_in)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'company_name', ''),
    coalesce(new.raw_user_meta_data ->> 'contact_name', ''),
    new.raw_user_meta_data ->> 'phone',
    coalesce((new.raw_user_meta_data ->> 'marketing_opt_in')::boolean, false)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
