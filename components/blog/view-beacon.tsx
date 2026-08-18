"use client";

import { useEffect } from "react";

/**
 * 조회수 한 번 두드리기. (2026-08-14)
 *
 * 발행면은 정적으로 구워져 CDN 이 내주기 때문에 서버 쪽에서는 방문을 볼 수
 * 없다. 브라우저가 알려 줘야 실측이 된다.
 *
 * `sessionStorage` 로 슬러그당 한 번만 보낸다. 뒤로 가기·새로고침까지 세면
 * 리포트 숫자가 실제보다 부풀고, 부풀린 숫자는 없는 숫자와 같다.
 */
export function ViewBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `bv:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // 프라이빗 모드 등에서 sessionStorage 가 막히면 그냥 한 번 보낸다
    }

    // 실패해도 아무 일도 일어나지 않아야 한다. 조회수 때문에 페이지가
    // 오류를 뱉으면 본말전도다
    void fetch("/api/blog/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
      keepalive: true,
    }).catch(() => {});
  }, [slug]);

  return null;
}
