-- ─────────────────────────────────────────────────────────────
-- 2026-08-14 키워드 풀 확장 — 구매의도를 분리해 기록한다
--
-- 사장님 지시: "니치 키워드만 200개는 되어야 하고, 전체 키워드는 1000개는
-- 되어야 하는 게 맞는데."
--
-- 그때까지 필터가 **구매의도를 필수**로 걸고 있었다(대행·비용·견적·업체…).
-- 그래서 21,779개를 수집해도 565개만 남았다. 구매 단계 검색어만 노리면
-- 이미 대행사를 찾기로 마음먹은 사람만 만나는데, 그 자리가 경쟁이 제일 세다.
--
-- 필수에서 빼고 이 컬럼으로 남긴다. 편성에서 **같은 조건이면 구매의도가
-- 있는 검색어를 먼저** 쓰는 데 쓴다. 결과: 565 → 1,869개.
-- ─────────────────────────────────────────────────────────────

alter table public.blog_keyword
  add column if not exists buyer_intent boolean not null default false;

-- 편성이 매번 훑는 조합 — 난이도 + 검색량 + 구매의도
create index if not exists blog_keyword_pick_idx
  on public.blog_keyword (difficulty, buyer_intent desc, niche_score desc)
  where status = 'idle';
