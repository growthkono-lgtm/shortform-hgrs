-- ─────────────────────────────────────────────────────────────
-- 2026-08-10 (6차) 후보 지표 자동 수집 대응
--
-- 지표는 Apify 에서 받아 채운다. 단, **제안 단가(reward)는 벤더가 주지 않는다** —
-- 우리가 협상해 넣는 값이라 컬럼을 따로 둔다.
-- CPV 는 단가 ÷ 평균조회수로 계산해 저장한다(화면에서 매번 나누지 않게).
--
-- fetch_error 는 수집이 실패한 이유를 그대로 남긴다. 어드민이 왜 "—"인지 알아야
-- 다시 시도할지 수기로 넣을지 판단할 수 있다.
-- ─────────────────────────────────────────────────────────────

alter table public.influencer_candidates add column if not exists reward integer;
alter table public.influencer_candidates add column if not exists fetch_error text;
alter table public.influencer_candidates add column if not exists fetched_at timestamptz;

comment on column public.influencer_candidates.reward is '제안 단가(원). 벤더가 주지 않는 협상값';
comment on column public.influencer_candidates.avg_cpv is 'reward ÷ avg_views. 둘 다 있을 때만 채운다';
comment on column public.influencer_candidates.fetch_error is '자동 수집 실패 사유. 성공하면 null';
