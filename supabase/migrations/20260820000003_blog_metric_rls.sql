-- 블로그 성과 지표를 익명 공개에서 내린다. (2026-08-20)
--
-- 측정으로 확인한 것: 익명 키로 blog_post_week 37행 · blog_post_metric 9행이
-- 전부 읽혔다. 노출·클릭·순위·문의수 = 우리 채널 성과가 그대로 공개돼 있었다.
--
-- 원인은 RLS 가 꺼진 게 아니었다. RLS 는 두 표 모두 켜져 있었고,
-- `to public using (true)` 인 SELECT 정책이 그 위에 열어두고 있었다.
-- 게다가 anon 에게 INSERT/UPDATE/DELETE 권한까지 살아 있었다.
--
-- 코드에서 이 두 표를 읽는 곳은 lib/blog-metrics.ts 뿐이고 전부 서비스 롤이라
-- (RLS 우회) 막아도 화면에 영향이 없다 — 막은 뒤 확인함.
--
-- blog_post / plans 는 그대로 둔다. 각각 status='published' · active=true 로
-- 이미 좁혀져 있어 공개돼야 할 것만 나간다.

drop policy if exists "post metric readable" on public.blog_post_metric;
drop policy if exists "post week readable"   on public.blog_post_week;

revoke all on public.blog_post_metric from anon, authenticated;
revoke all on public.blog_post_week   from anon, authenticated;
