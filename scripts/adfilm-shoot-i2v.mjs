/**
 * 확정 스틸에서 영상을 시작한다. (2026-08-18 — sora 경로를 대체)
 *
 *   node --env-file=.env.local scripts/adfilm-shoot-i2v.mjs drafts/feliway/scenes-v16.json [씬번호...]
 *
 * ── 무엇이 달라졌나 ────────────────────────────────────────────────────
 * 예전 `adfilm-shoot-sora.mjs` 는 **글로만** 영상을 뽑았다(text-to-video).
 * 레퍼런스를 넣어도 `reference-to-video` 라 이미지는 참고일 뿐이었고,
 * 모델이 컷마다 인물을 다시 그렸다. 같은 날 실측한 값이다(SSIM, 1.0=동일):
 *
 *   reference-to-video   0.642
 *   image-to-video       0.922   ← 준 프레임 그대로 시작
 *
 * 그래서 세 가지를 바꾼다.
 *
 * 1. **image_url = 확정 스틸.** 첫 프레임을 못 박는다 (인물 유지)
 * 2. **end_image_url = 다음 씬 스틸.** 컷의 끝을 다음 컷의 시작과 같게 만들어
 *    연결을 구조적으로 잇는다. 모델의 자유도가 중간 모션으로만 제한된다
 * 3. **generate_audio: false.** 중국 모델에게 한국어를 발음시키지 않는다.
 *    말은 한국어 TTS 로 따로 만들어 얹는다
 *
 * ── 길이는 대본이 정한다 ──────────────────────────────────────────────
 * 씬 길이를 5초로 미리 못 박지 않는다. voice-<태그>/lines.json 에 잰 **실제 음성
 * 길이**를 합쳐 그 초로 생성한다. Seedance 는 4~15초를 정수로 받으므로
 * 반올림만 하면 된다. "컷이 안 맞게 들어간다" 가 여기서 사라진다.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { recordSpend } from "./spend.mjs";

const planFile = process.argv[2] ?? "drafts/feliway/scenes-v16.json";
const only = process.argv.slice(3).map(Number).filter(Boolean);

const plan = JSON.parse(await readFile(planFile, "utf8"));
const root = path.dirname(planFile);
const tag = path.basename(planFile, ".json").replace(/^scenes-/, "");
const stillDir = path.join(root, `stills-${tag}`);
const outDir = path.join(root, `shots-${tag}`);
await mkdir(outDir, { recursive: true });

const voice = JSON.parse(await readFile(path.join(root, `voice-${tag}`, "lines.json"), "utf8"));
const durOf = (n) => voice.lines.find((l) => l.n === n)?.seconds ?? 0;
const GAP = 0.12;

const key = process.env.FAL_KEY;
const auth = { Authorization: `Key ${key}` };
const jsonAuth = { ...auth, "Content-Type": "application/json" };
const QUEUE = "https://queue.fal.run";
/** fast 720p. 명세서 §7-3 기준 $0.2419/s */
const MODEL = "bytedance/seedance-2.0/fast/image-to-video";

const balance = async () =>
  Number(await (await fetch("https://rest.alpha.fal.ai/billing/user_balance", { headers: auth })).text());

const uploaded = new Map();
async function upload(full) {
  if (uploaded.has(full)) return uploaded.get(full);
  if (!existsSync(full)) throw new Error(`스틸 없음: ${full}`);
  const init = await fetch(
    "https://rest.alpha.fal.ai/storage/upload/initiate?storage_type=fal-cdn-v3",
    {
      method: "POST",
      headers: jsonAuth,
      body: JSON.stringify({ content_type: "image/png", file_name: path.basename(full) }),
    },
  );
  if (!init.ok) throw new Error(`업로드 준비 실패 ${init.status}`);
  const { file_url, upload_url } = await init.json();
  const put = await fetch(upload_url, {
    method: "PUT",
    headers: { "Content-Type": "image/png" },
    body: readFileSync(full),
  });
  if (!put.ok) throw new Error(`업로드 실패 ${put.status}`);
  uploaded.set(full, file_url);
  return file_url;
}

const stillOf = (no) => path.join(stillDir, `scene${String(no).padStart(2, "0")}.png`);

/**
 * 씬 길이 — 대사 실측 합 + 문장 간격. Seedance 는 4~15초 정수만 받는다.
 * 올림한다. 모자란 것보다 남는 편이 낫다 — 남으면 편집에서 자르면 되지만
 * 모자라면 말이 잘린다.
 */
function secondsFor(scene) {
  const raw = scene.lines.reduce((a, n) => a + durOf(n), 0) + GAP * (scene.lines.length - 1);
  return Math.min(15, Math.max(4, Math.ceil(raw)));
}

/**
 * 영상 프롬프트 — **움직임만** 적는다.
 *
 * 생김새·구도·공간은 이미 첫 프레임이 정했다. 여기서 또 묘사하면 모델이
 * 그 묘사대로 다시 그리려 들어 첫 프레임과 싸운다. 카메라와 동작만 남긴다.
 */
function motionPrompt(scene) {
  return [
    `이 화면에서 시작한다. 등장하는 인물·동물·제품·공간을 바꾸지 않는다.`,
    `카메라: ${scene.camera}`,
    `움직임: ${scene.action}`,
    `실사 촬영본처럼 자연스러운 속도로. 화면에 글자·자막·로고를 넣지 않는다.`,
  ].join("\n");
}

async function shoot(scene, nextScene) {
  const seconds = secondsFor(scene);
  const first = await upload(stillOf(scene.no));
  /* 마지막 씬은 이어붙일 다음이 없다 */
  const last = nextScene && existsSync(stillOf(nextScene.no))
    ? await upload(stillOf(nextScene.no))
    : null;

  const before = await balance();
  const body = {
    prompt: motionPrompt(scene),
    image_url: first,
    resolution: "720p",
    duration: String(seconds),
    generate_audio: false,
  };
  if (last) body.end_image_url = last;

  const q = await fetch(`${QUEUE}/${MODEL}`, {
    method: "POST", headers: jsonAuth, body: JSON.stringify(body),
  });
  const job = await q.json();
  if (!q.ok || !job.request_id) throw new Error(`큐 실패 ${q.status}: ${JSON.stringify(job).slice(0, 300)}`);

  const statusUrl = job.status_url ?? `${QUEUE}/${MODEL}/requests/${job.request_id}/status`;
  const responseUrl = job.response_url ?? `${QUEUE}/${MODEL}/requests/${job.request_id}`;

  const started = Date.now();
  let status = "";
  while (status !== "COMPLETED") {
    await new Promise((r) => setTimeout(r, 5000));
    const s = await (await fetch(statusUrl, { headers: auth })).json();
    status = s.status;
    process.stdout.write(`\r  씬${String(scene.no).padStart(2, "0")} ${seconds}초 ${status} ${Math.round((Date.now() - started) / 1000)}s    `);
    if (status === "FAILED") throw new Error(`\n씬 ${scene.no} 실패: ${JSON.stringify(s).slice(0, 300)}`);
    if (Date.now() - started > 900_000) throw new Error("\n15분 초과");
  }

  const res = await (await fetch(responseUrl, { headers: auth })).json();
  const url = res.video?.url;
  if (!url) throw new Error(`응답에 영상이 없음: ${JSON.stringify(res).slice(0, 300)}`);

  const dest = path.join(outDir, `scene${String(scene.no).padStart(2, "0")}.mp4`);
  await writeFile(dest, Buffer.from(await (await fetch(url)).arrayBuffer()));

  const after = await balance();
  const spent = before - after;
  console.log(`\r  씬${String(scene.no).padStart(2, "0")} ${seconds}초 → ${path.basename(dest)} · $${spent.toFixed(3)} · 체인 ${last ? "O" : "—"}     `);

  await recordSpend("fal", "video", `${tag}/scene${scene.no}`, spent, {
    model: MODEL, seconds, chained: Boolean(last), seed: res.seed ?? null,
  });
  return { dest, spent, seconds };
}

/* ── 실행 ─────────────────────────────────────────────────────────── */
const all = plan.scenes;
const targets = all.filter((s) => !only.length || only.includes(s.no));
const totalSec = targets.reduce((a, s) => a + secondsFor(s), 0);

console.log(`i2v ${targets.length}씬 · 총 ${totalSec}초 · 예상 $${(totalSec * 0.2419).toFixed(2)}`);
console.log(`잔액 $${(await balance()).toFixed(2)}\n`);

let total = 0;
for (const scene of targets) {
  const next = all.find((s) => s.no === scene.no + 1);
  const dest = path.join(outDir, `scene${String(scene.no).padStart(2, "0")}.mp4`);
  if (existsSync(dest) && !only.length) {
    console.log(`  씬${String(scene.no).padStart(2, "0")} 건너뜀 (이미 있음)`);
    continue;
  }
  try {
    const r = await shoot(scene, next);
    total += r.spent;
  } catch (e) {
    console.error(`\n  씬${scene.no} — ${String(e.message).slice(0, 200)}`);
  }
}

console.log(`\n합계 $${total.toFixed(2)} · 잔액 $${(await balance()).toFixed(2)}`);
console.log(`  ${outDir}`);
