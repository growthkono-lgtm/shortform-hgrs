/**
 * 블로그 원고 검사 — 규격에 못 미치면 발행을 막는다.
 *
 *   npx tsx scripts/blog-audit.ts drafts/*.md
 *
 * 검사식은 `lib/blog-audit.ts` 하나뿐이다. 어드민 승인 버튼도 같은 함수를 부른다.
 * 2026-08-13 에 이 스크립트가 자기 사본을 들고 있어서, 규격을 고쳤는데 CLI 만
 * 옛 기준으로 막는 일이 실제로 있었다. 그래서 로직을 전부 라이브러리로 넘겼다.
 *
 * 이 파일이 하는 일은 셋뿐이다 — 파일 읽기, 함수 호출, 결과 찍기.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

import { auditPost } from "../lib/blog-audit";
import { FORMATS, type FormatKey } from "../lib/blog-spec";
import type { Source } from "../lib/blog-sources";

function frontmatter(md: string): Record<string, string> {
  const match = md.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const out: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const at = line.indexOf(":");
    if (at === -1) continue;
    out[line.slice(0, at).trim()] = line
      .slice(at + 1)
      .trim()
      .replace(/^"|"$/g, "");
  }
  return out;
}

/** 원고 옆의 <슬러그>.sources.json */
async function loadSources(file: string): Promise<Source[]> {
  try {
    return JSON.parse(
      await readFile(file.replace(/\.md$/, ".sources.json"), "utf8"),
    ) as Source[];
  } catch {
    return [];
  }
}

async function main() {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.error("사용법: npx tsx scripts/blog-audit.ts <원고.md ...>");
    process.exit(1);
  }

  let failed = 0;
  for (const file of files) {
    console.log(`\n${path.basename(file)}`);

    const md = await readFile(file, "utf8");
    const fm = frontmatter(md);
    const body = md.replace(/^---\n[\s\S]*?\n---\n/, "");
    const formatKey = (fm.format ?? "deep") as FormatKey;

    if (!FORMATS.some((f) => f.key === formatKey)) {
      console.log(
        `  ✗ 알 수 없는 유형 '${formatKey}' — ${FORMATS.map((f) => f.key).join(", ")} 중 하나여야 합니다`,
      );
      failed += 1;
      continue;
    }

    const result = auditPost({
      body,
      formatKey,
      sources: await loadSources(file),
      title: fm.title,
      slug: fm.slug,
    });

    if (result.ok) {
      console.log(
        `  ${result.chars}자 · 질문형 H2 ${result.questionH2} · 표 ${result.tables} · FAQ ${result.faqCount} · 내부링크 ${result.internalLinks} · 인용 자료 ${result.citedSources}`,
      );
    }
    for (const x of result.findings) {
      console.log(`  ${x.level === "fail" ? "✗" : "!"} ${x.message}`);
    }
    if (!result.ok) failed += 1;
  }

  console.log(
    failed
      ? `\n${failed}편이 규격 미달입니다. 발행하지 마세요.`
      : `\n${files.length}편 전부 규격 통과.`,
  );
  process.exit(failed ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
