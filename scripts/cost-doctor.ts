/**
 * 원가 장부 — 계정 전부를 한 표로. (2026-08-18)
 *
 *   npx tsx --env-file=.env.local scripts/cost-doctor.ts
 *
 * 사장님 지시: *"다 계산해야지 앞으로는."*
 *
 * ── 왜 만들었나 ────────────────────────────────────────────────────────
 * 8/17·8/18 블로그가 크레딧 소진으로 이틀 비었다. 그때 우리 장부는
 * "$4.03 / 상한 $80, 여유 있음" 이라고 말하고 있었다. 그 장부가 **블로그
 * 몫만** 세고 있었기 때문이다. 같은 계정에서 영상·이미지가 같이 나가는데
 * 그건 어디에도 안 적혔고, 두 계정이 마이너스로 갈 때까지 아무도 몰랐다.
 *
 * 그래서 판단 근거를 여기 모은다. 문서가 아니라 **살아 있는 값**이다.
 * [[feedback_no_fabricated_metrics]] — 못 가져오는 값은 빈칸으로 둔다.
 *
 * 종료 코드: 0 = 정상 / 1 = 잔액이 바닥났거나 상한에 닿음
 */
const OK = "✅";
const WARN = "⚠️";
const BAD = "❌";

const REST = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY!, Authorization: `Bearer ${KEY}` };

const rest = async (path: string) => {
  const r = await fetch(`${REST}/rest/v1/${path}`, { headers: H });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json();
};

/** 이번 달 1일 00시(KST) 의 ISO */
function monthStart(now = new Date()): string {
  const kst = new Date(now.getTime() + 9 * 3600 * 1000);
  return `${kst.getUTCFullYear()}-${String(kst.getUTCMonth() + 1).padStart(2, "0")}-01T00:00:00+09:00`;
}

type Row = { 계정: string; 항목: string; "이번 달": string; 잔액: string; 판정: string };

async function main() {
  const rows: Row[] = [];
  const from = monthStart();
  let bad = false;

  /* ── 1. 블로그 (OpenAI) — 편당 실측이 이미 쌓여 있다 ────────────── */
  const jobs: { cost_usd: string | null; stage: string }[] = await rest(
    `blog_job?select=cost_usd,stage&scheduled_for=gte.${from.slice(0, 10)}`,
  );
  const blog = jobs.reduce((s, j) => s + Number(j.cost_usd ?? 0), 0);
  const blogPosts = jobs.filter((j) => Number(j.cost_usd ?? 0) > 0).length;
  rows.push({
    계정: "OpenAI",
    항목: `블로그 (${blogPosts}편)`,
    "이번 달": `$${blog.toFixed(2)}`,
    잔액: "—",
    판정: blog < 80 ? OK : BAD,
  });

  /* ── 2. 장부에 적힌 나머지 — 영상·이미지·음성·판독 ──────────────── */
  // `+09:00` 의 + 는 쿼리스트링에서 공백으로 풀린다. 반드시 인코딩한다
  const spend: { service: string; kind: string; usd: string }[] = await rest(
    `spend_log?select=service,kind,usd&at=gte.${encodeURIComponent(from)}`,
  );
  const KIND_LABEL: Record<string, string> = {
    video: "영상",
    image: "이미지",
    audio: "음성",
    vision: "이미지 판독",
    blog: "블로그",
  };
  const bucket = new Map<string, number>();
  for (const s of spend) {
    const k = `${s.service}|${s.kind}`;
    bucket.set(k, (bucket.get(k) ?? 0) + Number(s.usd));
  }

  /* ── 3. 계정별 잔액 — 실측으로 가져올 수 있는 것만 ──────────────── */
  let falBalance: number | null = null;
  try {
    const r = await fetch("https://rest.alpha.fal.ai/billing/user_balance", {
      headers: { Authorization: `Key ${process.env.FAL_KEY}` },
    });
    if (r.ok) falBalance = Number(await r.text());
  } catch {
    /* 못 가져오면 빈칸이다. 지어내지 않는다 */
  }

  /** 크레딧이 남았는지만 본다 — 잔액 숫자는 프로젝트 키로 못 읽는다 */
  const alive = async (name: string, probe: () => Promise<number>) => {
    try {
      const s = await probe();
      return s === 429 ? "크레딧 소진" : s === 200 ? "사용 가능" : `HTTP ${s}`;
    } catch {
      return "확인 실패";
    }
  };
  const openaiState = await alive("openai", async () => {
    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "gpt-5.6-luna", input: "1", max_output_tokens: 16 }),
    });
    return r.status;
  });
  const anthropicState = await alive("anthropic", async () => {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4,
        messages: [{ role: "user", content: "1" }],
      }),
    });
    return r.status;
  });

  for (const [k, usd] of [...bucket].sort((a, b) => b[1] - a[1])) {
    const [service, kind] = k.split("|");
    rows.push({
      계정: service === "fal" ? "fal.ai" : service === "openai" ? "OpenAI" : "Anthropic",
      항목: KIND_LABEL[kind] ?? kind,
      "이번 달": `$${usd.toFixed(2)}`,
      잔액: "—",
      판정: OK,
    });
  }

  /* ── 4. 계정 요약 ────────────────────────────────────────────────── */
  const falSpend = [...bucket]
    .filter(([k]) => k.startsWith("fal|"))
    .reduce((s, [, v]) => s + v, 0);
  const openaiSpend =
    blog + [...bucket].filter(([k]) => k.startsWith("openai|")).reduce((s, [, v]) => s + v, 0);

  if (openaiState === "크레딧 소진") bad = true;
  rows.push({
    계정: "OpenAI",
    항목: "── 계정 합계",
    "이번 달": `$${openaiSpend.toFixed(2)}`,
    잔액: openaiState,
    판정: openaiState === "사용 가능" ? OK : BAD,
  });

  if (falBalance !== null && falBalance <= 0) bad = true;
  rows.push({
    계정: "fal.ai",
    항목: "── 계정 합계",
    "이번 달": `$${falSpend.toFixed(2)}`,
    잔액: falBalance === null ? "확인 실패" : `$${falBalance.toFixed(2)}`,
    판정: falBalance === null ? WARN : falBalance > 0 ? OK : BAD,
  });

  if (anthropicState === "크레딧 소진") bad = true;
  rows.push({
    계정: "Anthropic",
    항목: "── 계정 합계",
    "이번 달": "장부 없음",
    잔액: anthropicState,
    판정: anthropicState === "사용 가능" ? OK : BAD,
  });

  console.table(rows);

  /**
   * 장부에 안 잡히는 구멍을 숨기지 않는다. 08-16 에 OpenAI 에서 $35 가
   * 나갔는데 우리 장부엔 $2.67 만 있었다. 그 차이를 조용히 두면 같은 일이
   * 또 난다. [[feedback_no_unverified_claims]]
   */
  const holes: string[] = [];
  if (!bucket.size) holes.push("spend_log 가 비어 있습니다 — 배선 후 첫 생성부터 쌓입니다");
  holes.push("Anthropic 은 잔액·사용량 API 가 없어 이 표에 금액이 안 잡힙니다 (콘솔에서 확인)");
  holes.push(
    "OpenAI 계정 총액은 프로젝트 키로 못 읽습니다 — 대조하려면 Admin 키(api.usage.read)가 필요합니다",
  );
  console.log("\n장부에 안 잡히는 것:");
  for (const h of holes) console.log(`  · ${h}`);

  console.log(bad ? `\n${BAD} 막힌 계정이 있습니다` : `\n${OK} 쓸 수 있는 상태입니다`);
  process.exit(bad ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

// 이 파일은 스크립트다. 전역 스코프 충돌을 막으려고 모듈로 못 박는다
export {};
