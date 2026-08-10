-- ─────────────────────────────────────────────────────────────
-- 2026-08-10 (3차) 가입 순서 변경 대응
--
-- 가입이 "이메일 인증 → 나머지 입력 → 완료" 순서로 바뀐다.
-- 인증 시점에 auth 사용자와 profiles 행이 먼저 생기고(회사명 등은 아직 빈 값),
-- 마지막 [가입 완료]에서 비밀번호·회사정보·동의가 채워진다.
-- 그래서 "인증만 하고 이탈한 반쪽 계정"과 "가입을 마친 계정"을 구분할 플래그가 필요하다.
--
-- email 컬럼도 함께 둔다 — 가입 전 중복 여부를 확인해야 하는데
-- auth.users는 클라이언트에서 조회할 수 없고, 대시보드도 매번 토큰 클레임을 뒤져야 했다.
-- ─────────────────────────────────────────────────────────────

alter table public.profiles add column if not exists email text;
alter table public.profiles
  add column if not exists signup_completed boolean not null default false;

-- 기존 계정 이관: 이메일 채우고, 회사명이 들어있으면 가입 완료로 본다
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

update public.profiles
set signup_completed = true
where signup_completed = false and coalesce(company_name, '') <> '';

create unique index if not exists profiles_email_key
  on public.profiles (email) where email is not null;

comment on column public.profiles.email is '로그인 아이디. auth.users.email 사본 — 가입 중복 확인·대시보드 표시용';
comment on column public.profiles.signup_completed is 'false = 이메일 인증만 마치고 이탈한 반쪽 계정. 로그인 시 가입 마무리로 보낸다';

-- 트리거: 이메일을 함께 기록한다. 회사 정보는 인증 이후 단계에서 채워지므로 빈 값 허용
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles
    (id, email, company_name, contact_name, job_title, phone, marketing_opt_in)
  values (
    new.id,
    new.email,
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
