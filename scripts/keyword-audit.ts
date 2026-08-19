/**
 * 키워드 풀 점검 — 난이도 × 리드 타겟. (2026-08-19)
 *
 *   npx tsx --env-file=.env.local scripts/keyword-audit.ts
 *
 * 사장님 지시: *"seo전략과 우리 판매/리드 타겟 매칭률을 높이기 위한 걸
 * 고려해."* 그 매칭률을 **숫자로** 보는 자리다. 문서가 아니라 살아 있는 값이다.
 *
 * 여기서 답하는 질문 셋:
 *  1. 편성에 쓸 수 있는 키워드가 트랙별로 며칠치 남았나
 *  2. 우리 판매 타겟 4종에 각각 몇 개가 붙어 있나 (매칭률)
 *  3. **아무 타겟 신호에도 안 걸려** 기본값으로 떨어진 것이 몇 개인가
 *     — 이게 많으면 키워드는 있는데 누구에게 쓸 글인지 모르는 상태다
 */
import { LEAD_TARGETS, leadTargetOf } from "../lib/blog-spec";
import { CORE_TERMS, MIN_MAIN_VOLUME, isCore } from "../lib/keyword-filter";

const REST = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY!, Authorization: `Bearer ${KEY}` };

type Row = {
  term: string;
  total_volume: number | null;
  difficulty: string | null;
  status: string;
  buyer_intent: boolean;
};

/** 어느 타겟 신호에도 안 걸리는가 */
function unmatched(term: string): boolean {
  const t = term.replace(/\s+/g, "");
  return !LEAD_TARGETS.some((x) => x.signals.test(t));
}

async function main() {
  const rows: Row[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const r = await fetch(
      `${REST}/rest/v1/blog_keyword?select=term,total_volume,difficulty,status,buyer_intent&order=total_volume.desc.nullslast&limit=${PAGE}&offset=${from}`,
      { headers: H },
    );
    const page = (await r.json()) as Row[];
    if (!page.length) break;
    rows.push(...page);
    if (page.length < PAGE) break;
  }

  const pool = rows.filter(
    (r) =>
      r.status === "idle" &&
      (r.total_volume ?? 0) >= MIN_MAIN_VOLUME &&
      r.difficulty !== "일반어",
  );

  console.log(`전체 ${rows.length}개 · 편성 가능 풀 ${pool.length}개`);
  console.log(`  (status=idle · 검색량 ${MIN_MAIN_VOLUME}+ · 일반어 제외)\n`);

  /* ── 1. 트랙별 잔량 ─────────────────────────────────────── */
  const byDiff: Record<string, number> = {};
  for (const r of pool) byDiff[r.difficulty ?? "미분류"] = (byDiff[r.difficulty ?? "미분류"] ?? 0) + 1;
  console.log("난이도별 잔량 (주간 편성 소비량 기준 며칠치)");
  const WEEKLY = { 니치: 3, 중간: 1, 빅: 1 } as const;
  for (const [d, n] of Object.entries(byDiff).sort((a, b) => b[1] - a[1])) {
    const perWeek = (WEEKLY as Record<string, number>)[d];
    const weeks = perWeek ? ` → 주 ${perWeek}편 기준 ${Math.floor(n / perWeek)}주치` : "";
    console.log(`  ${d}: ${n}${weeks}`);
  }

  /* ── 2. 리드 타겟 매칭 ──────────────────────────────────── */
  console.log("\n리드 타겟별 매칭 (편성 가능 풀 기준)");
  const byTarget: Record<string, Row[]> = {};
  for (const r of pool) {
    const key = leadTargetOf(r.term).key;
    (byTarget[key] ??= []).push(r);
  }
  for (const t of LEAD_TARGETS) {
    const list = byTarget[t.key] ?? [];
    const pct = pool.length ? ((list.length / pool.length) * 100).toFixed(1) : "0";
    console.log(`\n  [${t.label}] ${list.length}개 (${pct}%)`);
    for (const r of list.slice(0, 8)) {
      console.log(`     ${r.term} ${r.total_volume}${r.buyer_intent ? " ·구매의도" : ""}`);
    }
  }

  /* ── 3. 미매칭 — 누구에게 쓸 글인지 모르는 키워드 ───────── */
  const orphan = pool.filter((r) => unmatched(r.term));
  const rate = pool.length ? (((pool.length - orphan.length) / pool.length) * 100).toFixed(1) : "0";
  console.log(`\n키워드-타겟 매칭률: ${rate}% (미매칭 ${orphan.length}개)`);
  console.log("미매칭 상위 25 — 타겟 신호를 늘릴지, 키워드를 뺄지 판단할 대상:");
  for (const r of orphan.slice(0, 25)) {
    console.log(`  ${r.term} ${r.total_volume} ${r.difficulty}`);
  }

  /* ── 4. 코어 키워드가 실제로 DB 에 있나 ─────────────────── */
  console.log("\n코어 키워드 상태 (격주 반복 배포 대상)");
  const byTerm = new Map(rows.map((r) => [r.term, r]));
  for (const c of CORE_TERMS) {
    const hit = byTerm.get(c.term);
    console.log(
      hit
        ? `  ${c.term}: ${hit.total_volume} · ${hit.difficulty} · ${hit.status}`
        : `  ${c.term}: ⚠️ DB 에 없음 — 씨앗에 넣거나 코어에서 빼야 한다`,
    );
  }

  const coreMissing = CORE_TERMS.filter((c) => !byTerm.has(c.term)).length;
  if (coreMissing) {
    console.log(
      `\n⚠️ 코어 ${coreMissing}개가 DB 에 없다. 편성은 돌지만 필러·검색량을 못 붙인다.`,
    );
  }
  // isCore 가 코어 목록과 어긋나지 않는지 확인 (표기 오류 조기 발견용)
  const mismatch = CORE_TERMS.filter((c) => !isCore(c.term));
  if (mismatch.length) console.log("⚠️ isCore 판정 불일치:", mismatch.map((m) => m.term));
}

main();
