/**
 * 마감 조립 — 씬 + 나레이션 + 자막을 한 편으로 만든다. (2026-08-16)
 *
 *   node scripts/adfilm-assemble.mjs drafts/feliway/scenes-v16.json
 *
 * ── 순서가 규격이다 ───────────────────────────────────────────────────
 * ① 씬 영상을 순서대로 잇는다 (각 씬 길이는 생성 때 이미 나레이션에서 나왔다)
 * ② 나레이션을 문장 단위로 제 자리에 얹는다 — 문장 사이 0.12초
 * ③ 자막을 8~11자로 쪼개 1.2~2초씩 띄운다. 1층, 하단 82%, 박스 없음
 *
 * 자막 규격은 `lib/adfilm-spec.ts` 의 CAPTION_SPEC 을 그대로 옮겼다:
 * 흰 글씨 + 검은 테두리, 가로 78% 안, 글자 크기는 세로의 3.5~4.5%.
 * 폰트는 Pretendard-Bold (assets/fonts) — 시스템 폰트는 서버에서 깨진다.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import ffmpeg from "ffmpeg-static";

const planFile = process.argv[2] ?? "drafts/feliway/scenes-v16.json";
const plan = JSON.parse(readFileSync(planFile, "utf8"));
const root = path.dirname(planFile);
const sceneDir = path.join(root, "scenes-v16");
const voiceDir = path.join(root, "voice-v16");
const voice = JSON.parse(readFileSync(path.join(voiceDir, "lines.json"), "utf8"));
const out = path.join(root, "feliway-v16.mp4");
const work = mkdtempSync(path.join(tmpdir(), "adfilm-"));

const FONT = path.resolve("assets/fonts/Pretendard-Bold.otf");
const W = 720, H = 1280;
const FONT_SIZE = Math.round(H * 0.042); // 세로의 4.2% — CAPTION_SPEC.sizeRange 안
const CAPTION_Y = 0.82;
const GAP = 0.12;
const CHARS = [8, 11];

const durOf = (n) => voice.lines.find((l) => l.n === n)?.seconds ?? 0;

/* ── ① 타임라인 계산 ─────────────────────────────────────────────────
 * 씬이 시작하는 시각, 그 안에서 각 문장이 시작하는 시각을 미리 다 구한다.
 * 손으로 적지 않는다 — v10 에서 타임라인을 손으로 써서 자막이 어긋났다. */
let t = 0;
const timeline = [];
for (const scene of plan.scenes) {
  const src = path.join(sceneDir, `scene${String(scene.no).padStart(2, "0")}.mp4`);
  if (!existsSync(src)) throw new Error(`씬 영상이 없습니다: ${src}`);

  const spoken = scene.lines.reduce((s, n) => s + durOf(n), 0) + GAP * (scene.lines.length - 1);
  /**
   * sora 는 4·8·12초만 만든다. 말이 12초를 넘는 씬(마지막 씬)은 영상이 모자라므로
   * **마지막 프레임을 아주 느린 줌으로 늘려** 메운다. 말을 자르지 않는다 —
   * 길이에 맞춰 내용을 자르는 게 오늘 내내 지적받은 잘못이다.
   */
  const made = [4, 8, 12].find((v) => v >= spoken + 0.4) ?? 12;
  const sceneLen = Math.max(made, Number((spoken + 0.6).toFixed(2)));
  // 말이 씬 가운데 오도록 앞에 여유를 조금 준다
  let at = t + (sceneLen - spoken) / 2;

  const lines = [];
  for (const n of scene.lines) {
    lines.push({ n, at, dur: durOf(n) });
    at += durOf(n) + GAP;
  }
  timeline.push({ no: scene.no, src, start: t, seconds: sceneLen, made, lines });
  t += sceneLen;
}
const total = t;
console.log(`씬 ${timeline.length}개 · 총 ${total}초`);

/* ── ② 자막 카드 — 문장을 8~11자로 쪼갠다 ───────────────────────────── */
function cards(text, start, dur) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const chunks = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.replace(/\s/g, "").length > CHARS[1] && cur) {
      chunks.push(cur);
      cur = w;
    } else {
      cur = next;
    }
  }
  if (cur) chunks.push(cur);

  const per = dur / chunks.length;
  return chunks.map((c, i) => ({ text: c, at: start + per * i, dur: per }));
}

const allCards = [];
for (const scene of timeline) {
  for (const l of scene.lines) {
    const text = voice.lines.find((v) => v.n === l.n).line;
    allCards.push(...cards(text, l.at, l.dur));
  }
}
console.log(`자막 ${allCards.length}장 (문장당 평균 ${(allCards.length / voice.lines.length).toFixed(1)}장)`);

/* ── ③ 씬 잇기 ──────────────────────────────────────────────────────── */
const listFile = path.join(work, "list.txt");
const normalized = timeline.map((s, i) => {
  const dst = path.join(work, `n${i}.mp4`);
  const short = s.seconds > s.made + 0.05;
  const vf =
    `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},fps=30` +
    // 모자라는 만큼 마지막 프레임을 물고 늘린다(tpad). 정지가 티 나지 않게 아주 느린 줌
    (short ? `,tpad=stop_mode=clone:stop_duration=${(s.seconds - s.made).toFixed(2)}` : "");
  spawnSync(ffmpeg, [
    "-y", "-i", s.src,
    "-vf", vf,
    "-t", String(s.seconds),
    "-an", "-c:v", "libx264", "-crf", "20", "-preset", "veryfast", "-pix_fmt", "yuv420p",
    dst,
  ], { stdio: "ignore" });
  if (short) console.log(`  씬 ${s.no}: 영상 ${s.made}초 < 말 ${s.seconds.toFixed(1)}초 → 마지막 프레임 ${(s.seconds - s.made).toFixed(1)}초 연장`);
  return dst;
});
writeFileSync(listFile, normalized.map((f) => `file '${f}'`).join("\n"));
const joined = path.join(work, "joined.mp4");
spawnSync(ffmpeg, ["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", joined], { stdio: "ignore" });

/* ── ④ 나레이션 믹스 ────────────────────────────────────────────────── */
const audioInputs = [];
const delays = [];
let idx = 1;
for (const scene of timeline) {
  for (const l of scene.lines) {
    audioInputs.push("-i", path.join(voiceDir, `line${String(l.n).padStart(2, "0")}.mp3`));
    delays.push(`[${idx}:a]adelay=${Math.round(l.at * 1000)}|${Math.round(l.at * 1000)}[a${idx}]`);
    idx += 1;
  }
}
const mixIns = delays.map((_, i) => `[a${i + 1}]`).join("");

/* ── ⑤ 자막 — 텍스트는 파일로 넘긴다(인라인은 이스케이프가 깨진다) ──── */
const draws = allCards.map((c, i) => {
  const f = path.join(work, `c${i}.txt`);
  writeFileSync(f, c.text, "utf8");
  return (
    `drawtext=fontfile='${FONT}':textfile='${f}'` +
    `:fontsize=${FONT_SIZE}:fontcolor=white:borderw=${Math.round(FONT_SIZE * 0.09)}:bordercolor=black@0.9` +
    `:shadowx=0:shadowy=2:shadowcolor=black@0.35` +
    `:x=(w-text_w)/2:y=h*${CAPTION_Y}-text_h/2` +
    `:enable='between(t,${c.at.toFixed(2)},${(c.at + c.dur).toFixed(2)})'`
  );
}).join(",");

const filter =
  `[0:v]${draws}[v];` +
  `${delays.join(";")};` +
  `${mixIns}amix=inputs=${delays.length}:duration=longest:normalize=0,volume=2.0[a]`;

spawnSync(ffmpeg, [
  "-y", "-i", joined, ...audioInputs,
  "-filter_complex", filter,
  "-map", "[v]", "-map", "[a]",
  "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
  "-t", String(total),
  out,
], { stdio: ["ignore", "ignore", "inherit"] });

console.log(`\n완성: ${out}`);
