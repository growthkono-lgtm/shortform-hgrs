/**
 * 상세페이지 판독 — **모든 기획의 선행 단계.** (2026-08-16)
 *
 *   npx tsx --env-file=.env.local scripts/adfilm-analyze.ts <상세페이지 링크> [제품명]
 *
 * 결과는 `drafts/<제품>/analysis.json` 에 떨어진다.
 *
 * ── 왜 이 스크립트가 따로 필요한가 ────────────────────────────────────
 * `lib/adfilm-detail.ts` 는 어드민 버튼이 부르는 서버 코드다. 그런데 그 경로가
 * 한 번도 실제로 안 돌아 본 채로 있었고(DB 의 adfilm 5행이 전부 빈 test),
 * 나는 그걸 건너뛰고 기획안을 손으로 썼다. 그 결과가 v11 의 내용 붕괴다 —
 * 고양이가 영역표시를 안 하고, 제품이 박스째 놓여 있고, 대사가 앞 장면과 어긋났다.
 *
 * **분석 없이 기획 없고, 기획 없이 생성 없다.** 그 순서를 CLI 에서도 강제한다.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { analyzeProductUrl } from "../lib/adfilm-detail";

async function main() {
  const url = process.argv[2];
  const name = process.argv[3] ?? "product";
  if (!url) {
    console.error("상세페이지 링크가 필요합니다");
    process.exit(1);
  }

  console.log(`판독 시작: ${url}`);
  const { analysis, images } = await analyzeProductUrl(url, { productName: name });

  const dir = path.join("drafts", name);
  await mkdir(dir, { recursive: true });
  await writeFile(
    path.join(dir, "analysis.json"),
    JSON.stringify({ url, imageCount: images.length, analysis }, null, 2),
  );

  console.log(`\n이미지 ${images.length}장 판독\n`);
  console.log(`무엇  ${analysis.what}`);
  console.log(`헤드  ${analysis.headline}\n`);

  const show = (label: string, rows: string[]) => {
    if (!rows.length) return;
    console.log(`[${label}]`);
    for (const r of rows) console.log(`  · ${r}`);
    console.log();
  };
  show("팩트", analysis.facts.map((f) => `${f.label}: ${f.value}`));
  show("기능", analysis.functions);
  show("추천 대상", analysis.audience);
  show("고객이 겪는 문제", analysis.problems);
  show("신뢰 지표", analysis.trust);
  show("하지 말아야 할 말", analysis.caveats);
  show("상세페이지 서사 순서", analysis.storyOrder);

  console.log(`저장: ${path.join(dir, "analysis.json")}`);
}

main();
