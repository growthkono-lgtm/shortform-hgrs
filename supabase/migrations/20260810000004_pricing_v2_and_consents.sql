-- ─────────────────────────────────────────────────────────────
-- 2026-08-10 (2차) 단가 재산정 + 헤드 전략 리뷰 제거 + 가입 동의 이력
--
-- ① 단가
--   1차 가격은 편수가 커질수록 편당 단가가 급락해(21만 → 12만) 큰 건일수록 마진이 사라졌다.
--   진입가(1편 21만)는 그대로 두고 볼륨 할인 곡선만 완만하게 편다.
--     싱글 편당 : 210,000 / 198,000 / 189,000 / 174,500
--     시딩 1인당: 55,000 / 49,500 / 46,000  (1차 3만원대는 챌린지비 원가 역전 구간)
--   패키지 총액 = 같은 편수 싱글가 + 시딩가 (화면에서 두 줄로 쪼개 보여준다)
--
-- ② 헤드 전략 리뷰 판매 중단 — 가격표·결제 요약에서 내린다. 컬럼은 남기되 전부 false.
--
-- ③ 가입 동의 이력 — 필수(이용약관+개인정보 수집·이용) / 선택(광고성 정보 수신)
--   정보통신망법·개인정보보호법 대응. 어느 버전 전문에 언제 동의했는지가 증빙의 핵심이다.
-- ─────────────────────────────────────────────────────────────

update public.plans set list_price = v.price, beta_price = v.price
from (values
  ('full',        'starter', 1540000),
  ('full',        'growth',  2880000),
  ('full',        'scale',   4870000),
  ('shorts_only', '1',        210000),
  ('shorts_only', '5',        990000),
  ('shorts_only', '10',      1890000),
  ('shorts_only', '20',      3490000)
) as v(code, tier, price)
where public.plans.code = v.code and public.plans.tier = v.tier;

update public.plans set head_review = false where head_review;

comment on column public.plans.head_review is '헤드 전략 리뷰 — 2026-08-10 판매 중단. 전부 false';

-- ── user_consents ── 가입 시점 동의 이력
create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  -- required = 이용약관 + 개인정보 수집·이용(필수) / marketing = 광고성 정보 수신(선택)
  kind text not null check (kind in ('required', 'marketing')),
  version text not null,
  agreed boolean not null,
  agreed_at timestamptz not null default now(),
  ip_address inet,
  user_agent text,
  -- 같은 버전에 두 번 기록하지 않는다. 버전이 오르면 새 행이 쌓인다
  constraint user_consents_unique unique (user_id, kind, version)
);

create index if not exists user_consents_user_id_idx on public.user_consents (user_id);

alter table public.user_consents enable row level security;

-- 본인 이력만 조회. 쓰기는 server route(service_role) 전용이라 정책을 두지 않는다
drop policy if exists "user_consents_select_own" on public.user_consents;
create policy "user_consents_select_own" on public.user_consents
  for select to authenticated
  using (user_id = (select auth.uid()));

comment on table public.user_consents is '가입 동의 이력. 전문은 lib/consents.ts가 버전별로 들고 있다';
