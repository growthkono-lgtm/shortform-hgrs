/**
 * 펠리웨이 v4 조립 — 발화 클립에서 plan 을 자동으로 만든다. (2026-08-14)
 *
 *   node scripts/feliway-build-v4.mjs
 *
 * ── 왜 손으로 안 짜는가 ───────────────────────────────────────────────
 * 발화 클립의 말 길이는 sora 가 정한다. 우리가 예측할 수 없다. 그래서
 * **whisper 로 받아써서 실제 말 구간을 잰 다음** 그 위에 자막과 브롤을
 * 배분한다. 사람이 초를 세어 맞추면 클립을 다시 뽑을 때마다 처음부터다.
 *
 * 이 파일이 하는 일:
 *   1. 클립 4개를 whisper 로 전사해 말이 시작/끝나는 지점을 잰다
 *   2. 클립마다 정해 둔 자막 카드를 그 구간에 균등 배분한다
 *   3. 클립마다 정해 둔 브롤을 남는 화면 시간에 채운다 (앞머리는 인물)
 *   4. plan-v4.json 을 쓴다
 */
import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";

import ffmpeg from "ffmpeg-static";

const DIR = path.join(process.env.HOME, "Documents/hgrs-boost/drafts/feliway");
const KEY = readFileSync(
  path.join(process.env.HOME, "Documents/hgrs-boost/.env.local"),
  "utf8",
)
  .split("\n")
  .find((l) => l.startsWith("OPENAI_API_KEY"))
  ?.split("=")
  .slice(1)
  .join("=")
  .replace(/"/g, "")
  .trim();

/** 인물이 화면에 서 있는 시간. 이보다 길면 브이로그가 되고, 짧으면 누가 말하는지 모른다 */
const FACE_SEC = 2.3;

/**
 * 클립별 설계.
 * `cards` 는 자막(8~11자), `broll` 은 그 구간에 깔 그림이다.
 * 브롤 순서가 곧 서사다 — 자동으로 섞지 않는다.
 */
const CLIPS = [
  {
    src: "sora-korean-test.mp4",
    cards: [
      { text: "이사하고 3일째인데" },
      { text: "밥을 아예 안 먹어요" },
      { text: "소리만 나면 후다닥" },
      { text: "옷장으로 숨어버리고" },
      { text: "좋아하던 숨숨집도" },
      { text: "이제 안 들어가요" },
    ],
    broll: [
      { broll: "addA.mp4", from: 0.4 },
      { broll: "addA.mp4", from: 5.0 },
      { broll: "addA.mp4", from: 9.3 },
      { broll: "raw-36s.mp4", from: 1.2 },
      { broll: "raw-36s.mp4", from: 7.2 },
    ],
  },
  {
    src: "c2.mp4",
    cards: [
      { text: "제가 데려온 건데" },
      { text: "다 제 탓 같았어요" },
      { text: "그러다 알게 된 게" },
      { text: "고양이 페로몬 디퓨저", hi: true },
      { text: "고양이가 안심할 때" },
      { text: "얼굴 비벼 남기는" },
      { text: "바로 그 표식이래요" },
    ],
    broll: [
      { broll: "raw-36s.mp4", from: 10.2 },
      { broll: "addB.mp4", from: 0.5 },
      { broll: "addB.mp4", from: 9.2 },
      { broll: "addB.mp4", from: 10.8 },
    ],
  },
  {
    src: "c3.mp4",
    cards: [
      { text: "진정제가 아니에요", hi: true },
      { text: "먹이는 것도 아니고" },
      { text: "리필 끼우기만 하면" },
      { text: "콘센트에 꽂으면 끝" },
      { text: "웅크리고 자던 애가" },
      { text: "대자로 뻗어서 자요", hi: true },
    ],
    broll: [
      { broll: "addB.mp4", from: 1.8 },
      { broll: "addB.mp4", from: 5.4 },
      { broll: "addA.mp4", from: 5.2 },
      { broll: "raw-36s.mp4", from: 16.3 }, // 대자로 뻗음 — 클라이맥스
    ],
  },
  /**
   * c4 는 숫자에서 넘어졌다 — "하나로 스물두 평 삼십 일" 을
   * "한하루 22평 31" 로 말했다. 그 문장(3.74~8.14초)만 도려내고 쓴다.
   * sora 에게 숫자를 시킬 때는 한글로 풀어 쓰는 편이 안전하다.
   */
  {
    src: "c4.mp4",
    window: [0, 3.74],
    cards: [{ text: "천 마리 넘게 실험해서" }, { text: "7일째부터 달라져요", hi: true }],
    broll: [{ broll: "raw-36s.mp4", from: 19.0 }],
  },
  {
    src: "c4.mp4",
    window: [8.14, 11.42],
    cards: [{ text: "이사·합사 앞두고 있다면" }, { text: "지금 미리 꽂아두세요" }],
    broll: [{ broll: "raw-36s.mp4", from: 34.2 }],
  },
];

/** 말이 실제로 시작하고 끝나는 지점을 잰다 */
function measure(src) {
  const wav = `/tmp/m-${path.basename(src, ".mp4")}.mp3`;
  execFileSync(ffmpeg, ["-y", "-v", "error", "-i", path.join(DIR, src), "-vn", "-ac", "1", "-ar", "16000", wav], {
    stdio: ["ignore", "ignore", "pipe"],
  });
  const raw = execFileSync(
    "curl",
    [
      "-s", "https://api.openai.com/v1/audio/transcriptions",
      "-H", `Authorization: Bearer ${KEY}`,
      "-F", `file=@${wav}`, "-F", "model=whisper-1",
      "-F", "language=ko", "-F", "response_format=verbose_json",
    ],
    { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
  );
  const d = JSON.parse(raw);
  const segs = d.segments ?? [];
  if (!segs.length) throw new Error(`${src}: 말을 못 찾았습니다`);
  return {
    start: Math.max(0, segs[0].start - 0.12),
    end: Math.min(d.duration, segs[segs.length - 1].end + 0.15),
    text: segs.map((s) => s.text.trim()).join(" "),
  };
}

const speechClips = [];
const screen = [];
const lines = [];
let track = 0;

CLIPS.forEach((c, ci) => {
  if (!existsSync(path.join(DIR, c.src))) throw new Error(`클립이 없습니다: ${c.src}`);
  // window 가 있으면 그 구간만 쓴다 — 말이 틀린 문장을 도려낼 때
  const m = c.window
    ? { start: c.window[0], end: c.window[1], text: "(구간 지정)" }
    : measure(c.src);
  const dur = m.end - m.start;
  console.log(`${c.src}  말 ${m.start.toFixed(2)}~${m.end.toFixed(2)} (${dur.toFixed(2)}초)`);
  console.log(`   "${m.text}"`);

  speechClips.push({ src: c.src, from: Number(m.start.toFixed(2)), dur: Number(dur.toFixed(2)) });

  // 자막 — 말 구간에 균등 배분
  const per = dur / c.cards.length;
  c.cards.forEach((card, i) => {
    lines.push({
      at: Number((track + i * per).toFixed(2)),
      until: Number((track + (i + 1) * per).toFixed(2)),
      text: card.text,
      ...(card.hi ? { hi: true } : {}),
    });
  });

  // 화면 — 앞머리는 인물, 나머지는 브롤을 균등하게
  const face = Math.min(FACE_SEC, dur * 0.35);
  screen.push({ clip: ci, dur: Number(face.toFixed(2)) });
  const rest = dur - face;
  const each = rest / c.broll.length;
  c.broll.forEach((b) => {
    screen.push({ broll: b.broll, from: b.from, dur: Number(each.toFixed(2)) });
  });

  track += dur;
});

const plan = {
  out: "feliway-v4.mp4",
  product: "pkg.png",
  productAt: Number((track - 3.0).toFixed(2)),
  productUntil: Number(track.toFixed(2)),
  speechClips,
  screen,
  lines,
};

writeFileSync(path.join(DIR, "plan-v4.json"), JSON.stringify(plan, null, 2), "utf8");
const cuts = screen.length;
console.log(
  `\nplan-v4.json 완성\n` +
    `  총 ${track.toFixed(1)}초 / ${cuts}컷 / 평균 ${(track / cuts).toFixed(2)}초\n` +
    `  자막 ${lines.length}장 / 인물 ${CLIPS.length}컷 · 브롤 ${cuts - CLIPS.length}컷`,
);
