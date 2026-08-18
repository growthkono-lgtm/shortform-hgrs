/**
 * 대본의 여닫이 검사. (2026-08-16)
 *
 *   npx tsx scripts/adfilm-arc-check.ts drafts/feliway/concept-v15.json
 *
 * 보는 것은 둘이다 — **첫 3초가 붙잡는가**, **마지막에 살 이유가 남는가.**
 * v13 대본이 변화 장면으로 끝나고 살 이유가 안 남아서 이 검사를 만들었다.
 */
import { readFileSync } from "node:fs";

import { auditArc, closeType, hookType } from "../lib/adfilm-arc";

const file = process.argv[2] ?? "drafts/feliway/concept-v15.json";
const c = JSON.parse(readFileSync(file, "utf8")) as {
  hook: string;
  close: string;
  통대본: { n: number; line: string; beat: string }[];
};

const lines = c.통대본.map((l) => l.line);
const h = hookType(c.hook);
const cl = closeType(c.close);

console.log(`\n훅 「${h.label}」 — ${h.device}`);
console.log(`  규칙: ${h.rule}`);
console.log(`  위험: ${h.risk}`);
console.log(`  첫 문장: "${lines[0]}" (${lines[0].length}자)\n`);

console.log(`클로징 「${cl.label}」 — ${cl.device}`);
console.log(`  담아야 할 것: ${cl.must}`);
console.log(`  위험: ${cl.risk}`);
console.log(`  마지막 세 문장: "${lines.slice(-3).join(" ")}"\n`);

const r = auditArc({ hook: c.hook, close: c.close, lines, product: "펠리웨이" });
console.log(r.ok ? "✅ 여닫이 통과" : "❌ 여닫이 미달");
for (const f of r.failures) console.log("  -", f);

const total = lines.reduce((s, l) => s + l.length, 0);
console.log(`\n${lines.length}문장 · ${total}자 · 8.5자/초 기준 ${Math.round(total / 8.5)}초`);
