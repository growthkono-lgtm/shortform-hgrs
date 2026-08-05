"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * 랜딩 헤더의 로그인 상태 표시.
 *
 * 랜딩은 SSG로 유지해야 해서(F13) 서버에서 쿠키를 읽지 않는다.
 * 여기서 판단하는 건 **표시용**일 뿐이고, 실제 접근 제어는 /app 레이아웃이
 * 서버에서 getClaims()로 수행한다.
 */
export function HeaderAuth() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    supabase.auth.getClaims().then(({ data }) => {
      if (active) setSignedIn(Boolean(data?.claims));
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setSignedIn(Boolean(session));
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // 판단 전에는 자리만 잡아둔다 — 레이아웃이 튀지 않게
  if (signedIn === null) {
    return <span aria-hidden className="h-8 w-32" />;
  }

  if (signedIn) {
    return (
      <Link
        href="/app"
        className="rounded-full bg-ink px-4 py-2 text-xs font-bold text-paper transition-colors duration-200 hover:bg-ink-soft"
      >
        내 프로젝트
      </Link>
    );
  }

  return (
    <>
      <Link href="/login" className="text-muted hover:text-ink">
        로그인
      </Link>
      <Link
        href="/signup"
        className="rounded-full bg-ink px-4 py-2 text-xs font-bold text-paper transition-colors duration-200 hover:bg-ink-soft"
      >
        무료 가입
      </Link>
    </>
  );
}
