-- ─────────────────────────────────────────────────────────────
-- 순방문자수 · 체류시간 · 수집 제외. (2026-08-22)
--
-- 사장님: *"노출-클릭-순방문자수-체류시간 하라 했잖아. …
-- 블로그 컨텐츠별 성과를 명확히 파악해야 한다고."*
--
-- 지금 있는 것과 없는 것을 먼저 가른다.
--
--   노출·클릭   Search Console.  있다
--   유입(views) blog_view 합계.   있다 — 단 **사람 수가 아니라 열린 횟수**다
--   순방문자수  blog_visit 행 수. 데이터는 있는데 **화면에 안 띄우고 있었다**
--   체류시간    **수집 자체를 안 하고 있었다.** 여기서 만든다
--
-- 체류는 `blog_visit` 에 붙인다. 표를 새로 만들지 않는 이유는 이미
-- (방문자 × 글) 한 행이 있어서다. 같은 사람이 같은 글을 두 번 읽으면
-- **더 오래 읽은 쪽**을 남긴다 — 합치면 재방문이 체류로 둔갑한다.
-- ─────────────────────────────────────────────────────────────
alter table public.blog_visit
  -- 이 사람이 이 글에 머문 시간(밀리초). null = 아직 못 쟀다(0 이 아니다)
  add column if not exists dwell_ms integer;

comment on column public.blog_visit.dwell_ms is
  '이 방문자가 이 글에 머문 시간(ms). 같은 글을 여러 번 보면 최댓값. null=미측정';

-- 주간 성적에도 두 칸. 화면이 매번 blog_visit 을 훑지 않게 미리 접어 둔다
alter table public.blog_post_week
  -- 그 주에 이 글을 본 **사람 수**. views(열린 횟수)와 다른 값이다
  add column if not exists visitors integer not null default 0,
  -- 그 주 이 글의 **중앙값** 체류(초). 평균이 아니라 중앙값인 이유는
  -- 탭을 열어 둔 채 잊은 한 명이 평균을 통째로 망가뜨리기 때문이다
  add column if not exists dwell_sec integer;

comment on column public.blog_post_week.visitors is
  '그 주 순방문자 수(사람). views 는 열린 횟수라 다른 값이다';
comment on column public.blog_post_week.dwell_sec is
  '그 주 체류시간 중앙값(초). 평균이 아니다 — 탭 켜 둔 한 명이 평균을 망친다. null=표본 없음';

-- ── 체류 기록 ────────────────────────────────────────────────
-- /api/blog/view 가 이탈 시점에 부른다. **더 긴 값만 남긴다** —
-- 뒤로 갔다 다시 온 사람의 두 번째 5초가 첫 번째 3분을 덮으면 안 된다.
create or replace function public.blog_dwell_mark(
  p_visitor text, p_slug text, p_ms integer
)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.blog_visit
     set dwell_ms = greatest(coalesce(dwell_ms, 0), p_ms)
   where visitor_id = p_visitor and slug = p_slug;
$$;

revoke all on function public.blog_dwell_mark(text, text, integer) from public;
grant execute on function public.blog_dwell_mark(text, text, integer) to service_role;
