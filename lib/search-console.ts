import "server-only";

import { createSign } from "node:crypto";

/**
 * Google Search Console — 실제 검색 성과를 읽어 온다. (2026-08-14)
 *
 * ── 왜 필요한가 ────────────────────────────────────────────────────────
 * 사장님 질문: *"지금 실제 그게 구글이나 네이버에 상위노출 걸리는데 얼마나
 * 걸릴까? 그게 가장 중요해 아니면 의미없어."*
 *
 * 맞다. 그런데 그때까지 우리는 **조회수만 세고 있었다.** 페이지가 몇 번
 * 열렸는지는 알아도, 어떤 검색어로 몇 위에 떠서 몇 번 눌렸는지는 아무도
 * 몰랐다. 그 상태로는 "되고 있다/아니다" 를 판단할 수 없고, 판단을 못 하면
 * 두 달 뒤에도 같은 방식으로 계속 쓰게 된다.
 *
 * 이 파일이 그 눈이다. 매일 리포트에 노출·클릭·평균순위가 실리고,
 * **순위가 오른 검색어**가 따로 뜬다. 그걸 보고 키워드를 갈아탄다.
 *
 * ── 사장님이 한 번 해 주셔야 하는 것 ──────────────────────────────────
 * Search Console 속성에 우리 서비스 계정을 **사용자로 추가**해야 한다.
 * 그 전까지는 403 이 나고, 리포트에는 "연결 전" 이라고만 적힌다.
 *   search.google.com/search-console → 설정 → 사용자 및 권한 → 사용자 추가
 *   → GOOGLE_SERVICE_ACCOUNT_EMAIL 값을 '전체' 권한으로
 *
 * googleapis 패키지는 쓰지 않는다 — 토큰 하나 받자고 의존성을 늘릴 이유가 없다.
 * `lib/google-drive.ts` 와 같은 방식이고, 스코프만 다르다.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

/**
 * 속성 주소 — **자동으로 찾는다.** (2026-08-14)
 *
 * Search Console 은 같은 사이트라도 등록 방식에 따라 속성 이름이 다르다:
 *   도메인 속성   `sc-domain:hgrs.io`
 *   URL 접두어    `https://hgrs.io/`
 * 둘은 서로 다른 것으로 취급돼서, 맞지 않으면 권한을 제대로 넣었는데도
 * 403 이 난다. 실제로 그 일을 겪었다.
 *
 * 그래서 하드코딩하지 않고 접근 가능한 속성 목록을 받아 우리 도메인이
 * 들어간 것을 고른다. 사장님이 어느 방식으로 등록하셨든 알아서 맞는다.
 * 환경변수로 못 박고 싶으면 `SEARCH_CONSOLE_SITE` 를 넣으면 그게 이긴다.
 */
const SITE_HINT = "hgrs.io";

async function resolveSite(token: string): Promise<string> {
  const fixed = process.env.SEARCH_CONSOLE_SITE;
  if (fixed) return fixed;

  const res = await fetch("https://searchconsole.googleapis.com/webmasters/v3/sites", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`속성 목록 조회 실패 (${res.status})`);

  const json = (await res.json()) as {
    siteEntry?: { siteUrl: string; permissionLevel: string }[];
  };
  const entries = (json.siteEntry ?? []).filter(
    (e) => e.siteUrl.includes(SITE_HINT) && e.permissionLevel !== "siteUnverifiedUser",
  );
  if (entries.length === 0) {
    throw new Error(
      "접근 가능한 속성이 없습니다 — Search Console 사용자 추가를 확인해 주세요",
    );
  }
  // 도메인 속성이 하위 경로까지 다 담으므로 있으면 그쪽을 쓴다
  return (
    entries.find((e) => e.siteUrl.startsWith("sc-domain:"))?.siteUrl ??
    entries[0].siteUrl
  );
}

const b64url = (input: string | Buffer) =>
  Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

export function searchConsoleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY,
  );
}

async function accessToken(): Promise<string> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  // 환경변수로 넣으면 줄바꿈이 \n 문자열로 들어온다. 되돌리지 않으면 서명이 깨진다
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) throw new Error("구글 서비스 계정이 설정되지 않았습니다.");

  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: email,
      scope: SCOPE,
      aud: TOKEN_URL,
      exp: now + 3600,
      iat: now,
    }),
  );

  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const signature = b64url(signer.sign(key));

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claims}.${signature}`,
    }),
  });
  if (!res.ok) throw new Error(`구글 인증 실패 (${res.status})`);

  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("액세스 토큰을 받지 못했습니다.");
  return json.access_token;
}

export type SearchRow = {
  key: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type SearchSummary = {
  /** 연결 전이거나 권한이 없으면 null — 리포트가 그 사실을 그대로 적는다 */
  ok: boolean;
  reason?: string;
  clicks: number;
  impressions: number;
  position: number;
  /** 노출이 많은 검색어 상위 */
  queries: SearchRow[];
  /** 지난 기간 대비 순위가 오른 검색어 */
  risen: { key: string; from: number; to: number }[];
};

async function query(
  token: string,
  site: string,
  body: Record<string, unknown>,
): Promise<{ rows?: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[] }> {
  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${text.slice(0, 200)}`);
  }
  return res.json();
}

const day = (d: Date) => d.toISOString().slice(0, 10);

/**
 * 최근 성과 + 순위 변화.
 *
 * Search Console 데이터는 **2~3일 늦게** 들어온다. 그래서 "어제" 가 아니라
 * 최근 7일을 보고, 그 앞 7일과 비교한다. 어제 것만 보면 늘 비어 있다.
 */
export async function searchSummary(now = new Date()): Promise<SearchSummary> {
  const empty: SearchSummary = {
    ok: false,
    clicks: 0,
    impressions: 0,
    position: 0,
    queries: [],
    risen: [],
  };

  if (!searchConsoleConfigured()) {
    return { ...empty, reason: "구글 서비스 계정이 설정되지 않았습니다" };
  }

  try {
    const token = await accessToken();
    const site = await resolveSite(token);

    const end = new Date(now.getTime() - 2 * 86_400_000);
    const start = new Date(end.getTime() - 6 * 86_400_000);
    const prevEnd = new Date(start.getTime() - 86_400_000);
    const prevStart = new Date(prevEnd.getTime() - 6 * 86_400_000);

    const [curr, prev] = await Promise.all([
      query(token, site, {
        startDate: day(start),
        endDate: day(end),
        dimensions: ["query"],
        rowLimit: 25,
      }),
      query(token, site, {
        startDate: day(prevStart),
        endDate: day(prevEnd),
        dimensions: ["query"],
        rowLimit: 100,
      }),
    ]);

    const rows = (curr.rows ?? []).map((r) => ({
      key: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr,
      position: r.position,
    }));

    const before = new Map(
      (prev.rows ?? []).map((r) => [r.keys[0], r.position] as const),
    );

    // 순위가 오른 것 = position 숫자가 **작아진** 것. 3계단 이상만 싣는다
    const risen = rows
      .filter((r) => {
        const was = before.get(r.key);
        return was !== undefined && was - r.position >= 3;
      })
      .map((r) => ({
        key: r.key,
        from: Math.round(before.get(r.key)!),
        to: Math.round(r.position),
      }))
      .slice(0, 5);

    const clicks = rows.reduce((s, r) => s + r.clicks, 0);
    const impressions = rows.reduce((s, r) => s + r.impressions, 0);
    const position =
      impressions > 0
        ? rows.reduce((s, r) => s + r.position * r.impressions, 0) / impressions
        : 0;

    return { ok: true, clicks, impressions, position, queries: rows.slice(0, 8), risen };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // 403 은 대개 "속성에 서비스 계정이 추가되지 않음" 이다. 그대로 알려 준다
    /**
     * 403 을 무조건 "권한 없음" 으로 바꾸지 않는다. (2026-08-14)
     *
     * 처음엔 그렇게 매핑했는데, 사장님이 사용자 추가를 마친 뒤에도 같은 문구가
     * 떠서 **원인을 못 찾았다.** 403 은 최소 세 가지다 —
     * 속성 미추가 / API 미활성화 / 속성 주소 불일치. 원문을 남겨야 구분된다.
     */
    return { ...empty, reason: message.slice(0, 240) };
  }
}

/**
 * 오늘치 검색 성과를 표에 적어 둔다. (2026-08-16)
 *
 * ── 왜 필요한가 ────────────────────────────────────────────────────────
 * 사장님 질문: *"성과도 봐야 하고 키워드 검색량도 중요하다. 결국 SEO·AEO 가
 * 되어야 구글·네이버에서 시크릿 창으로 확인할 수 있다."*
 *
 * 맞는데, 그때까지 우리는 **읽고 버리고 있었다.** 어드민을 열 때마다 구글에
 * 물어보고 화면에 그리고 끝이었다. 그러면 "이번 주가 지난주보다 나은가" 를
 * 영영 답할 수 없다 — 순위는 하루치 숫자가 아니라 기울기로 판단하는 것이다.
 *
 * 리포트가 매일 한 번 부르므로 하루 한 줄이 쌓인다. 같은 날 두 번 불러도
 * `(captured_on, dimension, key)` 유일 제약이 덮어쓴다.
 *
 * 연결 전(ok=false)이면 아무것도 적지 않는다 — 0 을 적으면 "성과 없음" 과
 * "측정 안 됨" 이 표에서 구분되지 않는다. 그 둘은 완전히 다른 얘기다.
 */
export async function recordSearchSnapshot(
  summary: SearchSummary,
  now = new Date(),
): Promise<void> {
  if (!summary.ok) return;

  const { createAdminClient } = await import("@/lib/supabase/server");
  const { kstDate } = await import("@/lib/blog-schedule");
  const captured_on = kstDate(now);

  const rows = [
    {
      captured_on,
      dimension: "total",
      key: "",
      impressions: summary.impressions,
      clicks: summary.clicks,
      position: summary.position || null,
    },
    ...summary.queries.map((q) => ({
      captured_on,
      dimension: "query",
      key: q.key.slice(0, 200),
      impressions: q.impressions,
      clicks: q.clicks,
      position: q.position || null,
    })),
  ];

  try {
    // `database.types.ts` 는 생성물이라 새 표가 아직 없다. 이 한 줄만 느슨하게
    // 두고, 타입은 다음 `supabase gen types` 때 같이 따라온다
    const db = createAdminClient() as unknown as {
      from: (t: string) => {
        upsert: (
          rows: unknown[],
          opts: { onConflict: string },
        ) => Promise<{ error: unknown }>;
      };
    };
    await db
      .from("blog_search_daily")
      .upsert(rows, { onConflict: "captured_on,dimension,key" });
  } catch {
    // 기록하려다 리포트를 못 보내면 본말전도다. 조용히 넘긴다
  }
}

/** 글 한 편의 검색 성적 — 발행일부터 측정일까지 누적 */
export type PagePerformance = {
  impressions: number;
  clicks: number;
  /** 노출이 0 이면 null. "0위" 라고 적지 않는다 */
  position: number | null;
};

/**
 * 글 단위 성적을 페이지 차원으로 가져온다. (2026-08-18)
 *
 * `searchSummary` 는 **검색어** 차원이라 "이 글이 몇 번 노출됐나" 를 못 답한다.
 * 편성표의 노출·순위 칸이 늘 비어 있던 이유도 그것이다 — 글에 검색어를 맞춰
 * 붙이려다 빗나갔다. 페이지 차원으로 물으면 URL 이 곧 열쇠라 빗나갈 일이 없다.
 *
 * 기간은 **발행일 ~ 측정일**이다. 그 구간 누적이 곧 그 글의 성적이다.
 * Search Console 데이터는 2~3일 늦게 들어오므로 끝을 그만큼 당긴다.
 */
export async function pagePerformance(
  paths: string[],
  since: Date,
  now = new Date(),
): Promise<Map<string, PagePerformance>> {
  const out = new Map<string, PagePerformance>();
  if (!paths.length || !searchConsoleConfigured()) return out;

  try {
    const token = await accessToken();
    const site = await resolveSite(token);

    const end = new Date(now.getTime() - 2 * 86_400_000);
    if (end.getTime() < since.getTime()) return out; // 아직 잴 구간이 없다

    const res = await query(token, site, {
      startDate: day(since),
      endDate: day(end),
      dimensions: ["page"],
      rowLimit: 500,
    });

    /**
     * 응답의 keys[0] 은 전체 URL 이다. 우리가 아는 건 경로뿐이고 사이트
     * 프로퍼티가 도메인형인지 URL 접두어형인지에 따라 앞부분이 달라진다.
     * 그래서 **경로 끝으로 맞춘다** — 쿼리스트링·슬래시 차이를 흡수한다.
     */
    const norm = (u: string) => new URL(u).pathname.replace(/\/+$/, "");
    const byPath = new Map<string, PagePerformance>();
    for (const r of res.rows ?? []) {
      try {
        byPath.set(norm(r.keys[0]), {
          impressions: r.impressions,
          clicks: r.clicks,
          position: r.impressions > 0 ? r.position : null,
        });
      } catch {
        // URL 파싱 실패한 줄은 버린다. 한 줄 때문에 전체를 잃지 않는다
      }
    }

    for (const p of paths) {
      const hit = byPath.get(p.replace(/\/+$/, ""));
      // 못 찾았으면 **0 노출**이다 — GSC 는 노출 0 인 페이지를 아예 안 준다.
      // 이건 "모른다" 가 아니라 "없다" 이므로 0 으로 적는 게 맞다
      out.set(p, hit ?? { impressions: 0, clicks: 0, position: null });
    }
  } catch {
    // 못 가져오면 빈 맵이다. 지어내지 않는다 [[feedback_no_fabricated_metrics]]
  }

  return out;
}
