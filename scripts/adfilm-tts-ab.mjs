/**
 * 한국어 TTS 벤더 A/B — 귀가 아니라 whisper 로 고른다. (2026-08-18)
 *
 *   node --env-file=.env.local scripts/adfilm-tts-ab.mjs
 *
 * ── 왜 필요한가 ────────────────────────────────────────────────────────
 * 사장님 지적: *"나레이션 발음 틀리고 중국어처럼 어눌하고 끊긴다."*
 *
 * 원인 둘 중 하나(모델 내장 오디오)는 `generate_audio: false` 로 닫았다.
 * 남은 하나는 우리 TTS 다. OpenAI `gpt-4o-mini-tts` 를 속도별로 재 봤더니
 * 1.0~1.6 어디서도 문자 일치율이 95% 언저리를 못 넘었고 밀도는 6.4자/초로
 * 규격(8.5)에 못 미쳤다. **속도 문제가 아니라 한국어 한계**였다.
 *
 * 수퍼톤을 붙이려다 결제가 막혀서, fal 에 올라온 벤더들로 돌린다.
 * 계정을 안 늘려도 되고 엔드포인트 한 줄만 바꾸면 갈아탈 수 있다.
 *
 * ── 판정 기준 ──────────────────────────────────────────────────────────
 * 문자 일치율(whisper 역검증) 과 밀도(자/초) 둘 다 본다. 하나만 보면 속는다 —
 * 느리게 읽으면 정확도는 오르지만 "공백 없는 속도감" 이라는 규격을 깬다.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

import ffmpeg from "ffmpeg-static";

import { recordSpend } from "./spend.mjs";

const OUT = "drafts/feliway/tts-ab";
mkdirSync(OUT, { recursive: true });

const key = process.env.FAL_KEY;
const auth = { Authorization: `Key ${key}` };
const jsonAuth = { ...auth, "Content-Type": "application/json" };
const QUEUE = "https://queue.fal.run";

/** v16 대본에서 발음이 까다로운 세 문장 — 숫자·외래어·받침 */
const LINES = [
  "스크래처를 사 줘도 벽지만 긁는 이유가 있습니다",
  "고양이가 스스로 안정됐다고 느끼는 신호를 만들어 주는 겁니다",
  "삼십 일 동안 꽂아 두기만 하면 됩니다",
];

/**
 * 후보. 한국어를 지원한다고 공시된 것만 넣었다.
 * `body` 는 벤더마다 필드가 다르므로 함수로 만든다.
 */
const VENDORS = [
  {
    name: "elevenlabs-v2",
    endpoint: "fal-ai/elevenlabs/tts/multilingual-v2",
    body: (text) => ({ text, language_code: "ko", stability: 0.5, similarity_boost: 0.75, speed: 1.1 }),
    pick: (r) => r.audio?.url,
  },
  {
    name: "minimax",
    endpoint: "fal-ai/minimax/speech-02-hd",
    body: (text) => ({ text, voice_setting: { speed: 1.1, voice_id: "Korean_SweetGirl" } }),
    pick: (r) => r.audio?.url,
  },
  {
    name: "gemini-tts",
    endpoint: "fal-ai/gemini-tts",
    body: (text) => ({ text }),
    pick: (r) => r.audio?.url,
  },
];

const balance = async () =>
  Number(await (await fetch("https://rest.alpha.fal.ai/billing/user_balance", { headers: auth })).text());

async function speak(vendor, text, file) {
  const q = await fetch(`${QUEUE}/${vendor.endpoint}`, {
    method: "POST", headers: jsonAuth, body: JSON.stringify(vendor.body(text)),
  });
  const job = await q.json();
  if (!q.ok || !job.request_id) throw new Error(`${q.status} ${JSON.stringify(job).slice(0, 200)}`);
  const statusUrl = job.status_url ?? `${QUEUE}/${vendor.endpoint}/requests/${job.request_id}/status`;
  const responseUrl = job.response_url ?? `${QUEUE}/${vendor.endpoint}/requests/${job.request_id}`;

  const started = Date.now();
  let status = "";
  while (status !== "COMPLETED") {
    await new Promise((r) => setTimeout(r, 2500));
    const s = await (await fetch(statusUrl, { headers: auth })).json();
    status = s.status;
    if (status === "FAILED") throw new Error(`실패: ${JSON.stringify(s).slice(0, 200)}`);
    if (Date.now() - started > 300_000) throw new Error("5분 초과");
  }
  const res = await (await fetch(responseUrl, { headers: auth })).json();
  const url = vendor.pick(res);
  if (!url) throw new Error(`오디오 없음: ${JSON.stringify(res).slice(0, 200)}`);
  writeFileSync(file, Buffer.from(await (await fetch(url)).arrayBuffer()));
}

/* ── whisper 역검증 (OpenAI) ────────────────────────────────────────── */
const norm = (t) => t.replace(/[^가-힣0-9a-zA-Z]/g, "");
async function stt(file) {
  const fd = new FormData();
  const { readFileSync } = await import("node:fs");
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

/** 문자 단위 유사도 — 띄어쓰기는 발음 문제가 아니다 */
function accuracy(orig, heard) {
  const a = norm(orig), b = norm(heard);
  if (!a.length) return 0;
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return 1 - dp[a.length][b.length] / Math.max(a.length, b.length);
}

const dur = (f) => {
  const p = spawnSync(ffmpeg, ["-hide_banner", "-i", f], { encoding: "utf8" });
  const m = (p.stderr || "").match(/Duration: (\d+):(\d+):([\d.]+)/);
  return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : 0;
};

/* ── 실행 ─────────────────────────────────────────────────────────── */
const rows = [];
for (const v of VENDORS) {
  const before = await balance();
  let acc = 0, chars = 0, secs = 0;
  const misses = [];
  let failed = null;
  for (let i = 0; i < LINES.length; i++) {
    const f = path.join(OUT, `${v.name}-${i}.mp3`);
    try {
      await speak(v, LINES[i], f);
      const heard = await stt(f);
      const a = accuracy(LINES[i], heard);
      acc += a; chars += LINES[i].replace(/\s/g, "").length; secs += dur(f);
      if (a < 0.99) misses.push(`"${heard.slice(0, 34)}"`);
    } catch (e) {
      failed = String(e.message).slice(0, 90);
      break;
    }
  }
  const after = await balance();
  const spent = before - after;
  if (spent > 0) await recordSpend("fal", "audio", `tts-ab/${v.name}`, spent, { endpoint: v.endpoint });

  rows.push(failed
    ? { 벤더: v.name, "문자 일치율": "—", "밀도(자/초)": "—", 비용: "—", 비고: failed }
    : {
        벤더: v.name,
        "문자 일치율": (acc / LINES.length * 100).toFixed(1) + "%",
        "밀도(자/초)": (chars / secs).toFixed(1),
        비용: "$" + spent.toFixed(3),
        비고: misses.join(" / ").slice(0, 44) || "—",
      });
  console.log(`  ${v.name} 완료`);
}

/* 비교 기준선 — 지금 쓰는 것 */
rows.push({ 벤더: "openai-tts (현행)", "문자 일치율": "95.6%", "밀도(자/초)": "6.4", 비용: "—", 비고: "speed 1.6 실측" });

console.table(rows);
console.log("\n규격 밀도 8.5자/초 · 반려 기준 문자 일치율 95% 미만");
console.log(`샘플: ${OUT}`);
