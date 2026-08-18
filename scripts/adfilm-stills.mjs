/**
 * 씬별 키프레임 스틸 — 영상보다 30배 싼 자리에서 인물을 못 박는다. (2026-08-18)
 *
 *   node --env-file=.env.local scripts/adfilm-stills.mjs drafts/feliway/scenes-v16.json
 *
 * ── 왜 이 단계가 생겼나 ────────────────────────────────────────────────
 * 사장님: *"이미지로 먼저 생성하고 영상화를 했는데도 인물이 중간에 같은
 * 인물이라면서 달라 보이게 들어간다."*
 *
 * 같은 날 A/B 로 원인을 쟀다 — 우리가 스틸을 `reference-to-video` 로 넘기고
 * 있었다. 거기서 이미지는 **참고**라 모델이 인물을 매번 다시 그린다.
 *
 *   reference-to-video   SSIM 0.642   ← 얼굴·머리·배경·구도까지 다시 그림
 *   image-to-video       SSIM 0.922   ← 그 프레임 그대로 시작
 *
 * 그래서 공정이 바뀐다. **씬마다 첫 프레임을 먼저 확정하고**, 그 스틸에서
 * 영상을 시작한다(`adfilm-shoot-i2v.mjs`). 이 파일이 그 스틸을 만든다.
 *
 * ── 왜 나노바나나인가 ─────────────────────────────────────────────────
 * 인물 일관성 때문이다. 캐릭터 시트를 레퍼런스로 물려 편집시키면 같은 얼굴이
 * 유지된다. FLIXX 도 캐릭터 생성만 나노바나나로 분리해 쓴다(랜딩 07/15).
 * 우리 gpt-image-2 는 씬 연출에는 좋지만 동일 인물 유지가 약하다.
 *
 * ── 값싼 자리에서 싸운다 ──────────────────────────────────────────────
 *   스틸 1장  $0.15        틀리면 여기서 다시 만든다
 *   샷 5초    $1.2~1.5     여기서 발견하면 10배를 버린다
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
const outDir = path.join(root, `stills-${tag}`);
await mkdir(outDir, { recursive: true });

const key = process.env.FAL_KEY;
const auth = { Authorization: `Key ${key}` };
const jsonAuth = { ...auth, "Content-Type": "application/json" };
const QUEUE = "https://queue.fal.run";
const MODEL = "fal-ai/nano-banana-pro/edit";
/** 공시 $0.15/장. 실제 차감은 잔액 차분으로 따로 잰다 */
const LIST_PRICE = 0.15;

const balance = async () =>
  Number(await (await fetch("https://rest.alpha.fal.ai/billing/user_balance", { headers: auth })).text());

/* ── 레퍼런스 업로드 (한 번 올린 건 다시 안 올린다) ──────────────────── */
const uploaded = new Map();
async function upload(rel) {
  if (uploaded.has(rel)) return uploaded.get(rel);
  const full = path.join(root, rel);
  if (!existsSync(full)) throw new Error(`레퍼런스 없음: ${full}`);
  const init = await fetch(
    "https://rest.alpha.fal.ai/storage/upload/initiate?storage_type=fal-cdn-v3",
    {
      method: "POST",
      headers: jsonAuth,
      body: JSON.stringify({ content_type: "image/png", file_name: path.basename(rel) }),
    },
  );
  if (!init.ok) throw new Error(`업로드 준비 실패 ${init.status}: ${await init.text()}`);
  const { file_url, upload_url } = await init.json();
  const put = await fetch(upload_url, {
    method: "PUT",
    headers: { "Content-Type": "image/png" },
    body: readFileSync(full),
  });
  if (!put.ok) throw new Error(`업로드 실패 ${put.status}`);
  uploaded.set(rel, file_url);
  return file_url;
}

/**
 * 스틸 프롬프트 — **첫 프레임 한 장**을 지시한다. 움직임을 적지 않는다.
 *
 * 씬 스펙의 `action` 은 영상용 지시라 "천천히 밀어 들어간다" 같은 시간 표현이
 * 섞여 있다. 스틸에는 그게 독이다 — 모델이 모션 블러를 넣거나 중간 상태를
 * 그린다. 그래서 **시작 순간**으로 고정해 적는다.
 */
function stillPrompt(scene) {
  return [
    `한국 가정집 실내를 배경으로 한 세로 9:16 사진. 광고 소재의 **첫 프레임 한 장**이다.`,
    ``,
    `카메라: ${scene.camera}`,
    `이 장면이 시작되는 순간의 정지 화면: ${scene.action}`,
    `반드시 화면에 담긴다: ${scene.must}`,
    ``,
    `레퍼런스 이미지의 인물·동물·제품과 **완전히 같은 개체**여야 한다 —`,
    `얼굴 생김새·머리 모양·옷·털 무늬·제품 형태를 그대로 유지한다.`,
    `실사 사진처럼. 자연광. 과장된 색보정 없이.`,
    `화면에 글자·자막·로고·워터마크를 넣지 않는다.`,
    `모션 블러를 넣지 않는다 — 멈춘 한 장이다.`,
  ].join("\n");
}

async function makeStill(scene) {
  const refs = [];
  for (const r of scene.refs ?? []) refs.push(await upload(r));
  if (!refs.length) throw new Error(`씬 ${scene.no}: refs 가 비어 있습니다 — 개체를 못 박을 수 없습니다`);

  const before = await balance();
  const body = {
    prompt: stillPrompt(scene),
    image_urls: refs,
    aspect_ratio: "9:16",
    resolution: "2K",
    output_format: "png",
    num_images: 1,
  };

  const q = await fetch(`${QUEUE}/${MODEL}`, {
    method: "POST",
    headers: jsonAuth,
    body: JSON.stringify(body),
  });
  const job = await q.json();
  if (!q.ok || !job.request_id) throw new Error(`큐 실패 ${q.status}: ${JSON.stringify(job).slice(0, 300)}`);

  const statusUrl = job.status_url ?? `${QUEUE}/${MODEL}/requests/${job.request_id}/status`;
  const responseUrl = job.response_url ?? `${QUEUE}/${MODEL}/requests/${job.request_id}`;

  const started = Date.now();
  let status = "";
  while (status !== "COMPLETED") {
    await new Promise((r) => setTimeout(r, 3000));
    const s = await (await fetch(statusUrl, { headers: auth })).json();
    status = s.status;
    process.stdout.write(`\r  씬${String(scene.no).padStart(2, "0")} ${status} ${Math.round((Date.now() - started) / 1000)}초    `);
    if (status === "FAILED") throw new Error(`\n씬 ${scene.no} 실패: ${JSON.stringify(s).slice(0, 300)}`);
    if (Date.now() - started > 600_000) throw new Error("\n10분 초과");
  }

  const res = await (await fetch(responseUrl, { headers: auth })).json();
  const url = res.images?.[0]?.url;
  if (!url) throw new Error(`응답에 이미지가 없음: ${JSON.stringify(res).slice(0, 300)}`);

  const dest = path.join(outDir, `scene${String(scene.no).padStart(2, "0")}.png`);
  await writeFile(dest, Buffer.from(await (await fetch(url)).arrayBuffer()));

  const after = await balance();
  const spent = before - after;
  console.log(`\r  씬${String(scene.no).padStart(2, "0")} → ${path.basename(dest)} · $${spent.toFixed(3)}      `);

  await recordSpend("fal", "image", `${tag}/still-scene${scene.no}`, spent || LIST_PRICE, {
    model: MODEL,
    refs: scene.refs,
    measured: spent > 0,
    seed: res.seed ?? null,
  });
  return { dest, spent };
}

/* ── 실행 ─────────────────────────────────────────────────────────── */
const scenes = plan.scenes.filter((s) => !only.length || only.includes(s.no));
console.log(`스틸 ${scenes.length}장 · 나노바나나 프로 · 잔액 $${(await balance()).toFixed(2)}\n`);

/**
 * **동시에 돌린다.** 한 장에 30~40초씩 걸리는데 순차로 12장이면 8분이다.
 * fal 큐는 동시 제출을 받는다 — 기다리는 시간을 겹치면 1분 안쪽으로 끝난다.
 */
const outcomes = await Promise.all(
  scenes.map(async (scene) => {
    const dest = path.join(outDir, `scene${String(scene.no).padStart(2, "0")}.png`);
    if (existsSync(dest) && !only.length) {
      console.log(`  씬${String(scene.no).padStart(2, "0")} 건너뜀 (이미 있음)`);
      return { dest, spent: 0 };
    }
    try {
      return await makeStill(scene);
    } catch (e) {
      console.error(`\n  씬${scene.no} — ${String(e.message).slice(0, 200)}`);
      return null;
    }
  }),
);
const total = outcomes.filter(Boolean).reduce((a, r) => a + r.spent, 0);
const done = outcomes.filter(Boolean).map((r) => r.dest);

console.log(`\n완성 ${done.length}장 · 합계 $${total.toFixed(2)} · 잔액 $${(await balance()).toFixed(2)}`);
console.log(`  ${outDir}`);
console.log(`\n다음: 스틸을 보고 인물이 유지되는지 확인 → adfilm-shoot-i2v.mjs`);
