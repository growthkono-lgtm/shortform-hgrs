/**
 * 지금 코드에 실제로 박혀 있는 블로그 규격을 표로 찍는다. (2026-08-16)
 *
 *   npx tsx scripts/blog-spec-table.ts
 *
 * 문서(BLOG_OPS.md)와 코드가 어긋나서 사람이 헛짚는 일이 반복됐다. 문서를
 * 믿지 말고 이걸 돌린다 — 출처는 `lib/blog-spec.ts` 하나뿐이다.
 */
import {
  AEO_SPEC,
  BLOG_SPEC,
  FORMATS,
  SOURCE_SPEC,
  STRUCTURE,
  VISUAL_SPEC,
  WRITING_RULES,
} from "../lib/blog-spec";

console.log("### 유형별 기준 (FORMATS)");
console.table(
  FORMATS.map((f) => ({
    유형: f.key,
    이름: f.label,
    훅: f.hook,
    분량: `${f.minChars}~${f.maxChars}자`,
    섹션: `${f.minH2}~${f.maxH2}개`,
    자료: `${f.minSources}건`,
    "재생 자료": `${f.minEmbeds}건`,
    표: `${f.minTables}개`,
    "핵심박스": `${f.minPoints}개`,
  })),
);

console.log("\n### 구조 (STRUCTURE)");
console.table({
  섹션수: `${STRUCTURE.minSections}~${STRUCTURE.maxSections}`,
  "시각물(재생+표)": `${STRUCTURE.minVisuals}~${STRUCTURE.maxVisuals}`,
  "링크만 인용 상한": STRUCTURE.maxLinkOnlyCitations,
  "섹션 최소 분량": `${STRUCTURE.minCharsPerSection}자`,
  "자료 최소/섹션": SOURCE_SPEC.minPerSection,
});

console.log("\n### 강조·실행 블록 (VISUAL_SPEC)");
console.table({
  "핵심 포인트 박스": VISUAL_SPEC.point.syntax.split("\n")[0],
  "실행 블록 개수": VISUAL_SPEC.action.count,
  "실행 블록 단계": `${VISUAL_SPEC.action.minItems}~${VISUAL_SPEC.action.maxItems}`,
  "실행 블록 위치": VISUAL_SPEC.action.place,
  "굵게 강조": `${VISUAL_SPEC.bold.min}~${VISUAL_SPEC.bold.max}곳`,
});

console.log("\n### 글 전체 (BLOG_SPEC / AEO)");
console.table({
  FAQ: `${BLOG_SPEC.faqCount}문항`,
  "내부 링크": `${BLOG_SPEC.minInternalLinks}개 이상`,
  "문단 최대": `${BLOG_SPEC.maxParagraphChars}자`,
  슬러그: String(BLOG_SPEC.slugPattern),
  "직답 블록": `${AEO_SPEC.answerBlock.minChars}~${AEO_SPEC.answerBlock.maxChars}자`,
  "구조화 데이터": AEO_SPEC.jsonLd.join(", "),
});

console.log("\n### 자료 — 국내 강제 (SOURCE_SPEC.region)");
console.log(JSON.stringify(SOURCE_SPEC.region, null, 1));

console.log("\n### 금지어 (독자가 모르는 내부 어휘)");
console.log(WRITING_RULES.bannedWords.join(" · "));
