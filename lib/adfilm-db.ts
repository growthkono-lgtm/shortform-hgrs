import "server-only";

import { createAdminClient } from "@/lib/supabase/server";

/**
 * `adfilm` 표 전용 접근 계층. (2026-08-16)
 *
 * ── 왜 따로 두는가 ────────────────────────────────────────────────────
 * `lib/supabase/types.ts` 는 **원격 DB 스키마에서 생성**된 파일이다.
 * `adfilm` 은 마이그레이션이 아직 원격에 적용되지 않아 그 타입에 없고,
 * 그래서 `supabase.from("adfilm")` 이 컴파일에서 막힌다.
 *
 * 여기서 두 가지 중 하나를 골라야 했다:
 *   1. 지금 `db push` 로 원격 스키마를 바꾸고 타입을 다시 뽑는다
 *   2. 이 표만 타입을 느슨하게 잡고, 마이그레이션은 사람이 눌러 적용한다
 *
 * **2번을 골랐다.** 원격 스키마를 코드가 마음대로 바꾸면 안 된다 —
 * 같은 DB 를 블로그·프로젝트·작업자 보드가 함께 쓰고 있다.
 * 마이그레이션 파일은 `supabase/migrations/20260816000001_adfilm_brief.sql` 에
 * 있고, 적용 전까지 이 화면은 "표가 없다" 오류를 낸다 — 그게 맞다.
 *
 * 적용하면 이 파일을 지우고 `createAdminClient()` 를 그대로 쓰면 된다.
 */

export type AdFilmRow = {
  id: string;
  title: string | null;
  format: string;
  stage: string;
  brief: unknown;
  shots: unknown;
  cost_usd: number | null;
  seconds: number | null;
  last_error: string | null;
  created_at: string;
};

type Filter = {
  select: (cols: string) => Filter;
  eq: (col: string, val: unknown) => Filter;
  gte: (col: string, val: unknown) => Filter;
  order: (col: string, opts?: Record<string, unknown>) => Filter;
  limit: (n: number) => Filter;
  single: () => Promise<{ data: AdFilmRow; error: { message: string } | null }>;
  maybeSingle: () => Promise<{
    data: AdFilmRow | null;
    error: { message: string } | null;
  }>;
  then: Promise<{
    data: AdFilmRow[] | null;
    error: { message: string } | null;
  }>["then"];
};

type Table = {
  select: (cols: string) => Filter;
  insert: (row: Record<string, unknown>) => Filter;
  update: (row: Record<string, unknown>) => Filter;
  delete: () => Filter;
};

/** `adfilm` 표 하나만 돌려준다. 다른 표는 평소대로 createAdminClient() 를 쓴다 */
export function adfilmTable(): Table {
  const client = createAdminClient() as unknown as {
    from: (t: string) => Table;
  };
  return client.from("adfilm");
}
