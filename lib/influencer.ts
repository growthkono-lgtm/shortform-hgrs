/**
 * 인플루언서 카드 — 표시 규칙.
 *
 * ⚠️ **리워드·CPV 는 클라이언트에게 보여주지 않는다.** 인플루언서 단가가 보이면
 * 패키지 금액에서 우리 마진이 그대로 역산된다. 그 둘은 어드민 화면에만 남는다.
 */

/** 카테고리 추정 — 프로필 소개글의 낱말로 짐작한다. AI 를 부르지 않아 비용이 0이다 */
const CATEGORY_RULES: [string, string[]][] = [
  ["뷰티", ["뷰티", "화장", "메이크업", "스킨", "코스메", "beauty", "makeup", "skin"]],
  ["패션", ["패션", "코디", "룩북", "옷", "스타일", "fashion", "ootd", "style"]],
  ["맛집·먹방", ["먹방", "맛집", "요리", "레시피", "카페", "디저트", "food", "eat", "cook", "recipe", "cafe"]],
  ["육아", ["육아", "아기", "맘", "엄마", "아이", "baby", "mom", "kids"]],
  ["반려동물", ["강아지", "고양이", "반려", "댕", "냥", "pet", "dog", "cat"]],
  ["운동", ["운동", "헬스", "필라테스", "요가", "다이어트", "fitness", "gym", "yoga"]],
  ["여행", ["여행", "travel", "trip", "호캉스"]],
  ["라이프스타일", ["일상", "라이프", "브이로그", "vlog", "daily", "life"]],
];

export function guessCategory(source: string | null | undefined): string | null {
  if (!source) return null;
  const text = source.toLowerCase();
  const hit = CATEGORY_RULES.find(([, words]) =>
    words.some((w) => text.includes(w.toLowerCase())),
  );
  return hit?.[0] ?? null;
}

export const CATEGORY_OPTIONS = CATEGORY_RULES.map(([label]) => label);

/** 인스타 DM 딥링크 — 벤치마크의 [채팅하기] 자리 */
export function chatLink(platform: string, handle: string | null) {
  if (!handle) return null;
  const h = handle.replace(/^@/, "");
  if (platform === "instagram") return `https://ig.me/m/${h}`;
  if (platform === "tiktok") return `https://www.tiktok.com/@${h}`;
  return null;
}

/** URL 에서 핸들만 뽑는다 */
export function handleFromUrl(url: string | null | undefined) {
  if (!url) return null;
  const m = url.match(/instagram\.com\/([^/?#]+)/i) ?? url.match(/@([^/?#]+)/);
  return m ? m[1].replace(/^@/, "") : null;
}

export type PostThumb = { thumbnail: string; url: string };

export function toPostThumbs(value: unknown): PostThumb[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (p): p is PostThumb =>
        typeof p === "object" &&
        p !== null &&
        typeof (p as PostThumb).thumbnail === "string" &&
        typeof (p as PostThumb).url === "string",
    )
    .slice(0, 3);
}
