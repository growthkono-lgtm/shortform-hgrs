-- 시의성 수집을 따로 센다. (2026-08-18)
--
-- 08-18 저녁, 사장님이 "20달러 충전했는데 그새 어디서 나가냐" 고 물으셨다.
-- 답은 **그날 내가 헛돌린 시의성 수집 네 번**이었는데, 그게 장부에 없어서
-- 세션 기억으로 복원해야 했다. 붙이고 나니 이번엔 "블로그" 가 두 줄로 나왔다 —
-- 원고 생성비와 수집비는 성격이 다르다. 하나는 편당 원가고 하나는 주당 고정비다.
alter table public.spend_log drop constraint if exists spend_log_kind_check;
alter table public.spend_log add constraint spend_log_kind_check
  check (kind = any (array[
    'blog', 'trend', 'video', 'image', 'audio', 'vision'
  ]));

update public.spend_log
   set kind = 'trend'
 where kind = 'blog' and ref like 'trends/%';
