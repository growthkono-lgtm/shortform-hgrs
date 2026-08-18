/**
 * 컷 촬영 — 시트를 레퍼런스로 넣어 image-to-video 로 뽑는다. (2026-08-16)
 *
 *   node --env-file=.env.local scripts/adfilm-shoot.mjs drafts/feliway/plan-v11.json 1 2 5 6
 *
 * ── 무엇이 달라졌나 ────────────────────────────────────────────────────
 * v10 까지는 텍스트만 주고 sora 에 던졌다. 그래서 컷마다 다른 사람이 나오고
 * 얼굴이 깨졌다. 이제는 **3번 정거장에서 확정한 시트**를 레퍼런스로 넣는다.
 *
 * 그리고 프롬프트의 역할이 바뀐다. 인물·배경·스타일은 **이미지가 이미 답을
 * 갖고 있으므로 다시 쓰지 않는다.** 영상 프롬프트에는 움직임·카메라 워킹·
 * 시간만 넣는다. 이게 이번 개편의 핵심이고, 우리가 안 하던 것이다.
 *
 * 레퍼런스는 fal 에 **data URI** 로 넣는다. 업로드 단계를 만들면 그 자체가
 * 고장 지점이 되고, 720p 로 줄이면 어차피 한 장 150KB 안팎이다.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";

import path from "node:path";
import os from "node:os";

const FAL_QUEUE = "https://queue.fal.run";
const ENDPOINT = "bytedance/seedance-2.0/reference-to-video";
/** ⚠️ 상태·결과 조회는 **앱 경로까지만** 쓴다. 모델 경로를 붙이면 405 가 온다 */
const APP = "bytedance/seedance-2.0";
const PRICE_PER_SEC = 0.3034; // fal 표준 티어 공시가
const MAX_FILM_USD = 25;

const planFile = process.argv[2] ?? "drafts/feliway/plan-v11.json";
const only = process.argv.slice(3).map(Number);
const plan = JSON.parse(await readFile(planFile, "utf8"));
const root = path.dirname(planFile);
const outDir = path.join(root, "v11");
await mkdir(outDir, { recursive: true });

/* ── 역할별 레퍼런스 자산 ──────────────────────────────────────────────
 * 컷의 `cast` 에 적힌 역할을 실제 파일로 옮긴다. 기획안이 곧 자산 목록이 된다. */
const ASSET = {
  beneficiary: (shot) => {
    const byRole = {
      훅: "subject/02-scratching.png",
      심화: "subject/03-hiding.png",
      상호작용: "subject/04-sniffing.png",
      변화: "subject/05-relaxed.png",
    };
    return [byRole[shot.role] ?? "subject/01-front.png", "subject/01-front.png"];
  },
  buyer: () => ["talent/01-front.png"],
  product: () => ["pkg.png"],
  space: () => ["talent/06-wide.png"],
};

/** 720p 로 줄여 data URI 로 만든다 — 원본 2.5MB 를 그대로 넣을 이유가 없다 */
function dataUri(rel) {
  const src = path.join(root, rel);
  if (!existsSync(src)) throw new Error(`레퍼런스가 없습니다: ${src}`);
  const tmp = path.join(os.tmpdir(), `ref-${path.basename(rel)}.jpg`);
  execFileSync("sips", ["-Z", "720", "-s", "format", "jpeg", "-s", "formatOptions", "80", src, "--out", tmp], {
    stdio: "ignore",
  });
  return `data:image/jpeg;base64,${readFileSync(tmp).toString("base64")}`;
}

const shots = plan.shots.filter((s) => only.length === 0 || only.includes(s.no));
const estimate = shots.reduce((sum, s) => sum + s.seconds * PRICE_PER_SEC, 0);
console.log(`컷 ${shots.length}개 · ${shots.reduce((s, x) => s + x.seconds, 0)}초 · 예상 $${estimate.toFixed(2)}`);
if (estimate > MAX_FILM_USD) {
  console.error(`한 편 상한 $${MAX_FILM_USD} 초과 — 멈춥니다`);
  process.exit(1);
}

const key = process.env.FAL_KEY;
if (!key) throw new Error("FAL_KEY 가 없습니다");
const auth = { Authorization: `Key ${key}`, "Content-Type": "application/json" };

async function submit(shot) {
  /* 레퍼런스를 모은다. 중복 제거하고 순서를 고정해야 [Image1] 지목이 맞는다 */
  const rels = [];
  for (const role of shot.cast) {
    for (const rel of ASSET[role]?.(shot) ?? []) if (!rels.includes(rel)) rels.push(rel);
  }
  const images = rels.slice(0, 9).map(dataUri);

  /* 프롬프트 = 움직임 + 카메라 + 시간. 인물·배경·스타일은 이미지가 갖고 있다 */
  const refLines = rels
    .map((rel, i) => {
      const what = rel.includes("subject")
        ? "the cat"
        : rel.includes("talent/01")
          ? "the woman"
          : rel.includes("talent/06")
            ? "the room"
            : "the product package";
      return `[Image${i + 1}] is ${what}.`;
    })
    .join(" ");

  const dialogue = shot.cast.includes("buyer") && shot.line
    ? ` The woman speaks to the camera in Korean, calmly and casually: "${shot.line}". Her lips match the Korean words.`
    : "";

  const prompt =
    `${refLines} From start to finish over ${shot.seconds} seconds: ${shot.motion}.` +
    ` Keep the same subject, same room, same lighting as the reference images.` +
    ` Natural indoor daylight, handheld phone-camera feel with almost no shake.${dialogue}`;

  const body = {
    prompt,
    resolution: "720p",
    duration: String(shot.seconds),
    aspect_ratio: "9:16",
    generate_audio: Boolean(dialogue),
    image_urls: images,
    seed: 20260816 + shot.no,
  };

  const res = await fetch(`${FAL_QUEUE}/${ENDPOINT}`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`컷 ${shot.no} 제출 실패 ${res.status}: ${text.slice(0, 300)}`);
  const data = JSON.parse(text);
  console.log(`컷 ${shot.no} (${shot.role}) 제출 · 레퍼런스 ${rels.length}장 · ${data.request_id}`);
  return { shot, requestId: data.request_id, prompt, rels };
}

async function wait(job) {
  const statusUrl = `${FAL_QUEUE}/${APP}/requests/${job.requestId}/status`;
  for (let i = 0; i < 120; i += 1) {
    const r = await fetch(statusUrl, { headers: { Authorization: `Key ${key}` } });
    const s = await r.json();
    if (s.status === "COMPLETED") break;
    if (s.status === "FAILED" || s.error) throw new Error(`컷 ${job.shot.no} 실패: ${JSON.stringify(s).slice(0, 300)}`);
    await new Promise((ok) => setTimeout(ok, 5000));
  }
  const r = await fetch(`${FAL_QUEUE}/${APP}/requests/${job.requestId}`, {
    headers: { Authorization: `Key ${key}` },
  });
  const out = await r.json();
  const url = out?.video?.url ?? out?.videos?.[0]?.url;
  if (!url) throw new Error(`컷 ${job.shot.no} 결과에 영상이 없습니다: ${JSON.stringify(out).slice(0, 300)}`);

  const bin = Buffer.from(await (await fetch(url)).arrayBuffer());
  const file = path.join(outDir, `cut${String(job.shot.no).padStart(2, "0")}.mp4`);
  await writeFile(file, bin);
  await writeFile(
    file.replace(/\.mp4$/, ".run.json"),
    JSON.stringify({ shot: job.shot, prompt: job.prompt, refs: job.rels, requestId: job.requestId }, null, 2),
  );
  console.log(`컷 ${job.shot.no} 완료 → ${file} (${(bin.length / 1024 / 1024).toFixed(1)}MB)`);
}

const jobs = [];
for (const shot of shots) jobs.push(await submit(shot));
console.log("\n생성 중… 컷당 2~4분 걸립니다\n");
for (const job of jobs) await wait(job);
console.log(`\n결과: ${outDir}`);
