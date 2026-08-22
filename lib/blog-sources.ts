/**
 * 블로그 실물 자료 수집·검증 — 2026-08-13 신설.
 *
 * 이 파일의 존재 이유 하나: **모델이 자료를 지어내지 못하게 막는 것.**
 *
 * 원고에 들어가는 모든 자료는 여기를 통과해야 한다. 통과 조건은 단순하다 —
 * 실제로 응답하는 URL 이어야 하고, 출처명·연도·기준이 채워져야 한다.
 * 하나라도 비면 `blog-audit.ts` 가 발행을 막는다.
 *
 * ── 2026-08-13 실측으로 확정한 것 (추측 아님, 전부 직접 호출해 봤다) ──────
 *   유튜브 oEmbed      키 불필요, JSON 반환                    → 검증·임베드 O
 *   틱톡 oEmbed        키 불필요, 임베드 HTML 을 통째로 반환    → 검증·임베드 O
 *   구글 트렌드        ❌ 2026-08-15 정정 — 임베드 X.
 *                     embed/explore 가 x-frame-options: SAMEORIGIN 을 준다.
 *                     08-13 메모는 로더 스크립트가 공개돼 있다는 것만 보고 적은 것이었다.
 *                     → 링크 인용만
 *   틱톡 크리에이티브센터  공개 페이지 200                        → 링크 인용 O
 *   ⚠️ 인스타 oEmbed   **로그인 HTML 을 반환한다. 못 쓴다.**
 *      og 메타 스크래핑도 막혀 있다. 즉 **남의 인스타 게시물은 서버에서 검증할 방법이 없다.**
 *      → 남의 계정은 링크 인용만. 임베드는 우리 계정 게시물에만 허용한다
 *        (우리 게시물은 사라지지 않으니 깨질 일이 없다).
 *
 * 메타 광고 라이브러리는 Apify actor 가 전부 건당 과금이라 기본 경로에서 뺐다.
 * 필요하면 사람이 웹에서 찾아 영구 링크만 인용한다(`kind: "adlibrary"`).
 */

import { SOURCE_SPEC } from "./blog-spec";

export type SourceKind = keyof typeof SOURCE_SPEC.kinds;

/** 검증을 통과한 자료 한 건. 원고와 발행면이 이 모양만 취급한다 */
export type Source = {
  kind: SourceKind;
  /** 원문 URL. 캡션에 그대로 노출된다 */
  url: string;
  /** 출처명 — 영상 제목, 리포트 제목, 페이지 제목 */
  title: string;
  /** 채널·계정·발행 기관 */
  author?: string;
  /** 발행 또는 조회 연도. 없으면 검증 실패 */
  year: string;
  /** 기준 — 기간·지역·대상. "2026년 8월 조회, 한국 지역" 같은 것 */
  basis: string;
  /** 본문에 심을 임베드 HTML. 링크 인용만 하는 자료는 없다 */
  embedHtml?: string;
  /**
   * 원문의 대표 이미지(og:image). (2026-08-22)
   *
   * 사장님: *"왜 이미지나 영상 안들어가있어? 크리에이터 인플루언서 실제
   * 얼굴들도 많잖아. … 초상권핑계대지말고."*
   *
   * 08-22 이전에는 통계·발표 자료가 예외 없이 **텍스트 한 줄**로 떨어졌다.
   * 네이버 보도자료도 올리브영 가이드도 유튜브 블로그도 전부 대표 이미지가
   * 있는데 그걸 안 쓰고 있었다. 공개된 og:image 를 **출처 표기와 함께**
   * 인용하는 것이라 저작권 문제도 없다.
   */
  previewImage?: string;
  /** 검증 시각 — 나중에 깨진 자료를 찾을 때 쓴다 */
  verifiedAt: string;
};

/** 모델이 내놓는 자료 후보. 아직 검증 전이다 */
export type SourceCandidate = {
  kind: SourceKind;
  url: string;
  /** 모델이 붙인 기준 설명. 검증이 제목·저자를 덮어써도 이건 남는다 */
  basis: string;
  /** 통계·리포트처럼 자동 검증으로 제목을 못 얻는 자료에 쓴다 */
  title?: string;
  author?: string;
  year?: string;
};

export type SourceRejection = { candidate: SourceCandidate; reason: string };

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

/** 우리 인스타 계정 — 이 계정 게시물만 임베드를 허용한다 */
const OWNED_IG_ACCOUNTS = ["hgrs.official"];

const nowYear = () => String(new Date().getFullYear());
const nowIso = () => new Date().toISOString();

async function getJson(url: string, timeoutMs = 8000): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { "user-agent": UA, accept: "application/json" },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    // 인스타처럼 JSON 대신 HTML 로그인 페이지를 돌려주는 곳이 있다.
    // 그걸 JSON.parse 실패로 흘려보내면 원인을 못 찾는다 — 여기서 잡는다.
    if (text.trimStart().startsWith("<")) {
      throw new Error("JSON 이 아니라 HTML 이 왔다(로그인 벽일 가능성)");
    }
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 원문에서 대표 이미지를 뽑는다. (2026-08-22)
 *
 * 못 뽑아도 **조용히 넘어간다** — 이미지 하나 때문에 자료가 통째로 탈락하면
 * 근거가 좋은 통계를 못 쓰게 된다. 이미지는 있으면 좋은 것이고 근거는
 * 반드시 있어야 하는 것이다.
 */
/**
 * **사이트 공통 OG 이미지는 대표 이미지가 아니다.** (2026-08-22)
 *
 * 08-22 실측에서 이런 것들이 카드로 나갔다 —
 *
 *   네이버      `OG_TAG_6_Media.png`   빈 기자간담회장. 모든 미디어 페이지에 붙는 공통 이미지
 *   콘텐츠진흥원 `logo-og.png`          그냥 기관 로고
 *   유튜브블로그 `default.jpg`          120×90 최저화질 썸네일
 *
 * 셋 다 **그 글의 내용을 담고 있지 않다.** 화질만으로는 못 거른다 —
 * 네이버 것은 1200×630 이라 해상도 검사를 통과한다. 파일명이 단서다.
 */
const GENERIC_IMAGE =
  /(?:^|[/_.-])(?:og[_-]?tag|og[_-]?image|logo|common|default|share|thumb(?:nail)?|placeholder|no[_-]?image|blank|main[_-]?visual|site[_-]?image)(?:[/_.-]|$)/i;

/** 카드로 쓸 만한 최소 폭. 이보다 작으면 본문에서 뭉개진다 */
const MIN_IMAGE_WIDTH = 800;

/**
 * **로고·심볼 이미지는 자료가 아니다.** (2026-08-22)
 *
 * 사장님: *"넌 이딴게 의미가 있는 시각자료라고 생각하냐?"*
 * 그 화면에 KOCCA 로고 한 장, TikTok World 로고 한 장이 크게 박혀 있었다.
 * **정보가 0이다.** 읽는 사람이 그 앞에서 멈출 이유가 없으니 체류시간에도
 * 도움이 안 된다.
 *
 * 파일명으로는 못 잡는다 — KOCCA 는 경로가 달랐고 TikTok 은 파일명이
 * 해시였다. 그래서 **그림 자체를 본다.**
 *
 *   · 색이 몇 개 안 쓰인다      로고는 단색·2색이 대부분이다
 *   · 여백이 태반이다           로고는 가운데만 차 있다
 *
 * 사진·차트·화면 캡처는 색이 수백 개고 여백이 그렇게 크지 않다.
 */
async function looksLikeLogo(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": UA },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());

    const sharp = (await import("sharp")).default;
    // 160px 로 줄여 픽셀을 훑는다. 원본을 다 읽으면 느리고 판정은 안 달라진다
    const { data, info } = await sharp(buf)
      .resize(160, 160, { fit: "inside" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const bucket = new Map<number, number>();
    const total = info.width * info.height;
    for (let i = 0; i < data.length; i += info.channels) {
      // 16단계로 뭉뚱그린다. 사진의 미세한 색차이를 다른 색으로 세지 않게
      const key =
        ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
      bucket.set(key, (bucket.get(key) ?? 0) + 1);
    }
    const colors = bucket.size;
    const background = Math.max(...bucket.values()) / total;

    /**
     * 실측 기준 (2026-08-22)
     *   KOCCA 로고      색 55 · 배경 52%
     *   네이버 간담회    색 110 · 배경 37%   ← 이건 사진이지만 내용이 없어 파일명으로 이미 걸린다
     *   유튜브 썸네일    색 176 · 배경 8.5%
     */
    return colors < 90 || background > 0.45;
  } catch {
    // 못 읽으면 막지 않는다. 근거를 잃는 것보다 낫다
    return false;
  }
}

/**
 * 이미지가 실제로 쓸 만한가 — 폭을 **직접 재서** 판정한다.
 * HEAD 로는 크기를 알 수 없어 앞부분만 받아 헤더에서 읽는다.
 */
async function imageWidth(url: string): Promise<number | null> {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": UA, range: "bytes=0-65535" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok && res.status !== 206) return null;
    const buf = Buffer.from(await res.arrayBuffer());

    // PNG — IHDR 의 폭은 16바이트 위치
    if (buf.length > 24 && buf.toString("hex", 0, 8) === "89504e470d0a1a0a") {
      return buf.readUInt32BE(16);
    }
    // JPEG — SOF 마커를 찾아 폭을 읽는다
    if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
      let i = 2;
      while (i < buf.length - 9) {
        if (buf[i] !== 0xff) { i += 1; continue; }
        const marker = buf[i + 1];
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
          return buf.readUInt16BE(i + 7);
        }
        i += 2 + buf.readUInt16BE(i + 2);
      }
    }
    // WebP(VP8X) — 24바이트 위치에 폭-1 이 24비트로 들어 있다
    if (buf.length > 30 && buf.toString("ascii", 8, 12) === "WEBP" && buf.toString("ascii", 12, 16) === "VP8X") {
      return 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
    }
    return null; // 형식을 모르면 막지 않는다 — 근거를 잃는 것보다 낫다
  } catch {
    return null;
  }
}

async function fetchPreviewImage(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; hgrs-blog/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return undefined;
    const html = (await res.text()).slice(0, 200_000);
    const m =
      /<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']/i.exec(html) ??
      /<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']/i.exec(html) ??
      /<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)["\']/i.exec(html);
    if (!m) return undefined;
    const raw = m[1].trim();
    if (!raw) return undefined;
    // 상대 경로로 준 곳이 있다. 절대 주소로 바꿔 둔다
    const abs = new URL(raw, url).toString();
    if (!abs.startsWith("http")) return undefined;

    // 사이트 공통 이미지는 그 글의 그림이 아니다
    if (GENERIC_IMAGE.test(new URL(abs).pathname)) return undefined;

    // 너무 작으면 본문에서 뭉개진다. 폭을 못 재면 통과시킨다
    const w = await imageWidth(abs);
    if (w !== null && w < MIN_IMAGE_WIDTH) return undefined;

    // 로고 한 장은 시각 자료가 아니다
    if (await looksLikeLogo(abs)) return undefined;

    return abs;
  } catch {
    return undefined;
  }
}

/** 유튜브 영상·쇼츠 — oEmbed 로 실재를 확인하고 iframe 임베드를 만든다 */
export async function resolveYouTube(
  candidate: SourceCandidate,
): Promise<Source> {
  const id = youtubeId(candidate.url);
  if (!id) throw new Error("유튜브 영상 ID 를 못 읽었다");

  const data = (await getJson(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(
      `https://www.youtube.com/watch?v=${id}`,
    )}&format=json`,
  )) as { title?: string; author_name?: string };

  if (!data.title) throw new Error("oEmbed 응답에 제목이 없다");

  return {
    kind: "youtube",
    url: `https://www.youtube.com/watch?v=${id}`,
    title: data.title,
    author: data.author_name,
    year: candidate.year ?? nowYear(),
    basis: candidate.basis,
    embedHtml:
      `<iframe src="https://www.youtube-nocookie.com/embed/${id}" ` +
      `title="${escapeAttr(data.title)}" loading="lazy" allowfullscreen ` +
      `allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"></iframe>`,
    verifiedAt: nowIso(),
  };
}

/** 틱톡 — oEmbed 가 임베드 HTML 을 통째로 준다. 우리가 만들 필요가 없다 */
export async function resolveTikTok(
  candidate: SourceCandidate,
): Promise<Source> {
  const data = (await getJson(
    `https://www.tiktok.com/oembed?url=${encodeURIComponent(candidate.url)}`,
  )) as { title?: string; author_name?: string; html?: string };

  if (!data.html) throw new Error("oEmbed 응답에 임베드 HTML 이 없다");

  return {
    kind: "tiktok",
    url: candidate.url,
    title: data.title ?? "틱톡 영상",
    author: data.author_name,
    year: candidate.year ?? nowYear(),
    basis: candidate.basis,
    embedHtml: data.html,
    verifiedAt: nowIso(),
  };
}

/**
 * 인스타그램 — 검증할 방법이 없다(위 주석 참고).
 * 우리 계정 게시물이면 임베드를 허용하고, 남의 계정이면 링크 인용으로 강등한다.
 * 임베드를 허용해도 **검증한 척하지 않는다** — 캡션에 원문 링크를 반드시 남긴다.
 */
export async function resolveInstagram(
  candidate: SourceCandidate,
): Promise<Source> {
  const account = instagramAccount(candidate.url);
  const owned = account !== null && OWNED_IG_ACCOUNTS.includes(account);

  if (!candidate.title) {
    throw new Error(
      "인스타는 자동으로 제목을 못 얻는다. title 을 직접 채워야 한다",
    );
  }

  return {
    kind: owned ? "owned" : "instagram",
    url: candidate.url,
    title: candidate.title,
    author: account ?? candidate.author,
    year: candidate.year ?? nowYear(),
    basis: candidate.basis,
    // 남의 게시물은 임베드하지 않는다 — 계정이 비공개로 바뀌면 빈 상자만 남는다
    embedHtml: owned
      ? `<blockquote class="instagram-media" data-instgrm-permalink="${escapeAttr(
          candidate.url,
        )}" data-instgrm-version="14"></blockquote>`
      : undefined,
    verifiedAt: nowIso(),
  };
}

/**
 * 링크만 인용하는 자료 — 공개 통계, 메타 광고 라이브러리, 틱톡 크리에이티브 센터.
 * 페이지가 실제로 응답하는지만 확인한다. 제목·연도·기준은 사람이나 모델이 채운다.
 */
export async function resolveLink(
  candidate: SourceCandidate,
): Promise<Source> {
  if (!candidate.title) throw new Error("출처명(title)이 비었다");
  if (!candidate.year) throw new Error("연도(year)가 비었다");

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(candidate.url, {
      headers: { "user-agent": UA },
      redirect: "follow",
      signal: ctrl.signal,
    });
    // 4xx·5xx 는 링크가 죽었다는 뜻이다. 403 은 봇 차단일 수 있으니 통과시킨다 —
    // 사람이 브라우저로 열면 보이는 페이지를 링크 하나 때문에 버리면 손해다.
    if (!res.ok && res.status !== 403) {
      throw new Error(`링크가 응답하지 않는다 (HTTP ${res.status})`);
    }
  } finally {
    clearTimeout(timer);
  }

  // 대표 이미지는 있으면 카드로 보여 준다. 없어도 자료는 그대로 산다
  const previewImage = await fetchPreviewImage(candidate.url);

  return {
    kind: candidate.kind,
    url: candidate.url,
    title: candidate.title,
    author: candidate.author,
    year: candidate.year,
    basis: candidate.basis,
    ...(previewImage ? { previewImage } : {}),
    verifiedAt: nowIso(),
  };
}

/**
 * 구글 트렌드 — 검색 '관심도' 지수다. 검색량이 아니다.
 * 이걸 검색량으로 쓰면 그게 바로 사장님이 말한 "틀린 내용"이라 basis 에 못박는다.
 *
 * ⚠️ 2026-08-15 실측 — **임베드는 못 쓴다.**
 * trends.google.com/trends/embed/explore 가 `x-frame-options: SAMEORIGIN` 을
 * 돌려준다. 남의 페이지에서 띄우면 빈 상자만 남는다. 파일 맨 위 08-13 메모의
 * "임베드 O" 는 embed_loader.js 가 공개돼 있다는 것만 보고 적은 것이었고,
 * 실제로 프레임에 얹어 보지는 않았다. 그래서 링크 인용으로 내린다.
 */
export function trendsSource(input: {
  terms: string[];
  /** 지역 코드. 한국은 KR */
  geo?: string;
  /** 기간. 예: "today 12-m" */
  time?: string;
}): Source {
  const geo = input.geo ?? "KR";
  const time = input.time ?? "today 12-m";

  return {
    kind: "trends",
    url: `https://trends.google.com/trends/explore?q=${input.terms
      .map(encodeURIComponent)
      .join(",")}&geo=${geo}`,
    title: `구글 트렌드 — ${input.terms.join(" / ")}`,
    author: "Google Trends",
    year: nowYear(),
    basis: `${geo} 지역, ${time} 기준 검색 관심도 지수(검색량이 아님)`,
    // embedHtml 없음 — 위 주석의 X-Frame-Options 때문. 링크 인용으로만 쓴다
    verifiedAt: nowIso(),
  };
}

/** 자료 후보를 종류에 맞는 검증기로 보낸다 */
export async function verifySource(
  candidate: SourceCandidate,
): Promise<Source> {
  switch (candidate.kind) {
    case "youtube":
      return resolveYouTube(candidate);
    case "tiktok":
      return resolveTikTok(candidate);
    case "instagram":
    case "owned":
      return resolveInstagram(candidate);
    case "trends":
      throw new Error("구글 트렌드는 trendsSource() 로 직접 만든다");
    default:
      return resolveLink(candidate);
  }
}

/**
 * 후보 전체 검증. 실패한 것은 버리되 **이유를 남긴다** —
 * 조용히 사라지면 "자료가 왜 4개뿐이지"를 추적할 수 없다.
 */
export async function verifySources(candidates: SourceCandidate[]): Promise<{
  verified: Source[];
  rejected: SourceRejection[];
}> {
  const settled = await Promise.allSettled(candidates.map(verifySource));
  const verified: Source[] = [];
  const rejected: SourceRejection[] = [];

  settled.forEach((result, i) => {
    if (result.status === "fulfilled") verified.push(result.value);
    else
      rejected.push({
        candidate: candidates[i],
        reason:
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason),
      });
  });

  return { verified, rejected };
}

/* ── 국내 판정 ─────────────────────────────────────────────────────────
 *
 * 2026-08-15 신설. 사장님 3편 검수 지적 1번("레퍼런스가 해외더라")을 코드가
 * 직접 막게 한다. 지금까지는 "국내 자료를 우선한다"는 말만 프롬프트에 있었고
 * 검사식이 없었다 — 말만 있는 규칙은 지켜지지 않는다.
 *
 * 판정이 쉽지 않은 건 **유튜브·틱톡·인스타** 다. 호스트는 전부 미국이지만
 * 국내 브랜드 영상일 수 있다. 그래서 호스트가 아니라 **제목·채널명에 한글이
 * 있는지**로 본다. 국내 브랜드의 유튜브 영상은 사실상 예외 없이 제목이나
 * 채널명에 한글이 들어간다. oEmbed 가 그 값을 실제로 가져오므로 모델의 말이
 * 아니라 플랫폼이 준 값으로 판정하는 셈이다.
 */

const HANGUL = /[가-힣]/;

/** 국내 기관·매체 호스트. `.kr` 로 안 끝나는 것만 적는다 */
const DOMESTIC_HOSTS = [
  "kostat.go.kr",
  "kobaco.co.kr",
  "opensurvey.co.kr",
  "nasmedia.co.kr",
  "mezzomedia.co.kr",
  "dmcreport.co.kr",
  "incross.com",
  "mobileindex.com",
  "wiseapp.co.kr",
  "20slab.org",
  "kocca.kr",
  "kisa.or.kr",
  "kcc.go.kr",
  "hgrs.io",
];

/** 해외 도메인이라도 한국어 판이면 국내로 친다 */
const KOREAN_PATH = /\/(ko|ko-kr|ko_kr|kr)(\/|$|\?)/i;

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * 이 자료가 국내 것인가.
 *
 * 순서가 중요하다 — 호스트로 먼저 확실한 것을 걸러 내고, 남는 플랫폼 자료만
 * 한글 여부로 본다. 반대로 하면 영문 제목의 한국 리포트를 놓친다.
 */
export function isDomestic(source: Source): boolean {
  const host = hostOf(source.url);
  if (!host) return false;

  if (host.endsWith(".kr") || DOMESTIC_HOSTS.some((h) => host.endsWith(h))) {
    return true;
  }
  // about.fb.com/ko, newsroom.tiktok.com/ko-kr, blog.google/intl/ko-kr 처럼
  // 해외 플랫폼의 한국어 판. 같은 내용이면 이쪽을 쓰라고 규격에 적어 뒀다
  if (KOREAN_PATH.test(source.url)) return true;

  // 유튜브·틱톡·인스타 — 제목·채널명이 한글이면 국내 게시물로 본다
  return HANGUL.test(`${source.title} ${source.author ?? ""}`);
}

/**
 * 본문에서 **보여 주는** 자료인가(임베드되어 그 자리에서 재생·열람되는가).
 * 링크 한 줄은 각주지 시각물이 아니다 — 검사식이 이 구분으로 센다.
 */
export function isVisual(source: Source): boolean {
  return Boolean(source.embedHtml);
}

/** 캡션 한 줄 — SOURCE_SPEC.citation 의 네 항목을 이 순서로 고정한다 */
export function citation(source: Source): string {
  const who = source.author ? `${source.author} · ` : "";
  return `출처: ${who}${source.title} (${source.year}) — ${source.basis} · ${source.url}`;
}

/** 원고 집필 프롬프트에 넣을 자료 목록 */
export function sourceBriefing(sources: Source[]): string {
  return sources
    .map((s, i) => {
      // 임베드 여부와 국적을 한눈에 보여 준다. 모델이 "재생되는 국내 자료"를
      // 우선 고르게 하려면 목록 단계에서 표시가 돼 있어야 한다
      const embed = s.embedHtml
        ? " [🎬 본문에서 재생됨]"
        : " [🔗 링크 인용만 — 시각물로 안 쳐 준다]";
      const region = isDomestic(s) ? " [국내]" : " [해외 — 플랫폼 공식 발표만 허용]";
      return `${i + 1}. (${s.kind})${embed}${region} ${s.title}${
        s.author ? ` — ${s.author}` : ""
      }\n   기준: ${s.basis} (${s.year})\n   URL: ${s.url}`;
    })
    .join("\n");
}

function youtubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /^([A-Za-z0-9_-]{11})$/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

function instagramAccount(url: string): string | null {
  const m = url.match(/instagram\.com\/([A-Za-z0-9._]+)\/(?:p|reel)\//);
  return m ? m[1] : null;
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
