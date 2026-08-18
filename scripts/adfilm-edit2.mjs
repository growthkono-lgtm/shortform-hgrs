/**
 * 광고 소재 편집기 v2 — 레퍼런스 자막 규격을 그대로 재현한다. (2026-08-14)
 *
 *   node scripts/adfilm-edit2.mjs <작업폴더> [plan파일명]
 *
 * ── v1 이 실패한 지점 ─────────────────────────────────────────────────
 * v1 은 자막을 세 층(상단 고정 헤드라인 / 중앙 누적 캡션 / 하단 박스 자막)으로
 * 쌓았다. 레퍼런스를 실측해 보니 **층이 하나뿐이다.** 대신 그 한 층이
 *   · 화면폭의 88~92% 를 채울 만큼 크고
 *   · 박스 없이 두꺼운 검은 테두리만 두르고
 *   · 무조건 한 줄이고
 *   · 나레이션 한 문장을 2~3장으로 쪼개 1.5초마다 갈아탄다.
 *
 * 그래서 여기서는 글자 크기를 **문장 길이에서 역산한다.** 짧은 문장은 크게,
 * 긴 문장은 작게 — 어느 쪽이든 가로폭은 항상 같게 찬다. 이게 레퍼런스가
 * 균일해 보이는 이유다.
 *
 * ── 소리 ──────────────────────────────────────────────────────────────
 * 원본(sora 가 만든 현장음)은 -26dB 로 깔기만 한다. v1 은 -12dB 라 나레이션과
 * 겹쳐 들렸다. 레퍼런스도 현장음은 거의 들리지 않는다 — 말이 주인공이다.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import ffmpeg from "ffmpeg-static";

const FONT = "/System/Library/Fonts/AppleSDGothicNeo.ttc";
const W = 720;
const H = 1280;

/** 자막이 차지할 가로폭 — 레퍼런스 실측값 */
const FILL = 0.9;
const MAX_PT = 88;
const MIN_PT = 34;

/** 강조어 색. ffmpeg 는 `#RRGGBB` 를 못 읽는다 — `0x` 라야 한다 */
const HI = "0xFFE24D";

const dir = process.argv[2];
const planName = process.argv[3] ?? "plan.json";
if (!dir) {
  console.error("사용법: node scripts/adfilm-edit2.mjs <작업폴더> [plan파일]");
  process.exit(1);
}

const plan = JSON.parse(readFileSync(path.join(dir, planName), "utf8"));
const work = mkdtempSync(path.join(tmpdir(), "adedit2-"));
const T = (name, body) => {
  const f = path.join(work, `${name}.txt`);
  writeFileSync(f, body, "utf8");
  return f;
};

/**
 * 글자 크기를 문장에서 역산한다.
 * 한글은 정사각(1.0), 공백·문장부호는 좁고, 숫자·영문은 그 중간이다.
 * 이 폭 모델이 없으면 짧은 문장은 초라하고 긴 문장은 화면 밖으로 나간다.
 */
function fitSize(text) {
  let units = 0;
  for (const ch of text) {
    if (/\s/.test(ch)) units += 0.35;
    else if (/[.,·!?]/.test(ch)) units += 0.4;
    else if (/[0-9A-Za-z]/.test(ch)) units += 0.55;
    else units += 0.92; // 한글 — AppleSDGothicNeo 실측 자폭
  }
  return Math.round(Math.min(MAX_PT, Math.max(MIN_PT, (W * FILL) / units)));
}

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
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
      "-c:a", "aac", "-ar", "48000", "-ac", "2",
      "-vf", `scale=${W}:${H},fps=30`, out,
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

/* ── 2) 자막 한 층 ─────────────────────────────────────────────────── */
const draws = (plan.lines ?? []).map((l, i) => {
  const pt = fitSize(l.text);
  return (
    `drawtext=fontfile='${FONT}':textfile='${T(`ln${i}`, l.text)}'` +
    `:fontsize=${pt}:fontcolor=${l.hi ? HI : "white"}` +
    `:x=(w-text_w)/2:y=h*${l.y ?? 0.27}` +
    // 테두리는 글자 크기에 비례해야 어느 문장에서나 같은 무게로 보인다
    `:borderw=${Math.max(4, Math.round(pt * 0.11))}:bordercolor=black` +
    `:shadowx=0:shadowy=3:shadowcolor=black@0.45` +
    `:enable='between(t,${l.at},${l.until})'`
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

// 제품은 자막 아래, 화면 중앙 하단에 크게 — 우상단 구석은 눈에 안 들어온다
const overlay = hasProduct
  ? `;[${audio.length + 1}:v]scale=340:-1[pkg];[vd][pkg]overlay=x=(W-w)/2:y=H*0.52` +
    `:enable='between(t,${plan.productAt},${plan.productUntil})'[v]`
  : "";

const filter =
  `[0:v]${draws.join(",")}[${hasProduct ? "vd" : "v"}]${overlay};` +
  `${delays};[0:a]volume=-26dB[bg];` +
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
const sizes = (plan.lines ?? []).map((l) => fitSize(l.text));
console.log(
  `완성: ${out}\n` +
    `  ${plan.cuts.length}컷 / ${total.toFixed(1)}초 / 평균 ${(total / plan.cuts.length).toFixed(2)}초\n` +
    `  자막 ${plan.lines?.length ?? 0}장 / 글자 ${Math.min(...sizes)}~${Math.max(...sizes)}pt`,
);
