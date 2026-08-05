-- public 스키마의 SECURITY DEFINER 함수는 기본적으로 PUBLIC에 EXECUTE가 열린다.
-- handle_new_user는 트리거 전용이라 직접 호출은 막혀 있지만,
-- 권한 자체를 회수해 표면을 줄인다. 트리거는 테이블 소유자 권한으로 돌아가므로
-- 회수해도 가입 플로우에는 영향이 없다.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
