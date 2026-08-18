-- ─────────────────────────────────────────────────────────────
-- 2026-08-14 원고 자동 생성 — 이어 달리는 작업표
--
-- 사장님 지시: "2편부터 만드는 건 내가 말해야 하는 게 아니라 이제 자동."
-- 발행 당일 아침에 스스로 원고를 만들고, 15시에 검수 메일을 보내고,
-- 승인하시면 17시에 나간다. 주 3회가 계속 돈다.
--
-- ⚠️ 왜 한 번에 안 만들고 표를 두는가:
-- 조사→기획→검증→집필 전 과정이 5~10분 걸린다. Vercel 함수는 300초에서
-- 끊긴다. 한 호출에 다 하려다 중간에 끊기면 **가장 비싼 조사(웹 검색 12회)가
-- 통째로 날아간다.** 실제로 2026-08-13 에 그 일을 겪었다.
--
-- 그래서 단계마다 결과를 여기 적어 두고, cron 이 다음 호출에서 이어받는다.
-- 어느 단계에서 죽어도 그 앞 단계는 살아남는다.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.blog_job (
  id uuid primary key default gen_random_uuid(),

  -- 어느 회차를 위한 작업인가. 하루에 한 편이라 이 값이 곧 자물쇠다
  scheduled_for date not null,

  -- 무엇을 쓸지 (편성표에서 가져온다)
  pillar text not null,
  format text not null,
  topic text not null,
  segment text,
  keyword_term text,

  -- research: 조사 / plan: 기획 / verify: 자료 검증 / write: 집필
  -- done: 어드민에 올라감 / failed: 사람이 봐야 함
  stage text not null default 'research'
    check (stage in ('research', 'plan', 'verify', 'write', 'done', 'failed')),

  -- 단계별 산출물. 다음 단계가 이걸 읽어 이어 간다
  research text,
  plan jsonb,
  sources jsonb,
  post_id uuid references public.blog_post (id) on delete set null,

  -- 같은 단계를 무한히 다시 밟지 않게 센다. 한계를 넘으면 failed 로 눕힌다
  attempts integer not null default 0,
  last_error text,

  -- 이 한 편에 얼마가 들었는지. 사장님이 어드민에서 보셔야 하는 값이다
  cost_usd numeric(10, 4),
  search_count integer,

  -- 두 호출이 같은 작업을 동시에 잡는 것을 막는다. cron 이 5분마다 도는데
  -- 조사가 4분 걸리면 다음 호출과 겹칠 수 있다
  locked_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 하루에 한 편. 같은 날짜로 두 번 만들지 못하게 막는다
create unique index if not exists blog_job_day_key
  on public.blog_job (scheduled_for);

-- cron 이 훑는 줄 — 아직 안 끝난 작업만
create index if not exists blog_job_pending_idx
  on public.blog_job (stage, updated_at)
  where stage not in ('done', 'failed');

alter table public.blog_job enable row level security;
-- 정책 없음 = 서비스 키로만. 작업 내용은 공개 클라이언트가 볼 일이 없다
