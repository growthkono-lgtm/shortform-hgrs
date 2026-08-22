"use client";

import { useEffect } from "react";

/**
 * 조회수 한 번 두드리기 + **체류시간 재기**. (2026-08-14 / 체류 2026-08-22)
 *
 * 발행면은 정적으로 구워져 CDN 이 내주기 때문에 서버 쪽에서는 방문을 볼 수
 * 없다. 브라우저가 알려 줘야 실측이 된다.
 *
 * `sessionStorage` 로 슬러그당 한 번만 보낸다. 뒤로 가기·새로고침까지 세면
 * 리포트 숫자가 실제보다 부풀고, 부풀린 숫자는 없는 숫자와 같다.
 *
 * ── 체류시간을 어떻게 재나 ─────────────────────────────────────────────
 * 사장님: *"노출-클릭-순방문자수-체류시간"*
 *
 * **탭이 보이는 동안만 센다.** 다른 탭으로 넘어가 있는 시간을 체류로 세면
 * 아침에 열어 두고 점심에 닫은 사람이 4시간 정독한 것으로 찍힌다.
 * `visibilitychange` 로 시계를 멈췄다 다시 돌린다.
 *
 * 보내는 시점은 **이탈할 때**(`pagehide`)다. `sendBeacon` 을 쓰는 이유는
 * 페이지가 사라지는 중에도 요청이 살아남기 때문이다 — 평범한 fetch 는
 * 브라우저가 그냥 취소한다.
 *
 * 상한 30분. 그보다 긴 값은 탭을 켜 둔 채 잊은 것이지 읽은 게 아니다.
 */
const MAX_DWELL_MS = 30 * 60 * 1000;

export function ViewBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `bv:${slug}`;
    let counted = false;
    try {
      counted = Boolean(sessionStorage.getItem(key));
      if (!counted) sessionStorage.setItem(key, "1");
    } catch {
      // 프라이빗 모드 등에서 sessionStorage 가 막히면 그냥 한 번 보낸다
    }

    if (!counted) {
      // 실패해도 아무 일도 일어나지 않아야 한다. 조회수 때문에 페이지가
      // 오류를 뱉으면 본말전도다
      void fetch("/api/blog/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
        keepalive: true,
      }).catch(() => {});
    }

    /* ── 체류 시계 ────────────────────────────────────────────── */
    let visibleSince = document.visibilityState === "visible" ? Date.now() : 0;
    let total = 0;
    let sent = false;

    const stop = () => {
      if (visibleSince) {
        total += Date.now() - visibleSince;
        visibleSince = 0;
      }
    };
    const start = () => {
      if (!visibleSince) visibleSince = Date.now();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") start();
      else {
        stop();
        // 탭을 떠나는 순간에도 한 번 보낸다 — 그대로 닫아 버리는 사람이 많다
        flush();
      }
    };

    const flush = () => {
      stop();
      const ms = Math.min(Math.round(total), MAX_DWELL_MS);
      // 3초 미만은 보내지 않는다. 잘못 눌러 바로 나간 것을 체류로 세면
      // 중앙값이 아래로 끌려 내려간다
      if (sent || ms < 3000) return;
      sent = true;
      try {
        navigator.sendBeacon(
          "/api/blog/view",
          new Blob([JSON.stringify({ slug, dwellMs: ms })], {
            type: "application/json",
          }),
        );
      } catch {
        // sendBeacon 이 막힌 환경이면 체류만 못 잰다. 조회수는 이미 셌다
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [slug]);

  return null;
}
