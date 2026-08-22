-- ─────────────────────────────────────────────────────────────
-- 글별 성과에 **first / assist / last** 를 나눠 적는다. (2026-08-22)
--
-- 사장님: *"블로그 성과 측정은 반영되어있어? first last"*
--
-- 지금 `blog_post_week.inquiries` 는 **첫 착지(entry_post_id)만** 센다.
-- 그래서 아래 두 가지가 장부에서 통째로 빠져 있었다.
--
--   어시스트  다른 데로 들어왔지만 그 글도 읽고 신청했다.
--             실무에서 제일 흔한 모양인데 0 으로 세고 있었다.
--   라스트    신청 직전 마지막으로 그 글을 통해 들어왔다.
--             "무엇이 알게 했나(first)" 와 "무엇이 결심시켰나(last)" 는
--             다른 질문이고, 광고를 돌리면 예산은 후자를 본다.
--
-- ⚠️ 세 값을 **더하지 않는다.** 한 건이 first 이면서 last 일 수 있어서
--    합하면 전환 수가 부풀려진다. 화면에서도 따로 세워 둔다.
-- ─────────────────────────────────────────────────────────────
alter table public.blog_post_week
  -- 첫 착지는 아니지만 이 글을 읽고 전환한 건수
  add column if not exists assists integer not null default 0,
  -- 신청 직전 마지막 진입이 이 글이었던 건수
  add column if not exists last_touch integer not null default 0;

comment on column public.blog_post_week.inquiries is
  'first touch — 이 글로 처음 들어와 신청까지 간 건수';
comment on column public.blog_post_week.assists is
  'assist — 첫 착지는 아니지만 이 글도 읽고 신청한 건수. inquiries 와 더하지 말 것';
comment on column public.blog_post_week.last_touch is
  'last touch — 신청 직전 마지막 진입이 이 글이었던 건수. inquiries 와 겹칠 수 있다';
