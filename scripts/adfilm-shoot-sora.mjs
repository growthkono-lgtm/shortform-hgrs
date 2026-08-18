/**
 * 씬 생성 (OpenAI sora-2) — **레퍼런스 이미지를 넣는 경로.** (2026-08-16)
 *
 *   node --env-file=.env.local scripts/adfilm-shoot-sora.mjs drafts/feliway/scenes-v16.json [씬번호…]
 *
 * ── 왜 sora 로 돌아왔나 ───────────────────────────────────────────────
 * fal 잔액이 소진돼 Seedance 경로가 막혔다(403 Exhausted balance). 그런데
 * **sora-2 도 `input_reference` 로 이미지를 받는다** — 우리가 3번 정거장에서
 * 확정한 캐릭터 시트를 그대로 넣을 수 있다. v10 이 무너진 건 sora 가 나빠서가
 * 아니라 **텍스트만 주고 만들었기 때문**이었다. 같은 모델도 레퍼런스를 주면 다르다.
 *
 * 단가도 싸다 — $0.10/초. Seedance fast($0.2419)의 절반 이하다.
 * 다만 2026-09-24 에 API 가 삭제된다. 그 전에 다시 갈아타야 한다.
 *
 * ⚠️ 레퍼런스 이미지는 **요청 해상도와 정확히 같아야** 한다(720x1280).
 * 안 맞으면 "Inpaint image must match the requested width and height" 가 온다.
 */
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";

import { recordSpend } from "./spend.mjs";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";

import ffmpeg from "ffmpeg-static";

const MODEL = "sora-2";
const SIZE = "720x1280";
const PRICE = 0.1; // $/초
const MAX_FILM = 25;
const GAP = 0.12;
/** sora 는 4·8·12초만 받는다 */
const ALLOWED = [4, 8, 12];

const file = process.argv[2] ?? "drafts/feliway/scenes-v16.json";
const only = process.argv.slice(3).map(Number);
const plan = JSON.parse(await readFile(file, "utf8"));
const root = path.dirname(file);
const voice = JSON.parse(await readFile(path.join(root, "voice-v16", "lines.json"), "utf8"));
const outDir = path.join(root, "scenes-v16");
await mkdir(outDir, { recursive: true });

const key = process.env.OPENAI_API_KEY;
const auth = { Authorization: `Bearer ${key}` };
const durOf = (n) => voice.lines.find((l) => l.n === n)?.seconds ?? 0;

/** 씬 길이 = 그 씬 대사의 실제 음성 길이. sora 가 받는 값으로 올림한다 */
export function sceneSeconds(scene) {
  const spoken = scene.lines.reduce((s, n) => s + durOf(n), 0) + GAP * (scene.lines.length - 1);
  return ALLOWED.find((v) => v >= spoken + 0.4) ?? 12;
}

/** 레퍼런스를 정확히 720x1280 으로 맞춘다 */
function refJpeg(rel, tag) {
  const src = path.join(root, rel);
  if (!existsSync(src)) throw new Error(`레퍼런스 없음: ${src}`);
  const dst = path.join(os.tmpdir(), `sref-${tag}.jpg`);
  spawnSync(
    ffmpeg,
    ["-y", "-i", src, "-vf", `scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280`, dst],
    { stdio: "ignore" },
  );
  return dst;
}

const scenes = plan.scenes.filter((s) => only.length === 0 || only.includes(s.no));
const totalSec = scenes.reduce((s, x) => s + sceneSeconds(x), 0);
console.log(`씬 ${scenes.length}개 · ${totalSec}초 · 예상 $${(totalSec * PRICE).toFixed(2)} (상한 $${MAX_FILM})`);
if (totalSec * PRICE > MAX_FILM) {
  console.error("편당 상한 초과 — 멈춥니다");
  process.exit(1);
}

async function submit(scene) {
  const seconds = sceneSeconds(scene);
  /**
   * sora 는 레퍼런스를 **한 장**만 받는다. 그 씬의 주인공 한 장을 고른다 —
   * 고양이 씬이면 고양이, 사람 씬이면 사람, 공간 씬이면 공간.
   */
  const ref = refJpeg(scene.refs[0], `s${scene.no}`);

  /* 프롬프트는 움직임·카메라·담을 것. 인물·배경·스타일은 레퍼런스가 갖고 있다 */
  const prompt =
    `Use the reference image as the exact subject, room and lighting.` +
    ` Over ${seconds} seconds: ${scene.action}.` +
    ` Camera: ${scene.camera}.` +
    ` Must be clearly visible: ${scene.must}.` +
    ` Natural indoor daylight, handheld phone-camera look with almost no shake.` +
    ` Nobody speaks, no dialogue, no on-screen text.`;

  const fd = new FormData();
  fd.append("model", MODEL);
  fd.append("prompt", prompt);
  fd.append("seconds", String(seconds));
  fd.append("size", SIZE);
  fd.append("input_reference", new Blob([readFileSync(ref)], { type: "image/jpeg" }), "ref.jpg");

  const r = await fetch("https://api.openai.com/v1/videos", { method: "POST", headers: auth, body: fd });
  const j = await r.json();
  if (!r.ok || !j.id) throw new Error(`씬 ${scene.no} 제출 실패: ${JSON.stringify(j).slice(0, 250)}`);
  console.log(`씬 ${scene.no} 제출 · ${seconds}초 · ${path.basename(scene.refs[0])} · ${j.id}`);
  return { no: scene.no, seconds, id: j.id };
}

const jobs = [];
for (const s of scenes) {
  try {
    jobs.push(await submit(s));
  } catch (e) {
    console.log(String(e.message).slice(0, 200));
  }
}
await writeFile(path.join(outDir, "sora-jobs.json"), JSON.stringify(jobs, null, 2));
console.log("\n생성 중… 씬당 1~3분\n");

for (const job of jobs) {
  let status = "";
  for (let i = 0; i < 200; i += 1) {
    const r = await fetch(`https://api.openai.com/v1/videos/${job.id}`, { headers: auth });
    const j = await r.json();
    status = j.status;
    if (status === "completed" || status === "failed") {
      if (status === "failed") console.log(`씬 ${job.no} 실패: ${JSON.stringify(j.error ?? {}).slice(0, 200)}`);
      break;
    }
    await new Promise((ok) => setTimeout(ok, 5000));
  }
  if (status !== "completed") continue;

  const r = await fetch(`https://api.openai.com/v1/videos/${job.id}/content`, { headers: auth });
  const bin = Buffer.from(await r.arrayBuffer());
  const dest = path.join(outDir, `scene${String(job.no).padStart(2, "0")}.mp4`);
  await writeFile(dest, bin);
  console.log(`씬 ${job.no} → ${dest} (${(bin.length / 1024 / 1024).toFixed(1)}MB)`);

  /**
   * sora-2 는 **초당 과금**이다. 720p $0.10/초 (2026-08-18 공시 확인).
   * 받은 씬만 적는다 — 실패한 씬은 과금되지 않는다.
   */
  await recordSpend("openai", "video", `${path.basename(root)}/scene${String(job.no).padStart(2, "0")}`, job.seconds * PRICE, {
    model: MODEL,
    size: SIZE,
    seconds: job.seconds,
    pricePerSecond: PRICE,
    videoId: job.id,
  });
}
console.log(`\n결과: ${outDir}`);
