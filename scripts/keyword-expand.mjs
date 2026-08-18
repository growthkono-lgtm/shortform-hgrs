/**
 * 씨앗 키워드 → 연관 키워드 확장 + 실측 검색량. (2026-08-13)
 *
 *   node --env-file=.env.local scripts/keyword-expand.mjs
 *   node --env-file=.env.local scripts/keyword-expand.mjs --json > /tmp/kw.json
 *   node --env-file=.env.local scripts/keyword-expand.mjs --min 300 --top 80
 *
 * Why 이 스크립트가 따로 필요한가:
 * `keyword-research.mjs` 로 내가 짜 둔 주제 16개를 조회했더니 **전부 월 10회 미만**이었다.
 * 주제를 쓰고 그게 검색어라고 가정한 것이 틀렸다 — 사람은 "숏폼 소재 교체 주기"라고
 * 치지 않는다. 순서가 반대여야 한다:
 *
 *   씨앗 키워드 → 네이버가 주는 연관어 → **검색량 있는 것만** → 거기서 주제를 만든다
 *
 * 씨앗은 사장님이 직접 주신 목록이다(2026-08-13). 우리가 파는 것과 붙어 있는 말들이라
 * 여기서 나온 연관어는 대체로 우리 리드와 관련이 있다.
 */
import crypto from "node:crypto";

const HOST = "https://api.searchad.naver.com";
const PATH = "/keywordstool";

const CUSTOMER = process.env.NAVER_AD_CUSTOMER_ID;
const API_KEY = process.env.NAVER_AD_API_KEY;
const SECRET = process.env.NAVER_AD_SECRET_KEY;

if (!CUSTOMER || !API_KEY || !SECRET) {
  console.error("네이버 검색광고 키 3개가 필요합니다 (.env.local).");
  process.exit(1);
}

/** 씨앗은 keyword-seeds.mjs 하나만 본다 — 두 벌로 두면 수집 결과가 갈린다 */
import { SEEDS } from "./keyword-seeds.mjs";

function sign(method, path) {
  const ts = Date.now().toString();
  const mac = crypto.createHmac("sha256", SECRET);
  mac.update(`${ts}.${method}.${path}`);
  return { ts, signature: mac.digest("base64") };
}

async function keywordTool(seeds) {
  const hint = seeds.map((k) => k.replace(/\s+/g, "")).join(",");
  const query = `?hintKeywords=${encodeURIComponent(hint)}&showDetail=1`;
  const { ts, signature } = sign("GET", PATH);

  const res = await fetch(`${HOST}${PATH}${query}`, {
    headers: {
      "X-Timestamp": ts,
      "X-API-KEY": API_KEY,
      "X-Customer": String(CUSTOMER),
      "X-Signature": signature,
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return (await res.json()).keywordList ?? [];
}

/** "< 10" 은 0 이 아니라 '적음'이다. 0 으로 만들면 없음과 구분이 안 된다 */
const num = (v) => {
  if (typeof v === "number") return v;
  if (typeof v !== "string") return 0;
  if (v.includes("<")) return 9;
  const n = Number(v.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : Number(process.argv[i + 1]);
};

async function main() {
  const minVolume = arg("min", 100);
  const top = arg("top", 120);
  const rows = new Map();

  for (let i = 0; i < SEEDS.length; i += 5) {
    const chunk = SEEDS.slice(i, i + 5);
    process.stderr.write(
      `씨앗 ${i + 1}~${Math.min(i + 5, SEEDS.length)} / ${SEEDS.length}  (${chunk.join(", ")})\n`,
    );
    try {
      for (const row of await keywordTool(chunk)) {
        const pc = num(row.monthlyPcQcCnt);
        const mo = num(row.monthlyMobileQcCnt);
        rows.set(row.relKeyword, {
          term: row.relKeyword,
          pcVolume: pc,
          mobileVolume: mo,
          totalVolume: pc + mo,
          mobileShare: pc + mo > 0 ? Math.round((mo / (pc + mo)) * 100) : 0,
          pcClicks: num(row.monthlyAvePcClkCnt),
          mobileClicks: num(row.monthlyAveMobileClkCnt),
          pcCtr: num(row.monthlyAvePcCtr),
          mobileCtr: num(row.monthlyAveMobileCtr),
          competition: row.compIdx ?? "—",
          adDepth: num(row.plAvgDepth),
        });
      }
    } catch (error) {
      console.error(`  ✗ ${chunk.join(", ")} — ${error.message}`);
    }
    if (i + 5 < SEEDS.length) await new Promise((r) => setTimeout(r, 400));
  }

  const list = [...rows.values()]
    .filter((r) => r.totalVolume >= minVolume)
    .sort((a, b) => b.totalVolume - a.totalVolume)
    .slice(0, top);

  if (process.argv.includes("--json")) {
    process.stdout.write(JSON.stringify(list, null, 2));
    return;
  }

  console.log(
    `\n연관 키워드 ${rows.size}개 수집 / 월 ${minVolume}회 이상 ${list.length}개\n`,
  );
  console.log(
    "키워드".padEnd(26) +
      "PC".padStart(8) +
      "모바일".padStart(10) +
      "합계".padStart(10) +
      "모바일%".padStart(8) +
      "CTR모".padStart(8) +
      "경쟁".padStart(6),
  );
  console.log("─".repeat(78));
  for (const r of list) {
    console.log(
      r.term.slice(0, 24).padEnd(24) +
        String(r.pcVolume).padStart(9) +
        String(r.mobileVolume).padStart(10) +
        String(r.totalVolume).padStart(10) +
        `${r.mobileShare}%`.padStart(8) +
        `${r.mobileCtr}`.padStart(8) +
        String(r.competition).padStart(6),
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
