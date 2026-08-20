-- 문의 폼 선택지 — 브랜드 채널 마케팅을 두 플랜으로 나눈다. (2026-08-20)
--
-- 08-20 개편으로 "브랜드 SNS 채널 커뮤니케이션"과 "종합 브랜드 마케팅"을
-- **브랜드 채널 마케팅 프로젝트** 하나로 합쳤고, 그 아래 플랜이 둘이 됐다.
--   · SNS 채널 활성화 플랜  (sns_channel)
--   · 린 IMC 마케팅 구독제   (lean_imc)
--
-- 사장님: *"문의폼에는 해당 플랜에 대한 카드박스와 설명도 있어야겠지."*
-- 폼에서 둘을 각각 고르게 하려면 체크 제약에 값을 먼저 넣어야 한다.
--
-- ⚠️ 옛 값은 **전부 남긴다.** 그 값으로 접수된 건이 이미 있고, 지우면 과거
-- 데이터가 제약을 위반한다. `sns_turnkey` 도 남긴다 — 새 폼은 안 보내지만
-- 08-18~20 사이 접수분이 그 값을 쓴다.
alter table public.inquiries drop constraint if exists inquiries_interest_check;
alter table public.inquiries add constraint inquiries_interest_check
  check (interest = any (array[
    -- 2026-08-20 현재 폼이 보내는 값
    'shorts_single', 'shorts_package', 'sns_channel', 'lean_imc', 'consult',
    -- 08-18~20 접수건
    'sns_turnkey', 'ai_team',
    -- 08-18 이전 접수건
    'shorts_only', 'full', 'unsure'
  ]));
