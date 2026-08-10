/**
 * 채널 링크 한 줄에서 플랫폼과 핸들을 뽑는다.
 *
 * 어드민이 후보를 넣을 때 **링크만 붙여넣으면 되게** 하려고 만든 것이다.
 * 채널명·플랫폼은 URL만 봐도 확정되므로 사람이 다시 칠 이유가 없다.
 *
 * ⚠️ 팔로워·조회수 같은 **지표는 여기서 만들 수 없다.** URL에 그 정보가 없다.
 *    수집 소스(유튜브 Data API 키 / 인스타 스크래핑 벤더)를 붙이기 전까지는
 *    비워 두고, 화면에서 "—"로 보여준다. 임의로 채워 넣으면 클라이언트에게
 *    가짜 숫자를 보여주는 셈이 된다.
 */

export type Platform = "instagram" | "youtube" | "tiktok" | "blog" | "etc";

export type ParsedChannel = {
  platform: Platform;
  /** @handle 형태의 표시용 이름 */
  handle: string;
  /** 앞뒤 공백·쿼리·트래킹 파라미터를 턴 정규화 URL */
  url: string;
};

const clean = (raw: string) => {
  const trimmed = raw.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withProtocol);
    u.search = "";
    u.hash = "";
    return u;
  } catch {
    return null;
  }
};

export function parseChannelUrl(raw: string): ParsedChannel | null {
  const u = clean(raw);
  if (!u) return null;

  const host = u.hostname.replace(/^www\./, "").toLowerCase();
  // 앞뒤 슬래시를 턴 경로 조각
  const parts = u.pathname.split("/").filter(Boolean);
  const url = u.toString().replace(/\/$/, "");

  if (host.endsWith("instagram.com")) {
    // /<handle> 또는 /<handle>/reel/<code>
    const handle = parts[0] ?? "";
    return { platform: "instagram", handle: handle ? `@${handle}` : "", url };
  }

  if (host.endsWith("youtube.com") || host === "youtu.be") {
    // /@handle · /channel/<id> · /c/<name> · /user/<name>
    const at = parts.find((p) => p.startsWith("@"));
    if (at) return { platform: "youtube", handle: at, url };
    const i = parts.findIndex((p) => ["channel", "c", "user"].includes(p));
    const name = i >= 0 ? (parts[i + 1] ?? "") : (parts[0] ?? "");
    return { platform: "youtube", handle: name ? `@${name}` : "", url };
  }

  if (host.endsWith("tiktok.com")) {
    const at = parts.find((p) => p.startsWith("@")) ?? "";
    return { platform: "tiktok", handle: at, url };
  }

  if (host.endsWith("blog.naver.com") || host.endsWith("blog.me")) {
    return { platform: "blog", handle: parts[0] ? `@${parts[0]}` : "", url };
  }

  // 알 수 없는 도메인 — 첫 경로 조각이나 호스트를 이름으로 쓴다
  return { platform: "etc", handle: parts[0] ? `@${parts[0]}` : host, url };
}
