-- ─────────────────────────────────────────────────────────────
-- plans 시딩 — S12 가격표
--
-- ※ 정가 6개는 임시 제안값이다 (PART G / PART I-2).
--   확정되면 이 테이블의 list_price / beta_price만 UPDATE 하면
--   랜딩·결제·대시보드 전 화면에 반영된다. 코드 수정 불필요.
--
-- ※ 스케일 티어(인플 30)는 챌린지비 실단가 재검산이 끝나지 않았다.
--   원가 역전이 확인되면 active=false로 내려 비공개 런칭할 수 있다.
-- ─────────────────────────────────────────────────────────────

insert into public.plans
  (code, tier, label, composition, influencer_count, shorts_count,
   list_price, beta_price, head_review, recommended, sort_order, active)
values
  -- 플랜 1 — 풀 파이프라인
  ('full', 'starter', '스타터', '인플루언서 10 + 숏폼 5',
   10, 5, 1900000, 1350000, false, false, 1, true),
  ('full', 'growth', '그로스', '인플루언서 20 + 숏폼 10',
   20, 10, 3100000, 2200000, false, true, 2, true),
  ('full', 'scale', '스케일', '인플루언서 30 + 숏폼 20',
   30, 20, 4000000, 2840000, true, false, 3, true),

  -- 플랜 2 — 전환 숏폼 단독
  ('shorts_only', '5', '5편', '전환 숏폼 5편',
   0, 5, 1250000, 900000, false, false, 1, true),
  ('shorts_only', '10', '10편', '전환 숏폼 10편',
   0, 10, 2100000, 1500000, false, true, 2, true),
  ('shorts_only', '20', '20편', '전환 숏폼 20편',
   0, 20, 2800000, 2000000, true, false, 3, true)
on conflict (code, tier) do nothing;
