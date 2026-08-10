-- ─────────────────────────────────────────────────────────────
-- 2026-08-10 진행 단계 어휘 교체 + 담당자 직책 추가
--
-- 대시보드가 고객에게 보여줄 단계를 확정했다. 기존 어휘(waiting/reviewing/…)는
-- 내부 운영 용어라 고객 화면에 그대로 쓸 수 없었다. lib/stages.ts와 1:1이다.
--
--   인플루언서 시딩(stage_a, 패키지 전용 / 싱글은 null = 해당없음)
--     guideline  컨텐츠 가이드라인 작업중
--     recruiting 모집중
--     confirmed  확정
--     shipping   제품 및 서비스 배송중
--     producing  컨텐츠 제작중
--     live       채널 라이브 확인
--
--   숏폼 기획제작(stage_b, 전 플랜)
--     source   소스컷 확인중
--     planning 기획중
--     produced 제작완료
--     revising 최종수정 반영중
--     download 다운로드하기
--
-- 기존 행은 가장 가까운 새 단계로 옮긴다. 제약을 먼저 떼고 값을 옮긴 뒤 다시 건다.
-- ─────────────────────────────────────────────────────────────

alter table public.projects drop constraint if exists projects_stage_a_check;
alter table public.projects drop constraint if exists projects_stage_b_check;
alter table public.projects alter column stage_b drop default;

update public.projects set stage_a = case stage_a
  when 'waiting' then 'guideline'
  when 'reviewing' then 'guideline'
  when 'recruiting' then 'recruiting'
  when 'distributed' then 'live'
  else stage_a
end
where stage_a is not null;

update public.projects set stage_b = case stage_b
  when 'guideline' then 'source'
  when 'targeting' then 'planning'
  when 'producing' then 'planning'
  when 'review' then 'produced'
  when 'final' then 'revising'
  when 'done' then 'download'
  else stage_b
end;

alter table public.projects
  add constraint projects_stage_a_check check (
    stage_a in ('guideline', 'recruiting', 'confirmed', 'shipping', 'producing', 'live')
  );

alter table public.projects
  add constraint projects_stage_b_check check (
    stage_b in ('source', 'planning', 'produced', 'revising', 'download')
  );

alter table public.projects alter column stage_b set default 'source';

comment on column public.projects.stage_a is '인플루언서 시딩 트랙. 싱글 플랜(shorts_only)은 null = 해당없음';
comment on column public.projects.stage_b is '숏폼 기획제작 트랙. 전 플랜 공통';

-- ── 담당자 직책 ── 가입 폼에서 이메일·회사명·담당자명과 함께 받는다
-- position은 Postgres 예약어와 겹쳐 인용부호를 요구한다 → job_title로 둔다
alter table public.profiles add column if not exists job_title text;

comment on column public.profiles.job_title is '담당자 직책 — 가입 시 입력. 상담·응대 톤 판단에 쓴다';

-- 트리거도 직책을 받도록 갱신 (가입 폼 → raw_user_meta_data → profiles)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles
    (id, company_name, contact_name, job_title, phone, marketing_opt_in)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'company_name', ''),
    coalesce(new.raw_user_meta_data ->> 'contact_name', ''),
    new.raw_user_meta_data ->> 'job_title',
    new.raw_user_meta_data ->> 'phone',
    coalesce((new.raw_user_meta_data ->> 'marketing_opt_in')::boolean, false)
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
