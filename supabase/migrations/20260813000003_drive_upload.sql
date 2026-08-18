-- ─────────────────────────────────────────────────────────────
-- 2026-08-13 (3차) 드라이브 직접 업로드
--
-- 작업자가 결과물 링크를 손으로 복붙하지 않는다. 파일을 끌어다 놓으면
-- 지정된 구글 드라이브 폴더로 바로 올라가고, 파일명은 규칙대로 자동으로 붙는다.
--
-- 폴더는 프로젝트당 둘이다 (drive_grants.kind 를 그대로 쓴다).
--   seeding  소스 폴더   — 클라이언트가 기존 소스를, 우리가 시딩 결과물을 올린다
--   final    완성본 폴더 — 작업자만 올린다
--
-- 파일명 규칙: {별칭}_{편번호}_{제목}_{형식}_{완성날짜}[_fin]
-- 첫 자리를 브랜드명이 아니라 **별칭**으로 둔 이유는 lib/work.ts 주석에 적어 뒀다.
-- ─────────────────────────────────────────────────────────────

alter table public.projects add column if not exists work_alias text;

comment on column public.projects.work_alias is
  '업로드 파일명 앞자리. 비우면 work_code 를 쓴다. 브랜드명을 넣으면 작업자가 클라이언트를 특정할 수 있다';

-- 업로드된 파일을 되짚을 수 있게 남긴다. 링크만 있으면 나중에 폴더를 옮겼을 때 못 찾는다
alter table public.deliverables
  add column if not exists drive_file_id text,
  add column if not exists work_file_name text;

comment on column public.deliverables.drive_file_id is '드라이브 파일 ID. work_url 은 이 값으로 만든 보기 링크';
comment on column public.deliverables.work_file_name is '규칙대로 붙은 업로드 파일명. 최종본은 _fin 이 붙는다';

-- 폴더 이름을 화면에 어떻게 띄울지. 기본값을 채워 둔다
update public.drive_grants set label = case kind
  when 'seeding' then '소스 폴더'
  else '완성본 폴더'
end
where label is null;
