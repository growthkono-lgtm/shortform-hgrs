-- 블로그 자동 운영 방아쇠를 DB 안으로 옮긴다. (2026-08-14)
--
-- ── 왜 옮기는가 ────────────────────────────────────────────────────────
-- 방아쇠를 맥의 launchd 가 당기고 있었다. 사장님 지적:
--   *"맥꺼져도 돌게하라고했잖아."*
-- 맞다. 맥이 꺼져 있으면 그날 발행이 통째로 없어지는 구조였다. 게다가 그 launchd 는
-- macOS TCC 때문에 다섯 시간 동안 한 번도 실행되지 않은 적도 있다.
--
-- Vercel Cron 은 무료 플랜에서 "하루 1회" 라 5단계 파이프라인을 못 민다.
-- cron-job.org 는 계정 키가 없다. 그래서 **이미 켜져 있는 Postgres** 가 직접 돈다.
-- pg_cron 은 횟수 제한이 없고, 맥·Vercel 플랜과 무관하며, 추가 비용이 0이다.
--
-- ── 시간대 ─────────────────────────────────────────────────────────────
-- DB 는 UTC 다. KST = UTC + 9.
--   생성    KST 09:00~09:25 (5분 간격 6회)  → UTC 00:00~00:25
--   따라잡기 KST 13:00~13:20                → UTC 04:00~04:20
--   발행    KST 17:05                       → UTC 08:05
--   알림    KST 17:10                       → UTC 08:10
--   리포트  KST 18:05                       → UTC 09:05
--
-- 생성을 여러 번 거는 이유: 한 호출에 **한 단계**만 밟기 때문이다
-- (Vercel 함수가 300초에서 끊긴다). 조사→기획→검증→집필→교정 다섯 단계라
-- 여섯 번이면 완주한다. 이미 끝났으면 서버가 "할 일 없음" 을 돌려주고 끝난다.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- 인증 토큰은 Vault 에 둔다. 함수 본문이나 cron.job 테이블에 평문으로 두지 않는다.
--   select vault.create_secret('<CRON_SECRET>', 'blog_cron_secret', '블로그 자동운영 크론 인증');
-- (값이 들어 있어야 아래 함수가 동작한다. 없으면 예외를 던진다)

/**
 * 우리 서버의 입구를 두드린다.
 *
 * security definer 인 이유: Vault 를 읽어야 하기 때문이다. 그래서 **아무나 못 부르게**
 * 아래에서 실행 권한을 회수한다. 이 함수를 부를 수 있으면 CRON_SECRET 으로 우리
 * 엔드포인트를 마음대로 두드릴 수 있게 된다.
 *
 * pg_net 은 비동기다 — 요청만 던지고 응답은 net._http_response 에 쌓인다.
 * 그래서 원고 한 단계가 4분 걸려도 DB 는 기다리지 않는다.
 */
create or replace function public.blog_cron_hit(path text)
returns bigint
language plpgsql
security definer
set search_path = public, net, vault
as $fn$
declare
  sec text;
  rid bigint;
begin
  select decrypted_secret into sec from vault.decrypted_secrets where name = 'blog_cron_secret';
  if sec is null then
    raise exception 'blog_cron_secret 이 Vault 에 없습니다';
  end if;

  select net.http_get(
    url := 'https://hgrs.io/api/blog/' || path,
    headers := jsonb_build_object('Authorization', 'Bearer ' || sec),
    timeout_milliseconds := 290000
  ) into rid;

  return rid;
end;
$fn$;

revoke all on function public.blog_cron_hit(text) from public, anon, authenticated;

-- 스케줄. 같은 이름으로 다시 걸면 pg_cron 이 덮어쓴다
select cron.schedule('blog-generate',   '0,5,10,15,20,25 0 * * *', 'select public.blog_cron_hit(''generate'')');
select cron.schedule('blog-generate-2', '0,5,10,15,20 4 * * *',    'select public.blog_cron_hit(''generate'')');
select cron.schedule('blog-publish',    '5 8 * * *',               'select public.blog_cron_hit(''publish'')');
select cron.schedule('blog-announce',   '10 8 * * *',              'select public.blog_cron_hit(''announce'')');
select cron.schedule('blog-report',     '5 9 * * *',               'select public.blog_cron_hit(''report'')');

-- 확인용
--   select jobid, jobname, schedule, active from cron.job order by jobid;
--   select id, status_code, left(content,200) from net._http_response order by id desc limit 10;
