/**
 * 키워드 전량 재분류. (2026-08-19)
 *
 *   npx tsx --env-file=.env.local scripts/keyword-reclassify.ts --dry
 *   npx tsx --env-file=.env.local scripts/keyword-reclassify.ts
 *
 * ── 왜 필요한가 ────────────────────────────────────────────────────────
 * `lib/keyword-filter.ts` 의 판정(관련성·난이도·니치점수)이 **한 번도 실제로
 * 돈 적이 없었다.** 수집 스크립트(`keyword-sync.mjs`)가 자기 정규식을 따로
 * 들고 있었고, `niche_score` 는 1,998개 중 538개만 값이 있었다(실측).
 *
 * 그래서 08-19 기준 편성 픽업 1순위가 `포장지제작`(월 540), 주말 후보가
 * `굿즈제작`·`홈페이지제작`·`쿠팡로켓그로스` 였다. 전부 우리가 파는 것이 아니다.
 *
 * 이 스크립트는 규칙을 바꾼 뒤 **이미 쌓인 것들을 그 규칙으로 다시 본다.**
 * 규칙만 고치고 데이터를 안 고치면 옛 쓰레기가 그대로 뽑힌다.
 *
 * ── 무엇을 바꾸나 ──────────────────────────────────────────────────────
 *   status      우리 일이 아니면 'dropped' (편성 픽업은 'idle' 만 본다)
 *   difficulty  마이크로/니치/중간/빅 — 검색량 한 축으로만
 *   niche_score 처음으로 전량 계산해 채운다
 *
 * ⚠️ **이미 쓴 키워드('planned'·'done')는 건드리지 않는다.** 발행된 글과
 * 키워드의 연결이 끊기면 편성표가 과거를 잃는다.
 */
import {
  difficultyOf,
  isOurs,
  nicheScore,
  type Difficulty,
} from "../lib/keyword-filter";

const REST = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = {
  apikey: KEY!,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

type Row = {
  id: string;
  term: string;
  pillar: string;
  status: string;
  difficulty: string | null;
  niche_score: number | null;
  total_volume: number | null;
  pc_ctr: number | null;
  mobile_ctr: number | null;
  competition: string | null;
};

async function main() {
  const dry = process.argv.includes("--dry");
  if (!REST || !KEY) throw new Error("Supabase 환경변수가 없습니다");

  /* ⚠️ PostgREST 는 1,000행에서 자른다. 다 읽을 때까지 넘긴다 */
  const rows: Row[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const r = await fetch(
      `${REST}/rest/v1/blog_keyword?select=id,term,pillar,status,difficulty,niche_score,total_volume,pc_ctr,mobile_ctr,competition&order=id&limit=${PAGE}&offset=${from}`,
      { headers: H },
    );
    const page = (await r.json()) as Row[];
    if (!page.length) break;
    rows.push(...page);
    if (page.length < PAGE) break;
  }
  console.log(`읽은 키워드 ${rows.length}개`);

  const changes: {
    id: string;
    /**
     * ⚠️ term·pillar 를 payload 에 반드시 실어야 한다.
     *
     * PostgREST 의 upsert 는 `INSERT ... ON CONFLICT` 라서 **먼저 INSERT 행을
     * 검사한다.** 빠진 컬럼은 null 로 들어가고, `pillar`·`term` 은 NOT NULL 이라
     * 통째로 400 이 난다(23502). 실제로 그렇게 한 번 튕겼다.
     */
    term: string;
    pillar: string;
    status: string;
    difficulty: Difficulty;
    niche_score: number;
    was: string;
  }[] = [];

  const tally: Record<string, number> = {};
  const bump = (k: string) => (tally[k] = (tally[k] ?? 0) + 1);

  for (const r of rows) {
    const volume = r.total_volume ?? 0;
    const metrics = {
      term: r.term,
      totalVolume: volume,
      mobileCtr: r.mobile_ctr === null ? null : Number(r.mobile_ctr),
      pcCtr: r.pc_ctr === null ? null : Number(r.pc_ctr),
      competition: r.competition,
    };

    const difficulty = difficultyOf(metrics);
    const score = nicheScore(metrics);
    const ours = isOurs(r.term);

    /**
     * 상태를 **바꾸지 않는** 경우 셋.
     *
     *  planned·done  이미 쓴 검색어. 발행된 글과의 연결이 끊긴다
     *  dropped       **사람이 어드민에서 제외한 것일 수 있다.** 자동 판정이
     *                사람의 제외를 뒤집으면 안 된다. 규칙이 관대해졌다고
     *                사장님이 손으로 내린 걸 되살리는 건 월권이다.
     *                되살릴 것은 CSV 로 보고 사람이 되살린다.
     */
    const lockedStatus =
      r.status === "planned" || r.status === "done" || r.status === "dropped";
    const status = lockedStatus ? undefined : ours ? "idle" : "dropped";

    const statusChanged = status !== undefined && status !== r.status;
    const diffChanged = difficulty !== r.difficulty;
    const scoreChanged = score !== r.niche_score;
    if (!statusChanged && !diffChanged && !scoreChanged) continue;

    if (statusChanged && status === "dropped") bump("우리 일 아님 → 제외");
    if (statusChanged && status === "idle") bump("되살림 → 후보 복귀");
    if (diffChanged) bump(`난이도 ${r.difficulty ?? "없음"} → ${difficulty}`);

    /**
     * ⚠️ 모든 행이 **같은 키 집합**을 가져야 한다. PostgREST 는 묶음 upsert 에서
     * 키가 다른 객체가 섞이면 통째로 400 을 낸다("All object keys must match").
     * 잠긴 행은 원래 status 를 그대로 다시 적어 키를 맞춘다.
     */
    changes.push({
      id: r.id,
      term: r.term,
      pillar: r.pillar,
      status: status ?? r.status,
      difficulty,
      niche_score: score,
      was: `${r.status}/${r.difficulty ?? "-"}/${r.niche_score ?? "-"} vol=${volume}`,
    });
  }

  console.log(`\n바뀔 행 ${changes.length}개`);
  for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v}`);
  }

  console.log("\n제외되는 것 상위 30 (검색량 순):");
  const dropped = changes
    .filter((c) => c.status === "dropped")
    .sort((a, b) => Number(b.was.split("vol=")[1]) - Number(a.was.split("vol=")[1]));
  for (const c of dropped.slice(0, 30)) {
    console.log(`  ${c.term} (${c.was.split("vol=")[1]})`);
  }

  if (dry) {
    console.log("\n--dry 이므로 쓰지 않았습니다.");
    return;
  }

  /* 200개씩 끊어 upsert. 한 번에 다 밀면 요청이 거절된다 */
  const CHUNK = 200;
  for (let i = 0; i < changes.length; i += CHUNK) {
    const slice = changes.slice(i, i + CHUNK).map(({ was: _was, ...rest }) => rest);
    const r = await fetch(`${REST}/rest/v1/blog_keyword?on_conflict=id`, {
      method: "POST",
      headers: { ...H, Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(slice),
    });
    if (!r.ok) {
      console.error(`❌ ${r.status} ${(await r.text()).slice(0, 300)}`);
      process.exit(1);
    }
    process.stdout.write(`  ${Math.min(i + CHUNK, changes.length)}/${changes.length}\r`);
  }
  console.log(`\n✅ ${changes.length}행 반영 완료`);
}

main();
