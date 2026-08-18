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

/**
 * 샷 폴더와 결과 파일명을 인자로 받는다. (2026-08-18)
 *
 * 예전엔 `scenes-v16` 을 하드코딩했다. i2v 로 갈아타면서 샷이 `shots-v16` 에
 * 쌓이는데, 같은 대본으로 두 판(sora 판 / i2v 판)을 나란히 두고 비교해야
 * 무엇이 좋아졌는지 알 수 있다. 폴더를 못 박으면 그 비교를 못 한다.
 *
 *   node scripts/adfilm-assemble.mjs <plan.json> [샷폴더] [결과파일명]
 */
const planFile = process.argv[2] ?? "drafts/feliway/scenes-v16.json";
const plan = JSON.parse(readFileSync(planFile, "utf8"));
const root = path.dirname(planFile);
const tag = path.basename(planFile, ".json").replace(/^scenes-/, "");
const sceneDir = path.join(root, process.argv[3] ?? `scenes-${tag}`);
const voiceDir = path.join(root, `voice-${tag}`);
const voice = JSON.parse(readFileSync(path.join(voiceDir, "lines.json"), "utf8"));
const out = path.join(root, process.argv[4] ?? `feliway-${tag}.mp4`);
const work = mkdtempSync(path.join(tmpdir(), "adfilm-"));

const FONT = path.resolve("assets/fonts/Pretendard-Bold.otf");
const W = 720, H = 1280;
const FONT_SIZE = Math.round(H * 0.042); // 세로의 4.2% — CAPTION_SPEC.sizeRange 안
const CAPTION_Y = 0.82;
const GAP = 0.12;
const CHARS = [8, 11];

const durOf = (n) => voice.lines.find((l) => l.n === n)?.seconds ?? 0;

/**
 * 씬 영상의 **실제 길이**를 잰다. (2026-08-18 신설)
 *
 * 예전엔 sora 눈금(4·8·12초)을 계산으로 짐작했다. i2v 로 갈아타면서 우리가
 * 원하는 초를 그대로 만들 수 있게 됐는데, 조립기가 옛 가정을 들고 있어서
 * 4.4초 대사에 **8초 자리**를 만들고 5초 영상을 그 길이로 늘렸다.
 * 그 결과 86초짜리가 111초가 됐다(QC 계층1이 잡았다).
 *
 * 짐작하지 않고 판다. 파일이 답을 갖고 있다.
 */
function videoSeconds(file) {
  const out = spawnSync(ffmpeg, ["-hide_banner", "-i", file], { encoding: "utf8" }).stderr || "";
  const m = out.match(/Duration: (\d+):(\d+):([\d.]+)/);
  if (!m) throw new Error(`길이를 못 쟀습니다: ${file}`);
  return +m[1] * 3600 + +m[2] * 60 + +m[3];
}

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
   * 씬 길이는 **만들어진 영상이 정한다.** 말이 그보다 길면 마지막 프레임을
   * 늘려 메운다 — 말을 자르지 않는다. 길이에 맞춰 내용을 자르는 게
   * 사장님이 계속 지적하신 잘못이다.
   *
   * i2v 는 우리가 요청한 초를 그대로 만들고, 그 초는 이미 대사 실측에서
   * 나왔으므로 늘릴 일이 거의 없다.
   */
  const made = videoSeconds(src);
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
  if (short) console.log(`  씬 ${s.no}: 영상 ${s.made.toFixed(1)}초 < 말 ${s.seconds.toFixed(1)}초 → 마지막 프레임 ${(s.seconds - s.made).toFixed(1)}초 연장`);
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
  /**
   * 라우드니스 정규화 + 리미터. (2026-08-19 신설)
   *
   * 예전엔 `volume=2.0` 으로 무조건 두 배를 올렸다. OpenAI TTS 가 작아서
   * 그렇게 맞춰 놨는데, ElevenLabs 로 갈아타니 원본이 커서 **0dB 에 붙어
   * 찌그러졌다**(QC 계층1 이 잡았다).
   *
   * 고정 배수를 쓰면 벤더를 바꿀 때마다 깨진다. 목표 라우드니스를 정하고
   * 거기에 맞춘다 — 숏폼 규격 -16 LUFS, 트루피크 -1.5dB.
   * `alimiter` 가 마지막 안전망이다.
   */
  `${mixIns}amix=inputs=${delays.length}:duration=longest:normalize=0,` +
  // loudnorm 은 샘플레이트를 제 마음대로 바꾼다(96kHz 로 튀었다). 뒤에서 못 박는다.
  // 리미터 -3dB. ⚠️ `level=disabled` 가 핵심이다 — alimiter 는 기본으로 출력을
  // **다시 풀스케일로 끌어올린다.** 그래서 limit 을 내릴수록 평균이 되레 올랐고
  // 피크가 계속 0dB 에 붙었다. AAC 인터샘플 오버슈트까지 감안해 -3dB 를 남긴다
  `loudnorm=I=-16:TP=-2:LRA=11,aresample=48000,alimiter=limit=0.70:level=disabled[a]`;

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
