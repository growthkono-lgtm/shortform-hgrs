-- ─────────────────────────────────────────────────────────────
-- 2026-08-13 블로그 3차 — 번호 · 고객 이야기 · 알림 구독
--
-- 사장님 지시 세 가지를 한 번에 받는다.
--  1. "컨텐츠는 /1 2 3 이런식으로 라벨링되니?" → 회차 번호를 DB 가 든다
--  2. "고객 이야기는 기존 portfolio 에 있던 글 몇개를 8편 정도 일괄로"
--  3. "뉴스레터대신 신규 컨텐츠 알림 받기로 해서 글 올라가면 메일 바로 발송"
-- ─────────────────────────────────────────────────────────────

-- ── 1. 회차 번호 ───────────────────────────────────────────────
-- 발행 순서대로 1, 2, 3… 이 붙는다. 목록과 어드민 편성표가 같은 번호를 부르고,
-- 사장님이 "3편 고쳐" 라고 하실 때 서로 같은 글을 가리키게 하는 게 목적이다.
--
-- 왜 published_at 순번을 그때그때 계산하지 않는가: 번호는 한 번 붙으면 안
-- 변해야 한다. 계산식으로 두면 중간 글을 내렸을 때 뒷 글들의 번호가 밀린다.
-- 이미 그 번호로 공유된 링크와 어긋난다.
alter table public.blog_post
  add column if not exists seq integer;

create unique index if not exists blog_post_seq_key
  on public.blog_post (seq)
  where seq is not null;

-- ── 2. 글 종류 ─────────────────────────────────────────────────
-- insight: 키워드를 노리고 쓰는 인사이트. 규격 검사(자료 N건·표·FAQ)를 받는다
-- story:   고객 이야기. 우리가 한 프로젝트의 기록이라 외부 자료 인용이 없다.
--          같은 잣대로 검사하면 통과할 수가 없으므로 검사 항목이 다르다
alter table public.blog_post
  add column if not exists kind text not null default 'insight'
    check (kind in ('insight', 'story'));

create index if not exists blog_post_kind_idx
  on public.blog_post (kind, published_at desc);

-- 고객 이야기에 붙는 사실 정보. 본문에서 뽑지 않고 따로 든다 —
-- 목록 카드에도 쓰고 구조화 데이터에도 넣어야 해서 두 곳이 같은 값을 봐야 한다
alter table public.blog_post
  add column if not exists client_name text,
  add column if not exists client_industry text,
  add column if not exists client_period text;

-- ── 3. 신규 콘텐츠 알림 구독 ───────────────────────────────────
-- 뉴스레터가 아니다. 정기 발송물을 따로 만들지 않고, **글이 올라갈 때만**
-- 한 통 나간다. 그래서 이름도 "신규 컨텐츠 알림 받기" 다.
create table if not exists public.blog_subscriber (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  -- 어디서 구독했는지. 나중에 어느 지면이 구독을 만드는지 보려고 남긴다
  source text,
  -- 수신 거부. 행을 지우지 않는 이유: 지우면 같은 주소가 다시 구독됐을 때
  -- 예전에 거부했던 사실을 잃는다
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists blog_subscriber_email_key
  on public.blog_subscriber (lower(email));

-- 발송 이력 — 같은 글을 두 번 보내지 않기 위한 자물쇠.
-- 발송 창(오전 10시~저녁 8시)을 기다리는 동안 cron 이 여러 번 도는데,
-- 이 표가 없으면 창이 열린 순간 중복 발송이 난다
create table if not exists public.blog_notice_log (
  post_id uuid not null references public.blog_post (id) on delete cascade,
  sent_at timestamptz not null default now(),
  recipients integer not null default 0,
  primary key (post_id)
);

alter table public.blog_subscriber enable row level security;
alter table public.blog_notice_log enable row level security;
-- 정책을 만들지 않는다 = 서비스 키로만 읽고 쓴다.
-- 구독자 메일 주소는 공개 클라이언트가 절대 조회하면 안 된다
