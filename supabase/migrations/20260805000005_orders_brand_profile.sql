-- 결제 시점에 고른 브랜드를 주문에 기록한다.
-- 승인 후 projects를 만들 때 이 값을 그대로 물려준다 —
-- 리다이렉트 URL로 실어 나르면 클라이언트가 조작할 수 있다.
alter table public.orders
  add column brand_profile_id uuid references public.brand_profiles (id) on delete set null;

create index orders_brand_profile_id_idx on public.orders (brand_profile_id);
