/**
 * 광고 소재 편집기 v3 — 나레이션을 얹지 않고 **인물이 직접 말한다.** (2026-08-14)
 *
 *   node scripts/adfilm-edit3.mjs <작업폴더> [plan파일명]
 *
 * ── v2 와 무엇이 다른가 ───────────────────────────────────────────────
 * v2 까지는 TTS 로 뽑은 목소리를 브롤 위에 얹었다. 사장님 지적:
 *   *"나레이션하는 사람 외국인이야? 한국말이 어눌해."*
 * 원인은 TTS 자체였다. sora-2 에게 한국어 대사를 시켜 보니 원문을 100%
 * 발음하는 데다 시키지도 않은 "아니," 를 스스로 붙였다. 읽는 게 아니라
 * 말하고 있다는 뜻이다. 그래서 **소리의 출처를 인물로 옮겼다.**
 *
 * ── 그래서 생기는 문제: 립싱크 ────────────────────────────────────────
 * 목소리가 화면 속 인물의 것이므로, 그 인물이 보이는 구간에서는 **영상과
 * 소리의 시간축이 어긋나면 안 된다.** 브롤을 끼워 넣는 순간 두 시간축이
 * 갈라진다. 그래서 이 편집기는 두 축을 따로 들고 간다:
 *
 *   · 소리축 — 발화 클립들의 말하는 구간만 이어 붙인 연속 트랙
 *   · 화면축 — 같은 길이인데, 어떤 구간은 인물, 어떤 구간은 브롤
 *
 * 화면에 인물을 세울 때는 **그 시점의 소리가 원래 클립 어디였는지 역산해서**
 * 정확히 그 프레임을 가져온다. 그래야 입이 맞는다.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import ffmpeg from "ffmpeg-static";

/* 자막 규격 — lib/adfilm-spec.ts 의 CAPTION_SPEC 과 같은 값. 한쪽을 고치면 둘 다 고칠 것.
   2026-08-16 개정: 상단 90%/88pt 는 레퍼런스 한 편의 스타일이었지 일반 규격이 아니었다.
   사장님 지적("유튜브 자막 생각하면 되는 거 아니야? 비율이 엉망이야")대로
   하단 자막바 · 가로 78% · 세로 해상도의 3.5~4.5% 로 되돌린다. */
const FONT = "assets/fonts/Pretendard-Bold.otf";
const W = 720;
const H = 1280;
const FILL = 0.78;
const MAX_PT = 58;
const MIN_PT = 40;
const CAPTION_Y = 0.82;   // 하단 자막바. 화면 끝에 붙이지 않는다
const HI = "0xFFE24D";

const dir = process.argv[2];
const planName = process.argv[3] ?? "plan-v4.json";
if (!dir) {
  console.error("사용법: node scripts/adfilm-edit3.mjs <작업폴더> [plan파일]");
  process.exit(1);
}

const plan = JSON.parse(readFileSync(path.join(dir, planName), "utf8"));
const work = mkdtempSync(path.join(tmpdir(), "adedit3-"));
const T = (name, body) => {
  const f = path.join(work, `${name}.txt`);
  writeFileSync(f, body, "utf8");
  return f;
};
const run = (args) =>
  execFileSync(ffmpeg, args, { stdio: ["ignore", "ignore", "pipe"] });

function fitSize(text) {
  let u = 0;
  for (const ch of text) {
    if (/\s/.test(ch)) u += 0.35;
    else if (/[.,·!?]/.test(ch)) u += 0.4;
    else if (/[0-9A-Za-z]/.test(ch)) u += 0.55;
    else u += 0.92;
  }
  return Math.round(Math.min(MAX_PT, Math.max(MIN_PT, (W * FILL) / u)));
}

/* ── 1) 소리축 — 발화 구간만 이어 붙인다 ──────────────────────────────
 * 클립 앞뒤의 침묵(인물이 숨 고르는 구간)을 잘라낸다. 이걸 안 하면
 * 클립 이음매마다 1~2초씩 비어 레퍼런스의 "침묵 0" 이 깨진다. */
const speech = plan.speechClips;
let cursor = 0;
speech.forEach((s) => {
  s.trackStart = cursor; // 완성본 시간축에서 이 클립이 시작하는 지점
  cursor += s.dur;
});
const TOTAL = cursor;

const audioParts = speech.map((s, i) => {
  const out = path.join(work, `a${i}.wav`);
  run([
    "-y", "-ss", String(s.from), "-t", String(s.dur),
    "-i", path.join(dir, s.src),
    "-vn", "-ac", "2", "-ar", "48000", out,
  ]);
  return out;
});
const alist = path.join(work, "alist.txt");
writeFileSync(alist, audioParts.map((p) => `file '${p}'`).join("\n"), "utf8");
const voice = path.join(work, "voice.wav");
run(["-y", "-f", "concat", "-safe", "0", "-i", alist, "-c", "copy", voice]);

/* ── 2) 화면축 ─────────────────────────────────────────────────────────
 * `clip` 이면 인물 — 그 시점의 소리가 원래 클립 어디였는지 역산한다.
 * `broll` 이면 아무 데서나 가져와도 된다. 소리와 무관하므로. */
const pieces = [];
let t = 0;
plan.screen.forEach((sc, i) => {
  const out = path.join(work, `v${i}.mp4`);
  let src;
  let from;

  if (sc.clip != null) {
    const s = speech[sc.clip];
    if (!s) throw new Error(`발화 클립 ${sc.clip} 이 없습니다`);
    /**
     * 완성본 t 초 → 그 클립 내부의 시각.
     *
     * 반올림이 필요하다 — 누적 덧셈의 부동소수점 잔여가 `3.55e-15` 같은
     * **지수 표기**로 남는데, ffmpeg 의 `-ss` 가 그 문자열을 못 읽고 죽는다
     * (2026-08-16 v6 조립에서 실제로 걸렸다).
     */
    from = Math.round((s.from + (t - s.trackStart)) * 1000) / 1000;
    src = path.join(dir, s.src);
    if (from < s.from - 0.05 || from + sc.dur > s.from + s.dur + 0.05) {
      throw new Error(
        `립싱크 어긋남: screen[${i}] 이 클립 ${sc.clip} 의 발화 구간을 벗어납니다 (${from.toFixed(2)}s)`,
      );
    }
  } else {
    src = path.join(dir, sc.broll);
    from = sc.from;
  }
  if (!existsSync(src)) throw new Error(`소스가 없습니다: ${src}`);

  run([
    "-y", "-ss", String(from), "-t", String(sc.dur), "-i", src,
    "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
    "-vf", `scale=${W}:${H},fps=30`, out,
  ]);
  pieces.push(out);
  t += sc.dur;
});

if (Math.abs(t - TOTAL) > 0.35) {
  console.warn(`⚠️ 화면 ${t.toFixed(2)}초 / 소리 ${TOTAL.toFixed(2)}초 — 어긋납니다`);
}

const vlist = path.join(work, "vlist.txt");
writeFileSync(vlist, pieces.map((p) => `file '${p}'`).join("\n"), "utf8");
const joined = path.join(work, "joined.mp4");
run(["-y", "-f", "concat", "-safe", "0", "-i", vlist, "-c", "copy", joined]);

/* ── 3) 자막 한 층 ─────────────────────────────────────────────────── */
const draws = (plan.lines ?? []).map((l, i) => {
  const pt = fitSize(l.text);
  /* 자막 디자인 — 2026-08-16. 사장님: "자막 위치는 딱 좋아. 근데 디자인 조금 더 이쁘게."
     테두리만 두르면 밝은 배경에서 뭉개진다. 반투명 검은 판을 뒤에 깔고
     테두리를 얇게 줄여 글자 획이 살아나게 한다. 판은 글자 크기에 비례해
     여백을 잡아 어떤 길이에서도 비율이 유지된다. */
  const tf = T(`ln${i}`, l.text);
  const y = l.y ?? CAPTION_Y;
  return (
    `drawtext=fontfile='${FONT}':textfile='${tf}'` +
    `:fontsize=${pt}:fontcolor=${l.hi ? HI : "white"}` +
    `:x=(w-text_w)/2:y=h*${y}` +
    `:box=1:boxcolor=black@0.55:boxborderw=${Math.round(pt * 0.42)}|${Math.round(pt * 0.30)}` +
    `:borderw=${Math.max(2, Math.round(pt * 0.05))}:bordercolor=black@0.85` +
    `:shadowx=0:shadowy=2:shadowcolor=black@0.35` +
    `:line_spacing=${Math.round(pt * 0.25)}` +
    `:enable='between(t,${l.at},${l.until})'`
  );
});

/* ── 4) 제품 실물컷 + 합성 ────────────────────────────────────────── */
const inputs = ["-i", joined, "-i", voice];
const product = path.join(dir, plan.product ?? "pkg.png");
const hasProduct = existsSync(product);
if (hasProduct) inputs.push("-i", product);

const overlay = hasProduct
  ? `;[2:v]scale=340:-1[pkg];[vd][pkg]overlay=x=(W-w)/2:y=H*0.52` +
    `:enable='between(t,${plan.productAt},${plan.productUntil})'[v]`
  : "";

const filter = `[0:v]${draws.join(",")}[${hasProduct ? "vd" : "v"}]${overlay}`;

const out = path.join(dir, plan.out ?? "final.mp4");
execFileSync(
  ffmpeg,
  [
    "-y", ...inputs, "-filter_complex", filter,
    "-map", "[v]", "-map", "1:a",
    "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", out,
  ],
  { stdio: ["ignore", "ignore", "inherit"] },
);

const shots = plan.screen.length;
const talking = plan.screen.filter((s) => s.clip != null).length;
console.log(
  `완성: ${out}\n` +
    `  ${shots}컷 / ${t.toFixed(1)}초 / 평균 ${(t / shots).toFixed(2)}초` +
    ` (인물 ${talking} · 브롤 ${shots - talking})\n` +
    `  자막 ${plan.lines?.length ?? 0}장`,
);
