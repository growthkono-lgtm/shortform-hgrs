/**
 * 샷 하나 생성 — 레퍼런스를 올리고 돌려서 받아 온다. (2026-08-15)
 *
 *   node scripts/adfilm-shot.mjs <작업폴더> <shot.json> [--go]
 *
 * `--go` 를 안 붙이면 **돈을 쓰지 않고** 프롬프트와 예상 비용만 보여 준다.
 * 생성은 초당 과금이라 눌러 보기 전에 무엇을 보내는지 눈으로 확인해야 한다.
 *
 * shot.json 예:
 * {
 *   "label": "product-01",
 *   "seconds": 5,
 *   "tier": "standard",
 *   "audio": false,
 *   "seed": 12345,
 *   "images": ["pkg.png", "device.png"],
 *   "prompt": "..."
 * }
 *
 * ── 왜 업로드가 필요한가 ──────────────────────────────────────────────
 * fal 은 레퍼런스를 **URL 로만** 받는다. 로컬 파일을 그대로 못 넘긴다.
 * fal 자체 스토리지에 올리고 그 URL 을 쓴다 — 우리 서버에 공개 경로를
 * 새로 파는 것보다 안전하다(제품 사진이 검색에 노출되지 않는다).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const dir = process.argv[2];
const shotFile = process.argv[3];
const go = process.argv.includes("--go");

if (!dir || !shotFile) {
  console.error("사용법: node scripts/adfilm-shot.mjs <작업폴더> <shot.json> [--go]");
  process.exit(1);
}

const KEY = (() => {
  if (process.env.FAL_KEY) return process.env.FAL_KEY;
  const env = readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
  return env.match(/^FAL_KEY=(.+)$/m)?.[1].trim().replace(/^["']|["']$/g, "");
})();
if (!KEY) {
  console.error("FAL_KEY 가 없습니다");
  process.exit(1);
}

const shot = JSON.parse(readFileSync(path.join(dir, shotFile), "utf8"));
const tier = shot.tier ?? "standard";
const PRICE = { standard: 0.3034, fast: 0.2419 };

const auth = { Authorization: `Key ${KEY}` };
const jsonAuth = { ...auth, "Content-Type": "application/json" };

/* ── 잔액 ─────────────────────────────────────────────────────────── */
const balance = Number(
  await (await fetch("https://rest.alpha.fal.ai/billing/user_balance", { headers: auth })).text(),
);

const hasVideo = (shot.videos?.length ?? 0) > 0;
const est = Number(
  (PRICE[tier] * shot.seconds * (hasVideo ? 0.6 : 1)).toFixed(3),
);

console.log(`\n[${shot.label}] ${shot.seconds}초 · ${tier} · 예상 $${est} · 잔액 $${balance.toFixed(2)}`);
console.log(`레퍼런스 이미지 ${shot.images?.length ?? 0}장${hasVideo ? ` · 비디오 ${shot.videos.length}개` : ""}`);
console.log(`\n─ 보낼 프롬프트 ─────────────────────────\n${shot.prompt}\n`);

if (!go) {
  console.log("(--go 를 붙이면 실제로 생성합니다)");
  process.exit(0);
}
if (est > balance) {
  console.error(`잔액 부족: $${balance} < $${est}`);
  process.exit(1);
}

/* ── 1) 레퍼런스 업로드 ───────────────────────────────────────────── */
const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".mp4": "video/mp4", ".mp3": "audio/mpeg" };

async function upload(file) {
  const full = path.join(dir, file);
  if (!existsSync(full)) throw new Error(`레퍼런스가 없습니다: ${full}`);
  const ext = path.extname(file).toLowerCase();
  const type = MIME[ext] ?? "application/octet-stream";

  const init = await fetch(
    "https://rest.alpha.fal.ai/storage/upload/initiate?storage_type=fal-cdn-v3",
    { method: "POST", headers: jsonAuth, body: JSON.stringify({ content_type: type, file_name: file }) },
  );
  if (!init.ok) throw new Error(`업로드 준비 실패 ${init.status}: ${await init.text()}`);
  const { file_url, upload_url } = await init.json();

  const put = await fetch(upload_url, {
    method: "PUT",
    headers: { "Content-Type": type },
    body: readFileSync(full),
  });
  if (!put.ok) throw new Error(`업로드 실패 ${put.status}`);
  console.log(`  ↑ ${file}`);
  return file_url;
}

console.log("레퍼런스 업로드…");
const imageUrls = [];
for (const f of shot.images ?? []) imageUrls.push(await upload(f));
const videoUrls = [];
for (const f of shot.videos ?? []) videoUrls.push(await upload(f));

/* ── 2) 생성 요청 ─────────────────────────────────────────────────── */
const hasRefs = imageUrls.length + videoUrls.length > 0;
const endpoint = hasRefs
  ? `bytedance/seedance-2.0${tier === "fast" ? "/fast" : ""}/reference-to-video`
  : `bytedance/seedance-2.0${tier === "fast" ? "/fast" : ""}/text-to-video`;

const body = {
  prompt: shot.prompt,
  resolution: "720p",
  duration: String(shot.seconds),
  aspect_ratio: "9:16",
  generate_audio: shot.audio ?? false,
};
if (shot.seed != null) body.seed = shot.seed;
if (imageUrls.length) body.image_urls = imageUrls;
if (videoUrls.length) body.video_urls = videoUrls;

console.log(`\n요청 → ${endpoint}`);
const submit = await fetch(`https://queue.fal.run/${endpoint}`, {
  method: "POST",
  headers: jsonAuth,
  body: JSON.stringify(body),
});
const submitText = await submit.text();
if (!submit.ok) {
  console.error(`실패 ${submit.status}: ${submitText.slice(0, 500)}`);
  process.exit(1);
}
const job = JSON.parse(submitText);
console.log(`  요청 ID ${job.request_id}`);

/* ── 3) 대기 ──────────────────────────────────────────────────────── */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let status = "IN_QUEUE";
const started = Date.now();
while (status !== "COMPLETED") {
  await sleep(5000);
  const r = await fetch(job.status_url, { headers: auth });
  const s = await r.json();
  status = s.status;
  const secs = Math.round((Date.now() - started) / 1000);
  process.stdout.write(`\r  ${status} ${secs}초${s.queue_position != null ? ` (대기 ${s.queue_position})` : ""}      `);
  if (status === "FAILED") {
    console.error(`\n생성 실패: ${JSON.stringify(s).slice(0, 400)}`);
    process.exit(1);
  }
  if (secs > 900) {
    console.error("\n15분 초과 — 중단합니다");
    process.exit(1);
  }
}

/* ── 4) 받기 ──────────────────────────────────────────────────────── */
const res = await (await fetch(job.response_url, { headers: auth })).json();
const url = res.video?.url;
if (!url) {
  console.error(`\n응답에 영상이 없습니다: ${JSON.stringify(res).slice(0, 400)}`);
  process.exit(1);
}

const out = path.join(dir, `${shot.label}.mp4`);
writeFileSync(out, Buffer.from(await (await fetch(url)).arrayBuffer()));

const after = Number(
  await (await fetch("https://rest.alpha.fal.ai/billing/user_balance", { headers: auth })).text(),
);

/* 재현에 필요한 것을 남긴다 — 이게 규격서의 원재료다 */
writeFileSync(
  path.join(dir, `${shot.label}.run.json`),
  JSON.stringify(
    { endpoint, body, seed: res.seed ?? shot.seed ?? null, videoUrl: url, spent: Number((balance - after).toFixed(3)) },
    null,
    2,
  ) + "\n",
);

console.log(`\n\n완성: ${out}`);
console.log(`  seed ${res.seed ?? shot.seed ?? "-"} · 실제 차감 $${(balance - after).toFixed(3)} · 잔액 $${after.toFixed(2)}`);
console.log(`  재현 정보: ${shot.label}.run.json`);
