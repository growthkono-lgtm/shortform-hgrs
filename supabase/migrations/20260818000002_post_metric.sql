-- 콘텐츠별 성적표 — 발행 후 세 시점에만 잰다. (2026-08-18)
--
-- 사장님 제안: *"업로드로부터 D+ 지난 시점 기준으로 측정한 값을 올리고,
-- 콘텐츠별로 3번만 업데이트하는 걸로."*
--
-- 그동안 우리가 쌓은 건 `blog_search_daily` — **사이트 전체와 검색어별**
-- 스냅숏이다. 그래서 "이 편이 먹혔나" 를 볼 수가 없었다. 편성표의 노출·순위
-- 칸이 늘 "—" 였던 것도 검색어로 맞추려다 빗나간 탓이다. 글에는 글의 성적을
-- 붙여야 한다.
--
-- 왜 매일이 아니라 세 번인가: 매일 재면 표가 지저분해지고 판단이 안 된다.
-- 왜 D+5·10·15 가 아니라 D+7·21·60 인가: 니치가 붙는 데 2~8주, 빅은
-- 6~12개월이다. 15일차에 0 이 찍히면 멀쩡한 글이 실패로 오독된다.
--
--   D+7   색인됐나         0 이면 색인 문제 — 즉시 조치
--   D+21  순위가 붙기 시작하나  0 이어도 아직 정상
--   D+60  최종 성적          이 값으로 키워드 난이도를 보정한다
create table if not exists public.blog_post_metric (
  post_id uuid not null references public.blog_post (id) on delete cascade,
  -- 발행일로부터 며칠째에 잰 값인가 (7 · 21 · 60)
  offset_days smallint not null check (offset_days in (7, 21, 60)),
  -- 실제로 잰 날 (KST). 크론이 하루 밀리면 D+8 에 잴 수도 있다
  captured_on date not null,
  -- 발행일부터 측정일까지 **누적**. Search Console 은 2~3일 늦게 들어온다
  impressions integer not null default 0,
  clicks integer not null default 0,
  -- 평균 게재순위. 노출이 0 이면 null 이다 — 0 위라고 적지 않는다
  position numeric(5, 1),
  primary key (post_id, offset_days)
);

comment on table public.blog_post_metric is
  '글별 검색 성적. 발행 후 D+7·21·60 세 시점에만 기록한다 (2026-08-18)';

create index if not exists blog_post_metric_captured_idx
  on public.blog_post_metric (captured_on desc);

alter table public.blog_post_metric enable row level security;

-- 발행된 글의 성적은 공개해도 되지만, 쓰는 건 서비스 롤만
create policy "post metric readable"
  on public.blog_post_metric for select using (true);
create policy "post metric service write"
  on public.blog_post_metric for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
