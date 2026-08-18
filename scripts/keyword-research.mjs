/**
 * 키워드 실측 수집 — 네이버 검색광고 키워드도구.
 *
 *   node --env-file=.env.local scripts/keyword-research.mjs
 *   node --env-file=.env.local scripts/keyword-research.mjs --json > keywords.json
 *
 * Why: 편성 순서를 검색량 없이 정하면 근거 없는 판단이 3개월치를 굴린다.
 * 추정치를 손으로 적는 것은 지어낸 숫자라 더 나쁘다 — 실측만 쓴다.
 *
 * 왜 개발자센터(developers.naver.com)가 아니라 검색광고인가:
 * 데이터랩 API 는 **상대 추이 지수**만 준다. 절대 검색량·클릭률이 없어서
 * "이 키워드가 저 키워드보다 몇 배인가"를 못 잰다. 편성 순서의 근거가 안 된다.
 *
 * 인증: X-Signature = base64(HMAC-SHA256(비밀키, `${timestamp}.${method}.${path}`))
 * 문서: https://naver.github.io/searchad-apidoc/
 */
import crypto from "node:crypto";

import { TOPIC_QUEUE } from "../lib/blog-schedule.ts";

const HOST = "https://api.searchad.naver.com";
const PATH = "/keywordstool";

const CUSTOMER = process.env.NAVER_AD_CUSTOMER_ID;
const API_KEY = process.env.NAVER_AD_API_KEY;
const SECRET = process.env.NAVER_AD_SECRET_KEY;

if (!CUSTOMER || !API_KEY || !SECRET) {
  console.error(
    "네이버 검색광고 키가 없습니다. .env.local 에 다음 3개가 필요합니다:\n" +
      "  NAVER_AD_CUSTOMER_ID / NAVER_AD_API_KEY / NAVER_AD_SECRET_KEY\n" +
      "발급: https://manage.searchad.naver.com/customers/0/tool/api-license",
  );
  process.exit(1);
}

function sign(method, path) {
  const ts = Date.now().toString();
  const mac = crypto.createHmac("sha256", SECRET);
  mac.update(`${ts}.${method}.${path}`);
  return { ts, signature: mac.digest("base64") };
}

/**
 * 키워드도구 조회.
 *
 * 두 가지 함정이 있다 —
 *  1. hintKeywords 는 **한 번에 5개까지**다. 더 넣으면 조용히 잘린다.
 *  2. 키워드에 **공백이 있으면 결과가 안 나온다.** 붙여서 보내야 한다.
 *     ("숏폼 외주 단가" → "숏폼외주단가")
 */
async function keywordTool(keywords) {
  const hint = keywords.map((k) => k.replace(/\s+/g, "")).join(",");
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

  if (!res.ok) {
    throw new Error(`검색광고 API ${res.status}: ${await res.text()}`);
  }
  return (await res.json()).keywordList ?? [];
}

/**
 * "< 10" 같은 문자열이 섞여 온다. 검색량이 적을 때 네이버가 구간으로 준다.
 * 이걸 0 으로 바꾸면 "없음"과 "적음"이 구분이 안 되므로 9 로 둔다.
 */
const num = (v) => {
  if (typeof v === "number") return v;
  if (typeof v !== "string") return 0;
  if (v.includes("<")) return 9;
  const n = Number(v.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const COMP = { 낮음: "낮음", 중간: "중간", 높음: "높음" };

async function main() {
  const terms = TOPIC_QUEUE.map((t) => t.term);
  const byTerm = new Map();

  // 5개씩 끊어 보낸다. 429 를 피하려고 사이에 간격을 둔다
  for (let i = 0; i < terms.length; i += 5) {
    const chunk = terms.slice(i, i + 5);
    process.stderr.write(
      `조회 ${i + 1}~${Math.min(i + 5, terms.length)} / ${terms.length}\n`,
    );
    let rows = [];
    try {
      rows = await keywordTool(chunk);
    } catch (error) {
      console.error(`  ✗ ${chunk.join(", ")} — ${error.message}`);
    }
    for (const row of rows) byTerm.set(row.relKeyword, row);
    if (i + 5 < terms.length) await new Promise((r) => setTimeout(r, 400));
  }

  const out = TOPIC_QUEUE.map((topic) => {
    const key = topic.term.replace(/\s+/g, "");
    const row = byTerm.get(key) ?? byTerm.get(topic.term);
    const pc = num(row?.monthlyPcQcCnt);
    const mo = num(row?.monthlyMobileQcCnt);
    return {
      term: topic.term,
      pillar: topic.pillar,
      tier: topic.tier,
      lead: topic.lead,
      angle: topic.angle,
      found: Boolean(row),
      pcVolume: pc,
      mobileVolume: mo,
      totalVolume: pc + mo,
      pcClicks: num(row?.monthlyAvePcClkCnt),
      mobileClicks: num(row?.monthlyAveMobileClkCnt),
      pcCtr: num(row?.monthlyAvePcCtr),
      mobileCtr: num(row?.monthlyAveMobileCtr),
      competition: COMP[row?.compIdx] ?? row?.compIdx ?? "—",
      adDepth: num(row?.plAvgDepth),
    };
  });

  if (process.argv.includes("--json")) {
    process.stdout.write(JSON.stringify(out, null, 2));
    return;
  }

  out.sort((a, b) => b.totalVolume - a.totalVolume);
  console.log(
    "\n키워드".padEnd(28) +
      "PC".padStart(8) +
      "모바일".padStart(9) +
      "합계".padStart(9) +
      "CTR모".padStart(8) +
      "경쟁".padStart(6),
  );
  console.log("─".repeat(70));
  for (const r of out) {
    console.log(
      (r.found ? "" : "? ") +
        r.term.padEnd(r.found ? 26 : 24) +
        String(r.pcVolume).padStart(8) +
        String(r.mobileVolume).padStart(9) +
        String(r.totalVolume).padStart(9) +
        `${r.mobileCtr}%`.padStart(8) +
        String(r.competition).padStart(6),
    );
  }
  const missing = out.filter((r) => !r.found).length;
  console.log(
    `\n${out.length}개 중 ${out.length - missing}개 조회됨` +
      (missing ? ` / ${missing}개는 데이터 없음(?)` : ""),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
