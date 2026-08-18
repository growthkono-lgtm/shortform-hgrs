import "server-only";

import { SERVICE } from "@/lib/constants";

/**
 * IndexNow — 발행하는 순간 검색엔진에 직접 알린다. (2026-08-14)
 *
 * ── 왜 필요한가 ────────────────────────────────────────────────────────
 * 사이트맵과 robots 는 "와서 보면 있다" 는 수동적 신호다. 크롤러가 다시 올 때까지
 * 며칠이 걸리고, 신생 도메인일수록 그 주기가 길다. 매일 한 편씩 쌓는 계획에서
 * 색인이 며칠씩 밀리면 **시즌성 주제는 시즌이 끝난 뒤에 색인된다.**
 *
 * IndexNow 는 반대다 — 우리가 URL 을 밀어 넣는다. **네이버(서치어드바이저)와
 * Bing 이 이 규약의 파트너**라 국내 타겟에는 특히 값이 있다. 구글은 참여하지
 * 않으므로 구글 쪽은 사이트맵·Search Console 이 그대로 담당한다.
 *
 * 계정도 API 키도 필요 없다. 우리 도메인 루트에 키 파일을 올려 두면 그게 곧
 * 소유 증명이다 — 그래서 사장님 손이 안 간다.
 */

/** 소유 증명 파일명과 같은 값. `public/<KEY>.txt` 가 이 문자열을 담고 있다 */
const KEY = "7b5c02667cae8149b61c993b43a509e2d04f4eb58ba87b70";

const ENDPOINT = "https://api.indexnow.org/indexnow";

/**
 * 색인 요청. 실패해도 절대 던지지 않는다 —
 * 발행은 이미 끝났고, 색인 신호 하나 때문에 발행 경로를 죽일 이유가 없다.
 */
export async function pingIndexNow(paths: string[]): Promise<{
  ok: boolean;
  status: number | null;
  count: number;
}> {
  const origin = SERVICE.url.includes("localhost") ? "https://hgrs.io" : SERVICE.url;
  const host = origin.replace(/^https?:\/\//, "");
  const urlList = paths.map((p) => (p.startsWith("http") ? p : `${origin}${p}`));
  if (urlList.length === 0) return { ok: true, status: null, count: 0 };

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key: KEY,
        keyLocation: `${origin}/${KEY}.txt`,
        urlList,
      }),
      // 색인 신호는 급하지 않다. 오래 물고 있지 않는다
      signal: AbortSignal.timeout(10_000),
    });
    return { ok: res.ok, status: res.status, count: urlList.length };
  } catch {
    return { ok: false, status: null, count: urlList.length };
  }
}
