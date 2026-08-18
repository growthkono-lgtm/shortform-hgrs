-- ─────────────────────────────────────────────────────────────
-- 2026-08-13 승인과 발행을 분리한다
--
-- 사장님이 정한 흐름:
--   발행일 당일 15시  검수 요청 메일 → 사장님이 "발행하기" 를 누른다
--   발행일 당일 17시  승인된 글만 실제로 나간다
--
-- 지금까지는 "승인 = 즉시 발행" 이었다. 승인은 아침에도 밤에도 눌릴 수 있는데
-- 발행 시각이 들쭉날쭉하면 발행 주기가 흐려지고 구독 알림도 아무 때나 날아간다.
-- 그래서 허락(approved_at)과 발행(published_at)을 다른 칸으로 나눈다.
--
-- ⚠️ 승인하지 않으면 17시가 지나도 나가지 않는다. 자동 발행은 여전히 없다.
-- ─────────────────────────────────────────────────────────────

alter table public.blog_post
  add column if not exists approved_at timestamptz;

-- 발행 대기 줄 — 승인은 됐고 아직 안 나간 글. cron 이 이 인덱스로만 훑는다
create index if not exists blog_post_pending_publish_idx
  on public.blog_post (scheduled_for)
  where approved_at is not null and published_at is null;
