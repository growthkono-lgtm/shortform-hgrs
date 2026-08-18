import "server-only";

/**
 * 외부 이미지를 우리 스토리지로 복사한다.
 *
 * **왜 필요한가** — 인스타 CDN 주소에는 서명과 만료가 들어 있다. 그대로 저장해 두면
 * 몇 주 뒤 클라이언트 화면에서 사진이 통째로 깨진다. 클라이언트는 프로젝트가 끝난 뒤에도
 * 다시 들어와 보는데, 그때마다 우리가 새로고침을 눌러 줄 수는 없다.
 *
 * 그래서 **받는 즉시 우리 것으로 만든다.** 원본 주소는 다시 쓰지 않는다.
 * 복사에 실패하면 null 을 돌려주고, 호출부는 원본 주소라도 저장한다 —
 * 사진이 늦게 깨지는 것이 지금 당장 안 보이는 것보다 낫다.
 */

const BUCKET = "influencer-media";

const base = () => process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/** 스토리지에 올라간 뒤의 공개 주소 */
export const publicUrl = (path: string) =>
  `${base()}/storage/v1/object/public/${BUCKET}/${path}`;

/**
 * @param url  원본 이미지 주소
 * @param path 버킷 안 경로. 같은 경로면 덮어쓴다(재수집 시 최신으로 갱신)
 */
export async function mirrorImage(
  url: string | null | undefined,
  path: string,
): Promise<string | null> {
  if (!url || !base() || !key()) return null;

  try {
    // 인스타 CDN 은 referrer 가 붙으면 막는 경우가 있다
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", Referer: "" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;

    const type = res.headers.get("content-type") ?? "image/jpeg";
    if (!type.startsWith("image/")) return null;
    const body = await res.arrayBuffer();
    if (body.byteLength === 0 || body.byteLength > 10 * 1024 * 1024) return null;

    const upload = await fetch(`${base()}/storage/v1/object/${BUCKET}/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key()}`,
        apikey: key(),
        "Content-Type": type,
        // 재수집 때 같은 경로에 덮어쓴다 — 경로가 늘어나면 지울 방법이 없다
        "x-upsert": "true",
      },
      body,
      signal: AbortSignal.timeout(20_000),
    });
    if (!upload.ok) return null;

    return publicUrl(path);
  } catch {
    return null;
  }
}

/** 프로필 사진과 게시물 썸네일을 한 번에 옮긴다 */
export async function mirrorCandidateMedia(
  candidateId: string,
  input: {
    thumbnailUrl: string | null;
    posts: { thumbnail: string; url: string }[];
  },
) {
  const [thumbnail, ...posts] = await Promise.all([
    mirrorImage(input.thumbnailUrl, `candidate/${candidateId}/profile`),
    ...input.posts.map((p, i) =>
      mirrorImage(p.thumbnail, `candidate/${candidateId}/post-${i + 1}`),
    ),
  ]);

  return {
    thumbnailUrl: thumbnail ?? input.thumbnailUrl,
    posts: input.posts.map((p, i) => ({
      thumbnail: posts[i] ?? p.thumbnail,
      url: p.url,
    })),
  };
}
