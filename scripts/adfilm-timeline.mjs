/**
 * 자막·컷 타임라인 생성기 — 2026-08-15 신설.
 *
 *   node scripts/adfilm-timeline.mjs <작업폴더> [plan파일] [--write]
 *
 * ── 왜 만들었나 ───────────────────────────────────────────────────────
 * 사장님 지적: *"나레이션도 컷전환 자막 다 싱크가 안 맞고 따로 놀기도 하고."*
 *
 * 펠리웨이 v4 를 whisper 로 재 봤다(2026-08-15 실측):
 *   · 자막 카드 23개의 간격이 1.78 / 1.78 / 1.78 …  **균등 분할이었다**
 *   · 실제 발화 대비 **최대 0.83초 어긋남**
 *   · 컷 20개 중 발화 시작에 붙은 건 **4개(20%)**
 *
 * 원인은 툴도 프롬프트도 아니었다. **편집기가 오디오를 한 번도 안 들었다.**
 * `plan.json` 의 `lines` 를 사람이 자로 재듯 균등하게 적어 넣었고 ffmpeg 는
 * 그대로 잘랐다. 첫 문장이 4.5초인데 자막은 3.55초에 넘어가니 따로 놀 수밖에 없다.
 *
 * ── 그래서 이 스크립트가 하는 일 ──────────────────────────────────────
 * 완성될 소리를 **먼저 듣고** 자막과 컷 지점을 거기서 만든다.
 * 사람이 타임라인을 손으로 쓰는 자리를 없앤다 — 손으로 쓰면 또 어긋난다.
 *
 * 이건 어떤 생성 툴을 쓰든 남는다. sora 든 Seedance 든 소리는 나오고,
 * 자막은 그 소리 위에 얹히기 때문이다. 오히려 컷이 많은 롱폼에서 더 중요해진다
 * — 어긋남이 컷마다 누적된다.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import ffmpeg from "ffmpeg-static";

/* 규격은 lib/adfilm-spec.ts 의 CAPTION_SPEC 과 같은 값이다.
   .mjs 라 import 를 못 해 상수로 옮겨 적는다 — 한쪽을 고치면 다른 쪽도 고칠 것 */
const CHARS_PER_CARD = [8, 11]; // 한 장에 담는 글자 수
const CARD_SECONDS = [1.0, 2.4]; // 한 장이 머무는 시간
const HI_HINT = /\d|무료|증정|할인|배송|일째|배|%/; // 강조색을 줄 만한 카드

const dir = process.argv[2];
const planName = process.argv.find((a) => a.endsWith(".json")) ?? "plan-v4.json";
const write = process.argv.includes("--write");

if (!dir) {
  console.error(
    "사용법: node scripts/adfilm-timeline.mjs <작업폴더> [plan파일] [--write]",
  );
  process.exit(1);
}

const planPath = path.join(dir, planName);
const plan = JSON.parse(readFileSync(planPath, "utf8"));
const work = mkdtempSync(path.join(tmpdir(), "adtimeline-"));
const run = (args) => execFileSync(ffmpeg, args, { stdio: ["ignore", "ignore", "pipe"] });

/* ── 1) 완성본과 같은 소리축을 만든다 ─────────────────────────────────
 * adfilm-edit3.mjs 가 만드는 것과 정확히 같은 순서·같은 구간이어야 한다.
 * 다르면 여기서 잰 시각이 완성본에서 안 맞는다. */
if (!Array.isArray(plan.speechClips) || !plan.speechClips.length) {
  console.error("plan 에 speechClips 가 없습니다");
  process.exit(1);
}

const parts = plan.speechClips.map((s, i) => {
  const src = path.join(dir, s.src);
  if (!existsSync(src)) throw new Error(`소스가 없습니다: ${src}`);
  const out = path.join(work, `a${i}.wav`);
  run(["-y", "-ss", String(s.from), "-t", String(s.dur), "-i", src,
       "-vn", "-ac", "1", "-ar", "16000", out]);
  return out;
});

const list = path.join(work, "list.txt");
writeFileSync(list, parts.map((p) => `file '${p}'`).join("\n"), "utf8");
const voice = path.join(work, "voice.mp3");
run(["-y", "-f", "concat", "-safe", "0", "-i", list, "-ac", "1", "-ar", "16000", voice]);

const total = plan.speechClips.reduce((s, c) => s + c.dur, 0);

/* ── 2) 단어 단위로 받아쓴다 ──────────────────────────────────────────
 * 문장 단위로는 부족하다. 자막 카드는 문장보다 짧아서(8~11자) 문장 안
 * 어디에서 끊을지를 알아야 한다. */
const KEY = process.env.OPENAI_API_KEY ?? readEnvKey();
if (!KEY) {
  console.error("OPENAI_API_KEY 가 없습니다 (.env.local 확인)");
  process.exit(1);
}

function readEnvKey() {
  try {
    const env = readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
    return env.match(/^OPENAI_API_KEY=(.+)$/m)?.[1].trim().replace(/^["']|["']$/g, "");
  } catch {
    return null;
  }
}

const form = new FormData();
form.append("file", new Blob([readFileSync(voice)], { type: "audio/mpeg" }), "voice.mp3");
form.append("model", "whisper-1");
form.append("language", "ko");
form.append("response_format", "verbose_json");
form.append("timestamp_granularities[]", "word");
form.append("timestamp_granularities[]", "segment");

const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
  method: "POST",
  headers: { Authorization: `Bearer ${KEY}` },
  body: form,
});
if (!res.ok) {
  console.error(`whisper 실패 ${res.status}: ${(await res.text()).slice(0, 300)}`);
  process.exit(1);
}
const tr = await res.json();
let words = tr.words ?? [];
let segments = tr.segments ?? [];

/**
 * ⚠️ **자막 글자는 받아쓰기가 아니라 원문에서 온다.** (2026-08-16)
 *
 * v7 첫 조립에서 자막에 `오금실수`·`표속이래요`·`먹히는것도` 가 그대로 나갔다.
 * whisper 가 잘못 들은 것을 자막으로 썼기 때문이다. 발음이 조금만 뭉개져도
 * 화면에 오탈자가 박힌다 — 광고에서 이건 치명적이다.
 *
 * 그래서 `speechClips[].line` 에 기획안 원문이 있으면 **글자는 원문을 쓰고
 * 시각만 받아쓰기에서 가져온다.** 어절 수가 받아쓰기와 달라도 되게, 그 클립의
 * 실제 발화 구간에 어절을 글자 수 비례로 배분한다. 카드는 어차피 어절 여러 개를
 * 묶으므로 이 정도 근사로 충분하고, **글자가 맞는 게 0.1초보다 훨씬 중요하다.**
 */
const scripted = plan.speechClips.filter((s) => s.line?.trim());
if (scripted.length) {
  const rebuilt = [];
  const segs = [];
  let track = 0;
  for (const clip of plan.speechClips) {
    const t0 = track;
    const t1 = track + clip.dur;
    track = t1;
    if (!clip.line?.trim()) continue;

    // 이 클립 안에서 실제로 말이 있었던 구간
    const mine = words.filter((w) => w.start >= t0 - 0.01 && w.start < t1 + 0.01);
    const from = mine.length ? mine[0].start : t0;
    const to = mine.length ? mine[mine.length - 1].end : t1;

    const parts = clip.line.trim().split(/\s+/).filter(Boolean);
    const weights = parts.map((p) => Math.max(1, p.replace(/\s/g, "").length));
    const sum = weights.reduce((a, b) => a + b, 0);
    let cur = from;
    for (let i = 0; i < parts.length; i += 1) {
      const span = ((to - from) * weights[i]) / sum;
      rebuilt.push({ word: parts[i], start: cur, end: cur + span });
      cur += span;
    }
    segs.push({ start: from, end: to, text: clip.line.trim() });
  }
  if (rebuilt.length) {
    words = rebuilt;
    segments = segs; // 문장 경계 = 클립 경계. 자막이 클립을 넘지 않는다
    console.log(`\n원문 대사 ${segs.length}줄로 자막 글자를 교체했습니다(받아쓰기는 시각만 사용)`);
  }
}

if (!words.length) {
  console.error("단어 타임스탬프가 없습니다 — 말이 없는 트랙일 수 있습니다");
  process.exit(1);
}

/* ── 3) 자막 카드 — 실제 발화 위에서 자른다 ──────────────────────────
 * 글자 수로 끊되, **단어 중간에서는 절대 안 끊는다.** 카드의 시각은
 * 첫 단어가 시작하는 순간과 마지막 단어가 끝나는 순간 그대로다. */
const count = (s) => s.replace(/\s/g, "").length;

/**
 * ⚠️ 문장 경계를 **절대 넘지 않는다.** (2026-08-15 1차 실행에서 잡은 문제)
 *
 * 처음엔 단어를 쭉 이어 붙이며 글자 수로만 끊었다. 싱크는 0초가 됐는데
 * 카드가 이렇게 나왔다:
 *   "밥을 아예 안 먹더라구요 소리만"  ← 문장이 끝났는데 다음 문장이 붙음
 *   "나면 옷장으로 숨어버리고"        ← 문장 중간에서 시작
 * 시각은 맞는데 **읽기는 균등분할보다 나빴다.** 자막은 의미 단위로 끊겨야 한다.
 *
 * 그래서 문장(whisper segment) 안에서만 쪼갠다. 문장이 8~11자보다 짧으면
 * 그 문장이 그대로 한 장이 된다 — 짧은 게 붙는 것보다 낫다.
 */
/**
 * 단어를 **정확히 한 문장에만** 배정한다.
 *
 * 처음엔 `start` 가 문장 구간에 들면 넣는 식으로 느슨하게 판정했는데,
 * whisper 의 문장 구간이 서로 살짝 겹쳐서 경계 단어가 두 문장에 다 들어갔다.
 * 그 결과 자막에 "꽂으면 끝이에요 웅크리고" 처럼 **다른 문장 두 개가 한 장에**
 * 붙었다(v5 첫 조립에서 눈으로 확인). 겹치는 시간이 가장 큰 문장 하나로 보낸다.
 */
const overlap = (w, s) =>
  Math.max(0, Math.min(w.end, s.end) - Math.max(w.start, s.start));

const owner = new Map();
words.forEach((w, i) => {
  let best = -1;
  let bestOv = -1;
  segments.forEach((s, si) => {
    const ov = overlap(w, s);
    if (ov > bestOv) {
      bestOv = ov;
      best = si;
    }
  });
  owner.set(i, best);
});

const cards = [];

for (let si = 0; si < segments.length; si += 1) {
  const mine = words.filter((_, i) => owner.get(i) === si);
  if (!mine.length) continue;

  let buf = [];
  const flush = () => {
    if (!buf.length) return;
    const text = buf.map((w) => w.word).join(" ").replace(/\s+/g, " ").trim();
    cards.push({
      at: Number(buf[0].start.toFixed(2)),
      until: Number(buf[buf.length - 1].end.toFixed(2)),
      text,
      ...(HI_HINT.test(text) ? { hi: true } : {}),
      seg: si, // 병합할 때 같은 문장인지 보려고 달아 둔다. 저장 전에 뗀다
    });
    buf = [];
  };

  for (const w of mine) {
    // **넣기 전에** 검사한다. 넣고 나서 검사하면 상한을 넘긴 카드가 남는다
    const wouldBe = count([...buf, w].map((x) => x.word).join(""));
    const span = w.end - (buf[0]?.start ?? w.start);
    if (buf.length && (wouldBe > CHARS_PER_CARD[1] || span > CARD_SECONDS[1])) {
      flush();
    }
    buf.push(w);
  }
  flush();
}

/* 같은 문장 안에서 너무 짧은 꼬리 카드는 앞에 붙인다 — 깜빡이면 안 읽힌다.
   문장이 다르면 붙이지 않는다(위 규칙을 여기서 깨면 의미가 없다) */
for (let i = cards.length - 1; i > 0; i -= 1) {
  const c = cards[i];
  const prev = cards[i - 1];
  const sameSentence = prev.seg === c.seg;
  const tooShort = c.until - c.at < CARD_SECONDS[0] || count(c.text) < 4;
  /**
   * 두 글자 이하 꼬리는 글자 수 상한을 무시하고 붙인다.
   * `말` 한 글자가 0.4초 깜빡이는 카드가 실제로 나왔다(2026-08-16).
   * 한 글자짜리 카드는 상한을 조금 넘는 것보다 훨씬 나쁘다.
   */
  const orphan = count(c.text) <= 2;
  if (
    sameSentence &&
    tooShort &&
    (orphan || count(`${prev.text}${c.text}`) <= CHARS_PER_CARD[1])
  ) {
    prev.text = `${prev.text} ${c.text}`.trim();
    prev.until = c.until;
    if (c.hi) prev.hi = true;
    cards.splice(i, 1);
  }
}

/**
 * 말이 끝나도 자막은 조금 더 남는다.
 *
 * 단어 끝에 딱 맞춰 지우면 눈이 따라가기 전에 사라진다 — 0.8초짜리 카드가
 * 깜빡이는 이유다. 다음 카드가 뜨기 직전까지 늘려 준다. 발화보다 늦게
 * 사라지는 건 어색하지 않지만, 먼저 사라지면 못 읽는다.
 */
const HOLD_MIN = 1.1;
cards.forEach((c, i) => {
  const limit = i + 1 < cards.length ? cards[i + 1].at : total;
  c.until = Number(Math.min(limit, Math.max(c.until, c.at + HOLD_MIN)).toFixed(2));
});

/* ── 4) 컷 지점 — 말이 끊기는 자리에서만 자른다 ──────────────────────
 * 말 한복판에서 화면이 바뀌면 그게 "따로 논다" 의 정체다.
 * 문장 경계를 1순위, 카드 경계를 2순위로 쓴다. */
const sentenceEdges = segments.map((s) => Number(s.start.toFixed(2)));
const cardEdges = cards.map((c) => c.at);
const cutPoints = [...new Set([...sentenceEdges, ...cardEdges])]
  .filter((t) => t >= 0 && t <= total)
  .sort((a, b) => a - b);

/* ── 5) 지금 plan 이 얼마나 어긋나 있는지 ────────────────────────────── */
const before = plan.lines ?? [];
const drift = segments.map((s) => {
  const near = before.length
    ? before.reduce((a, b) => (Math.abs(b.at - s.start) < Math.abs(a.at - s.start) ? b : a))
    : null;
  return near ? Math.abs(near.at - s.start) : 0;
});
const worstBefore = drift.length ? Math.max(...drift) : 0;

const cutsOn = (list) =>
  list.filter((c) => sentenceEdges.some((x) => Math.abs(c - x) < 0.25)).length;

let oldCuts = [];
if (Array.isArray(plan.screen)) {
  let t = 0;
  for (const sc of plan.screen) {
    oldCuts.push(Number(t.toFixed(2)));
    t += sc.dur;
  }
}

console.log(`\n소리축 ${total.toFixed(2)}초 · 단어 ${words.length}개 · 문장 ${segments.length}개\n`);
console.log("── 지금 plan ─────────────────────────────");
console.log(`  자막 ${before.length}장 · 발화 대비 최대 어긋남 ${worstBefore.toFixed(2)}초`);
if (oldCuts.length) {
  console.log(`  컷 ${oldCuts.length}개 중 발화 경계에 붙은 것 ${cutsOn(oldCuts)}개`);
}
console.log("\n── 새 타임라인 ───────────────────────────");
console.log(`  자막 ${cards.length}장 · 발화 대비 어긋남 0.00초 (발화에서 직접 만듦)`);
console.log(`  자를 수 있는 지점 ${cutPoints.length}개 (전부 말이 끊기는 자리)`);
console.log(
  `  카드 길이 ${Math.min(...cards.map((c) => c.until - c.at)).toFixed(2)}` +
    `~${Math.max(...cards.map((c) => c.until - c.at)).toFixed(2)}초 · ` +
    `글자 ${Math.min(...cards.map((c) => count(c.text)))}~${Math.max(...cards.map((c) => count(c.text)))}자`,
);

console.log("\n── 자막 (앞 10장) ────────────────────────");
for (const c of cards.slice(0, 10)) {
  console.log(`  ${c.at.toFixed(2)} → ${c.until.toFixed(2)}  ${c.hi ? "★ " : "  "}${c.text}`);
}

/* ── 6) 컷 지점 스냅 ──────────────────────────────────────────────────
 * 화면이 말 한복판에서 바뀌면 그게 "따로 논다" 의 정체다. 각 컷의 끝을
 * 가장 가까운 발화 경계로 당긴다. 많이 움직이면 립싱크가 깨지므로
 * ±SNAP_MAX 안에서만 옮기고, 남은 오차는 마지막 컷이 흡수한다. */
const SNAP_MAX = 0.6;

/**
 * ⚠️ **발화 컷(`clip`)에 닿는 경계는 못 옮긴다.** (첫 시도에서 잡힌 문제)
 *
 * 처음엔 모든 경계를 자유롭게 당겼더니 `adfilm-edit3.mjs` 의 립싱크 검증이
 * 잡아냈다 — *"screen[6] 이 클립 1 의 발화 구간을 벗어납니다 (-1.02s)"*.
 * 인물이 화면에 있는 구간은 소리축과 1:1로 묶여 있어서, 그 경계를 옮기면
 * 입이 어긋난다. 브롤 사이 경계만 옮긴다.
 *
 * 검증이 이걸 잡아 준 게 다행이다 — 안 잡혔으면 입이 어긋난 채 납품됐다.
 */
function snapScreen(screen) {
  const bounds = [];
  let t = 0;
  for (const s of screen) {
    bounds.push(Number(t.toFixed(2)));
    t += s.dur;
  }
  bounds.push(Number(t.toFixed(2)));

  for (let i = 1; i < bounds.length - 1; i += 1) {
    // bounds[i] = screen[i-1] 의 끝이자 screen[i] 의 시작
    if (screen[i].clip != null || screen[i - 1].clip != null) continue;

    const here = bounds[i];
    const near = cutPoints.reduce(
      (a, b) => (Math.abs(b - here) < Math.abs(a - here) ? b : a),
      cutPoints[0],
    );
    // 앞뒤 경계를 넘거나 컷이 너무 짧아지면 옮기지 않는다
    if (
      Math.abs(near - here) <= SNAP_MAX &&
      near > bounds[i - 1] + 0.5 &&
      near < bounds[i + 1] - 0.5
    ) {
      bounds[i] = Number(near.toFixed(2));
    }
  }

  return screen.map((s, i) => ({
    ...s,
    dur: Number((bounds[i + 1] - bounds[i]).toFixed(2)),
  }));
}

if (Array.isArray(plan.screen) && plan.screen.length > 1) {
  const after = snapScreen(plan.screen);
  let t = 0;
  const newCuts = [];
  for (const s of after) {
    newCuts.push(Number(t.toFixed(2)));
    t += s.dur;
  }
  console.log(
    `\n── 컷 스냅 ───────────────────────────────\n` +
      `  발화 경계에 붙은 컷 ${cutsOn(oldCuts)}개 → ${cutsOn(newCuts)}개 / 전체 ${newCuts.length}개`,
  );
  plan.__snappedScreen = after;
}

if (write) {
  plan.lines = cards.map(({ seg: _seg, ...rest }) => rest);
  plan.cutPoints = cutPoints;
  if (plan.__snappedScreen) {
    plan.screen = plan.__snappedScreen;
  }
  delete plan.__snappedScreen;
  writeFileSync(planPath, JSON.stringify(plan, null, 2) + "\n", "utf8");
  console.log(`\n✓ ${planName} 에 반영했습니다. adfilm-edit3.mjs 로 다시 조립하세요.`);
} else {
  console.log("\n(--write 를 붙이면 plan 에 반영합니다)");
}
