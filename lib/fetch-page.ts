/**
 * 상세페이지 텍스트 추출 (E1 입력 ①).
 *
 * 사용자가 준 URL을 서버에서 가져오므로 SSRF 방어가 필요하다 —
 * 내부망 주소로 요청을 유도할 수 있기 때문.
 */

const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "metadata.google.internal",
  "169.254.169.254",
]);

export function assertPublicUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  } catch {
    throw new Error("올바른 주소가 아닙니다.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("http 또는 https 주소만 분석할 수 있습니다.");
  }

  const host = url.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host)) throw new Error("접근할 수 없는 주소입니다.");

  // 사설 대역 차단
  if (
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^169\.254\./.test(host) ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    throw new Error("접근할 수 없는 주소입니다.");
  }

  return url;
}

/** HTML에서 본문 텍스트만 뽑는다. 광고 소재 기획에 필요한 건 문구뿐이라 태그는 버린다 */
export function htmlToText(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    // 이미지 alt는 상세페이지에서 실제 카피를 담고 있는 경우가 많다
    .replace(/<img\b[^>]*\balt=["']([^"']+)["'][^>]*>/gi, " $1 ")
    .replace(/<\/(p|div|li|h[1-6]|br|tr|section)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const MAX_CHARS = 60_000;

export async function fetchPageText(raw: string): Promise<string> {
  const url = assertPublicUrl(raw);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        // 봇 차단 페이지를 받으면 분석할 게 없어진다
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`페이지를 불러오지 못했습니다 (${res.status}).`);
    }

    const text = htmlToText(await res.text());

    if (text.length < 200) {
      throw new Error(
        "페이지에서 읽을 수 있는 내용이 거의 없습니다. 자바스크립트로 그려지는 페이지일 수 있으니 직접 작성을 이용해 주세요.",
      );
    }

    return text.slice(0, MAX_CHARS);
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("페이지를 불러오는 데 시간이 너무 오래 걸립니다.");
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}
