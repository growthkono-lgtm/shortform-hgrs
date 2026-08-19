/**
 * 첫 접점 기록 — "이 사람은 어디로 처음 들어왔나". (2026-08-19)
 *
 * ── 왜 만들었나 ────────────────────────────────────────────────────────
 * 사장님 질문: *"프로젝트신청 한 건이 블로그 어떤 경로로 처음 유입됐는지 알 수
 * 있어?"* 답은 **아니오** 였다. `inquiries` 에 남는 건 IP·User-Agent 뿐이고,
 * 어드민의 "유입 경로" 칸은 **폼이 놓인 페이지**(`/sns-brand`)를 적고 있었다.
 * 그건 어디서 왔는지가 아니라 어디서 눌렀는지다.
 *
 * ── 어떻게 ─────────────────────────────────────────────────────────────
 * 브라우저에 쿠키 두 장을 심는다. 심는 곳은 `proxy.ts` 다 — 발행면은 정적으로
 * 구워져 CDN 이 내주기 때문에 페이지 코드로는 첫 방문을 볼 수 없다. proxy 는
 * 캐시 앞단이라 요청마다 돈다.
 *
 *   hg_v   방문자 id. 우리가 준 임의의 값이라 사람을 특정하지 않는다
 *   hg_ft  첫 접점 — 착지 경로·리퍼러·utm·시각. **한 번 심으면 안 덮는다**
 *
 * 둘 다 httpOnly 다. 화면 자바스크립트가 읽을 일이 없고, 읽게 두면 값이
 * 조작될 수 있다. 우리 도메인 안에서만 서버끼리 주고받는다.
 *
 * 개인정보: 이름·이메일이 아니라 임의 id 다. 신청 폼을 제출한 순간에만
 * 실명 레코드(`inquiries`)와 이어지고, 그때는 이미 수집 동의를 받은 뒤다.
 */

export const VISITOR_COOKIE = "hg_v";
export const FIRST_TOUCH_COOKIE = "hg_ft";

/** 400일. 브라우저가 받아 주는 상한선 근처다 */
export const TOUCH_MAX_AGE = 400 * 24 * 60 * 60;

export type FirstTouch = {
  /** 처음 착지한 경로 (쿼리 제외) */
  p: string;
  /** 리퍼러 원문. 없으면 직접 방문 */
  r?: string;
  /** utm_* 묶음 */
  u?: Record<string, string>;
  /** 처음 닿은 시각 (ISO) */
  t: string;
};

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

/** 봇은 심지 않는다. `/api/blog/view` 와 같은 목록이다 */
export const TOUCH_BOT =
  /bot|crawler|spider|crawling|slurp|facebookexternalhit|preview|monitor|curl|wget|python|headless/i;

/**
 * 쿠키에 담을 때 JSON 을 그대로 넣지 않는다 — 따옴표·한글이 섞이면 헤더에서
 * 깨진다. base64url 로 감싸면 어떤 값이 와도 한 덩어리로 오간다.
 */
export function encodeTouch(t: FirstTouch): string {
  return Buffer.from(JSON.stringify(t), "utf8").toString("base64url");
}

export function decodeTouch(raw: string | undefined): FirstTouch | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as FirstTouch;
    return typeof parsed?.p === "string" ? parsed : null;
  } catch {
    // 형식이 깨진 쿠키는 없는 것으로 친다. 여기서 던지면 페이지가 죽는다
    return null;
  }
}

/** 요청 하나에서 첫 접점을 만든다 */
export function readTouch(url: URL, referrer: string | null, now: Date): FirstTouch {
  const utm: Record<string, string> = {};
  for (const k of UTM_KEYS) {
    const v = url.searchParams.get(k);
    if (v) utm[k] = v.slice(0, 120);
  }
  return {
    p: url.pathname.slice(0, 300),
    // 우리 도메인 안에서의 이동은 리퍼러로 치지 않는다 — 첫 접점이니까
    ...(referrer && !referrer.includes(url.host) ? { r: referrer.slice(0, 300) } : {}),
    ...(Object.keys(utm).length ? { u: utm } : {}),
    t: now.toISOString(),
  };
}

/** `/blog/무엇` 이면 그 슬러그. 아니면 null */
export function blogSlugOf(path: string | null | undefined): string | null {
  if (!path) return null;
  const m = /^\/blog\/([a-z0-9-]{3,120})\/?$/.exec(path);
  return m ? m[1] : null;
}

/**
 * 리퍼러를 사람이 읽는 한 줄로. (어드민 표시용)
 *
 * 검색·SNS 는 이름으로 바꾸고, 나머지는 호스트만 남긴다. 전체 URL 을 그대로
 * 찍으면 표가 길어지기만 하고 판단에는 안 쓰인다.
 */
const REFERRER_LABEL: [RegExp, string][] = [
  [/google\./i, "구글 검색"],
  [/naver\./i, "네이버"],
  [/daum\.|kakao\./i, "다음·카카오"],
  [/bing\./i, "빙 검색"],
  [/instagram\./i, "인스타그램"],
  [/facebook\./i, "페이스북"],
  [/youtube\./i, "유튜브"],
  [/threads\./i, "스레드"],
  [/linkedin\./i, "링크드인"],
  [/t\.co|twitter\.|x\.com/i, "X(트위터)"],
];

export function referrerLabel(referrer: string | null | undefined): string {
  if (!referrer) return "직접 방문";
  for (const [re, label] of REFERRER_LABEL) if (re.test(referrer)) return label;
  try {
    return new URL(referrer).host;
  } catch {
    return referrer.slice(0, 60);
  }
}
