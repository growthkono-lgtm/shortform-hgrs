/**
 * 블로그 1편 생성 — 어드민이 붙기 전에 품질부터 고정하기 위한 실행기.
 *
 *   npx tsx --env-file=.env.local scripts/blog-write.ts \
 *     --pillar shortform --format deep --topic "메타 CPM이 오를 때 소재 운영"
 *
 * 2026-08-13 개편: **조사 → 기획 → 자료 검증 → 집필** 네 정거장이 됐다.
 * 사장님이 소스를 주실 수 없으므로 1단계에서 모델이 직접 웹을 검색하고,
 * 3단계에서 그 URL 을 우리가 다시 호출해 실재를 확인한다.
 *
 * 남는 파일 (전부 `drafts/<slug>.*`)
 *   .md            본문
 *   .plan.json     구성안
 *   .sources.json  검증을 통과한 자료 (검사식이 이걸 읽는다)
 *   .research.md   조사 원문 (다시 돌릴 때 재사용)
 *
 * 중간부터 다시 돌리는 법 — 비싼 단계를 두 번 태우지 않기 위한 것이다
 *   --from-research <경로>   조사를 건너뛴다 (기획부터)
 *   --from-plan <경로>       조사·기획을 건너뛴다 (자료 검증부터)
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  USAGE,
  planPost,
  researchTopic,
  writePost,
  type BlogPlan,
  type Research,
} from "../lib/blog-ai";
import { verifySources, type Source } from "../lib/blog-sources";
import { BLOG_SPEC, SOURCE_SPEC, format, pillar } from "../lib/blog-spec";
import type { FormatKey, PillarKey } from "../lib/blog-spec";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

/** 조사 원문 보관 파일명용 — 슬러그가 정해지기 전에 쓴다 */
function stamp(): string {
  return new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
}

async function main() {
  const pillarKey = (arg("pillar") ?? "shortform") as PillarKey;
  const formatKey = (arg("format") ?? "deep") as FormatKey;
  const topic = arg("topic");

  if (!topic) {
    console.error("--topic 이 필요합니다.");
    process.exit(1);
  }

  // 잘못된 키는 여기서 바로 터뜨린다 — 모델 호출까지 가서 실패하면 시간만 버린다
  const p = pillar(pillarKey);
  const f = format(formatKey);

  const dir = path.join(process.cwd(), "drafts");
  await mkdir(dir, { recursive: true });

  const planPath = arg("from-plan");
  const researchPath = arg("from-research");

  // ── 1단계 조사 ────────────────────────────────────────────────────────
  let research: Research | null = null;
  if (!planPath) {
    if (researchPath) {
      research = {
        findings: await readFile(researchPath, "utf8"),
        searchCount: 0,
      };
      console.log(`\n[조사] 재사용 — ${researchPath}`);
    } else {
      console.log(
        `\n[조사] ${p.label} · ${f.label} · ${topic}\n  웹 검색 중… (몇 분 걸립니다)`,
      );
      research = await researchTopic({
        pillarKey,
        formatKey,
        topic,
        onPass: (label, ok, detail) =>
          console.log(`  ${ok ? "✓" : "✗"} ${label} — ${detail}`),
      });
      console.log(`  검색 ${research.searchCount}회 / 보고 ${research.findings.length}자`);

      // 조사가 이 파이프라인에서 가장 비싼 단계다(웹 검색 12회).
      // 슬러그가 정해지기 전이라도 **즉시** 떨궈 둔다 — 2026-08-13 에 크레딧이
      // 떨어져 기획 호출이 400 으로 죽으면서 조사 9,278자가 통째로 날아갔다.
      // 뒷단계가 무엇으로 죽든 조사만은 살아남아야 --from-research 로 이어붙인다.
      const stash = path.join(dir, `_research-${stamp()}.md`);
      await writeFile(stash, research.findings, "utf8");
      console.log(`  조사 원문 보관: ${stash}`);
    }
  }

  // ── 2단계 기획 ────────────────────────────────────────────────────────
  const plan: BlogPlan = planPath
    ? (JSON.parse(await readFile(planPath, "utf8")) as BlogPlan)
    : await planPost({ pillarKey, formatKey, topic, research: research! });

  console.log(`\n[기획]${planPath ? " 구성안 재사용" : ""}`);
  console.log(`  제목: ${plan.title}`);
  console.log(`  슬러그: ${plan.slug}`);
  console.log(`  주 키워드: ${plan.head_keyword}`);
  console.log(
    `  H2 ${plan.sections.length}개 / 표 ${plan.sections.filter((s) => s.table).length}개 / 자료 후보 ${plan.sources.length}건`,
  );
  plan.sections.forEach((s) => console.log(`    - ${s.heading}`));

  if (research) {
    await writeFile(
      path.join(dir, `${plan.slug}.research.md`),
      research.findings,
      "utf8",
    );
  }
  await writeFile(
    path.join(dir, `${plan.slug}.plan.json`),
    JSON.stringify(plan, null, 2),
    "utf8",
  );

  // ── 3단계 자료 검증 ───────────────────────────────────────────────────
  // 모델이 URL 을 지어냈는지 여기서 걸러진다. 탈락 이유를 반드시 찍는다 —
  // 조용히 사라지면 "왜 자료가 4건뿐이지"를 추적할 수 없다
  console.log(`\n[검증] 자료 ${plan.sources.length}건 실제로 호출해 확인 중…`);
  const { verified, rejected } = await verifySources(plan.sources);

  verified.forEach((s, i) =>
    console.log(
      `  ✓ [${i + 1}] (${s.kind})${s.embedHtml ? " 임베드" : " 링크"} ${s.title}`,
    ),
  );
  rejected.forEach((r) =>
    console.log(`  ✗ (${r.candidate.kind}) ${r.candidate.url}\n      → ${r.reason}`),
  );

  if (verified.length < f.minSources) {
    console.error(
      `\n자료 ${verified.length}건 — 이 유형은 ${f.minSources}건 이상이 필요합니다.`,
    );
    console.error(
      `조사를 다시 돌리거나, --from-research ${path.join(dir, `${plan.slug}.research.md`)} 로 기획만 다시 돌리세요.`,
    );
    process.exit(1);
  }

  await writeFile(
    path.join(dir, `${plan.slug}.sources.json`),
    JSON.stringify(verified, null, 2),
    "utf8",
  );

  // ── 4단계 집필 ────────────────────────────────────────────────────────
  console.log(
    `\n[제작] 본문 생성 중… (${f.minChars}자 이상, 자료 ${verified.length}건 인용, 몇 분 걸립니다)`,
  );
  const draft = await writePost({ plan, sources: verified, pillarKey, formatKey });

  const front = [
    "---",
    `title: ${JSON.stringify(plan.title)}`,
    `slug: ${plan.slug}`,
    `pillar: ${pillarKey}`,
    `format: ${formatKey}`,
    `head_keyword: ${JSON.stringify(plan.head_keyword)}`,
    `read_minutes: ${draft.readMinutes}`,
    `sources: ${verified.length}`,
    "---",
    "",
    `📖 읽는 시간: 약 ${draft.readMinutes}분`,
    "",
  ].join("\n");

  const mdPath = path.join(dir, `${plan.slug}.md`);
  await writeFile(mdPath, front + draft.body + "\n", "utf8");

  console.log(`\n[비용] ${USAGE.summary()}`);
  console.log(`\n[완료] ${draft.chars}자 / 약 ${draft.readMinutes}분 / 자료 ${verified.length}건`);
  console.log(`  본문: ${mdPath}`);
  console.log(`  자료: ${path.join(dir, `${plan.slug}.sources.json`)}`);
  console.log(`\n다음: npx tsx scripts/blog-audit.ts ${mdPath}`);

  if (!BLOG_SPEC.slugPattern.test(plan.slug)) {
    console.log(`  ⚠️ 슬러그가 규격(영문-케밥-연도)에 안 맞습니다: ${plan.slug}`);
  }
  if (verified.length < plan.sources.length) {
    console.log(
      `  ⚠️ 자료 ${plan.sources.length - verified.length}건이 검증에서 탈락했습니다 (위 ✗ 참고).`,
    );
  }
  const embeds = verified.filter((s: Source) => s.embedHtml).length;
  if (embeds === 0) {
    console.log(
      `  ⚠️ 재생 가능한 임베드가 0건입니다 — 링크 인용만으로는 ${SOURCE_SPEC.kinds.youtube.label} 의 효과가 안 납니다.`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
