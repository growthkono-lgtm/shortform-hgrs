-- ─────────────────────────────────────────────────────────────
-- 2026-08-13 (2차) 공정 재설계 — 5단계 · 라벨 두 벌 · 검수 게이트 제거
--
-- 1차에서 8단계를 만들었는데 실제 일하는 방식과 달랐다. 고친 것 셋:
--
--  1) **기획안 검수 게이트를 없앤다.** 컨텐츠는 편당 들어가는데 프로젝트 하나에
--     "기획 작성중"을 걸어 두니 작업자 입장에서 뭘 쓰라는 건지 알 수 없다.
--     단계는 작업자가 직접 넘긴다. 어드민은 필요할 때만 수동 개입한다.
--
--  2) **단계를 5개로 줄이고 라벨을 두 벌 둔다.** 상태는 하나인데 부르는 이름이 다르다 —
--     작업자는 자기가 할 일로, 클라이언트는 자기가 받을 것으로 읽는다. (lib/work.ts)
--
--       study     작업자 "브랜드 정보 확인"      클라 "담당자 브랜드 압축 스터디중"
--       producing 작업자 "컨텐츠 기획제작중"      클라 "숏폼 기획제작 진행중"
--       review    작업자 "1차 완성본 컨펌 요청"   클라 "1차 완성본 컨펌 확인"
--       revising  작업자 "최종 수정 반영중"       클라 "최종 수정요청 반영중"
--       done      작업자 "최종본 전달 완료"       클라 "최종본 다운로드/확인"
--
--  3) **브랜드 정보는 AI 가 아니라 사람이 먼저 쓴다.** 어드민이 제품 링크·가격·현황·
--     요청사항을 수기로 적고(manual_note), 클라이언트가 코멘트를 얹고(client_note),
--     AI 는 그걸 토대로 한 **세부 자료조사**(ai_analysis)로 내려간다.
-- ─────────────────────────────────────────────────────────────

-- ── work_status 5단계 ──
alter table public.deliverables drop constraint if exists deliverables_work_status_check;
alter table public.deliverables alter column work_status drop default;

update public.deliverables set work_status = case work_status
  when 'brief' then 'study'
  when 'planning' then 'study'
  when 'plan_review' then 'study'
  when 'submitted' then 'review'
  when 'delivered' then 'review'
  else work_status
end;

alter table public.deliverables alter column work_status set default 'study';
alter table public.deliverables add constraint deliverables_work_status_check check (
  work_status in ('study', 'producing', 'review', 'revising', 'done')
);

comment on column public.deliverables.work_status is
  '편 단위 진행 단계 5종. 작업자가 직접 넘긴다. 라벨은 보는 사람에 따라 다르다(lib/work.ts)';
comment on column public.deliverables.plan_note is
  '작업자 메모(선택). 제출 조건이 아니다 — 적어도 되고 안 적어도 된다';

-- ── projects.stage_b 를 편에서 파생시킨다 ──
--
-- 클라이언트 대시보드는 프로젝트 단위 스텝퍼를 그리는데, 실제 진행은 편 단위다.
-- 사람이 두 곳을 맞춰 누르게 하면 반드시 어긋난다. **가장 뒤처진 편**을 프로젝트 단계로 삼고
-- 트리거로 자동 갱신한다. 이걸로 "각 단계 넘어가는 건 작업자가" 가 성립한다.
alter table public.projects drop constraint if exists projects_stage_b_check;
alter table public.projects alter column stage_b drop default;

update public.projects set stage_b = case stage_b
  when 'source' then 'study'
  when 'planning' then 'producing'
  when 'produced' then 'review'
  when 'revising' then 'revising'
  when 'download' then 'done'
  else 'study'
end;

alter table public.projects alter column stage_b set default 'study';
alter table public.projects add constraint projects_stage_b_check check (
  stage_b in ('study', 'producing', 'review', 'revising', 'done')
);

create or replace function public.sync_project_stage_b()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid := coalesce(new.project_id, old.project_id);
  slowest text;
begin
  -- 순서 배열의 가장 앞선(=덜 진행된) 값이 프로젝트 단계다
  select d.work_status into slowest
  from public.deliverables d
  where d.project_id = target
  order by array_position(
    array['study', 'producing', 'review', 'revising', 'done'], d.work_status
  )
  limit 1;

  if slowest is not null then
    update public.projects set stage_b = slowest where id = target and stage_b is distinct from slowest;
  end if;

  return null;
end;
$$;

revoke execute on function public.sync_project_stage_b() from public, anon, authenticated;

drop trigger if exists deliverables_sync_stage_b on public.deliverables;
create trigger deliverables_sync_stage_b
  after insert or update of work_status or delete on public.deliverables
  for each row execute function public.sync_project_stage_b();

comment on column public.projects.stage_b is
  '숏폼 트랙. deliverables.work_status 에서 트리거로 파생된다 — 직접 쓰지 말 것';

-- ── work_briefs 개편 ── AI 9필드 → 사람이 쓰는 칸 둘 + AI 분석 하나
alter table public.work_briefs
  add column if not exists manual_note text,
  add column if not exists client_note text,
  add column if not exists ai_analysis text,
  add column if not exists ai_analysis_at timestamptz;

-- 1차에서 만든 AI 브리프 9칸은 쓰지 않는다. 공개 토글도 없앤다 —
-- 어드민이 직접 쓴 글이라 검수할 사람이 따로 없고, 저장하면 곧 전달이다
alter table public.work_briefs
  drop column if exists category,
  drop column if exists offer,
  drop column if exists target,
  drop column if exists usp,
  drop column if exists tone,
  drop column if exists forbidden,
  drop column if exists must_include,
  drop column if exists reference_note,
  drop column if exists source_note,
  drop column if exists published_at,
  drop column if exists ai_generated_at,
  drop column if exists ai_model;

comment on table public.work_briefs is
  '프로젝트 단위 브랜드 정보. manual_note(어드민 수기) → client_note(클라 코멘트) → ai_analysis(AI 세부조사) 순서로 읽힌다';
comment on column public.work_briefs.manual_note is
  '어드민이 직접 적는 제품 링크·가격·현재 상황·브랜드 요청사항. 상호·브랜드명은 적지 않는다';
comment on column public.work_briefs.client_note is '클라이언트가 남기는 미팅 코멘트. 작업자에게 그대로 보인다';
comment on column public.work_briefs.ai_analysis is '위 두 칸을 근거로 돌린 세부 자료조사 결과';

-- 프로젝트를 열면 브랜드 정보 칸이 이미 있어야 한다 (없으면 어드민이 "생성"부터 눌러야 함)
insert into public.work_briefs (project_id)
select id from public.projects
on conflict (project_id) do nothing;

-- 트리거를 한 번 돌려 기존 프로젝트의 stage_b 를 편 기준으로 맞춘다
update public.deliverables set work_status = work_status;
