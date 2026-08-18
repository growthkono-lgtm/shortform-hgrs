alter table public.blog_keyword
  add column if not exists niche_score integer,
  add column if not exists difficulty text;
create index if not exists blog_keyword_niche_idx
  on public.blog_keyword (niche_score desc nulls last)
  where status <> 'dropped';
comment on column public.blog_keyword.niche_score is
  '지금 우리가 이길 수 있고 이기면 값이 되는 정도 0~100. 검색량(로그)×클릭률×경쟁도. lib/keyword-filter.ts';
comment on column public.blog_keyword.difficulty is
  '니치/중간/빅. 요일별로 섞어 편성한다 — 빅만 노리면 순위를 못 잡고 니치만 노리면 천장이 낮다';
