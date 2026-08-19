/**
 * 키워드·편성표 CSV 를 **파일로** 뽑는다. (2026-08-19)
 *
 *   npx tsx --env-file=.env.local scripts/keyword-csv.ts [저장할_디렉터리]
 *
 * 어드민 화면의 [CSV] 버튼과 같은 값이다. 사장님이 파일로 바로 받아
 * 필터를 거실 때 쓴다 — 로그인·브라우저를 거치지 않아도 되고, 어드민이
 * 막혀 있을 때도 손에 파일이 남는다.
 *
 * ⚠️ 열 구성은 `app/api/blog/export/route.ts` 와 **같은 뜻**이어야 한다.
 * 두 벌이 어긋나면 사장님이 본 표와 내가 본 표가 달라진다 — 키워드 판정이
 * 두 벌이라 벌어졌던 사고와 같은 종류다.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { toCsv } from "../lib/csv";
import { isCore } from "../lib/keyword-filter";
import { leadTargetOf } from "../lib/blog-spec";

const REST = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY!, Authorization: `Bearer ${KEY}` };

const HEAD: [string, string][] = [
  ["term", "검색어"],
  ["total_volume", "검색량(합)"],
  ["difficulty", "난이도"],
  ["status", "상태"],
  ["buyer_intent", "구매의도"],
  ["niche_score", "니치점수"],
  ["competition", "경쟁도"],
  ["pillar", "필러"],
  ["tier", "헤드/롱테일"],
  ["pc_volume", "PC검색량"],
  ["mobile_volume", "모바일검색량"],
  ["pc_ctr", "PC클릭률"],
  ["mobile_ctr", "모바일클릭률"],
  ["ad_depth", "광고수"],
  ["refreshed_at", "지표갱신"],
  ["note", "메모"],
];

/** 상태·난이도를 사람 말로 — 사장님이 필터 걸 때 코드값을 읽지 않아도 되게 */
const STATUS_MEANING: Record<string, string> = {
  idle: "후보",
  planned: "편성됨",
  done: "발행완료",
  dropped: "제외됨",
};

async function main() {
  const outDir = process.argv[2] ?? process.env.HOME + "/Desktop";
  if (!REST || !KEY) throw new Error("Supabase 환경변수가 없습니다");

  /* ⚠️ PostgREST 는 1,000행에서 자른다 */
  const rows: Record<string, unknown>[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const r = await fetch(
      `${REST}/rest/v1/blog_keyword?select=*&order=total_volume.desc.nullslast&limit=${PAGE}&offset=${from}`,
      { headers: H },
    );
    const page = (await r.json()) as Record<string, unknown>[];
    if (!page.length) break;
    rows.push(...page);
    if (page.length < PAGE) break;
  }

  /* 그 검색어를 실제로 쓴 회차 */
  const posts = (await (
    await fetch(
      `${REST}/rest/v1/blog_post?select=seq,title,keyword_id&keyword_id=not.is.null`,
      { headers: H },
    )
  ).json()) as { seq: number | null; title: string; keyword_id: string }[];
  const used = new Map<string, string>();
  for (const p of posts) {
    const label = `${p.seq === null ? "" : `#${p.seq} `}${p.title}`;
    used.set(p.keyword_id, [used.get(p.keyword_id), label].filter(Boolean).join(" | "));
  }

  /* 어느 작업으로 나갔는지도 붙인다 — 자동 파이프라인은 keyword_id 를 안 채운다 */
  const jobs = (await (
    await fetch(`${REST}/rest/v1/blog_job?select=keyword_term,scheduled_for`, {
      headers: H,
    })
  ).json()) as { keyword_term: string | null; scheduled_for: string }[];
  const usedByTerm = new Map<string, string>();
  for (const j of jobs) {
    if (j.keyword_term) usedByTerm.set(j.keyword_term, j.scheduled_for);
  }

  const known = HEAD.map(([k]) => k);
  const extra = rows.length
    ? Object.keys(rows[0]).filter((k) => !known.includes(k) && k !== "id")
    : [];

  const headers = [
    ...HEAD.map(([, label]) => label),
    "상태(설명)",
    // 사장님이 타겟별로 필터를 걸 수 있어야 한다 — 매칭률이 이 열로 보인다
    "리드타겟",
    "코어키워드",
    "쓴 날짜",
    "쓴 회차",
    ...extra,
  ];

  const body = rows.map((r) => [
    ...known.map((k) => r[k]),
    STATUS_MEANING[String(r.status)] ?? String(r.status),
    leadTargetOf(String(r.term)).label,
    isCore(String(r.term)) ? "코어" : "",
    usedByTerm.get(String(r.term)) ?? "",
    used.get(String(r.id)) ?? "",
    ...extra.map((k) => r[k]),
  ]);

  const day = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
  const path = join(outDir, `키워드_${day}.csv`);
  writeFileSync(path, toCsv(headers, body), "utf8");

  console.log(`✅ ${rows.length}행 → ${path}`);

  /* 무엇이 담겼는지 한눈에 — 파일을 열기 전에 알아야 필터를 어디 걸지 정한다 */
  const tally: Record<string, number> = {};
  for (const r of rows) {
    const k = `${r.difficulty ?? "미분류"} / ${STATUS_MEANING[String(r.status)] ?? r.status}`;
    tally[k] = (tally[k] ?? 0) + 1;
  }
  for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${k}: ${v}`);
  }
}

main();
