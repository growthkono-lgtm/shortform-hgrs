-- ─────────────────────────────────────────────────────────────
-- 2026-08-10 가격 확정 — 정가/베타가 이원화 종료
--
-- ※ 판매가가 확정되어 list_price = beta_price로 맞춘다.
--   지어낸 정가로 할인율을 만들지 않는다. 결제 화면은 할인 0%면 정가 줄을 그리지 않는다.
--
-- ※ 숏폼 단독에 1편(₩210,000) 티어를 연다 — 첫 거래를 트기 위한 단품이다.
--   인플루언서 시딩은 크리에이터 모집·배포 단위라 1편에는 붙일 수 없다(5편 묶음부터).
--
-- ※ 시딩 포함(full) 총액 = 같은 편수의 숏폼 단독가 + 시딩 단가
--     스타터 950,000 + 300,000 = 1,250,000
--     그로스 1,800,000 + 450,000 = 2,250,000
--     스케일 2,400,000 + 650,000 = 3,050,000
--   랜딩 카드에서 이 두 줄을 쪼개 보여준다(lib/constants.ts의 shortsPrice/seedingPrice).
-- ─────────────────────────────────────────────────────────────

-- 1편 티어 신설 (sort_order 0 — 숏폼 단독 맨 앞)
insert into public.plans
  (code, tier, label, composition, influencer_count, shorts_count,
   list_price, beta_price, head_review, recommended, sort_order, active)
values
  ('shorts_only', '1', '1편', '전환 숏폼 1편',
   0, 1, 210000, 210000, false, false, 0, true)
on conflict (code, tier) do nothing;

-- 확정가 반영 — 두 컬럼을 같은 문장에서 같은 값으로 쓰므로 beta <= list 체크는 항상 통과한다
update public.plans set list_price = v.price, beta_price = v.price
from (values
  ('full',        'starter', 1250000),
  ('full',        'growth',  2250000),
  ('full',        'scale',   3050000),
  ('shorts_only', '1',        210000),
  ('shorts_only', '5',        950000),
  ('shorts_only', '10',      1800000),
  ('shorts_only', '20',      2400000)
) as v(code, tier, price)
where public.plans.code = v.code and public.plans.tier = v.tier;
