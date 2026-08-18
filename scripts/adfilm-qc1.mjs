/**
 * QC 계층1 — 기계 측정. **자동 반려 권한이 있다.** (2026-08-18)
 *
 *   node scripts/adfilm-qc1.mjs drafts/feliway/feliway-v17.mp4 drafts/feliway/scenes-v16.json
 *
 * ── 왜 계층을 나누나 (명세서 §5) ──────────────────────────────────────
 * 신뢰도에 따라 권한이 달라야 한다.
 *
 *   계층1 기계 측정   결정적이다 → **자동 반려까지**
 *   계층2 교차 대조   기준 데이터와 비교 → 임계값 반려
 *   계층3 판정        모션·왜곡·감도 → 플래그만, 확정은 사람
 *
 * 계층3 에 반려 권한을 주면 오판이 공정을 막는다. v16 프레임을 보고 고양이를
 * 잘못 판정한 적이 있는데, 그런 게 납품을 막으면 안 된다.
 *
 * 이 파일은 계층1 만 한다. 여기서 걸리는 것은 **논쟁의 여지가 없다** —
 * 해상도가 틀렸거나, 길이가 안 맞거나, 소리가 없거나, 검은 프레임이 있다.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

import ffmpeg from "ffmpeg-static";

const file = process.argv[2];
const planFile = process.argv[3];
if (!file || !existsSync(file)) {
  console.error("사용법: adfilm-qc1.mjs <완성본.mp4> [scenes-*.json]");
  process.exit(1);
}

const rows = [];
const add = (항목, 판정, 결과) => rows.push({ 항목, 결과, 판정 });

/** ffmpeg 헤더에서 스트림 정보를 긁는다 */
const info = spawnSync(ffmpeg, ["-hide_banner", "-i", file], { encoding: "utf8" }).stderr || "";

/* ── 1. 해상도 ─────────────────────────────────────────────────────── */
const dim = info.match(/Video:.*?(\d{3,4})x(\d{3,4})/);
const W = dim ? +dim[1] : 0, H = dim ? +dim[2] : 0;
add(
  "해상도",
  W === 720 && H === 1280 ? "✅" : W / H < 0.58 && W / H > 0.55 ? "⚠️" : "❌",
  `${W}×${H}` + (W === 720 && H === 1280 ? "" : " (규격 720×1280)"),
);

/* ── 2. 길이 ───────────────────────────────────────────────────────── */
const d = info.match(/Duration: (\d+):(\d+):([\d.]+)/);
const seconds = d ? +d[1] * 3600 + +d[2] * 60 + +d[3] : 0;
let expected = null;
if (planFile && existsSync(planFile)) {
  const plan = JSON.parse(readFileSync(planFile, "utf8"));
  const tag = planFile.replace(/.*scenes-/, "").replace(/\.json$/, "");
  const vf = planFile.replace(/scenes-.*\.json$/, `voice-${tag}/lines.json`);
  if (existsSync(vf)) {
    const voice = JSON.parse(readFileSync(vf, "utf8"));
    const durOf = (n) => voice.lines.find((l) => l.n === n)?.seconds ?? 0;
    expected = plan.scenes.reduce(
      (a, s) => a + s.lines.reduce((x, n) => x + durOf(n), 0) + 0.12 * (s.lines.length - 1),
      0,
    );
  }
}
/**
 * 길이 판정 — **두 방향을 따로 본다.** (2026-08-18 기준 수정)
 *
 * 처음엔 "대사 합 ±2초" 로 쟀다가 멀쩡한 영상을 반려했다. 대사 합은
 * **말하는 시간**이고 영상에는 말 앞뒤 여백이 있어야 한다. 한 방향만 재면
 * 여백을 오류로 읽는다.
 *
 *   너무 짧다  →  말이 잘렸다는 뜻. **반려** (길이에 맞춰 내용을 자르는 것이
 *                 사장님이 계속 지적하신 바로 그 잘못이다)
 *   너무 길다  →  빈 화면으로 늘어졌다는 뜻. 15% 를 넘으면 **반려**
 */
const MAX_SLACK = 1.15;
add(
  "길이",
  !expected
    ? "⚠️"
    : seconds < expected - 0.5
      ? "❌"
      : seconds > expected * MAX_SLACK
        ? "❌"
        : "✅",
  expected
    ? `${seconds.toFixed(1)}초 · 대사 ${expected.toFixed(1)}초 · 여백 ${((seconds / expected - 1) * 100).toFixed(0)}% ` +
      (seconds < expected - 0.5
        ? "— 말이 잘렸습니다"
        : seconds > expected * MAX_SLACK
          ? `— 늘어졌습니다 (상한 ${((MAX_SLACK - 1) * 100).toFixed(0)}%)`
          : "")
    : `${seconds.toFixed(1)}초 (대본 비교 불가)`,
);

/* ── 3. 오디오 ─────────────────────────────────────────────────────── */
const aud = info.match(/Audio: (\w+).*?(\d+) Hz/);
add("오디오 트랙", aud ? "✅" : "❌", aud ? `${aud[1]} ${aud[2]}Hz` : "없음 — 나레이션이 안 얹혔습니다");

/* ── 4. 라우드니스·클리핑 ───────────────────────────────────────────── */
if (aud) {
  const vol = spawnSync(ffmpeg, ["-hide_banner", "-i", file, "-af", "volumedetect", "-f", "null", "-"],
    { encoding: "utf8" }).stderr || "";
  const mean = vol.match(/mean_volume: (-?[\d.]+) dB/);
  const peak = vol.match(/max_volume: (-?[\d.]+) dB/);
  if (mean) {
    const m = +mean[1];
    add("평균 음량", m > -30 && m < -12 ? "✅" : "⚠️", `${m} dB (목표 -24~-14)`);
  }
  if (peak) {
    const p = +peak[1];
    add("클리핑", p < -0.5 ? "✅" : "❌", `피크 ${p} dB` + (p >= -0.5 ? " — 0dB 에 붙어 찌그러집니다" : ""));
  }
  /** 무음 구간 — 나레이션이 통째로 빠진 컷을 잡는다 */
  const sil = spawnSync(ffmpeg, ["-hide_banner", "-i", file, "-af", "silencedetect=n=-45dB:d=2.5", "-f", "null", "-"],
    { encoding: "utf8" }).stderr || "";
  const gaps = [...sil.matchAll(/silence_start: ([\d.]+)/g)].map((m) => +m[1]);
  add("2.5초 이상 무음", gaps.length === 0 ? "✅" : "⚠️",
    gaps.length ? `${gaps.length}곳 (${gaps.map((g) => g.toFixed(1) + "s").join(", ")})` : "없음");
}

/* ── 5. 검은 프레임 ─────────────────────────────────────────────────── */
const blk = spawnSync(ffmpeg, ["-hide_banner", "-i", file, "-vf", "blackdetect=d=0.4:pic_th=0.98", "-f", "null", "-"],
  { encoding: "utf8" }).stderr || "";
const blacks = [...blk.matchAll(/black_start:([\d.]+)/g)].map((m) => +m[1]);
add("검은 프레임", blacks.length === 0 ? "✅" : "❌",
  blacks.length ? `${blacks.length}곳 (${blacks.map((b) => b.toFixed(1) + "s").join(", ")})` : "없음");

/* ── 6. 프리즈 프레임 — 생성이 멈춘 컷을 잡는다 ─────────────────────── */
const frz = spawnSync(ffmpeg, ["-hide_banner", "-i", file, "-vf", "freezedetect=n=-55dB:d=1.5", "-f", "null", "-"],
  { encoding: "utf8" }).stderr || "";
const freezes = [...frz.matchAll(/freeze_start: ([\d.]+)/g)].map((m) => +m[1]);
add("1.5초 이상 정지", freezes.length === 0 ? "✅" : "⚠️",
  freezes.length ? `${freezes.length}곳 (${freezes.map((f) => f.toFixed(1) + "s").join(", ")})` : "없음");

/* ── 7. 디코드 에러 ─────────────────────────────────────────────────── */
const dec = spawnSync(ffmpeg, ["-v", "error", "-i", file, "-f", "null", "-"], { encoding: "utf8" }).stderr || "";
add("디코드 에러", dec.trim() ? "❌" : "✅", dec.trim() ? dec.trim().slice(0, 90) : "없음");

console.table(rows);
const bad = rows.filter((r) => r.판정 === "❌").length;
const warn = rows.filter((r) => r.판정 === "⚠️").length;
console.log(
  bad
    ? `\n❌ ${bad}건 — **납품 잠김.** 계층1은 논쟁의 여지가 없습니다`
    : warn
      ? `\n⚠️ ${warn}건 지켜볼 것 — 잠그지는 않습니다`
      : `\n✅ 계층1 통과`,
);
process.exit(bad ? 1 : 0);
