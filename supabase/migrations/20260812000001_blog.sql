-- ─────────────────────────────────────────────────────────────
-- 2026-08-12 블로그 — 기획(키워드) → 제작(회차) 두 정거장
--
-- 어제 자체 /blog 를 만들었다가 같은 날 접었다("글도 이미지도 구성도 형편없다").
-- 손으로 한 편씩 쓰는 방식으로는 품질이 안 나온다는 결론이었고, 이번엔
-- 편성표·키워드 전략을 먼저 세우고 거기서 원고를 뽑는 구조로 다시 짓는다.
--
-- ⚠️ 편성 필러와 글 유형은 **여기 테이블로 두지 않는다.** `lib/blog-spec.ts` 의
-- 코드 상수다. 그 값들이 생성 프롬프트와 발행 검사식에 동시에 들어가기 때문에
-- DB 로 빼면 두 벌이 되어 어긋난다. DB 가 들고 있어야 하는 건 "무엇을 쓸지"
-- (키워드)와 "무엇을 썼는지"(회차) 두 가지뿐이다.
-- ─────────────────────────────────────────────────────────────

-- ── 키워드 보드 ────────────────────────────────────────────────
-- 벤치마크(비에이티)는 헤드텀 하나를 완벽 가이드로 먹고 그 아래 롱테일을
-- 여러 편으로 받는다. 그 구조를 굴리려면 어떤 검색어를 이미 썼고 어떤 게
-- 남았는지가 한 화면에 보여야 한다. 같은 검색어로 두 편을 쓰면 서로 순위를
-- 깎아먹는다(카니발라이제이션).
create table if not exists public.blog_keyword (
  id uuid primary key default gen_random_uuid(),
  -- lib/blog-spec.ts 의 PILLARS 키. 코드가 단일 출처라 여기선 열거하지 않는다
  pillar text not null,
  term text not null,
  -- head: 상위 개념 헤드텀(가이드형으로 통째로 먹는다) / long: 롱테일
  tier text not null default 'long' check (tier in ('head', 'long')),
  -- 검색량·난이도는 실제 수집 경로를 붙이기 전까지 비워 둔다.
  -- 손으로 채워 넣은 추정치는 근거 없는 숫자라 판단을 흐린다
  volume integer,
  note text,
  -- idle: 미착수 / planned: 기획됨 / done: 발행 완료 / dropped: 안 씀
  status text not null default 'idle'
    check (status in ('idle', 'planned', 'done', 'dropped')),
  created_at timestamptz not null default now()
);

-- 같은 검색어를 두 번 등록하지 못하게 막는다 — 중복 등록이 곧 중복 발행이 된다
create unique index if not exists blog_keyword_term_key
  on public.blog_keyword (lower(term));
create index if not exists blog_keyword_board_idx
  on public.blog_keyword (pillar, status);

-- ── 회차 ──────────────────────────────────────────────────────
create table if not exists public.blog_post (
  id uuid primary key default gen_random_uuid(),
  pillar text not null,
  -- lib/blog-spec.ts 의 FORMATS 키 (guide/trend/case/howto)
  format text not null,
  -- 이 글이 노리는 키워드. 키워드를 지워도 발행된 글은 남아야 하므로 set null
  keyword_id uuid references public.blog_keyword (id) on delete set null,

  title text not null,
  slug text not null,
  -- 기획 산출물(BlogPlan). 본문이 마음에 안 들 때 구성안만 고쳐 다시 돌린다
  plan jsonb not null,
  -- 마크다운 본문. 기획만 하고 멈춘 상태면 null
  body text,

  -- 발행 전 검사 결과(scripts/blog-audit.ts 와 같은 기준). 미달이면 발행 못 한다
  chars integer,
  read_minutes integer,
  audit jsonb,

  -- 썸네일 1장만. 본문 도판은 쓰지 않는다(시각 요소는 표) — 2026-08-12 결정
  thumbnail_url text,

  status text not null default 'planned'
    check (status in ('planned', 'drafted', 'review', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 슬러그는 곧 URL 이다. 대소문자 섞인 중복까지 막는다
create unique index if not exists blog_post_slug_key
  on public.blog_post (lower(slug));
-- 외래키 컬럼은 인덱스가 자동으로 생기지 않는다 — 조인과 set null 이 느려진다
create index if not exists blog_post_keyword_idx
  on public.blog_post (keyword_id);
-- 공개 목록: 발행분만 최신순. 부분 인덱스라 초안이 인덱스를 부풀리지 않는다
create index if not exists blog_post_published_idx
  on public.blog_post (published_at desc)
  where status = 'published';
create index if not exists blog_post_board_idx
  on public.blog_post (status, created_at desc);

-- ── RLS ───────────────────────────────────────────────────────
alter table public.blog_keyword enable row level security;
alter table public.blog_post enable row level security;

-- 키워드 보드는 전략 자료다. 어드민만 본다.
-- 쓰기는 server action(service_role)만 — 정책을 열지 않으면 그쪽만 통과한다
drop policy if exists "blog_keyword_select_admin" on public.blog_keyword;
create policy "blog_keyword_select_admin" on public.blog_keyword
  for select to authenticated
  using ((select private.is_admin()));

-- 발행된 글은 누구나 읽는다. 초안은 어드민만.
-- is_admin() 을 select 로 감싸야 행마다 재실행되지 않는다
drop policy if exists "blog_post_select_published" on public.blog_post;
create policy "blog_post_select_published" on public.blog_post
  for select to anon, authenticated
  using (status = 'published');

drop policy if exists "blog_post_select_admin" on public.blog_post;
create policy "blog_post_select_admin" on public.blog_post
  for select to authenticated
  using ((select private.is_admin()));

comment on table public.blog_keyword is '블로그 키워드 보드. 무엇을 아직 안 썼는지와 중복 발행 방지가 목적';
comment on table public.blog_post is '블로그 회차. plan(기획) → body(제작) → published 순으로 진행';
comment on column public.blog_post.plan is 'lib/blog-ai.ts 의 BlogPlan. 제작 단계의 입력값이라 다시 입력하는 구간이 없다';
comment on column public.blog_post.audit is 'scripts/blog-audit.ts 규격 검사 결과. fail 이 있으면 발행 차단';
