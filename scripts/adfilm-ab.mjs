/**
 * A/B 대조 — 우리가 API 를 잘못 쓰고 있었는지 $1.5 로 판정한다. (2026-08-18)
 *
 *   node --env-file=.env.local scripts/adfilm-ab.mjs <스틸경로> "<프롬프트>" [초]
 *
 * ── 왜 이걸 먼저 하나 ─────────────────────────────────────────────────
 * 사장님이 겪은 세 가지 — 발음이 중국어처럼 어눌하다 / 컷 간 연결이 어색하다 /
 * **이미지를 먼저 만들었는데도 인물이 달라진다** — 의 원인으로 코드에서
 * 두 줄을 지목했다.
 *
 *   lib/adfilm-gen.ts:164   레퍼런스가 있으면 reference-to-video 로 간다
 *   lib/adfilm-gen.ts:178   generate_audio: true
 *
 * reference-to-video 에서 이미지는 **참고**다. 모델이 인물을 매번 다시 그린다.
 * image-to-video 의 `image_url` 은 **그 이미지가 1번 프레임 그 자체**다.
 * 그리고 generate_audio 는 중국 모델에게 한국어를 발음시킨다.
 *
 * 지목이 맞으면 B 가 스틸의 인물을 그대로 유지하고 오디오가 없어야 한다.
 * 틀리면 모델을 바꿔야 하는 것이고, 그것도 $1.5 에 알게 된다.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

import { recordSpend } from "./spend.mjs";

const [still, prompt, secondsArg = "5"] = process.argv.slice(2);
if (!still || !prompt) {
  console.error('사용법: adfilm-ab.mjs <스틸경로> "<프롬프트>" [초]');
  process.exit(1);
}
const seconds = Number(secondsArg);
const outDir = path.join(path.dirname(still), "ab-out");
mkdirSync(outDir, { recursive: true });

const key = process.env.FAL_KEY;
const auth = { Authorization: `Key ${key}` };
const jsonAuth = { ...auth, "Content-Type": "application/json" };
const QUEUE = "https://queue.fal.run";

const balance = async () =>
  Number(await (await fetch("https://rest.alpha.fal.ai/billing/user_balance", { headers: auth })).text());

async function upload(file) {
  if (!existsSync(file)) throw new Error(`파일 없음: ${file}`);
  const init = await fetch(
    "https://rest.alpha.fal.ai/storage/upload/initiate?storage_type=fal-cdn-v3",
    {
      method: "POST",
      headers: jsonAuth,
      body: JSON.stringify({ content_type: "image/png", file_name: path.basename(file) }),
    },
  );
  if (!init.ok) throw new Error(`업로드 준비 실패 ${init.status}: ${await init.text()}`);
  const { file_url, upload_url } = await init.json();
  const put = await fetch(upload_url, {
    method: "PUT",
    headers: { "Content-Type": "image/png" },
    body: readFileSync(file),
  });
  if (!put.ok) throw new Error(`업로드 실패 ${put.status}`);
  return file_url;
}

async function run(label, endpoint, body) {
  const before = await balance();
  console.log(`\n[${label}] ${endpoint}`);
  console.log(`  ${JSON.stringify(body).slice(0, 220)}`);

  const q = await fetch(`${QUEUE}/${endpoint}`, {
    method: "POST",
    headers: jsonAuth,
    body: JSON.stringify(body),
  });
  const job = await q.json();
  if (!q.ok || !job.request_id) throw new Error(`큐 실패 ${q.status}: ${JSON.stringify(job).slice(0, 300)}`);

  const statusUrl = job.status_url ?? `${QUEUE}/${endpoint}/requests/${job.request_id}/status`;
  const responseUrl = job.response_url ?? `${QUEUE}/${endpoint}/requests/${job.request_id}`;

  const started = Date.now();
  let status = "";
  while (status !== "COMPLETED") {
    await new Promise((r) => setTimeout(r, 5000));
    const s = await (await fetch(statusUrl, { headers: auth })).json();
    status = s.status;
    process.stdout.write(`\r  ${status} ${Math.round((Date.now() - started) / 1000)}초      `);
    if (status === "FAILED") throw new Error(`\n생성 실패: ${JSON.stringify(s).slice(0, 300)}`);
    if (Date.now() - started > 900_000) throw new Error("\n15분 초과");
  }

  const res = await (await fetch(responseUrl, { headers: auth })).json();
  const url = res.video?.url;
  if (!url) throw new Error(`응답에 영상이 없음: ${JSON.stringify(res).slice(0, 300)}`);

  const dest = path.join(outDir, `${label}.mp4`);
  writeFileSync(dest, Buffer.from(await (await fetch(url)).arrayBuffer()));

  const after = await balance();
  const spent = before - after;
  console.log(`\n  → ${dest} · 실제 차감 $${spent.toFixed(3)} · 잔액 $${after.toFixed(2)}`);
  await recordSpend("fal", "video", `ab/${label}`, spent, { endpoint, body, seed: res.seed ?? null });
  return { dest, spent };
}

const imageUrl = await upload(still);
console.log(`스틸 업로드: ${path.basename(still)}`);

/* A — 지금 방식. 이미지는 '참고'이고 모델이 오디오를 만든다 */
const a = await run("A-현행-ref2v-오디오켬", "bytedance/seedance-2.0/fast/reference-to-video", {
  prompt,
  resolution: "720p",
  duration: String(seconds),
  aspect_ratio: "9:16",
  generate_audio: true,
  image_urls: [imageUrl],
});

/* B — 바꾼 방식. 스틸이 1번 프레임 그 자체이고 오디오는 우리가 얹는다 */
const b = await run("B-신규-i2v-오디오끔", "bytedance/seedance-2.0/fast/image-to-video", {
  prompt,
  resolution: "720p",
  duration: String(seconds),
  generate_audio: false,
  image_url: imageUrl,
});

console.log(`\n합계 $${(a.spent + b.spent).toFixed(3)}`);
console.log(`\n볼 것 —`);
console.log(`  1. B 의 첫 프레임이 넣은 스틸과 같은가 (같아야 정상)`);
console.log(`  2. A 는 인물을 다시 그렸는가`);
console.log(`  3. A 에 한국어 비슷한 소리가 들어갔는가 / B 는 무음인가`);
