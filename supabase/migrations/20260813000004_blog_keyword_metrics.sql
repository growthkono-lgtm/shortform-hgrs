-- ─────────────────────────────────────────────────────────────
-- 2026-08-13 키워드 실측 지표 + 주간 이력, 그리고 회차 확장
--
-- 08-12 에 만든 blog_keyword 는 term/tier/status 만 들고 있었다. 실제로 돌려
-- 보니 그것만으로는 편성 순서를 못 정한다 — 내가 주제라고 잡아 둔 16개가
-- 네이버 검색광고 조회에서 **전부 월 10회 미만**이었다. 주제와 검색어는 다르다.
--
-- 그래서 두 가지를 넣는다.
--  1. 키워드에 실측 지표를 붙인다 (PC/모바일 검색량·클릭수·CTR·경쟁도)
--  2. 그 지표를 **주간 스냅샷**으로 쌓는다 — 순위와 검색량은 계속 바뀌고,
--     "지난주 대비 오른 키워드"가 다음 주 편성의 근거가 되기 때문이다.
--     현재값만 덮어쓰면 그 변화를 영영 못 본다.
--
-- 지표 출처는 네이버 검색광고 키워드도구 API 다(scripts/keyword-expand.mjs).
-- 크롤링이 아니라 공식 API 라 클라이언트 서비스로 재사용해도 문제가 없다.
-- ─────────────────────────────────────────────────────────────

-- ── 키워드 실측 지표 ──────────────────────────────────────────
-- 값은 전부 nullable 이다. 조회에 실패한 키워드를 0 으로 채우면
-- "검색량 없음"과 "아직 안 재봄"이 구분되지 않는다.
alter table public.blog_keyword
  add column if not exists pc_volume integer,
  add column if not exists mobile_volume integer,
  -- 정렬·필터에 가장 많이 쓰이는 값이라 계산해 두지 않고 컬럼으로 둔다
  add column if not exists total_volume integer,
  add column if not exists pc_clicks numeric(10, 2),
  add column if not exists mobile_clicks numeric(10, 2),
  add column if not exists pc_ctr numeric(6, 3),
  add column if not exists mobile_ctr numeric(6, 3),
  -- 네이버가 주는 3단계: 낮음/중간/높음. 열거형으로 묶지 않는다(네이버가 바꾸면 배포가 막힌다)
  add column if not exists competition text,
  add column if not exists ad_depth numeric(6, 2),
  -- 씨앗에서 확장된 연관어인지, 사람이 직접 넣은 것인지
  add column if not exists source text not null default 'naver_searchad',
  add column if not exists refreshed_at timestamptz;

-- 편성 화면의 기본 정렬: 검색량 큰 것부터. 부분 인덱스로 미측정분을 뺀다
create index if not exists blog_keyword_volume_idx
  on public.blog_keyword (total_volume desc nulls last)
  where status <> 'dropped';

-- upsert 용 유니크 제약.
-- 08-12 에 만든 것은 `lower(term)` 표현식 인덱스인데, PostgREST 의 on_conflict 는
-- 표현식 인덱스를 대상으로 잡지 못한다(42P10). 주간 갱신이 upsert 라서 필요하다.
-- 표현식 인덱스는 대소문자 변형 중복을 막는 용도로 그대로 둔다.
alter table public.blog_keyword
  drop constraint if exists blog_keyword_term_unique;
alter table public.blog_keyword
  add constraint blog_keyword_term_unique unique (term);

-- ── 주간 스냅샷 ───────────────────────────────────────────────
-- 같은 키워드를 매주 다시 재서 쌓는다. 덮어쓰지 않는 이유는 위 주석 참고.
create table if not exists public.blog_keyword_metric (
  id uuid primary key default gen_random_uuid(),
  keyword_id uuid not null
    references public.blog_keyword (id) on delete cascade,
  -- 그 주의 월요일 날짜. 주 단위로 한 행만 남게 하는 기준
  week date not null,
  pc_volume integer,
  mobile_volume integer,
  total_volume integer,
  pc_ctr numeric(6, 3),
  mobile_ctr numeric(6, 3),
  competition text,
  collected_at timestamptz not null default now()
);

-- 같은 주에 두 번 돌려도 행이 두 개가 되지 않는다 (upsert 대상)
create unique index if not exists blog_keyword_metric_week_key
  on public.blog_keyword_metric (keyword_id, week);
create index if not exists blog_keyword_metric_trend_idx
  on public.blog_keyword_metric (week desc);

-- ── 회차 확장 ─────────────────────────────────────────────────
alter table public.blog_post
  -- 메인 1 + 서브 2 구성. 서브는 본문에 자연스럽게 깔리는 연관어다
  add column if not exists sub_keyword_ids uuid[] not null default '{}',
  -- 검증을 통과한 실물 자료(lib/blog-sources.ts 의 Source[]).
  -- 08-13 개편의 핵심이라 본문과 같은 무게로 저장한다 — 자료 없는 글은 발행 못 한다
  add column if not exists sources jsonb not null default '[]'::jsonb,
  -- 편성된 발행 예정 시각. 이 값 20분 전에 검수 요청 메일이 나간다
  add column if not exists scheduled_for timestamptz,
  add column if not exists notified_at timestamptz,
  -- 사장님 승인 기록. 승인 없이는 status 가 published 로 가지 않는다
  add column if not exists approved_at timestamptz,
  add column if not exists reject_note text;

create index if not exists blog_post_scheduled_idx
  on public.blog_post (scheduled_for)
  where status in ('drafted', 'review');

comment on table public.blog_keyword_metric is
  '키워드 지표 주간 스냅샷. 현재값만 덮어쓰면 검색량 변화를 못 보므로 이력으로 쌓는다';
comment on column public.blog_post.sub_keyword_ids is
  '서브 키워드. 메인 1개(keyword_id) + 서브 2개 구성으로 복합 키워드를 노린다';
comment on column public.blog_post.sources is
  '검증을 통과한 실물 자료. 섹션마다 1개 이상이어야 발행 가능(lib/blog-spec.ts SOURCE_SPEC)';
comment on column public.blog_post.approved_at is
  '사장님 승인 시각. 자동 발행하지 않는다 — 승인이 곧 발행 트리거다';

-- blog_post.slug 도 같은 이유로 일반 유니크 제약이 필요하다.
-- 08-12 것은 lower(slug) 표현식 인덱스라 upsert 대상이 되지 못한다(42P10).
alter table public.blog_post
  drop constraint if exists blog_post_slug_unique;
alter table public.blog_post
  add constraint blog_post_slug_unique unique (slug);
