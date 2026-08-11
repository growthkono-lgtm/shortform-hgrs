/**
 * 문장 안 강조 — 카피 문자열의 `<em>` 구간만 렌더한다.
 * 원문은 lib/sns-brand.ts 에서 관리하고, 스타일은 globals.css `.rich em` 하나로 묶는다.
 * (후기 카드 s11-reviews 가 쓰는 방식과 같다)
 */
export function Rich({
  html,
  as: Tag = "p",
  className = "",
}: {
  html: string;
  as?: "p" | "span" | "div" | "li";
  className?: string;
}) {
  return (
    <Tag
      className={`rich ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
