-- ─────────────────────────────────────────────────────────────
-- 2026-08-16 AI 광고영상 — 기획안을 표에 앉힌다
--
-- ── 왜 필요했나 ───────────────────────────────────────────────
-- 사장님이 2026-08-14 에 기획안을 주셨는데(칸 1~9 구조) 그게 **대화 기록에만**
-- 있었다. 그래서 다음 날 작업에서 그걸 못 찾고 샷 목록을 지어냈고,
-- 사장님 지적을 그대로 받았다 — *"내가 기획안 잡아서 어제 줬고, 넌 알아서
-- 만들어 내 목적대로. 안 그러면 내가 기획 세부 콘티 다 짜야 한단 거잖아."*
--
-- 기획안이 파일이나 표에 없으면 반드시 또 잃어버린다. 그래서 칸을 만든다.
--
-- ── 무엇을 담나 ───────────────────────────────────────────────
-- `brief` 한 칸에 기획안 전체를 담는다(jsonb). 칸을 컬럼으로 쪼개지 않는 이유는
-- 유형(`lib/adfilm-formats.ts` 의 6종)마다 필요한 칸이 다르기 때문이다.
-- 대신 **검증은 코드가 한다** — `lib/adfilm-brief.ts` 의 validateBrief() 가
-- 빈 칸을 잡고, 빈 칸이 있으면 생성 버튼이 안 눌린다.
-- ─────────────────────────────────────────────────────────────

alter table public.adfilm
  -- 영상 유형. lib/adfilm-formats.ts 의 AD_FORMATS[].key
  add column if not exists format text not null default 'ugc',
  -- 기획안 전문 — 제품 팩트·타겟·USP·샷별 대사·레퍼런스 자산
  add column if not exists brief jsonb not null default '{}'::jsonb,
  -- 이 편을 부르는 이름. 어드민 목록에 뜬다
  add column if not exists title text,
  -- 생성된 샷들 — [{no, label, videoUrl, seed, prompt, spent}]
  add column if not exists shots jsonb not null default '[]'::jsonb;

-- 목록을 최근 것부터 뽑는다
create index if not exists adfilm_created_idx
  on public.adfilm (created_at desc);
