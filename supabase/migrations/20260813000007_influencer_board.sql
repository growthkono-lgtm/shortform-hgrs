-- ─────────────────────────────────────────────────────────────
-- 2026-08-13 (7차) 인플루언서 보드 — 선정 현황 · 콘텐츠 검수 · 모아보기
--
-- 흐름이 바뀌었다. **1차 선정 심사(클라이언트가 고르는 단계)는 없앤다.**
-- 인플루언서는 사장님이 다른 플랫폼에서 이미 선정해 온다. 우리 화면이 하는 일은
-- 링크와 인스타명만 받아 **보기 좋은 카드로 만들어 주는 것**이고,
-- 클라이언트는 "누가 확정됐는지"와 "무엇을 올렸는지"만 본다.
--
-- 거절/재선정 카운트도 두지 않는다. 사장님이 인원을 채워 넣으므로
-- 클라이언트 화면에는 언제나 확정된 명단만 보이면 된다.
--
-- ⚠️ 리워드·CPV 는 클라이언트 화면에서 뺀다. 인플루언서 단가가 보이면
--    패키지 금액에서 우리 마진이 역산된다. 어드민에서만 관리한다.
-- ─────────────────────────────────────────────────────────────

-- ── 후보 카드에 필요한 것 ──
alter table public.influencer_candidates
  add column if not exists bio text,
  add column if not exists category text,
  -- 최근 게시물 썸네일 3장. Apify 응답의 latestPosts 에서 뽑는다(이미 받아오고 있었다)
  add column if not exists latest_posts jsonb not null default '[]'::jsonb;

comment on column public.influencer_candidates.bio is '인스타 프로필 소개글. 카테고리 추정과 카드 표시에 쓴다';
comment on column public.influencer_candidates.category is '뷰티·패션·먹방 등. bio 키워드로 추정하고 어드민이 고칠 수 있다';
comment on column public.influencer_candidates.latest_posts is '[{thumbnail, url}] 최근 게시물 3장';

-- ── 콘텐츠 검수 · 모아보기 ──
-- 인플루언서가 올린 게시물을 등록하면 클라이언트가 확인하고 수정 요청할 수 있다.
create table if not exists public.influencer_contents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  candidate_id uuid references public.influencer_candidates (id) on delete set null,
  -- 등록 시점에 박아 둔다. 후보가 지워져도 누가 올린 건지는 남아야 한다
  handle text not null,
  permalink text not null,
  thumbnail_url text,
  caption text,
  view_count integer,
  like_count integer,
  comment_count integer,
  posted_at timestamptz,
  -- 검수 흐름: pending(확인 전) → approved(검수 완료) / revision(수정 요청)
  review_status text not null default 'pending'
    check (review_status in ('pending', 'approved', 'revision')),
  revision_note text,
  reviewed_at timestamptz,
  collected_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint influencer_contents_permalink_unique unique (project_id, permalink)
);

create index if not exists influencer_contents_project_idx
  on public.influencer_contents (project_id, posted_at desc);
create index if not exists influencer_contents_candidate_idx
  on public.influencer_contents (candidate_id);

comment on table public.influencer_contents is
  '인플루언서가 올린 게시물. 검수(클라이언트 확인/수정요청)와 콘텐츠 모아보기가 이 표를 함께 쓴다';

alter table public.influencer_contents enable row level security;

drop policy if exists influencer_contents_select_own on public.influencer_contents;
create policy influencer_contents_select_own on public.influencer_contents
  for select to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.user_id = (select auth.uid()) or (select private.is_admin()))
    )
  );

-- 기존 후보는 전부 확정된 것으로 본다 — 1차 심사가 없어졌으므로
update public.influencer_candidates set confirmed = true where confirmed = false;
