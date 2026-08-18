/**
 * 이 편이 인용한 자료가 정말 국내 것인지 한 줄씩 판정한다. (2026-08-16)
 *
 *   npx tsx --env-file=.env.local scripts/blog-source-region.ts <슬러그>
 *
 * 사장님 지적(08-15) "레퍼런스가 국내가 아니라 해외더라" 를 눈으로 확인하는 자리.
 * 검사식은 비율만 보고 통과/미달을 찍지만, 어느 자료가 왜 국내로 잡혔는지는
 * 이걸로 봐야 한다.
 */
import { isDomestic, isVisual, type Source } from "../lib/blog-sources";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const h = { apikey: key, Authorization: `Bearer ${key}` };
  const slug = process.argv[2];

  const [post] = await (
    await fetch(
      `${url}/rest/v1/blog_post?select=slug,body,sources&slug=eq.${slug}`,
      { headers: h },
    )
  ).json();

  const cited = new Set(
    [...post.body.matchAll(/:::source\s+(\d+)/g)].map((m: RegExpMatchArray) => Number(m[1])),
  );
  const sources = post.sources as Source[];

  const rows = sources
    .map((s, i) => ({ s, n: i + 1 }))
    .filter(({ n }) => cited.has(n))
    .map(({ s, n }) => ({
      번호: n,
      종류: s.kind,
      재생: isVisual(s) ? "▶︎ 본문 재생" : "링크 인용",
      지역: isDomestic(s) ? "국내" : "해외",
      출처: s.author ?? new URL(s.url).host,
      제목: (s.title ?? "").slice(0, 28),
    }));

  console.table(rows);
  const dom = rows.filter((r) => r.지역 === "국내").length;
  console.log(
    `국내 ${dom}/${rows.length}건 = ${Math.round((dom / rows.length) * 100)}% (기준 70% 이상)`,
  );
  const playing = rows.filter((r) => r.재생.startsWith("▶︎"));
  console.log(
    `본문에서 재생되는 자료 ${playing.length}건 · 그중 해외 ${playing.filter((r) => r.지역 === "해외").length}건 (해외는 0건이어야 함)`,
  );
}

main();
