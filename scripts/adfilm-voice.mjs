/**
 * 나레이션 — ElevenLabs(fal 경유). 만들고 **길이를 잰다.** (2026-08-19)
 *
 *   node --env-file=.env.local scripts/adfilm-voice.mjs drafts/feliway/concept-v17.json
 *
 * ── 왜 벤더를 바꿨나 ───────────────────────────────────────────────────
 * 사장님: *"여전히 약간 중국어스럽게 들리는 부분이 있어."*
 *
 * 모델 내장 오디오는 이미 껐다. 남은 건 우리 TTS 였다. OpenAI·ElevenLabs·
 * MiniMax 를 같은 문장으로 돌려 whisper 로 재 봤더니 **문자 일치율이 셋 다
 * 95.6% 로 같았다** — 지표가 포화됐다. 알아듣기는 하는데 억양이 어색한 것은
 * whisper 가 못 잡는다(계층3). 그래서 사장님이 듣고 고르셨고, ElevenLabs 다.
 *
 * ── whisper 는 여전히 돌린다 ──────────────────────────────────────────
 * 고르는 데는 못 써도 **사고를 잡는 데는 쓴다.** 브랜드명이 '텔리웨이'로 나오면
 * 그건 넘길 수 없는 결함이고, 그건 whisper 가 잡는다.
 *
 * 씬 길이는 이 파일이 잰 실제 음성 길이에서 나온다. 5초로 미리 못 박지 않는다.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

import ffmpeg from "ffmpeg-static";

import { recordSpend } from "./spend.mjs";

const planFile = process.argv[2] ?? "drafts/feliway/concept-v17.json";
const plan = JSON.parse(await readFile(planFile, "utf8"));
const root = path.dirname(planFile);
const tag = path.basename(planFile, ".json").replace(/^concept-/, "");
const outDir = path.join(root, `voice-${tag}`);
await mkdir(outDir, { recursive: true });

const key = process.env.FAL_KEY;
const auth = { Authorization: `Key ${key}` };
const jsonAuth = { ...auth, "Content-Type": "application/json" };
const QUEUE = "https://queue.fal.run";
const MODEL = "fal-ai/elevenlabs/tts/multilingual-v2";

/** 한 화자다. 컷마다 목소리가 바뀌면 그 순간 광고가 아니라 오류가 된다 */
const VOICE = process.env.ADFILM_TTS_VOICE ?? "Rachel";
/**
 * 말 속도. 규격 밀도는 8.5자/초인데 실측은 어느 벤더도 6.5 언저리다.
 * 1.15 는 또박또박함을 지키는 상한으로 잡았다 — 더 올리면 받침이 뭉개진다.
 */
const SPEED = Number(process.env.ADFILM_TTS_SPEED ?? 1.15);
const GAP = 0.12;

const balance = async () =>
  Number(await (await fetch("https://rest.alpha.fal.ai/billing/user_balance", { headers: auth })).text());

async function speak(text, file) {
  const q = await fetch(`${QUEUE}/${MODEL}`, {
    method: "POST",
    headers: jsonAuth,
    body: JSON.stringify({
      text,
      language_code: "ko",
      stability: 0.5,
      similarity_boost: 0.75,
      speed: SPEED,
      voice: VOICE,
    }),
  });
  const job = await q.json();
  if (!q.ok || !job.request_id) throw new Error(`${q.status} ${JSON.stringify(job).slice(0, 200)}`);
  const statusUrl = job.status_url ?? `${QUEUE}/${MODEL}/requests/${job.request_id}/status`;
  const responseUrl = job.response_url ?? `${QUEUE}/${MODEL}/requests/${job.request_id}`;
  const started = Date.now();
  let status = "";
  while (status !== "COMPLETED") {
    await new Promise((r) => setTimeout(r, 2000));
    const s = await (await fetch(statusUrl, { headers: auth })).json();
    status = s.status;
    if (status === "FAILED") throw new Error(`실패: ${JSON.stringify(s).slice(0, 200)}`);
    if (Date.now() - started > 300_000) throw new Error("5분 초과");
  }
  const res = await (await fetch(responseUrl, { headers: auth })).json();
  const url = res.audio?.url;
  if (!url) throw new Error(`오디오 없음: ${JSON.stringify(res).slice(0, 200)}`);
  writeFileSync(file, Buffer.from(await (await fetch(url)).arrayBuffer()));
}

const seconds = (f) => {
  const out = spawnSync(ffmpeg, ["-hide_banner", "-i", f], { encoding: "utf8" }).stderr || "";
  const m = out.match(/Duration: (\d+):(\d+):([\d.]+)/);
  return m ? +(+m[1] * 3600 + +m[2] * 60 + +m[3]).toFixed(2) : 0;
};

const norm = (t) => t.replace(/[^가-힣0-9a-zA-Z]/g, "");
async function heard(file) {
  const fd = new FormData();
  fd.append("file", new Blob([readFileSync(file)]), path.basename(file));
  fd.append("model", "whisper-1");
  fd.append("language", "ko");
  const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: fd,
  });
  return ((await r.json()).text ?? "").trim();
}

/** 넘길 수 없는 사고만 본다 — 브랜드명·제품명 오발음 */
const CRITICAL = ["펠리웨이"];

/* ── 실행 — 문장을 **동시에** 뽑는다 ────────────────────────────────── */
const lines = plan.통대본;
const before = await balance();
console.log(`${lines.length}문장 · ElevenLabs · ${VOICE} · 속도 ${SPEED}\n`);

const results = await Promise.all(
  lines.map(async (l) => {
    const file = path.join(outDir, `line${String(l.n).padStart(2, "0")}.mp3`);
    if (!existsSync(file)) await speak(l.line, file);
    return { n: l.n, text: l.line, file, seconds: seconds(file) };
  }),
);
results.sort((a, b) => a.n - b.n);

/* 검증도 동시에 */
const checks = await Promise.all(
  results.map(async (r) => ({ n: r.n, said: await heard(r.file) })),
);
const bad = [];
for (const c of checks) {
  const r = results.find((x) => x.n === c.n);
  for (const w of CRITICAL) {
    if (r.text.includes(w) && !norm(c.said).includes(norm(w))) {
      bad.push(`${r.n}번 "${w}" → "${c.said.slice(0, 40)}"`);
    }
  }
}

const total = results.reduce((a, r) => a + r.seconds, 0) + GAP * (results.length - 1);
await writeFile(
  path.join(outDir, "lines.json"),
  JSON.stringify({ voice: VOICE, speed: SPEED, model: MODEL, // 조립기는 `line` 으로 읽는다. 키 이름을 다르게 쓰면 조용히 깨진다
      lines: results.map(({ n, seconds, text }) => ({ n, seconds, line: text, text })) }, null, 2) + "\n",
);

const after = await balance();
const spent = before - after;
if (spent > 0) await recordSpend("fal", "audio", `${tag}/narration`, spent, { model: MODEL, voice: VOICE, lines: results.length });

for (const r of results) console.log(`  ${String(r.n).padStart(2)} ${r.seconds.toFixed(2)}s  ${r.text.slice(0, 42)}`);
console.log(`\n총 ${total.toFixed(1)}초 · ${(results.reduce((a, r) => a + r.text.replace(/\s/g, "").length, 0) / total).toFixed(1)}자/초 · $${spent.toFixed(3)}`);
console.log(bad.length ? `\n❌ 브랜드명 오발음 ${bad.length}건\n  ${bad.join("\n  ")}` : `\n✅ 브랜드명 발음 정상`);
