/**
 * 광고 소재 편집기 — 긴 생성분을 잘게 잘라 템포를 만든다. (2026-08-14)
 *
 *   node scripts/adfilm-edit.mjs <작업폴더>
 *
 * ── 왜 생성이 아니라 편집으로 템포를 만드는가 ─────────────────────────
 * 포트폴리오 실측: 52초에 컷 전환 22회 = **평균 2.4초에 한 컷**.
 * 그런데 sora 로 2.4초짜리를 12번 뽑으면 두 가지가 망가진다.
 *   · 값이 5배가 된다 (호출마다 최소 4초 과금)
 *   · 컷마다 인물·조명이 달라진다 (연장이 아니라 새 생성이므로)
 *
 * 그래서 **생성은 길게(12초씩 연장), 편집은 잘게** 한다. 실제 제작 현장에서
 * 하는 것과 같다 — 길게 찍고 잘라 붙인다.
 *
 * ── 자막 3층 ──────────────────────────────────────────────────────────
 * 레퍼런스를 그대로 옮겼다. 음소거로 보는 사람이 대다수라 자막이 본체다.
 *   1층 상단 고정 헤드라인 — 영상 내내
 *   2층 중앙 강조 캡션    — 한 줄씩 **누적**되며 쌓인다
 *   3층 하단 발화 자막    — 나레이션과 싱크, 한 문장씩 딱딱
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import ffmpeg from "ffmpeg-static";

const FONT = "/System/Library/Fonts/Supplemental/AppleGothic.ttf";
const dir = process.argv[2];
if (!dir) {
  console.error("사용법: node scripts/adfilm-edit.mjs <작업폴더>");
  process.exit(1);
}

const plan = JSON.parse(readFileSync(path.join(dir, "plan.json"), "utf8"));
const work = mkdtempSync(path.join(tmpdir(), "adedit-"));
const T = (name, body) => {
  const f = path.join(work, `${name}.txt`);
  writeFileSync(f, body, "utf8");
  return f;
};

/* ── 1) 컷을 잘라 이어 붙인다 ──────────────────────────────────────── */
const pieces = [];
plan.cuts.forEach((c, i) => {
  const src = path.join(dir, c.src);
  if (!existsSync(src)) throw new Error(`소스가 없습니다: ${src}`);
  const out = path.join(work, `c${i}.mp4`);
  execFileSync(
    ffmpeg,
    [
      "-y", "-ss", String(c.from), "-t", String(c.dur), "-i", src,
      // 컷마다 다시 인코딩해야 이어 붙일 때 프레임이 안 튄다
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
      "-c:a", "aac", "-ar", "48000", "-ac", "2",
      "-vf", "scale=720:1280,fps=30", out,
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  pieces.push(out);
});

const list = path.join(work, "list.txt");
writeFileSync(list, pieces.map((p) => `file '${p}'`).join("\n"), "utf8");
const joined = path.join(work, "joined.mp4");
execFileSync(
  ffmpeg,
  ["-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", joined],
  { stdio: ["ignore", "ignore", "pipe"] },
);

/* ── 2) 자막 3층 ───────────────────────────────────────────────────── */
const draws = [];

// 1층 — 상단 고정. 검은 띠 위 흰 글씨
draws.push(
  `drawtext=fontfile='${FONT}':textfile='${T("head", plan.headline)}'` +
    `:fontsize=40:fontcolor=white:line_spacing=10:x=(w-text_w)/2:y=h*0.055` +
    `:box=1:boxcolor=black@0.78:boxborderw=22`,
);

// 2층 — 중앙 강조 캡션. 한 줄씩 쌓인다
for (const g of plan.emphasis ?? []) {
  g.lines.forEach((line, i) => {
    const at = g.at + i * (g.step ?? 0.8);
    const y = `h*${(g.y ?? 0.3) + i * 0.062}`;
    draws.push(
      `drawtext=fontfile='${FONT}':textfile='${T(`em${g.at}_${i}`, line.text)}'` +
        `:fontsize=${line.big ? 52 : 44}:fontcolor=${line.color ?? "white"}` +
        `:x=(w-text_w)/2:y=${y}:borderw=5:bordercolor=black@0.85` +
        `:enable='between(t,${at},${g.until})'`,
    );
  });
}

// 3층 — 하단 발화 자막. 나레이션과 싱크
(plan.speech ?? []).forEach((s, i) => {
  draws.push(
    `drawtext=fontfile='${FONT}':textfile='${T(`sp${i}`, s.text)}'` +
      `:fontsize=36:fontcolor=white:line_spacing=12:x=(w-text_w)/2:y=h*0.78` +
      `:box=1:boxcolor=black@0.5:boxborderw=16` +
      `:enable='between(t,${s.at},${s.at + s.dur})'`,
  );
});

/* ── 3) 나레이션 + 제품 실물컷 ─────────────────────────────────────── */
const inputs = ["-i", joined];
const audio = (plan.speech ?? []).filter((s) => s.audio);
audio.forEach((s) => inputs.push("-i", path.join(dir, s.audio)));

const product = path.join(dir, plan.product ?? "pkg.png");
const hasProduct = existsSync(product);
if (hasProduct) inputs.push("-i", product);

const delays = audio
  .map((s, i) => `[${i + 1}:a]adelay=${Math.round(s.at * 1000)}|${Math.round(s.at * 1000)}[n${i}]`)
  .join(";");
const mixIns = audio.map((_, i) => `[n${i}]`).join("");

const overlay = hasProduct
  ? `;[${audio.length + 1}:v]scale=280:-1[pkg];[vd][pkg]overlay=x=W-w-24:y=H*0.155:enable='between(t,${plan.productAt},${plan.productUntil})'[v]`
  : "";

const filter =
  `[0:v]${draws.join(",")}[${hasProduct ? "vd" : "v"}]${overlay};` +
  `${delays};[0:a]volume=-12dB[bg];` +
  `[bg]${mixIns}amix=inputs=${audio.length + 1}:duration=first:normalize=0[a]`;

const out = path.join(dir, plan.out ?? "final.mp4");
execFileSync(
  ffmpeg,
  [
    "-y", ...inputs, "-filter_complex", filter,
    "-map", "[v]", "-map", "[a]",
    "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out,
  ],
  { stdio: ["ignore", "ignore", "inherit"] },
);

const total = plan.cuts.reduce((s, c) => s + c.dur, 0);
console.log(
  `완성: ${out}\n  ${plan.cuts.length}컷 / ${total.toFixed(1)}초 / 평균 ${(total / plan.cuts.length).toFixed(1)}초`,
);
