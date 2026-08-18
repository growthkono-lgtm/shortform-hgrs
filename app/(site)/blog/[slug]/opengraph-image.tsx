import { renderThumbnail, THUMBNAIL_SIZE } from "@/lib/blog-thumbnail";

/**
 * 카카오·슬랙·링크드인에 링크를 붙였을 때, 그리고 구글 이미지 검색에 뜨는 그림.
 * 그리는 일은 `lib/blog-thumbnail` 이 한다 — 목록 카드와 같은 그림이어야 한다.
 */
export const alt = "해그로시 인사이트";
export const size = THUMBNAIL_SIZE;
export const contentType = "image/png";

export default async function Image(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  return renderThumbnail(slug);
}
