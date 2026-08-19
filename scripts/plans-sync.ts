/**
 * `lib/constants.ts` 의 PLANS 를 DB `plans` 테이블에 밀어 넣는다. (2026-08-19)
 *
 *   npx tsx --env-file=.env.local scripts/plans-sync.ts --dry
 *   npx tsx --env-file=.env.local scripts/plans-sync.ts
 *
 * ── 왜 필요한가 ────────────────────────────────────────────────────────
 * 가격이 **두 곳**에 있다. 화면·소개서는 `lib/constants.ts` 를 읽고,
 * **결제 금액은 DB `plans` 를 읽는다**(`lib/plans.ts` — "결제 금액의 유일한
 * 출처. 클라이언트가 보낸 금액은 절대 신뢰하지 않는다").
 *
 * 둘이 어긋나면 **화면에 적힌 값과 실제로 청구되는 값이 달라진다.** 오늘만
 * 같은 종류(판정 두 벌·편성 큐 두 벌)로 세 번 사고가 났다. 손으로 맞추지
 * 않고 이 스크립트로 민다.
 *
 * ⚠️ `plans` 는 `orders` 가 참조하므로 **지우지 않는다.** 값만 갱신하고,
 * 목록에서 빠진 플랜은 `active=false` 로 내린다 — 지난 주문의 연결이 끊기면
 * 매출 장부가 깨진다.
 */
import { PLANS } from "../lib/constants";

const REST = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = {
  apikey: KEY!,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

type Row = {
  id: string;
  code: string;
  tier: string;
  label: string;
  composition: string;
  influencer_count: number;
  shorts_count: number;
  list_price: number;
  beta_price: number;
  sort_order: number;
  active: boolean;
};

const KRW = (n: number) => n.toLocaleString("ko-KR");

async function main() {
  const dry = process.argv.includes("--dry");
  if (!REST || !KEY) throw new Error("Supabase 환경변수가 없습니다");

  const existing = (await (
    await fetch(`${REST}/rest/v1/plans?select=*`, { headers: H })
  ).json()) as Row[];
  const byKey = new Map(existing.map((r) => [`${r.code}-${r.tier}`, r]));

  /** 표시 순서 — 싱글은 편수, 멀티는 티어 순 */
  const order: Record<string, number> = { "1": 0, "5": 1, "10": 2, "20": 3, starter: 1, growth: 2, scale: 3 };

  const changes: { key: string; before: string; after: string; row: Record<string, unknown> }[] = [];

  for (const p of PLANS) {
    const key = `${p.code}-${p.tier}`;
    const cur = byKey.get(key);
    const next = {
      code: p.code,
      tier: p.tier,
      label: p.label,
      composition: p.composition,
      influencer_count: p.influencerCount,
      shorts_count: p.shortsCount,
      list_price: p.listPrice,
      beta_price: p.betaPrice,
      recommended: p.recommended ?? false,
      sort_order: order[p.tier] ?? 0,
      active: true,
    };

    const before = cur
      ? `${cur.label} · ${cur.composition} · ${KRW(cur.beta_price)}`
      : "(없음 — 새로 만든다)";
    const after = `${p.label} · ${p.composition} · ${KRW(p.betaPrice)}`;
    if (before !== after || !cur?.active) {
      changes.push({ key, before, after, row: cur ? { id: cur.id, ...next } : next });
    }
  }

  /** PLANS 에서 빠진 플랜은 내린다 — 지우지 않는다 */
  const live = new Set(PLANS.map((p) => `${p.code}-${p.tier}`));
  const retire = existing.filter((r) => r.active && !live.has(`${r.code}-${r.tier}`));

  console.log(`플랜 ${PLANS.length}개 · 바뀔 것 ${changes.length}개 · 내릴 것 ${retire.length}개\n`);
  for (const c of changes) {
    console.log(`  ${c.key}`);
    console.log(`    전: ${c.before}`);
    console.log(`    후: ${c.after}`);
  }
  for (const r of retire) console.log(`  ↓ 비활성: ${r.code}-${r.tier} (${r.label})`);

  if (dry) {
    console.log("\n--dry 이므로 쓰지 않았습니다.");
    return;
  }
  if (!changes.length && !retire.length) {
    console.log("바꿀 것이 없습니다.");
    return;
  }

  for (const c of changes) {
    const hasId = "id" in c.row;
    const res = await fetch(
      hasId ? `${REST}/rest/v1/plans?id=eq.${c.row.id}` : `${REST}/rest/v1/plans`,
      {
        method: hasId ? "PATCH" : "POST",
        headers: { ...H, Prefer: "return=minimal" },
        body: JSON.stringify(hasId ? { ...c.row, id: undefined } : c.row),
      },
    );
    if (!res.ok) {
      console.error(`❌ ${c.key}: ${res.status} ${(await res.text()).slice(0, 200)}`);
      process.exit(1);
    }
  }

  for (const r of retire) {
    await fetch(`${REST}/rest/v1/plans?id=eq.${r.id}`, {
      method: "PATCH",
      headers: { ...H, Prefer: "return=minimal" },
      body: JSON.stringify({ active: false }),
    });
  }

  console.log(`\n✅ ${changes.length}개 갱신 · ${retire.length}개 비활성`);
}

main();
