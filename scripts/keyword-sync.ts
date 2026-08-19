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

/** 씨앗 — keyword-expand.mjs 와 같은 목록을 쓴다 */
const { SEEDS } = await import("./keyword-seeds.mjs");

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
  const keep = [...rows.values()]
    .filter((r) => isOurs(r.term) && r.total_volume >= MIN_MAIN_VOLUME)
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
    `\n수집 ${rows.size} → 우리 키워드 ${keep.length}개 (월 ${MIN_MAIN_VOLUME}회 이상)`,
  );
  if (dry) {
    console.log(JSON.stringify(keep.slice(0, 20), null, 2));
    return;
  }

  const now = new Date().toISOString();
  const week = weekStart();

  // 1) 키워드 현재값 upsert. term 소문자 유니크라 중복은 갱신된다
  for (let i = 0; i < keep.length; i += 200) {
    const batch = keep.slice(i, i + 200).map((r) => ({
      ...r,
      pillar: "unassigned",
      source: "naver_searchad",
      refreshed_at: now,
    }));
    await sb("blog_keyword?on_conflict=term", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(batch),
    });
    process.stderr.write(`  키워드 저장 ${Math.min(i + 200, keep.length)}/${keep.length}\n`);
  }

  // 2) 이번 주 스냅샷. 방금 저장한 id 를 다시 읽어 붙인다
  const saved = await sb(
    `blog_keyword?select=id,term&limit=5000`,
  );
  const idByTerm = new Map(
    (saved as { id: string; term: string }[]).map((k) => [k.term, k.id]),
  );

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
