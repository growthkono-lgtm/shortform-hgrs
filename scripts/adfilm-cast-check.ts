/**
 * 기획안의 출연 구성을 검사한다. (2026-08-16)
 *
 *   npx tsx scripts/adfilm-cast-check.ts drafts/feliway/plan-v11.json
 *
 * 기획안은 시작값(프리셋) 하나를 고르고 거기서 값을 바꾼 **조합**을 갖는다.
 * 이 스크립트는 그 조합이 성립하는지, 그리고 증거 역할이 화면을 충분히
 * 차지하는지를 본다. 보호자 얼굴 6컷 + 고양이 1컷 같은 기획안은 여기서 걸린다.
 */
import { readFileSync } from "node:fs";

import {
  ROLE_LABEL,
  auditCast,
  castPreset,
  evidenceRoles,
  needsLipSync,
  requiredEvidenceRatio,
  sheetsNeeded,
  speakers,
  type CastComposition,
  type CastRole,
} from "../lib/adfilm-cast";

const file = process.argv[2] ?? "drafts/feliway/plan-v11.json";
const plan = JSON.parse(readFileSync(file, "utf8")) as {
  product: string;
  cast: string;
  castOverride?: Partial<CastComposition>;
  shots: { no: number; role: string; seconds: number; cast: CastRole[]; must: string }[];
};

/** 시작값에서 출발해 기획안이 바꾼 값을 덮는다 — 프리셋은 규격이 아니라 출발점이다 */
const preset = castPreset(plan.cast);
const composition: CastComposition = {
  ...preset.composition,
  ...(plan.castOverride ?? {}),
};

const STRUCTURE_LABEL = {
  solo: "혼자 말하기",
  dialogue: "주고받기",
  relay: "한마디씩",
  none: "무발화",
} as const;

console.log(`\n${plan.product} · 시작값 「${preset.label}」`);
console.log(preset.premise);
console.log(`\n발화 구조: ${STRUCTURE_LABEL[composition.structure]}`);
console.log(
  `말하는 역할: ${
    speakers(composition)
      .map((s) => `${s.label}(${s.speech === "onscreen" ? "화면 안" : "목소리만"})`)
      .join(" · ") || "없음"
  }`,
);
console.log(`립싱크 필요: ${needsLipSync(composition) ? "예" : "아니오"}`);
console.log(`먼저 만들 시트: ${sheetsNeeded(composition).map((s) => s.label).join(" · ")}`);

const evidence = evidenceRoles(composition);
console.table(
  plan.shots.map((s) => ({
    "#": s.no,
    역할: s.role,
    초: s.seconds,
    출연: s.cast.map((r) => ROLE_LABEL[r]).join("·"),
    증거: s.cast.some((r) => evidence.has(r)) ? "●" : "",
  })),
);

const result = auditCast({ composition, shots: plan.shots });
console.log(
  `증거 컷 ${Math.round(result.ratio * 100)}% (조합에서 계산된 기준 ${Math.round(
    requiredEvidenceRatio(composition) * 100,
  )}% 이상)`,
);
console.log(result.ok ? "✅ 구성 통과" : "❌ 구성 미달");
for (const f of result.failures) console.log("  -", f);

console.log("\n이 구성에서 조심할 것:");
for (const w of preset.watchFor) console.log("  ·", w.replace(/\*\*/g, ""));
