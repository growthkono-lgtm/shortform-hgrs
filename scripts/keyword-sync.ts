/**
 * 키워드 수집 → DB 반영. 주 1회 돌린다. (2026-08-13)
 *
 *   npx tsx --env-file=.env.local scripts/keyword-sync.ts
 *   npx tsx --env-file=.env.local scripts/keyword-sync.ts --dry
 *
 * ⚠️ 2026-08-19: `.mjs` 에서 `.ts` 로 옮겼다. 이 파일이 **자기만의 필터 정규식을
 * 따로 들고 있어서** `lib/keyword-filter.ts` 의 판정이 한 번도 실제로 돈 적이
 * 없었다. 규칙이 두 벌이면 반드시 어긋나고, 실제로 어긋나 있었다 —
 * `키링제작`·`네이버영수증리뷰`·`홈페이지제작` 이 그대로 들어와 편성 후보
 * 상위를 차지했다. 이제 판정은 `lib/keyword-filter.ts` **한 곳**에서만 한다.
 *
 * 하는 일 두 가지:
 *  1. blog_keyword 의 현재 지표를 최신값으로 갱신(upsert)
 *  2. blog_keyword_metric 에 **이번 주 스냅샷**을 남긴다
 *
 * 왜 스냅샷을 따로 쌓나: 검색량과 경쟁도는 계속 움직인다. 현재값만 덮어쓰면
 * "지난주 대비 오른 키워드"를 영영 못 본다 — 그게 다음 주 편성의 근거다.
 * 주 단위 유니크라 같은 주에 여러 번 돌려도 행이 늘지 않는다.
 *
 * 분류(필러 배정)는 여기서 하지 않는다. 자동 분류는 반드시 틀리고,
 * 틀린 분류가 편성으로 이어진다. 어드민에서 사람이 붙인다.
 */
import crypto from "node:crypto";

const HOST = "https://api.searchad.naver.com";
const PATH = "/keywordstool";

const {
  NAVER_AD_CUSTOMER_ID: CUSTOMER,
  NAVER_AD_API_KEY: API_KEY,
  NAVER_AD_SECRET_KEY: SECRET,
  NEXT_PUBLIC_SUPABASE_URL: SB_URL,
  SUPABASE_SERVICE_ROLE_KEY: SB_KEY,
} = process.env as Record<string, string>;

for (const [name, v] of Object.entries({
  NAVER_AD_CUSTOMER_ID: CUSTOMER,
  NAVER_AD_API_KEY: API_KEY,
  NAVER_AD_SECRET_KEY: SECRET,
  NEXT_PUBLIC_SUPABASE_URL: SB_URL,
  SUPABASE_SERVICE_ROLE_KEY: SB_KEY,
})) {
  if (!v) {
    console.error(`환경변수 ${name} 가 없습니다.`);
    process.exit(1);
  }
}

/**
 * 씨앗 — `keyword-expand.mjs` 와 같은 목록을 쓴다.
 *
 * ⚠️ 동적 `await import` 였는데 `.ts` 로 옮기면서 **최상위 await 를 못 쓴다**
 * (tsx 의 cjs 출력). 정적 import 로 바꿨다.
 */
// 타입 선언 없는 .mjs 씨앗 목록. 값은 string[] 이다
import { SEEDS } from "./keyword-seeds.mjs";

import {
  MIN_MAIN_VOLUME,
  difficultyOf,
  hasBuyerIntent,
  isOurs,
  nicheScore,
} from "../lib/keyword-filter";

/** 네이버 검색광고 키워드도구가 주는 한 줄. 필요한 칸만 적는다 */
type KeywordRow = {
  relKeyword: string;
  monthlyPcQcCnt: unknown;
  monthlyMobileQcCnt: unknown;
  monthlyAvePcClkCnt: unknown;
  monthlyAveMobileClkCnt: unknown;
  monthlyAvePcCtr: unknown;
  monthlyAveMobileCtr: unknown;
  compIdx: string | null;
  plAvgDepth: unknown;
};

function sign(method: string, path: string) {
  const ts = Date.now().toString();
  const mac = crypto.createHmac("sha256", SECRET);
  mac.update(`${ts}.${method}.${path}`);
  return { ts, signature: mac.digest("base64") };
}

async function keywordTool(seeds: string[]) {
  const hint = seeds.map((k: string) => k.replace(/\s+/g, "")).join(",");
  const { ts, signature } = sign("GET", PATH);
  const res = await fetch(
    `${HOST}${PATH}?hintKeywords=${encodeURIComponent(hint)}&showDetail=1`,
    {
      headers: {
        "X-Timestamp": ts,
        "X-API-KEY": API_KEY,
        "X-Customer": String(CUSTOMER),
        "X-Signature": signature,
      },
    },
  );
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return ((await res.json()) as { keywordList?: KeywordRow[] }).keywordList ?? [];
}

const num = (v: unknown): number | null => {
  if (typeof v === "number") return v;
  if (typeof v !== "string") return null;
  if (v.includes("<")) return 9;
  const n = Number(v.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
};

/** 이번 주 월요일 (스냅샷 기준일) */
function weekStart(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x.toISOString().slice(0, 10);
}

/**
 * 표 하나를 **끝까지** 읽는다. (2026-08-19 신설)
 *
 * ⚠️ PostgREST 는 `limit=5000` 을 줘도 **1,000행에서 자른다.** 이 파일에
 * 두 군데 있었고 둘 다 조용히 틀린 값을 만들고 있었다 —
 *  · `existing` 이 1,000개만 담겨서 이미 있는 키워드를 "새 키워드" 로 세고,
 *    그 바람에 `pillar` 를 덮어쓰지 않으려던 방어가 무력화됐다
 *  · `idByTerm` 이 1,000개만 담겨서 **1,000번째 뒤 키워드는 주간 스냅샷이
 *    아예 안 남았다** (지난주 대비 변화량을 못 만든다)
 *
 * 같은 절단 사고가 편성표(08-18)·키워드 보드(08-18)에서도 났다. 세 번째다.
 */
async function sbAll<T>(table: string, select: string): Promise<T[]> {
  const out: T[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const page = (await sb(
      `${table}?select=${select}&order=term&limit=${PAGE}&offset=${from}`,
    )) as T[] | null;
    if (!page?.length) break;
    out.push(...page);
    if (page.length < PAGE) break;
  }
  return out;
}

async function sb(path: string, init: RequestInit = {}) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function main() {
  const dry = process.argv.includes("--dry");
  const rows = new Map();

  for (let i = 0; i < SEEDS.length; i += 5) {
    const chunk = SEEDS.slice(i, i + 5);
    process.stderr.write(`씨앗 ${i + 1}~${Math.min(i + 5, SEEDS.length)}/${SEEDS.length}\n`);
    try {
      for (const row of await keywordTool(chunk)) {
        const pc = num(row.monthlyPcQcCnt) ?? 0;
        const mo = num(row.monthlyMobileQcCnt) ?? 0;
        rows.set(row.relKeyword, {
          term: row.relKeyword,
          pc_volume: pc,
          mobile_volume: mo,
          total_volume: pc + mo,
          pc_clicks: num(row.monthlyAvePcClkCnt),
          mobile_clicks: num(row.monthlyAveMobileClkCnt),
          pc_ctr: num(row.monthlyAvePcCtr),
          mobile_ctr: num(row.monthlyAveMobileCtr),
          competition: row.compIdx ?? null,
          ad_depth: num(row.plAvgDepth),
        });
      }
    } catch (error) {
      console.error(`  ✗ ${chunk.join(", ")} — ${(error as Error).message}`);
    }
    if (i + 5 < SEEDS.length) await new Promise((r) => setTimeout(r, 400));
  }

  /**
   * 2026-08-14 완화 — B2B 구매의도를 **필수에서 뺐다.**
   *
   * 필수로 걸었더니 21,779개를 수집해도 565개만 남았다. 구매 단계 검색어만
   * 노리면 이미 대행사를 찾기로 마음먹은 사람만 만나는데, 그 자리가 경쟁이
   * 제일 세다. 인지·고려 단계로 먼저 만나서 글로 신뢰를 쌓는 편이 낫다.
   *
   * 구매의도는 버리지 않고 `buyer_intent` 로 남긴다 — 편성에서 같은 조건이면
   * 돈 되는 검색어를 위로 올리는 데 쓴다.
   */
  /**
   * 판정은 `lib/keyword-filter.ts` 한 곳에서만 한다. (2026-08-19)
   *
   * 하한을 100 → `MIN_MAIN_VOLUME`(500) 으로 올렸다. 사장님 기준:
   * *"500 내외 혹은 그 미만은 그냥 엄청나게 작은 키워드라 컨텐츠 메인으로
   * 걸 건 사실 원래 아닌데."* 08-19 실측에서 1,998개 중 1,358개(68%)가
   * 100~499 였고, 그 구간이 매일 편성에 뽑히고 있었다.
   *
   * 하한 밑을 아예 안 담는 이유: 담아 두면 표가 그걸로 뒤덮여 판단이 안 된다.
   * 본문 보조 검색어는 기획 단계에서 헤드 키워드로부터 파생시킨다.
   */
  const all = [...rows.values()];

  /**
   * 단계별로 몇 개가 남는지 찍는다. (2026-08-19)
   *
   * 앞서 "수집 16,295 → 우리 키워드 260개" 한 줄만 찍었다. 그러면 260이
   * **하한 때문인지 관련성 때문인지** 알 수 없고, 씨앗을 고쳐야 하는지
   * 규칙을 고쳐야 하는지 판단이 안 된다. 두 관문을 갈라서 센다.
   */
  const volumeOk = all.filter((r) => r.total_volume >= MIN_MAIN_VOLUME);
  const rejected = volumeOk.filter((r) => !isOurs(r.term));

  const keep = volumeOk
    .filter((r) => isOurs(r.term))
    .map((r) => {
      const metrics = {
        term: r.term,
        totalVolume: r.total_volume,
        mobileCtr: r.mobile_ctr ?? null,
        pcCtr: r.pc_ctr ?? null,
        competition: r.competition ?? null,
      };
      return {
        ...r,
        buyer_intent: hasBuyerIntent(r.term),
        difficulty: difficultyOf(metrics),
        // 08-19 이전에는 아무도 안 채워서 1,998개 중 1,460개가 비어 있었다
        niche_score: nicheScore(metrics),
      };
    });

  console.error(
    `\n수집 ${all.length} → 검색량 ${MIN_MAIN_VOLUME}+ ${volumeOk.length} → 우리 키워드 ${keep.length} (관련성 탈락 ${rejected.length})`,
  );

  /** 탈락한 것 중 검색량 큰 것 — 규칙이 과하게 자르는지 눈으로 본다 */
  console.error("\n관련성 탈락 상위 40:");
  for (const r of [...rejected].sort((a, b) => b.total_volume - a.total_volume).slice(0, 40)) {
    console.error(`  ${r.term}\t${r.total_volume}`);
  }

  if (dry) {
    console.log(JSON.stringify(keep.slice(0, 20), null, 2));
    return;
  }

  const now = new Date().toISOString();
  const week = weekStart();

  /**
   * 1) 키워드 현재값 upsert. term 유니크라 중복은 갱신된다.
   *
   * ⚠️ **`pillar` 를 이미 있는 행에 덮어쓰면 안 된다.** (2026-08-19 수정)
   *
   * 앞 판은 모든 행에 `pillar: "unassigned"` 를 실어 보냈다. PostgREST 의
   * merge-duplicates 는 **보낸 컬럼을 전부 update** 하므로, 사장님이 어드민에서
   * 필러를 붙여 놓은 키워드도 주 1회 수집이 돌 때마다 미배정으로 되돌아간다.
   * 지금은 1,998개가 전부 미배정이라 사고가 안 났을 뿐이다.
   *
   * 그래서 **새 키워드와 기존 키워드를 갈라서** 보낸다. 새 것에만 pillar 를
   * 싣고, 기존 것에는 지표만 싣는다. (한 묶음에 키 집합이 다른 객체를 섞으면
   * PostgREST 가 400 을 낸다 — "All object keys must match")
   *
   * `status` 는 애초에 안 싣는다 — 실으면 사장님이 제외한 키워드가 되살아난다.
   */
  const existing = new Set(
    (await sbAll<{ term: string }>("blog_keyword", "term")).map((k) => k.term),
  );

  const fresh = keep.filter((r) => !existing.has(r.term));
  const known = keep.filter((r) => existing.has(r.term));
  console.error(`\n새 키워드 ${fresh.length}개 · 기존 갱신 ${known.length}개`);

  for (const [group, withPillar] of [
    [fresh, true],
    [known, false],
  ] as [typeof keep, boolean][]) {
    for (let i = 0; i < group.length; i += 200) {
      const batch = group.slice(i, i + 200).map((r) => ({
        ...r,
        ...(withPillar ? { pillar: "unassigned" } : {}),
        source: "naver_searchad",
        refreshed_at: now,
      }));
      await sb("blog_keyword?on_conflict=term", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(batch),
      });
      process.stderr.write(
        `  ${withPillar ? "신규" : "갱신"} 저장 ${Math.min(i + 200, group.length)}/${group.length}\n`,
      );
    }
  }

  // 2) 이번 주 스냅샷. 방금 저장한 id 를 다시 읽어 붙인다
  const saved = await sbAll<{ id: string; term: string }>("blog_keyword", "id,term");
  const idByTerm = new Map(saved.map((k) => [k.term, k.id]));

  const snaps = keep
    .filter((r) => idByTerm.has(r.term))
    .map((r) => ({
      keyword_id: idByTerm.get(r.term),
      week,
      pc_volume: r.pc_volume,
      mobile_volume: r.mobile_volume,
      total_volume: r.total_volume,
      pc_ctr: r.pc_ctr,
      mobile_ctr: r.mobile_ctr,
      competition: r.competition,
    }));

  for (let i = 0; i < snaps.length; i += 200) {
    await sb("blog_keyword_metric?on_conflict=keyword_id,week", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(snaps.slice(i, i + 200)),
    });
  }

  console.error(`\n완료 — 키워드 ${keep.length}개 / ${week} 주 스냅샷 ${snaps.length}건`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
