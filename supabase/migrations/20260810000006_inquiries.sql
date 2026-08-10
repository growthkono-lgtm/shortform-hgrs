-- ─────────────────────────────────────────────────────────────
-- 2026-08-10 (4차) 신청 폼 — 홈페이지 가격 비노출 전환
--
-- 가격표를 랜딩에서 내린다. 대신 **신청 입력폼**으로 받고,
-- 구성·견적이 담긴 소개서를 이메일로 보내는 흐름으로 간다.
-- (자동 발송은 어드민 대시보드를 잡은 뒤에 붙인다 — 지금은 접수만 쌓는다.)
--
-- plans / orders / checkout 은 그대로 둔다. 결제 경로는 살아 있고
-- 공개 화면에서 링크만 끊긴 상태다. 가격을 다시 열 때 코드 복구가 필요 없다.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  email text not null,
  phone text,
  brand_url text,
  -- 관심 구성 — 숏폼 단독 / 시딩 포함 / 아직 모르겠음
  interest text not null check (interest in ('shorts_only', 'full', 'unsure')),
  volume text not null check (volume in ('v1', 'v5', 'v10', 'v20', 'unknown')),
  message text,
  -- 진단 섹션을 마치고 넘어온 경우 답변·결과 스냅샷을 그대로 담는다.
  -- 어떤 국면이라고 스스로 답했는지가 소개서 문구를 가르는 값이다
  diagnosis jsonb,
  consent_version text not null,
  marketing_agreed boolean not null default false,
  ip_address inet,
  user_agent text,
  -- new: 접수 / sent: 소개서 발송 / contacted: 회신 완료 / closed: 종료
  status text not null default 'new'
    check (status in ('new', 'sent', 'contacted', 'closed')),
  brochure_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists inquiries_created_idx on public.inquiries (created_at desc);
create index if not exists inquiries_status_idx on public.inquiries (status);

alter table public.inquiries enable row level security;

-- 쓰기는 server action(service_role)만 한다 — anon 에게 insert 를 열면 스팸이 그대로 쌓인다.
-- 읽기는 어드민만.
drop policy if exists "inquiries_select_admin" on public.inquiries;
create policy "inquiries_select_admin" on public.inquiries
  for select to authenticated
  using ((select private.is_admin()));

comment on table public.inquiries is '랜딩 신청 폼 접수. 가격 비노출 전환(2026-08-10)에 따른 유일한 공개 전환 경로';
comment on column public.inquiries.diagnosis is '진단 5문항 답변 + 산출된 추천 구성 스냅샷';
