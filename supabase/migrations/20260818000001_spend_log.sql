-- 유료 호출 장부. (2026-08-18)
--
-- 왜 만드나: 8/17·8/18 블로그가 크레딧 소진으로 이틀 비었다. 그런데 우리
-- 장부에는 "$4.03 / 상한 $80, 여유 있음" 으로 보였다. 그 장부가 **블로그가
-- 스스로 쓴 돈만** 세고 있었기 때문이다. 같은 계정을 영상·이미지·비전판독이
-- 같이 쓰는데 그건 어디에도 안 적혔다. 그 사이 OpenAI 는 -$13.70, fal 은
-- -$7.10 까지 갔다. 장부가 거짓말을 하고 있었다.
--
-- 사장님 지시: "다 계산해야지 앞으로는."
-- 돈이 나가는 자리마다 여기에 한 줄씩 적는다. 추정이 아니라 실측만 적는다.
create table if not exists public.spend_log (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  -- 어느 계정에서 나갔나. 계정별 잔액과 대조할 수 있어야 한다
  service text not null check (service in ('openai', 'fal', 'anthropic')),
  -- 무엇에 썼나. openai 한 계정에서 블로그·영상·이미지가 같이 나가므로 필수
  kind text not null check (kind in ('blog', 'video', 'image', 'audio', 'vision')),
  -- 무엇을 만들었나 (예: 'feliway/scene07', 'blog/2026-08-18')
  ref text not null,
  -- 실제 차감액(USD).
  --   fal  = 호출 전후 잔액 차분(실측)
  --   openai = 공시 단가 x 실사용 토큰·초·장수
  usd numeric(10, 4) not null,
  -- 재현·검증용 원재료 (모델, 초, 해상도, 토큰 수 등)
  meta jsonb not null default '{}'::jsonb
);

-- "이번 달 얼마" 를 계정별로 묻는 게 이 표의 유일한 용도다
create index if not exists spend_log_at_idx on public.spend_log (at desc);
create index if not exists spend_log_service_at_idx on public.spend_log (service, at desc);

alter table public.spend_log enable row level security;

-- 서비스 롤만 읽고 쓴다. 원가는 작업자·클라이언트에게 보이지 않는다
-- [[feedback_no_brand_identity_to_workers]] — 가리는 건 돈뿐이다
create policy "spend_log service role only"
  on public.spend_log for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
