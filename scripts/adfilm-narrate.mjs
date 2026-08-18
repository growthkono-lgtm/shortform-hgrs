/**
 * 나레이션 — 대본 문장을 음성으로 만들고 **길이를 잰다.** (2026-08-16)
 *
 *   node --env-file=.env.local scripts/adfilm-narrate.mjs drafts/feliway/concept-v16.json
 *
 * ── 왜 목소리를 따로 만드는가 ──────────────────────────────────────────
 * 영상 모델이 직접 말하게 하면 컷마다 목소리가 달라진다. 한 편 안에서 화자가
 * 바뀌면 그 순간 광고가 아니라 오류가 된다. 그래서 **말은 우리가 만들고**
 * 화면에서는 아무도 입을 움직이지 않게 한다(보호자 시점형·voiceover).
 * 립싱크 실패 지점이 통째로 사라진다.
 *
 * ── 왜 whisper 로 되받아쓰는가 ────────────────────────────────────────
 * 사장님 지적(2026-08-14): *"나레이션하는 사람 외국인이야? 한국말이 어눌해."*
 * 그때 만든 검증을 그대로 쓴다 — 뽑은 음성을 whisper 로 받아써서 원문과 대조한다.
 * 발음이 뭉개지면 whisper 가 틀리게 듣는다. 귀로 고르지 않는다.
 *
 * 씬 길이는 이 파일이 잰 **실제 음성 길이**에서 나온다. 5초로 미리 못 박지 않는다.
 */
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import ffmpeg from "ffmpeg-static";

const VOICE = "sage"; // nova 는 탈락(발음 뭉갬). coral·sage·marin 이 통과했다
const MODEL = "gpt-4o-mini-tts";
const GAP = 0.12; // 문장 사이 간격 — NARRATION.gapSeconds
/**
 * 말 속도. 기본값 그대로 뽑으면 **4.9자/초**가 나왔다 — 우리 규격(8.5자/초)의 절반이고,
 * 사장님이 말한 "사운드의 공백이 거의 없는 속도감" 과 정반대다. 623자 대본이 128초가 됐다.
 * 1.6 배로 올리면 7.8자/초 언저리가 된다. 더 올리면 또박또박함이 무너진다.
 */
const SPEED = 1.6;

const planFile = process.argv[2] ?? "drafts/feliway/concept-v16.json";
const plan = JSON.parse(await readFile(planFile, "utf8"));
const root = path.dirname(planFile);
const outDir = path.join(root, "voice-v16");
await mkdir(outDir, { recursive: true });

const key = process.env.OPENAI_API_KEY;
const auth = { Authorization: `Bearer ${key}` };

async function tts(text, file) {
  const r = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      voice: VOICE,
      input: text,
      response_format: "mp3",
      speed: SPEED,
      instructions:
        "한국어 구어체로, 친구에게 자기 경험을 얘기하듯 담백하게. 광고 성우 톤을 쓰지 말고 또박또박. 문장 끝을 흐리지 않는다.",
    }),
  });
  if (!r.ok) throw new Error(`TTS 실패 ${r.status}: ${(await r.text()).slice(0, 200)}`);
  await writeFile(file, Buffer.from(await r.arrayBuffer()));
}

async function transcribe(file) {
  const fd = new FormData();
  fd.append("file", new Blob([readFileSync(file)], { type: "audio/mpeg" }), path.basename(file));
  fd.append("model", "whisper-1");
  fd.append("language", "ko");
  const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: auth,
    body: fd,
  });
  const j = await r.json();
  return (j.text ?? "").trim();
}

/**
 * 비교용 정규화.
 *
 * whisper 는 **들은 소리를 자기 표기로** 적는다. "삼만 오천" 을 "35,000" 으로,
 * "앉더라고요" 를 "앉더라구요" 로 적는 건 발음이 틀린 게 아니다. 그런 걸 실패로
 * 세면 진짜 뭉갬(‘대조군’→‘개조근’)이 묻힌다. 표기 차이는 지우고 소리만 남긴다.
 */
const NUM = { 영: "0", 일: "1", 이: "2", 삼: "3", 사: "4", 오: "5", 육: "6", 칠: "7", 팔: "8", 구: "9" };
const norm = (s) =>
  s
    .replace(/[\s.,!?~…"'·]/g, "")
    .replace(/[0-9,]+/g, (m) => m.replace(/[,0]/g, ""))
    .replace(/구요$/g, "고요")
    .replace(/마흔|서른|스물|이십오|이십|열|만|천|백|십|개월|년째|년|원대|원|퍼센트|%|개|나라/g, "")
    .replace(/[0-9]/g, "")
    .replace(new RegExp(`[${Object.keys(NUM).join("")}]`, "g"), "");

/** 글자 겹침 비율 — 1.0 이면 완전히 같다 */
function similarity(a, b) {
  if (!a || !b) return 0;
  const long = a.length >= b.length ? a : b;
  const short = a.length >= b.length ? b : a;
  let hit = 0;
  const pool = [...short];
  for (const ch of long) {
    const i = pool.indexOf(ch);
    if (i >= 0) { hit += 1; pool.splice(i, 1); }
  }
  return hit / long.length;
}

const result = [];
for (const l of plan.통대본) {
  const file = path.join(outDir, `line${String(l.n).padStart(2, "0")}.mp3`);
  if (!existsSync(file)) await tts(l.line, file);

  // 길이: ffmpeg 는 성공해도 정보를 **stderr** 로 뱉는다. 성공/실패 양쪽에서 읽는다
  // ⚠️ execFileSync 는 **성공하면 stderr 를 못 준다.** ffmpeg 는 성공해도 정보를
  // stderr 로 뱉으므로 spawnSync 로 받아야 한다. 이걸 몰라 길이가 전부 0 으로 찍혔다
  const probe = spawnSync(ffmpeg, ["-hide_banner", "-i", file, "-f", "null", "-"], {
    encoding: "utf8",
  });
  const m = `${probe.stderr ?? ""}`.match(/Duration: (\d+):(\d+):([\d.]+)/);
  const dur = m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : 0;

  const heard = await transcribe(file);
  const score = similarity(norm(heard), norm(l.line));
  const ok = score >= 0.92;
  result.push({ n: l.n, line: l.line, file: path.basename(file), seconds: dur, heard, score, ok });
  console.log(
    `${String(l.n).padStart(2)} ${ok ? "✅" : "❌"} ${dur.toFixed(2)}s  ${(score * 100).toFixed(0)}%  ${l.line}`,
  );
  if (!ok) console.log(`     들린 것: ${heard}`);
}

await writeFile(path.join(outDir, "lines.json"), JSON.stringify({ voice: VOICE, gap: GAP, lines: result }, null, 2));

const total = result.reduce((s, r) => s + r.seconds, 0) + GAP * (result.length - 1);
const bad = result.filter((r) => !r.ok);
console.log(`\n합계 ${total.toFixed(1)}초 · 문장 ${result.length}개 · 발음 불일치 ${bad.length}건`);
console.log(`저장: ${outDir}`);
