/**
 * 광고영상 종합 점검. (2026-08-16)
 *
 *   npx tsx --env-file=.env.local scripts/adfilm-doctor.ts drafts/feliway
 *
 * `docs/ADFILM_CHECKLIST.md` 의 항목을 **실제로 돌려서** 확인한다.
 * 블로그의 `blog-doctor.ts` 와 같은 자리다 — 문서를 읽고 판단하지 말고 이걸 먼저 돌린다.
 *
 * 보는 것은 공정 순서 그대로다: 분석 → 대본 → 씬 → 시트 → 생성 → 소리 → 조립 → 돈.
 * 앞 정거장이 비어 있으면 뒤는 볼 것도 없다.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { auditCast, castPreset, requiredEvidenceRatio, type CastComposition, type CastRole } from "../lib/adfilm-cast";
import { auditArc } from "../lib/adfilm-arc";

type Row = { 구분: string; 항목: string; 결과: string; 판정: "✅" | "⚠️" | "❌" };
const rows: Row[] = [];
const add = (구분: string, 항목: string, 판정: Row["판정"], 결과: string) =>
  rows.push({ 구분, 항목, 결과, 판정 });

const dir = process.argv[2] ?? "drafts/feliway";
const read = (f: string) => JSON.parse(readFileSync(path.join(dir, f), "utf8"));
const has = (f: string) => existsSync(path.join(dir, f));
/** 같은 이유로 기획 파일도 숫자로 고른다 */
const pick = (pattern: RegExp) =>
  readdirSync(dir)
    .filter((f) => pattern.test(f))
    .sort((a, b) => Number(a.match(/v(\d+)/)![1]) - Number(b.match(/v(\d+)/)![1]))
    .pop();

/* ── 1. 분석 ──────────────────────────────────────────────────────── */
if (!has("analysis.json")) {
  add("분석", "상세페이지 판독", "❌", "analysis.json 없음 — 이게 없으면 기획을 시작하면 안 됩니다");
} else {
  const a = read("analysis.json");
  const an = a.analysis;
  const counts = `팩트 ${an.facts.length} · 대상 ${an.audience.length} · 문제 ${an.problems.length} · 신뢰 ${an.trust.length} · 금칙 ${an.caveats.length}`;
  add("분석", `이미지 ${a.imageCount}장 판독`, an.facts.length >= 10 ? "✅" : "⚠️", counts);
  add("분석", "가격", an.price ? "✅" : "⚠️", an.price ? `${an.price.판매가} (영상 미언급)` : "미수집");
}

/* ── 2. 대본 ──────────────────────────────────────────────────────── */
const conceptFile = pick(/^concept-v\d+\.json$/);
if (!conceptFile) {
  add("대본", "통대본", "❌", "concept-*.json 없음");
} else {
  const c = read(conceptFile);
  const lines: { n: number; line: string; beat: string }[] = c.통대본;
  const chars = lines.reduce((s, l) => s + l.line.length, 0);
  add("대본", `${conceptFile}`, "✅", `${lines.length}문장 · ${chars}자`);

  /* 설득 사슬이 다 있는가 — 이게 빠지면 "제품 좋으니 쓰래" 가 된다 */
  const beats = lines.map((l) => l.beat).join(" ");
  const chain = ["원리", "작동", "효과", "근거", "안심"];
  const missing = chain.filter((k) => !beats.includes(k));
  add("대본", "설득 사슬", missing.length === 0 ? "✅" : "❌",
    missing.length === 0 ? chain.join(" → ") : `빠짐: ${missing.join("·")}`);

  /* 여닫이 */
  if (c.hook && c.close) {
    const hook = Array.isArray(c.hook) ? c.hook[0] : c.hook;
    const arc = auditArc({ hook, close: c.close, lines: lines.map((l) => l.line), product: "펠리웨이" });
    add("대본", "훅·클로징·귀결점", arc.ok ? "✅" : "❌",
      arc.ok ? `${hook} → ${c.close}` : arc.failures[0]);
  } else {
    add("대본", "훅·클로징", "⚠️", "타입이 지정되지 않음");
  }
}

/* ── 3. 씬 ────────────────────────────────────────────────────────── */
const sceneFile = pick(/^scenes-v\d+\.json$/);
if (!sceneFile) {
  add("씬", "씬 분할", "❌", "scenes-*.json 없음");
} else {
  const s = read(sceneFile);
  const scenes: { no: number; lines: number[]; cast: CastRole[]; seconds?: number }[] = s.scenes;
  add("씬", "분할", "✅", `${scenes.length}씬 · 문장 ${scenes.reduce((a, x) => a + x.lines.length, 0)}개`);

  const preset = castPreset(s.cast);
  const comp: CastComposition = { ...preset.composition, ...(s.castOverride ?? {}) };
  const r = auditCast({
    composition: comp,
    shots: scenes.map((x) => ({ seconds: x.lines.length, cast: x.cast })),
  });
  add("씬", "증거 컷 비중", r.ok ? "✅" : "❌",
    `${Math.round(r.ratio * 100)}% (기준 ${Math.round(requiredEvidenceRatio(comp) * 100)}%) · ${preset.label}`);
}

/* ── 4. 시트 ──────────────────────────────────────────────────────── */
for (const [label, sub] of [["인물 시트", "talent"], ["수혜자 시트", "subject"], ["합성 레퍼런스", "pairs"]] as const) {
  const p = path.join(dir, sub);
  const n = existsSync(p) ? readdirSync(p).filter((f) => f.endsWith(".png")).length : 0;
  add("시트", label, n > 0 ? "✅" : sub === "pairs" ? "⚠️" : "❌",
    n > 0 ? `${n}장` : "없음");
}
add("시트", "제품 실물", has("pkg.png") ? "✅" : "❌", has("pkg.png") ? "pkg.png" : "없음 — 제품은 AI로 그리지 않습니다");

/* ── 5. 생성 ──────────────────────────────────────────────────────── */
const sceneDir = path.join(dir, sceneFile ? sceneFile.replace(".json", "") : "scenes-v16");
if (existsSync(sceneDir)) {
  const mp4 = readdirSync(sceneDir).filter((f) => /^scene\d+\.mp4$/.test(f));
  const expected = sceneFile ? read(sceneFile).scenes.length : 0;
  add("생성", "씬 영상", mp4.length >= expected && expected > 0 ? "✅" : "⚠️", `${mp4.length}/${expected}개`);
} else {
  add("생성", "씬 영상", "❌", "생성 폴더 없음");
}

/* ── 6. 소리 ──────────────────────────────────────────────────────── */
const voiceDir = readdirSync(dir).find((f) => /^voice-v\d+$/.test(f));
if (!voiceDir || !existsSync(path.join(dir, voiceDir, "lines.json"))) {
  add("소리", "나레이션", "❌", "voice-*/lines.json 없음");
} else {
  const v = JSON.parse(readFileSync(path.join(dir, voiceDir, "lines.json"), "utf8"));
  const bad = v.lines.filter((l: { ok: boolean }) => !l.ok).length;
  const sec = v.lines.reduce((s: number, l: { seconds: number }) => s + l.seconds, 0);
  const chars = v.lines.reduce((s: number, l: { line: string }) => s + l.line.length, 0);
  add("소리", "발음 검증 (whisper)", bad === 0 ? "✅" : "❌", `${v.lines.length - bad}/${v.lines.length} 통과`);
  add("소리", "말 속도", sec > 0 && chars / sec >= 6.5 ? "✅" : "⚠️",
    `${(chars / sec).toFixed(1)}자/초 (규격 8.5 · 하한 6.5)`);
}

/* ── 7. 완성본 ────────────────────────────────────────────────────── */
/** ⚠️ 문자열 정렬이면 v9 가 v16 보다 뒤로 온다. 숫자로 센다 */
const film = readdirSync(dir)
  .filter((f) => /^[a-z-]+-v\d+\.mp4$/.test(f))
  .sort((a, b) => Number(a.match(/v(\d+)/)![1]) - Number(b.match(/v(\d+)/)![1]))
  .pop();
if (!film) {
  add("완성", "완성본", "⚠️", "아직 없음");
} else {
  const mb = statSync(path.join(dir, film)).size / 1024 / 1024;
  add("완성", film, "✅", `${mb.toFixed(1)}MB`);
}

/* ── 8. 돈 ────────────────────────────────────────────────────────── */
if (sceneFile && voiceDir) {
  const v = JSON.parse(readFileSync(path.join(dir, voiceDir, "lines.json"), "utf8"));
  const spoken = v.lines.reduce((s: number, l: { seconds: number }) => s + l.seconds, 0);
  const made = Math.ceil(spoken / 4) * 4; // 대략 — 4·8·12 단위로 올림
  const cost = made * 0.1;
  add("돈", "영상 생성비(추정)", cost < 25 ? "✅" : "❌", `약 $${cost.toFixed(2)} / 편당 상한 $25`);
}
add("돈", "sora-2 마감", "⚠️", "2026-09-24 API 삭제 — 그 전에 생성 층 교체 필요");

console.table(rows);
const bad = rows.filter((r) => r.판정 === "❌");
const warn = rows.filter((r) => r.판정 === "⚠️");
console.log(
  `\n${bad.length === 0 ? "✅ 막힌 곳 없음" : `❌ ${bad.length}건 조치 필요`}` +
    (warn.length ? ` · ⚠️ 지켜볼 것 ${warn.length}건` : ""),
);
if (bad.length) process.exitCode = 1;
