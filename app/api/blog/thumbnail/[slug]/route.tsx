import { renderThumbnail } from "@/lib/blog-thumbnail";

/**
 * GET /api/blog/thumbnail/[slug] — 목록 카드가 쓰는 썸네일.
 *
 * `opengraph-image` 를 그대로 못 쓰는 이유: Next 가 그 파일의 URL 에 빌드마다
 * 바뀌는 해시를 붙인다(`opengraph-image-fx5gi7`). 목록 카드의 img src 는
 * 손으로 적어야 하므로 주소가 고정인 입구가 따로 필요하다.
 *
 * 그림 자체는 같은 함수가 그린다.
 */
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/blog/thumbnail/[slug]">,
) {
  const { slug } = await ctx.params;
  return renderThumbnail(slug);
}
