/**
 * AI 광고영상 마감 — 나레이션·자막·CTA 를 얹어 납품물로 만든다. (2026-08-14)
 *
 *   node scripts/adfilm-compose.mjs <원본.mp4> <출력.mp4>
 *
 * ── 왜 sora 가 만든 영상에 자막을 따로 얹는가 ─────────────────────────
 * sora 에게 "화면에 글자를 넣어라" 라고 시키면 **한글이 깨진다.** 자모가
 * 뭉개지거나 없는 글자가 만들어진다. 영어도 철자가 틀린다. 그래서 프롬프트에
 * 아예 "글자 넣지 마라" 를 박아 두고, 글자는 전부 여기서 얹는다.
 *
 * 그리고 자막은 판매에 직접 개입한다 — 프로모션 문구 하나가 전환을 가른다.
 * 그 문장이 모델의 손에 있으면 안 된다.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import ffmpeg from "ffmpeg-static";

/** macOS 기본 한글 폰트. ttc 라 인덱스를 지정해야 한 벌만 잡힌다 */
const FONT = "/System/Library/Fonts/Supplemental/AppleGothic.ttf";

const [, , src, out] = process.argv;
if (!src || !out) {
  console.error("사용법: node scripts/adfilm-compose.mjs <원본.mp4> <출력.mp4>");
  process.exit(1);
}

/**
 * 자막·나레이션 타임라인.
 *
 * 컷 구조(`lib/adfilm-spec.ts`)와 같은 순서다:
 *   훅(무음) → 문제 → 제품·이유 → 행동
 * 훅 구간에 말을 얹지 않는 게 핵심이다. 3초 안에 소리부터 나오면
 * 광고로 인식되고 손가락이 올라간다.
 */
const TIMELINE = [
  { at: 12.0, audio: "nar-1.mp3", text: "일곱 살이 넘으면\n관절은 조용히 나빠집니다", dur: 5 },
  { at: 19.0, audio: "nar-2.mp3", text: "수의사 처방 기준 그대로\n사람이 먹는 등급 원료", dur: 6 },
  { at: 29.5, audio: "nar-3.mp3", text: "지금 2개 사면 1개 더", dur: 5, cta: true },
];

const dir = path.dirname(src);
const work = mkdtempSync(path.join(tmpdir(), "adfilm-"));

/**
 * 자막은 **파일로 넘긴다.** (2026-08-14)
 *
 * drawtext 의 `text=` 에 한글과 줄바꿈을 인라인으로 넣으면 셸·필터그래프를
 * 두 번 거치면서 이스케이프가 깨진다. 실제로 첫 합성에서 줄바꿈이 리터럴
 * `n` 으로 찍히고 한 줄이 되어 화면 밖으로 넘쳤다.
 * `textfile=` 은 파일 내용을 그대로 읽으므로 그 경로가 아예 없다.
 */
const textFile = (name, body) => {
  const f = path.join(work, `${name}.txt`);
  writeFileSync(f, body, "utf8");
  return f;
};

// ── 자막 + CTA 박스 ────────────────────────────────────────────────────
// 하단 18% 지점. 인스타·틱톡 UI 가 덮는 자리를 피한다
const draws = TIMELINE.map((t, i) => {
  const between = `between(t,${t.at},${t.at + t.dur})`;
  const box = t.cta
    ? ":box=1:boxcolor=#FF3B30@0.92:boxborderw=24"
    : ":box=1:boxcolor=black@0.45:boxborderw=18";
  // 720px 폭에 한글이 들어가는 크기. 첫 판은 46이라 한 줄이 잘렸다
  const size = t.cta ? 46 : 36;
  return (
    `drawtext=fontfile='${FONT}':textfile='${textFile(`sub${i}`, t.text)}'` +
    `:fontsize=${size}:fontcolor=white:line_spacing=14` +
    `:x=(w-text_w)/2:y=h*0.70${box}:enable='${between}'`
  );
}).join(",");

// ── 나레이션 믹스 ──────────────────────────────────────────────────────
// 원본 현장음은 살리되 나레이션이 들리게 눌러 준다(-9dB)
const inputs = ["-i", src];
TIMELINE.forEach((t) => {
  const p = path.join(dir, t.audio);
  if (!existsSync(p)) throw new Error(`나레이션 파일이 없습니다: ${p}`);
  inputs.push("-i", p);
});

const delays = TIMELINE.map(
  (t, i) => `[${i + 1}:a]adelay=${Math.round(t.at * 1000)}|${Math.round(t.at * 1000)}[n${i}]`,
).join(";");
const mixIns = TIMELINE.map((_, i) => `[n${i}]`).join("");

const filter =
  `[0:v]${draws}[v];` +
  `${delays};` +
  `[0:a]volume=-9dB[bg];` +
  `[bg]${mixIns}amix=inputs=${TIMELINE.length + 1}:duration=first:normalize=0[a]`;

const args = [
  "-y",
  ...inputs,
  "-filter_complex", filter,
  "-map", "[v]",
  "-map", "[a]",
  "-c:v", "libx264",
  "-preset", "medium",
  "-crf", "20",
  "-pix_fmt", "yuv420p",
  "-c:a", "aac",
  "-b:a", "192k",
  "-movflags", "+faststart",
  out,
];

execFileSync(ffmpeg, args, { stdio: ["ignore", "ignore", "inherit"] });
console.log(`완성: ${out}`);
