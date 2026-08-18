import { parseChannelUrl, type ParsedChannel } from "@/lib/channel-url";

/**
 * 채널 지표 수집.
 *
 * 인스타는 공식 API로 남의 계정 지표를 못 가져온다. 상용 스크래핑 벤더를 쓴다.
 * 지금 붙인 건 **Apify** — 액터 하나를 동기 실행해 결과를 바로 받는다.
 * 벤더가 바뀔 걸 전제로 이 파일 하나만 갈아 끼우면 되게 격리해 두었다
 * (스크래핑 벤더는 수명이 짧다 — 마스터 스펙 F5).
 *
 * ⚠️ 값을 만들어내지 않는다. 못 가져오면 null 로 두고 화면에 "—"로 나온다.
 *    가짜 숫자는 클라이언트가 그걸 보고 인플루언서를 고르기 때문에 절대 금물이다.
 */

export type ChannelMetrics = {
  followerCount: number | null;
  contentCount: number | null;
  avgViews: number | null;
  avgLikes: number | null;
  avgComments: number | null;
  thumbnailUrl: string | null;
  /** 표시용 채널명 — 벤더가 주는 이름이 URL 핸들보다 정확하다 */
  displayName: string | null;
  /** 프로필 소개글. 카드 표시와 카테고리 추정에 쓴다 */
  bio: string | null;
  /** 최근 게시물 썸네일 3장. 이미 받아오던 응답에 들어 있는데 버리고 있었다 */
  latestPosts: { thumbnail: string; url: string }[];
  /** 인스타가 직접 주는 업종. **비즈니스 계정에만 있다** — 없으면 소개글로 짐작한다 */
  businessCategory: string | null;
  /** 카테고리 추정용 재료 — 소개글 + 최근 게시물 해시태그 */
  keywords: string | null;
};

export type MetricsResult =
  | { ok: true; metrics: ChannelMetrics }
  | { ok: false; error: string };

const APIFY = "https://api.apify.com/v2/acts";
/** 동기 실행 한도. 넘기면 실패로 보고 수기 입력으로 넘어간다 */
const TIMEOUT_MS = 90_000;

/** 플랫폼별 Apify 액터. 액터가 바뀌면 여기만 고친다 */
const ACTOR: Partial<Record<ParsedChannel["platform"], string>> = {
  instagram: "apify~instagram-profile-scraper",
  tiktok: "clockworks~tiktok-scraper",
  youtube: "streamers~youtube-scraper",
};

const avg = (nums: number[]) =>
  nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null;

const toNum = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? Math.round(v) : null;

/** 핸들에서 @ 를 뗀다 — 벤더 입력은 대개 순수 username 을 받는다 */
const bare = (handle: string) => handle.replace(/^@/, "");

type ActorRun = { items?: Record<string, unknown>[]; error?: string };

async function runActor(
  actor: string,
  input: unknown,
  token: string,
): Promise<ActorRun> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(
      `${APIFY}/${actor}/run-sync-get-dataset-items?token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: controller.signal,
      },
    );
    if (!res.ok) {
      return { error: `수집 실패 (${res.status}) — ${(await res.text()).slice(0, 160)}` };
    }
    const items = (await res.json()) as unknown;
    if (!Array.isArray(items) || items.length === 0) {
      return { error: "채널을 찾지 못했습니다. 링크를 확인해 주세요." };
    }
    return { items: items as Record<string, unknown>[] };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      error: msg.includes("abort")
        ? "수집이 시간 안에 끝나지 않았습니다. 잠시 후 다시 시도해 주세요."
        : `수집 실패 — ${msg.slice(0, 160)}`,
    };
  } finally {
    clearTimeout(timer);
  }
}

/** 인스타 프로필 스크래퍼 결과 → 지표 */
function fromInstagram(item: Record<string, unknown>): ChannelMetrics {
  const posts = Array.isArray(item.latestPosts)
    ? (item.latestPosts as Record<string, unknown>[])
    : [];
  const pick = (key: string) =>
    posts.map((p) => toNum(p[key])).filter((n): n is number => n != null);

  return {
    followerCount: toNum(item.followersCount),
    contentCount: toNum(item.postsCount),
    // 릴스가 아닌 게시물은 조회수가 없다 — 있는 것만 평균 낸다
    avgViews: avg(pick("videoViewCount").length ? pick("videoViewCount") : pick("videoPlayCount")),
    avgLikes: avg(pick("likesCount")),
    avgComments: avg(pick("commentsCount")),
    thumbnailUrl: typeof item.profilePicUrl === "string" ? item.profilePicUrl : null,
    displayName:
      typeof item.fullName === "string" && item.fullName
        ? item.fullName
        : typeof item.username === "string"
          ? `@${item.username}`
          : null,
    bio: typeof item.biography === "string" ? item.biography : null,
    businessCategory:
      typeof item.businessCategoryName === "string" ? item.businessCategoryName : null,
    // 소개글만으로는 업종이 안 잡히는 계정이 많다. 게시물 해시태그·캡션을 같이 본다
    keywords: [
      typeof item.biography === "string" ? item.biography : "",
      ...posts.flatMap((p) =>
        Array.isArray(p.hashtags) ? (p.hashtags as string[]) : [],
      ),
      ...posts.map((p) => (typeof p.caption === "string" ? p.caption.slice(0, 120) : "")),
    ]
      .filter(Boolean)
      .join(" ")
      .slice(0, 2000),
    latestPosts: posts
      .map((p) => ({
        thumbnail:
          (typeof p.displayUrl === "string" && p.displayUrl) ||
          (typeof p.thumbnailUrl === "string" && p.thumbnailUrl) ||
          "",
        url: typeof p.url === "string" ? p.url : "",
      }))
      .filter((p) => p.thumbnail && p.url)
      .slice(0, 3),
  };
}

/** 틱톡 스크래퍼 결과 → 지표 */
function fromTiktok(items: Record<string, unknown>[]): ChannelMetrics {
  const author = (items[0]?.authorMeta ?? {}) as Record<string, unknown>;
  const num = (key: string) =>
    items.map((i) => toNum(i[key])).filter((n): n is number => n != null);

  return {
    followerCount: toNum(author.fans),
    contentCount: toNum(author.video),
    avgViews: avg(num("playCount")),
    avgLikes: avg(num("diggCount")),
    avgComments: avg(num("commentCount")),
    thumbnailUrl: typeof author.avatar === "string" ? author.avatar : null,
    bio: typeof author.signature === "string" ? author.signature : null,
    businessCategory: null,
    keywords: typeof author.signature === "string" ? author.signature : null,
    latestPosts: [],
    displayName:
      typeof author.nickName === "string"
        ? author.nickName
        : typeof author.name === "string"
          ? `@${author.name}`
          : null,
  };
}

/** 유튜브 스크래퍼 결과 → 지표 */
function fromYoutube(items: Record<string, unknown>[]): ChannelMetrics {
  const first = items[0] ?? {};
  const num = (key: string) =>
    items.map((i) => toNum(i[key])).filter((n): n is number => n != null);

  return {
    followerCount: toNum(first.numberOfSubscribers),
    contentCount: toNum(first.channelTotalVideos),
    avgViews: avg(num("viewCount")),
    avgLikes: avg(num("likes")),
    avgComments: avg(num("commentsCount")),
    thumbnailUrl: typeof first.channelAvatarUrl === "string" ? first.channelAvatarUrl : null,
    bio: typeof first.channelDescription === "string" ? first.channelDescription : null,
    businessCategory: null,
    keywords:
      typeof first.channelDescription === "string" ? first.channelDescription : null,
    latestPosts: [],
    displayName: typeof first.channelName === "string" ? first.channelName : null,
  };
}

export async function fetchChannelMetrics(url: string): Promise<MetricsResult> {
  const parsed = parseChannelUrl(url);
  if (!parsed) return { ok: false, error: "채널 링크 형식을 확인해 주세요." };

  const token = process.env.APIFY_TOKEN;
  if (!token) {
    return {
      ok: false,
      error:
        "수집 키(APIFY_TOKEN)가 설정되지 않았습니다. 설정 전까지는 지표를 직접 입력해 주세요.",
    };
  }

  const actor = ACTOR[parsed.platform];
  if (!actor) {
    return { ok: false, error: `${parsed.platform} 채널은 아직 자동 수집을 지원하지 않습니다.` };
  }

  const handle = bare(parsed.handle);
  if (!handle) return { ok: false, error: "링크에서 채널 아이디를 읽지 못했습니다." };

  // 액터마다 입력 스키마가 다르다. 최근 게시물 12개면 평균이 흔들리지 않는다
  const input =
    parsed.platform === "instagram"
      ? { usernames: [handle], resultsLimit: 12 }
      : parsed.platform === "tiktok"
        ? { profiles: [handle], resultsPerPage: 12, shouldDownloadVideos: false }
        : { startUrls: [{ url: parsed.url }], maxResults: 12, maxResultsShorts: 12 };

  const run = await runActor(actor, input, token);
  if (run.error) return { ok: false, error: run.error };
  if (!run.items?.length) return { ok: false, error: "채널을 찾지 못했습니다." };

  const metrics =
    parsed.platform === "instagram"
      ? fromInstagram(run.items[0])
      : parsed.platform === "tiktok"
        ? fromTiktok(run.items)
        : fromYoutube(run.items);

  return { ok: true, metrics };
}

/**
 * CPV = 제안 단가 ÷ 평균 조회수.
 * 단가는 벤더가 주지 않는다(우리가 협상해 넣는 값) — 둘 다 있을 때만 계산한다.
 */
export function computeCpv(reward: number | null, avgViews: number | null) {
  if (!reward || !avgViews) return null;
  return Math.round(reward / avgViews);
}

export type PostMetrics = {
  handle: string | null;
  thumbnail: string | null;
  caption: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  postedAt: string | null;
};

/**
 * 게시물 하나의 지표 — 콘텐츠 검수·모아보기가 쓴다.
 *
 * 프로필 스크래퍼와 같은 액터를 게시물 URL 로 돌린다. 실패하면 null 을 돌려주고,
 * **호출부는 링크만이라도 저장한다** — 지표가 없다고 검수를 못 하면 안 된다.
 */
export async function fetchPostMetrics(url: string): Promise<PostMetrics | null> {
  const token = process.env.APIFY_TOKEN;
  if (!token) return null;

  try {
    const run = await runActor(
      "apify~instagram-scraper",
      { directUrls: [url], resultsType: "posts", resultsLimit: 1 },
      token,
    );
    const p = run.items?.[0];
    if (!p) return null;

    return {
      handle: typeof p.ownerUsername === "string" ? p.ownerUsername : null,
      thumbnail:
        (typeof p.displayUrl === "string" && p.displayUrl) ||
        (typeof p.thumbnailUrl === "string" && p.thumbnailUrl) ||
        null,
      caption: typeof p.caption === "string" ? p.caption : null,
      views: toNum(p.videoViewCount) ?? toNum(p.videoPlayCount),
      likes: toNum(p.likesCount),
      comments: toNum(p.commentsCount),
      postedAt: typeof p.timestamp === "string" ? p.timestamp : null,
    };
  } catch {
    return null;
  }
}
