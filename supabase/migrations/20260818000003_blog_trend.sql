-- 시즌·시의성 키워드 후보. (2026-08-18)
--
-- 사장님 제안: *"시즌성 키워드를 반영해야 돼. 뉴스나 유튜브 등 핫하게
-- 올라오는 소식이 있으면 그걸 엮어서 컨텐츠로 내보낼 때 또 순위가 좋지 않나?
-- 복합키워드로 진행할 때."*
--
-- 맞다. 두 가지가 동시에 붙는다 —
--   (1) 검색엔진은 급상승 쿼리에 새 문서를 빨리 올린다. 니치가 붙는 데
--       2~8주인데 시의성 키워드는 며칠이면 붙는다
--   (2) 경쟁 문서가 아직 없다. 선점이다
-- 도메인 1년 3개월에 노출 2회인 지금, 이 상태를 깨는 가장 빠른 길이다.
--
-- 다만 전부를 이걸로 채우지 않는다. 수명이 짧아 3개월 뒤 트래픽이 0 이 되고,
-- "뉴스 요약" 이 되면 매거진 포지션이 무너진다. 그래서 **주 7편 중 2편**만
-- 이 표에서 꺼낸다 (`SEASONAL_WEEKDAYS`). 나머지 5편은 니치 자산 그대로다.
create table if not exists public.blog_trend (
  id uuid primary key default gen_random_uuid(),
  captured_on date not null,
  -- 무슨 일이 있었나 (한 문장)
  headline text not null,
  -- 근거. 출처가 없으면 쓰지 않는다 [[feedback_no_fabricated_metrics]]
  source_url text not null,
  source_name text,
  -- 우리 필러 중 어디에 붙나
  pillar text not null,
  -- 이 소식 x 우리 니치 키워드 = 복합키워드. 이게 이 표의 결과물이다
  combined_term text not null,
  -- 왜 이 각도인가. 편성표에 그대로 보인다
  angle text not null,
  -- 편성에 쓰인 날. null 이면 아직 안 쓴 후보다
  used_on date,
  created_at timestamptz not null default now()
);

-- 같은 소식을 두 번 쓰지 않는다
create unique index if not exists blog_trend_term_idx
  on public.blog_trend (combined_term);
create index if not exists blog_trend_unused_idx
  on public.blog_trend (used_on, captured_on desc);

alter table public.blog_trend enable row level security;
create policy "blog trend service role only"
  on public.blog_trend for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
