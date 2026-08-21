import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  FIRST_TOUCH_COOKIE,
  LAST_TOUCH_COOKIE,
  TOUCH_BOT,
  TOUCH_MAX_AGE,
  VISITOR_COOKIE,
  decodeLastTouch,
  encodeLastTouch,
  encodeTouch,
  isExternalEntry,
  readTouch,
} from "@/lib/attribution";

/**
 * Next.js 16에서 Middleware는 Proxy로 이름이 바뀌었다 (동작은 동일).
 *
 * 여기서 하는 일은 셋이다.
 *  1) 세션 토큰 갱신 — 실제 접근 제어는 각 레이아웃에서 getClaims()로 판단한다
 *     (Next 문서가 proxy를 전체 인증 해법으로 쓰지 말라고 명시한다)
 *  2) **호스트 분리** — 작업자 도메인과 우리 도메인을 같은 배포에서 갈라 준다
 *  3) **첫 접점 심기** — 이 방문자가 어디로 처음 들어왔는지 (2026-08-19)
 */

/**
 * 작업자 대시보드로 쓸 호스트 목록 (쉼표 구분).
 *
 * 이 호스트로 들어오면 `/work/**` 말고는 **전부 404** 다. 리다이렉트가 아니라 404 인 게 중요하다 —
 * 리다이렉트는 "다른 곳이 있다"를 알려주지만 404 는 아무것도 알려주지 않는다.
 * 작업자가 주소창에 `/admin`, `/shortform`, `/checkout` 을 쳐 봐도 없는 사이트로 보인다.
 *
 * 비워 두면 분리가 꺼진다 — 로컬에서 localhost:3000/work 로 개발할 때를 위한 것이다.
 */
const WORK_HOSTS = (process.env.WORK_HOSTS ?? "")
  .split(",")
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

/** 작업자 호스트에서 열어 주는 경로. 이 밖은 존재하지 않는다 */
const isWorkPath = (path: string) => path === "/work" || path.startsWith("/work/");

function matchesWorkHost(host: string | null) {
  if (!host || WORK_HOSTS.length === 0) return false;
  const full = host.toLowerCase();
  const bare = full.split(":")[0];
  return WORK_HOSTS.includes(full) || WORK_HOSTS.includes(bare);
}

const notFound = () =>
  new NextResponse(null, { status: 404, headers: { "x-robots-tag": "noindex, nofollow" } });

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const onWorkHost = matchesWorkHost(request.headers.get("host"));

  // 우리 도메인에서는 작업자 표면이 존재하지 않는다.
  // (호스트 분리를 켜 둔 경우에만. 안 그러면 로컬 개발에서 /work 를 못 연다)
  if (!onWorkHost && WORK_HOSTS.length > 0 && isWorkPath(pathname)) {
    return notFound();
  }

  if (onWorkHost && pathname !== "/" && !isWorkPath(pathname)) return notFound();

  // 루트로 들어와도 보드로 간다. rewrite 라 주소창에는 "/" 만 남는다.
  // 세션 갱신 쿠키를 실어야 하므로 여기서 응답을 만들어 두고 아래에서 함께 쓴다
  const response =
    onWorkHost && pathname === "/"
      ? NextResponse.rewrite(new URL("/work", request.url))
      : NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // 만료 임박 토큰을 갱신하고 새 쿠키를 응답에 실어 보낸다
  await supabase.auth.getClaims();

  if (!onWorkHost) markFirstTouch(request, response);

  return response;
}

/**
 * 첫 접점 쿠키 두 장. (2026-08-19)
 *
 * **이미 있으면 절대 덮지 않는다.** 덮는 순간 "블로그로 들어와서 나중에
 * 랜딩에서 신청" 이 "랜딩에서 들어옴" 으로 바뀐다 — 그러면 콘텐츠가 한 일이
 * 통째로 지워진다. 첫 접점은 처음 그 한 번이 전부다.
 *
 * 사람이 실제로 본 페이지에만 심는다. HTML 문서 요청이 아니면(이미지·API·
 * 프리페치) 건너뛴다 — `/api/blog/view` 가 첫 접점으로 찍히면 아무 의미가 없다.
 *
 * 작업자 호스트에서는 심지 않는다. 그쪽은 고객 표면이 아니고, 유입 분석 대상도
 * 아니다. 쿠키가 굴러다닐 이유가 없다.
 */
function markFirstTouch(request: NextRequest, response: NextResponse) {
  const accept = request.headers.get("accept") ?? "";
  const dest = request.headers.get("sec-fetch-dest");
  const isDocument = dest ? dest === "document" : accept.includes("text/html");
  if (!isDocument) return;
  if (TOUCH_BOT.test(request.headers.get("user-agent") ?? "")) return;

  const { pathname } = request.nextUrl;
  // 우리 내부 화면은 유입이 아니다. 어드민·작업자·인증 콜백은 세지 않는다
  if (/^\/(admin|work|auth|api)(\/|$)/.test(pathname)) return;

  const secure = request.nextUrl.protocol === "https:";
  const base = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: TOUCH_MAX_AGE,
  };

  const referrer = request.headers.get("referer");

  if (!request.cookies.get(VISITOR_COOKIE)) {
    response.cookies.set(VISITOR_COOKIE, crypto.randomUUID(), base);
  }
  if (!request.cookies.get(FIRST_TOUCH_COOKIE)) {
    const touch = readTouch(request.nextUrl, referrer, new Date());
    response.cookies.set(FIRST_TOUCH_COOKIE, encodeTouch(touch), base);
  }

  /**
   * **라스트 터치는 밖에서 들어올 때만 덮는다.** (2026-08-21)
   *
   * 사이트 안에서 페이지를 넘길 때마다 덮으면 마지막 접점이 늘 우리 자신이
   * 되어 아무 정보가 없다. 같은 이유로 진입 횟수도 여기서만 올린다 —
   * 한 번 와서 다섯 장 본 사람을 5회 방문으로 세면 재방문 판정이 무너진다.
   */
  if (!isExternalEntry(request.nextUrl, referrer)) return;

  const prev = decodeLastTouch(request.cookies.get(LAST_TOUCH_COOKIE)?.value);
  const touch = readTouch(request.nextUrl, referrer, new Date());
  response.cookies.set(
    LAST_TOUCH_COOKIE,
    encodeLastTouch({ ...touch, n: (prev?.n ?? 0) + 1 }),
    base,
  );
}

export const config = {
  matcher: [
    // 정적 자산과 이미지 최적화 경로는 제외.
    // favicon.ico 는 일부러 뺐다 — 작업자 호스트에서 브라우저가 자동으로 긁어가면
    // 우리 파비콘이 그대로 나간다. 여기를 통과시켜 404 로 막는다
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|woff2)$).*)",
  ],
};
