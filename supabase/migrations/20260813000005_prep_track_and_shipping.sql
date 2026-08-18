-- ─────────────────────────────────────────────────────────────
-- 2026-08-13 (5차) 준비 트랙 재정의 · 배송 관리 · 소스 전달
--
-- 공정이 확정됐다. 화면은 헤드라인 두 개로 갈린다.
--
--   「인플루언서 시딩」   1 컨텐츠 가이드라인 작업중 → 2 모집중
--                        → 3 인플루언서 확정하기 → 4 제품 및 서비스 배송하기
--                        → 5 소스컷 업로드/확인
--   「전환형 숏폼 기획제작」 6 숏폼 기획제작 진행중 → 7 1차 완성본 컨펌 확인
--                        → 8 최종 수정요청 반영중 → 9 최종본 다운로드/확인
--
-- 바뀐 것 셋:
--  1) stage_a 가 "시딩 트랙"에서 **준비 트랙**이 된다. 소스컷 단계(sources)가 끝에 붙고,
--     시딩이 없는 싱글 플랜도 이 트랙을 쓴다 — 소스컷 업로드는 두 플랜 공통이기 때문이다.
--     (싱글은 sources 한 칸으로 시작한다)
--  2) 「담당자 브랜드 압축 스터디중」을 뺐다. 클라이언트가 볼 단계가 아니다.
--  3) 소스 전달 시점(source_delivered_at)이 **작업 시계의 0시**다. 마감·리마인드가 여기서 계산된다.
-- ─────────────────────────────────────────────────────────────

-- ── 준비 트랙 ──
alter table public.projects drop constraint if exists projects_stage_a_check;
alter table public.projects drop constraint if exists projects_stage_a_matches_type;

-- 뒤 두 단계(컨텐츠 제작중·채널 라이브 확인)는 소스컷 구간으로 접는다
update public.projects set stage_a = 'sources'
where stage_a in ('producing', 'live');

-- 싱글 플랜도 소스컷 칸이 필요하다. 비어 있던 행을 채운다
update public.projects set stage_a = 'sources'
where stage_a is null;

alter table public.projects
  add constraint projects_stage_a_check check (
    stage_a in ('guideline', 'recruiting', 'confirmed', 'shipping', 'sources', 'delivered')
  );

alter table public.projects alter column stage_a set default 'sources';

comment on column public.projects.stage_a is
  '준비 트랙. 패키지는 guideline 부터, 싱글은 sources 부터. delivered = 소스 전달 완료(작업 시작)';

-- ── 작업 시계의 0시 ──
alter table public.projects
  add column if not exists source_delivered_at timestamptz;

comment on column public.projects.source_delivered_at is
  '[작업자에게 전달하기] 누른 시각. 편별 마감(주당 2건 기준 7일)과 리마인드가 전부 여기서 계산된다';

-- ── 배송 관리 ── 어드민이 수기로 채우고, 브랜드가 행마다 발송완료를 누른다
create table if not exists public.seeding_shipments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  influencer_name text not null,
  product text,
  quantity text,
  option text,
  address text,
  phone text,
  -- 송장번호 등. 필요할 때만 쓴다
  note text,
  shipped_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists seeding_shipments_project_idx
  on public.seeding_shipments (project_id, sort_order);

comment on table public.seeding_shipments is
  '시딩 배송 리스트. 어드민이 채우고 브랜드가 행마다 [발송완료]를 누른다. 미처리 행은 리마인드 메일 대상';

alter table public.seeding_shipments enable row level security;

drop policy if exists seeding_shipments_select_own on public.seeding_shipments;
create policy seeding_shipments_select_own on public.seeding_shipments
  for select to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.user_id = (select auth.uid()) or (select private.is_admin()))
    )
  );

-- ── 소스컷 폴더 ── drive_grants.kind 는 그대로 쓴다(seeding = 소스 폴더)

-- ── 메일 종류 확장 ──
alter table public.email_log drop constraint if exists email_log_kind_check;
alter table public.email_log add constraint email_log_kind_check check (
  kind in (
    'brochure', 'project_start', 'stage', 'other',
    'client_todo',      -- 배송/소스 업로드 방치 리마인드
    'source_ready',     -- 소스 전달 → 작업자에게 작업 시작 안내
    'work_remind',      -- 전달 48시간 후 진행 확인
    'work_deadline',    -- 마감 24시간 전
    'preview_ready',    -- 1차 완성본 올라옴 → 클라이언트 확인 요청
    'final_ready',      -- 최종본 올라옴 → 클라이언트 확인 요청
    'project_done'      -- 최종본 다운로드 → 양쪽에 완료 통지
  )
);

-- 같은 메일을 하루에 두 번 보내지 않기 위한 조회용
create index if not exists email_log_kind_project_idx
  on public.email_log (kind, project_id, created_at desc);

-- ── 리마인드 발송 이력 ── 편 단위로 한 번만 보낸다
alter table public.deliverables
  add column if not exists remind_48h_at timestamptz,
  add column if not exists remind_24h_at timestamptz;

comment on column public.deliverables.remind_48h_at is '진행 확인 리마인드 발송 시각. 한 번만 보낸다';
comment on column public.deliverables.remind_24h_at is '마감 24시간 전 리마인드 발송 시각. 한 번만 보낸다';
