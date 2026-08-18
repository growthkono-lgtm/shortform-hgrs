-- ─────────────────────────────────────────────────────────────
-- 2026-08-14 AI 광고영상 공장 — 작업자 보드에서 돌린다
--
-- 사장님 지시: "작업자 계정 하나를 더 만들어서 그 작업자 보드에 프롬프트를
-- UI로 옮겨놓고 기획제작 공장처럼 돌리고 싶거든."
--
-- ⚠️ sora 를 '긁어오는' 게 아니다. API 로 이미 부르고 있고, 여기 필요한 건
-- **그 호출을 사람이 눌러서 반복할 수 있는 표**다. 한 편이 컷 3개로 이뤄지고
-- 컷마다 생성이 4~8분 걸리므로, 진행 상태를 DB 에 남기지 않으면 작업자가
-- 브라우저를 닫는 순간 어디까지 됐는지 아무도 모른다.
--
-- 블로그의 `blog_job` 과 같은 구조다 — 단계마다 적어 두고 이어 달린다.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.adfilm (
  id uuid primary key default gen_random_uuid(),

  -- 어느 편을 위한 영상인가. 기존 산출물 표에 붙는다
  deliverable_id uuid references public.deliverables (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,

  -- 누가 돌리고 있나
  assignee_id uuid references public.profiles (id) on delete set null,

  -- 콘티 — 컷마다 {role, seconds, prompt, videoId, status}
  -- jsonb 로 두는 이유: 컷 수가 유형마다 달라서 표를 또 쪼개면 조회가 번거롭다
  storyboard jsonb not null default '[]'::jsonb,

  -- 지금 어디까지 왔나
  stage text not null default 'draft'
    check (stage in ('draft', 'generating', 'composing', 'review', 'done', 'failed')),

  -- sora 가 돌려준 마지막 영상 id. 이어붙이기(extension)가 이 값을 받는다
  video_id text,
  /** 완성본 — 자막·나레이션까지 얹은 파일 */
  final_url text,
  seconds integer,

  -- 돈. 블로그와 같은 원칙 — 추정하지 않고 실측을 적는다
  cost_usd numeric(10, 4) default 0,

  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists adfilm_assignee_idx
  on public.adfilm (assignee_id, stage);

alter table public.adfilm enable row level security;
-- 정책 없음 = 서비스 키로만. 작업자 화면은 전부 서버 액션을 거친다
