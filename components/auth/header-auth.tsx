"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * 헤더 우측 — 로그인 상태 표시.
 *
 * 랜딩은 SSG로 유지해야 해서(F13) 서버에서 쿠키를 읽지 않는다.
 * 여기서 판단하는 건 **표시용**일 뿐이고, 실제 접근 제어는 /app 레이아웃이
 * 서버에서 getClaims()로 수행한다.
 *
 * 2026-08-10: 메뉴를 "로그인 / 내 프로젝트" 둘로 줄였다. 가입 CTA는 뺐다 —
 * 랜딩의 전환 경로는 진단 → 신청 하나뿐이고, 가입은 결제 길목에서만 필요하다.
 */
export function HeaderAuth({ paper }: { paper?: boolean } = {}) {
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

  return (
    <>
      {/* 판단 전에는 로그인 자리를 비워 둔다 — 로그인 상태인데 "로그인"이 깜빡이면 안 된다 */}
      {signedIn === false && (
        <Link
          href="/login"
          className={
            paper
              ? "-my-3.5 shrink-0 py-3.5 text-[0.6875rem] whitespace-nowrap text-muted hover:text-ink sm:text-sm"
              : "-my-3.5 shrink-0 py-3.5 text-[0.6875rem] whitespace-nowrap text-white/60 hover:text-white sm:text-sm"
          }
        >
          로그인
        </Link>
      )}
      <Link
        href="/app"
        className="shrink-0 rounded-full bg-accent px-3 py-3 text-[0.6875rem] font-bold whitespace-nowrap text-white transition-colors duration-200 hover:bg-accent-deep sm:px-4 sm:py-2 sm:text-xs"
      >
        내 프로젝트
      </Link>
    </>
  );
}
