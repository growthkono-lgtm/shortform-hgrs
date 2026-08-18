/**
 * 펠리웨이 30초 구매전환 소재 — 마감. (2026-08-14)
 *
 *   node scripts/feliway-compose.mjs <원본.mp4> <출력.mp4>
 *
 * ── AI 가 만든 것과 사람이 얹는 것 ────────────────────────────────────
 * sora 가 만드는 것: 장면(집·고양이·집사·행동)
 * 여기서 얹는 것:   나레이션 · 자막 · **제품 실물컷** · CTA
 *
 * 제품을 AI 에게 그리게 하지 않는다. 라벨·용기 모양이 매번 달라지고,
 * 실제 상품과 다른 물건이 광고에 나가는 건 그 자체로 사고다.
 * 그래서 프롬프트에서는 "손으로 가려진 흰 플러그형 기기" 로만 두고,
 * 실물 패키지는 마지막 구간에 오버레이로 올린다.
 *
 * ── 자막 문구의 근거 ──────────────────────────────────────────────────
 * 전부 제품 패키지와 자사몰(cevakorea.com)에서 확인한 것만 쓴다.
 * 가격은 두 곳 다 명시가 없어서 **넣지 않았다.** 지어내지 않는다.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import ffmpeg from "ffmpeg-static";

const FONT = "/System/Library/Fonts/Supplemental/AppleGothic.ttf";

const [, , src, out] = process.argv;
if (!src || !out) {
  console.error("사용법: node scripts/feliway-compose.mjs <원본.mp4> <출력.mp4>");
  process.exit(1);
}

const dir = path.dirname(src);
const work = mkdtempSync(path.join(tmpdir(), "feliway-"));
const textFile = (name, body) => {
  const f = path.join(work, `${name}.txt`);
  writeFileSync(f, body, "utf8");
  return f;
};

/**
 * 타임라인 — 훅 구간(0~11초)에는 말을 얹지 않는다.
 * 3초 안에 소리부터 나오면 광고로 인식되고 손가락이 올라간다.
 */
const TIMELINE = [
  {
    at: 11.5,
    audio: "nar-1.mp3",
    text: "숨고 · 긁고 · 마킹하고\n불안하다는 신호였어요",
    dur: 5.5,
  },
  {
    at: 18.5,
    audio: "nar-2.mp3",
    text: "수의사가 권하는 페로몬\n진정제가 아닙니다",
    dur: 6,
  },
  {
    at: 29,
    audio: "nar-3.mp3",
    text: "콘센트 하나로 30일",
    dur: 6,
    cta: true,
  },
];

/** 제품 실물이 화면에 머무는 구간 */
const PRODUCT_AT = 26.5;
const PRODUCT_DUR = 9.5;

const esc = (p) => p.replace(/'/g, "\\'");

// ── 자막 + CTA ─────────────────────────────────────────────────────────
const draws = TIMELINE.map((t, i) => {
  const between = `between(t,${t.at},${t.at + t.dur})`;
  const box = t.cta
    ? ":box=1:boxcolor=#7B2D8E@0.94:boxborderw=24" // 브랜드 퍼플
    : ":box=1:boxcolor=black@0.45:boxborderw=18";
  return (
    `drawtext=fontfile='${FONT}':textfile='${textFile(`sub${i}`, t.text)}'` +
    `:fontsize=${t.cta ? 46 : 36}:fontcolor=white:line_spacing=14` +
    `:x=(w-text_w)/2:y=h*0.70${box}:enable='${between}'`
  );
}).join(",");

// ── 나레이션 ───────────────────────────────────────────────────────────
const inputs = ["-i", src];
TIMELINE.forEach((t) => {
  const p = path.join(dir, t.audio);
  if (!existsSync(p)) throw new Error(`나레이션이 없습니다: ${p}`);
  inputs.push("-i", p);
});

// ── 제품 실물컷 ────────────────────────────────────────────────────────
const product = path.join(dir, "pkg.png");
const hasProduct = existsSync(product);
if (hasProduct) inputs.push("-i", product);

const nAudio = TIMELINE.length;
const delays = TIMELINE.map(
  (t, i) => `[${i + 1}:a]adelay=${Math.round(t.at * 1000)}|${Math.round(t.at * 1000)}[n${i}]`,
).join(";");
const mixIns = TIMELINE.map((_, i) => `[n${i}]`).join("");

// 제품은 우상단에 얹는다 — 하단 자막과 겹치지 않는 자리
const overlay = hasProduct
  ? `;[${nAudio + 1}:v]scale=300:-1[pkg];[v0][pkg]overlay=x=W-w-30:y=H*0.12:enable='between(t,${PRODUCT_AT},${PRODUCT_AT + PRODUCT_DUR})'[v]`
  : "";

const filter =
  `[0:v]${draws}[${hasProduct ? "v0" : "v"}]${overlay};` +
  `${delays};` +
  `[0:a]volume=-10dB[bg];` +
  `[bg]${mixIns}amix=inputs=${nAudio + 1}:duration=first:normalize=0[a]`;

execFileSync(
  ffmpeg,
  [
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
  ],
  { stdio: ["ignore", "ignore", "inherit"] },
);
console.log(`완성: ${out}${hasProduct ? " (제품 실물컷 포함)" : " ⚠️ 제품컷 없음"}`);
