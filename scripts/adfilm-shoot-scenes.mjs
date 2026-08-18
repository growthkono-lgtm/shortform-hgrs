/**
 * 씬 생성 — **길이를 나레이션에서 받아** image-to-video 로 뽑는다. (2026-08-16)
 *
 *   node --env-file=.env.local scripts/adfilm-shoot-scenes.mjs drafts/feliway/scenes-v16.json [씬번호…]
 *
 * ── 앞 판(adfilm-shoot.mjs)과 다른 점 ─────────────────────────────────
 * 컷 길이를 5초로 못 박지 않는다. 씬이 담은 **문장들의 실제 음성 길이**를 더해
 * 그만큼 생성한다. 사장님 지적 그대로다 — *"영상 길이나 컷 수에 연연하지 말고
 * 일단 들어갈 내용은 들어가야지."* 길이는 내용에서 나오는 값이지 먼저 정하는 값이 아니다.
 *
 * 소리는 넣지 않는다(`generate_audio: false`). 말은 우리 TTS 한 목소리로 얹는다 —
 * 모델이 컷마다 다른 목소리를 만들면 그 순간 광고가 아니라 오류가 된다.
 */
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";

const FAL = "https://queue.fal.run";
const ENDPOINT = "bytedance/seedance-2.0/fast/reference-to-video";
/** 상태·결과 조회는 앱 경로까지만. 모델 경로를 붙이면 405 가 온다 */
const APP = "bytedance/seedance-2.0";
const PRICE = 0.2419; // fast 티어. 82초짜리를 표준가로 뽑으면 편당 상한($25)을 넘는다
const MAX_FILM = 25;
const GAP = 0.12;

const file = process.argv[2] ?? "drafts/feliway/scenes-v16.json";
const only = process.argv.slice(3).map(Number);
const plan = JSON.parse(await readFile(file, "utf8"));
const root = path.dirname(file);
const voice = JSON.parse(await readFile(path.join(root, "voice-v16", "lines.json"), "utf8"));
const outDir = path.join(root, "scenes-v16");
await mkdir(outDir, { recursive: true });

const durOf = (n) => voice.lines.find((l) => l.n === n)?.seconds ?? 0;

/** 씬 길이 = 그 씬 문장들의 음성 길이 + 사이 간격 + 앞뒤 여유 0.5초 */
function sceneSeconds(scene) {
  const spoken = scene.lines.reduce((s, n) => s + durOf(n), 0) + GAP * (scene.lines.length - 1);
  return Math.min(15, Math.max(4, Math.ceil(spoken + 0.5)));
}

function dataUri(rel) {
  const src = path.join(root, rel);
  if (!existsSync(src)) throw new Error(`레퍼런스 없음: ${src}`);
  const tmp = path.join(os.tmpdir(), `ref-${rel.replace(/[\/]/g, "_")}.jpg`);
  spawnSync("sips", ["-Z", "720", "-s", "format", "jpeg", "-s", "formatOptions", "80", src, "--out", tmp]);
  return `data:image/jpeg;base64,${readFileSync(tmp).toString("base64")}`;
}

const scenes = plan.scenes.filter((s) => only.length === 0 || only.includes(s.no));
const totalSec = scenes.reduce((s, x) => s + sceneSeconds(x), 0);
const cost = totalSec * PRICE;
console.log(`씬 ${scenes.length}개 · ${totalSec}초 · 예상 $${cost.toFixed(2)} (편당 상한 $${MAX_FILM})`);
if (cost > MAX_FILM) {
  console.error("편당 상한 초과 — 멈춥니다");
  process.exit(1);
}

const key = process.env.FAL_KEY;
const headers = { Authorization: `Key ${key}`, "Content-Type": "application/json" };

const WHAT = (rel) =>
  rel.includes("subject") ? "the cat"
  : rel.includes("talent") && rel.includes("06-wide") ? "the room"
  : rel.includes("talent") ? "the woman"
  : "the product package";

async function submit(scene) {
  const seconds = sceneSeconds(scene);
  const refs = scene.refs.slice(0, 9);
  const refLines = refs.map((r, i) => `[Image${i + 1}] is ${WHAT(r)}.`).join(" ");

  /* 프롬프트는 움직임·카메라·시간만. 인물·배경·스타일은 레퍼런스가 갖고 있다 */
  const prompt =
    `${refLines} From start to finish over ${seconds} seconds: ${scene.action}.` +
    ` Camera: ${scene.camera}.` +
    ` The scene must clearly show: ${scene.must}.` +
    ` Keep the same subjects, same room, same lighting as the reference images.` +
    ` Natural indoor daylight, handheld phone-camera feel with almost no shake.` +
    ` No one speaks. No text or captions in the frame.`;

  const body = {
    prompt,
    resolution: "720p",
    duration: String(seconds),
    aspect_ratio: "9:16",
    generate_audio: false,
    image_urls: refs.map(dataUri),
    seed: 20260816 + scene.no,
  };

  const r = await fetch(`${FAL}/${ENDPOINT}`, { method: "POST", headers, body: JSON.stringify(body) });
  const text = await r.text();
  if (!r.ok) throw new Error(`씬 ${scene.no} 제출 실패 ${r.status}: ${text.slice(0, 250)}`);
  const { request_id } = JSON.parse(text);
  console.log(`씬 ${scene.no} 제출 · ${seconds}초 · 레퍼런스 ${refs.length}장 · ${request_id}`);
  return { scene, seconds, requestId: request_id, prompt };
}

async function poll(url) {
  const r = await fetch(url, { headers: { Authorization: `Key ${key}` } });
  const t = await r.text();
  if (!t) return { status: "IN_PROGRESS" };
  try { return JSON.parse(t); } catch { return { status: "UNPARSEABLE" }; }
}

const jobs = [];
for (const s of scenes) jobs.push(await submit(s));
await writeFile(path.join(outDir, "jobs.json"), JSON.stringify(jobs.map((j) => ({ no: j.scene.no, seconds: j.seconds, requestId: j.requestId })), null, 2));
console.log("\n생성 중…\n");

for (const job of jobs) {
  let state = "";
  for (let i = 0; i < 180; i += 1) {
    const s = await poll(`${FAL}/${APP}/requests/${job.requestId}/status`);
    state = s.status ?? "";
    if (state === "COMPLETED" || state === "FAILED") break;
    await new Promise((ok) => setTimeout(ok, 5000));
  }
  if (state !== "COMPLETED") { console.log(`씬 ${job.scene.no} 미완(${state})`); continue; }

  const out = await poll(`${FAL}/${APP}/requests/${job.requestId}`);
  const url = out?.video?.url ?? out?.videos?.[0]?.url;
  if (!url) { console.log(`씬 ${job.scene.no} 결과 없음`); continue; }
  const bin = Buffer.from(await (await fetch(url)).arrayBuffer());
  const dest = path.join(outDir, `scene${String(job.scene.no).padStart(2, "0")}.mp4`);
  await writeFile(dest, bin);
  console.log(`씬 ${job.scene.no} → ${dest} (${(bin.length / 1024 / 1024).toFixed(1)}MB)`);
}
console.log(`\n결과: ${outDir}`);
