-- ─────────────────────────────────────────────────────────────
-- 2026-08-13 (4차) 프로젝트 단계는 "가장 앞선 편"을 따른다
--
-- 3차에서 **가장 뒤처진 편**을 프로젝트 단계로 삼았는데 틀렸다.
-- 10편짜리 프로젝트에서 1편이 제작에 들어가도 나머지 9편이 남아 있으면
-- 클라이언트 화면은 계속 첫 단계에 머문다 — "우리 프로젝트 지금 어디까지 왔나"에
-- 답을 못 하는 값이 된다.
--
-- 바꾼 규칙:
--   · 편이 **전부** done 이면 done (하나라도 남아 있으면 완료가 아니다)
--   · 아니면 아직 안 끝난 편들 중 **가장 앞선** 단계
--
-- 완료만 전원 합의, 나머지는 선두 기준이다. 진행은 앞이 끌고 완료는 뒤가 정한다.
-- ─────────────────────────────────────────────────────────────

create or replace function public.sync_project_stage_b()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid := coalesce(new.project_id, old.project_id);
  total integer;
  finished integer;
  leading_stage text;
begin
  select count(*), count(*) filter (where work_status = 'done')
    into total, finished
  from public.deliverables where project_id = target;

  if total = 0 then
    return null;
  end if;

  if finished = total then
    leading_stage := 'done';
  else
    -- 아직 안 끝난 편들 중 가장 많이 진행된 단계
    select d.work_status into leading_stage
    from public.deliverables d
    where d.project_id = target and d.work_status <> 'done'
    order by array_position(
      array['study', 'producing', 'review', 'revising', 'done'], d.work_status
    ) desc
    limit 1;
  end if;

  if leading_stage is not null then
    update public.projects
    set stage_b = leading_stage
    where id = target and stage_b is distinct from leading_stage;
  end if;

  return null;
end;
$$;

revoke execute on function public.sync_project_stage_b() from public, anon, authenticated;

comment on column public.projects.stage_b is
  '숏폼 트랙. deliverables 에서 트리거로 파생 — 완료는 전 편이 done 일 때만, 그 외는 선두 편 기준';

-- 기존 프로젝트 값을 새 규칙으로 다시 계산한다
update public.deliverables set work_status = work_status;
