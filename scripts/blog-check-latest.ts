/**
 * 최근 원고가 규격을 실제로 얼마나 채웠는지 숫자로 본다. (2026-08-16)
 *
 *   npx tsx --env-file=.env.local scripts/blog-check-latest.ts [슬러그]
 *
 * 검사식(`auditPost`)의 통과/미달만이 아니라, **기준 대비 실측치**를 나란히
 * 찍는다. "통과했다" 와 "여유 있게 통과했다" 는 다른 얘기라서다.
 */
import { auditPost } from "../lib/blog-audit";
import { FORMATS, type FormatKey } from "../lib/blog-spec";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const h = { apikey: key, Authorization: `Bearer ${key}` };
  const slug = process.argv[2];

  const q = slug
    ? `slug=eq.${slug}`
    : "order=created_at.desc&limit=1";
  const [post] = await (
    await fetch(
      `${url}/rest/v1/blog_post?select=slug,title,body,format,sources,chars,status,approved_at&${q}`,
      { headers: h },
    )
  ).json();

  const f = FORMATS.find((x) => x.key === post.format)!;
  const body: string = post.body;
  const sources = (post.sources ?? []) as { url?: string }[];

  const result = auditPost({
    body,
    formatKey: post.format as FormatKey,
    sources: sources as never,
    title: post.title,
    slug: post.slug,
  });

  const sections = body
    .split(/^## /m)
    .slice(1)
    .filter((s) => !/^(목차|자주 묻는 질문|맺으며|관련 아티클)/.test(s));
  const cited = [...body.matchAll(/:::source\s+(\d+)/g)].map((m) => Number(m[1]));
  const embeds = new Set(cited).size;
  const points = (body.match(/^:::point/gm) ?? []).length;
  const doBlocks = (body.match(/^:::do/gm) ?? []).length;
  const bold = (body.match(/\*\*[^*\n]+\*\*/g) ?? []).length;
  const domestic = sources.filter(
    (s) => s.url && !/about\.fb\.com|newsroom\.tiktok\.com|blog\.google/.test(s.url) === false
      ? false
      : true,
  ).length;

  const row = (name: string, actual: number | string, standard: string, ok: boolean) => ({
    항목: name,
    기준: standard,
    "이 편": actual,
    판정: ok ? "✅" : "❌",
  });

  console.log(`\n원고: ${post.slug} (${f.label}) · 상태 ${post.status} · 승인 ${post.approved_at ? "O" : "X"}\n`);
  console.table([
    row("본문 분량", `${result.chars}자`, `${f.minChars}~${f.maxChars}자`, result.chars >= f.minChars && result.chars <= f.maxChars),
    row("본론 섹션", sections.length, `${f.minH2}~${f.maxH2}개`, sections.length >= f.minH2 && sections.length <= f.maxH2),
    row("질문형 H2", result.questionH2, `본론의 절반 이상`, result.questionH2 * 2 >= sections.length),
    row("인용 자료", result.citedSources, `${f.minSources}건 이상`, result.citedSources >= f.minSources),
    row("재생되는 자료", embeds, `${f.minEmbeds}건 이상`, embeds >= f.minEmbeds),
    row("표", result.tables, `${f.minTables}개 이상`, result.tables >= f.minTables),
    row("핵심 포인트 박스", points, `${f.minPoints}개 이상`, points >= f.minPoints),
    row("실행 블록", doBlocks, `1개`, doBlocks === 1),
    row("굵게 강조", bold, `6~16곳`, bold >= 6 && bold <= 16),
    row("내부 링크", result.internalLinks, `3개 이상`, result.internalLinks >= 3),
    row("FAQ", result.faqCount, `4문항`, result.faqCount === 4),
  ]);

  console.log("검사식 최종:", result.ok ? "✅ 통과" : "❌ 미달");
  for (const fail of result.failures) console.log("  -", fail);
  const warns = result.findings.filter((x) => x.level === "warn");
  for (const w of warns) console.log("  ⚠️", w.message);
  console.log("자료 URL:", sources.length, "건");
}

main();
