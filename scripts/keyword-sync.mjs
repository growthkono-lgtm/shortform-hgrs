/**
 * 키워드 수집 → DB 반영. 주 1회 돌린다. (2026-08-13)
 *
 *   node --env-file=.env.local scripts/keyword-sync.mjs
 *   node --env-file=.env.local scripts/keyword-sync.mjs --dry
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
} = process.env;

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

const KEEP =
  /마케팅|광고|브랜딩|브랜드|숏폼|릴스|쇼츠|인플루언서|체험단|서포터즈|앰버서더|바이럴|콘텐츠|컨텐츠|소재|퍼포먼스|그로스|자사몰|쇼핑몰|카페24|스마트스토어|D2C|이커머스|커머스|팝업|프로모션|CRM|IMC|BTL|SNS|인스타|유튜브|틱톡|대행|제작|영상|촬영|편집|검색광고|SEO|AEO|상위노출|리뷰|후기|캠페인|모델|섭외|스타트업|PMF|USP|전환|ROAS|퍼널|랜딩|상세페이지|리타겟|어트리뷰션|리텐션|LTV|객단가|재구매|런칭|포지셔닝|카피|스토리텔링|AI|AX|머신러닝|딥러닝|프로덕트|펀딩|와디즈|라이브커머스|공동구매|멤버십|쿠폰|이벤트|기획/i;
const DROP =
  /자격증|시험|기사자격|알바|채용|구인|학원|국비|내일배움|공연|연극|전시회|골프|제주|맛집|놀거리|관광|대출|보험|부동산|주식|코인|전지|엔비디아|SQLD|ADSP|키오스크|밀수|관세|수익창출|월급|연봉|취업|자소서|면접|과제|레포트|논문|영화|드라마제작사|웹툰|소설|게임|다이어트|병원|한의원|피부과|성형|변호사|세무사|노무|법률/i;
const B2B =
  /대행|업체|비용|견적|단가|가격|제작|외주|의뢰|전략|방법|하는법|어떻게|추천|순위|비교|사례|운영|기획|매출|전환|ROAS|퍼널|리드|스타트업|B2B|마케팅|브랜딩|IMC|BTL|그로스|퍼포먼스|런칭|포지셔닝|소재|캠페인/i;
const NOT_B2B =
  /수익|알바|셀프|자격|취업|연봉|입점|정산|환불|배송|반품|고객센터|로그인|다운로드|무료로|공짜/i;

function sign(method, path) {
  const ts = Date.now().toString();
  const mac = crypto.createHmac("sha256", SECRET);
  mac.update(`${ts}.${method}.${path}`);
  return { ts, signature: mac.digest("base64") };
}

async function keywordTool(seeds) {
  const hint = seeds.map((k) => k.replace(/\s+/g, "")).join(",");
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
  return (await res.json()).keywordList ?? [];
}

const num = (v) => {
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

async function sb(path, init = {}) {
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
      console.error(`  ✗ ${chunk.join(", ")} — ${error.message}`);
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
  const keep = [...rows.values()]
    .filter(
      (r) =>
        KEEP.test(r.term) &&
        !DROP.test(r.term) &&
        !NOT_B2B.test(r.term) &&
        r.total_volume >= 100,
    )
    .map((r) => ({
      ...r,
      buyer_intent: B2B.test(r.term),
      // SEO 난이도는 검색량과 롱테일 여부로 본다. 네이버 competition 은
      // 광고 입찰 경쟁이라 마케팅 축에서는 거의 전부 '높음' 이 나온다
      difficulty:
        r.total_volume >= 5000
          ? "빅"
          : r.total_volume >= 2000
            ? r.term.length >= 12
              ? "중간"
              : "빅"
            : r.total_volume >= 1000
              ? r.term.length >= 12
                ? "니치"
                : "중간"
              : "니치",
    }));

  console.error(
    `\n수집 ${rows.size} → 우리 키워드 ${keep.length}개 (월 100회 이상)`,
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
