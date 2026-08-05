-- ─────────────────────────────────────────────────────────────
-- 수정: private.is_admin()을 authenticated가 실행할 수 있게 한다
--
-- RLS 정책은 쿼리를 던진 롤의 권한으로 평가된다.
-- EXECUTE를 회수해두면 정책 평가 자체가 권한 오류로 실패해
-- 본인 행 조회까지 막힌다 (증상: 로그인은 되는데 profiles가 안 읽힘).
--
-- 노출 위험은 없다:
--  · private 스키마는 Data API에 노출되지 않아 PostgREST로 호출할 수 없다
--  · 함수는 인자가 없고 "호출한 본인이 admin인가"만 돌려준다 — 타인 정보 누출 없음
--  · anon에는 여전히 권한을 주지 않는다 (is_admin을 쓰는 정책은 전부 to authenticated)
-- ─────────────────────────────────────────────────────────────

grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

revoke usage on schema private from anon;
revoke execute on function private.is_admin() from anon, public;
