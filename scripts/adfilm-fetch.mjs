/**
 * 이미 제출한 컷의 결과만 받아온다. (2026-08-16)
 *
 *   node --env-file=.env.local scripts/adfilm-fetch.mjs drafts/feliway/v11 <컷번호:요청ID> …
 *
 * 제출은 됐는데 받아오다 끊긴 경우가 있다. **다시 제출하면 돈을 두 번 낸다.**
 * 그래서 받아오기를 따로 뗀다. 큐에 있는 결과는 fal 이 한동안 보관한다.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ENDPOINT = "bytedance/seedance-2.0/reference-to-video";
/** ⚠️ 상태·결과 조회는 **앱 경로까지만** 쓴다. 모델 경로를 붙이면 405 가 온다 */
const APP = "bytedance/seedance-2.0";
const QUEUE = "https://queue.fal.run";
const key = process.env.FAL_KEY;
if (!key) throw new Error("FAL_KEY 가 없습니다");
const headers = { Authorization: `Key ${key}` };

const outDir = process.argv[2];
const jobs = process.argv.slice(3).map((a) => {
  const [no, id] = a.split(":");
  return { no: Number(no), id };
});
await mkdir(outDir, { recursive: true });

/** 빈 몸통·비JSON 응답을 만나도 죽지 않는다. 그게 이번에 깨진 지점이다 */
async function json(url) {
  const r = await fetch(url, { headers });
  const t = await r.text();
  if (!t) return { status: r.status === 200 ? "IN_PROGRESS" : `HTTP_${r.status}` };
  try {
    return JSON.parse(t);
  } catch {
    return { status: "UNPARSEABLE", raw: t.slice(0, 200) };
  }
}

for (const job of jobs) {
  let state = "";
  for (let i = 0; i < 150; i += 1) {
    const s = await json(`${QUEUE}/${APP}/requests/${job.id}/status`);
    state = s.status ?? "";
    if (state === "COMPLETED") break;
    if (state.startsWith("HTTP_4") || state === "FAILED") {
      console.log(`컷 ${job.no} 실패: ${JSON.stringify(s).slice(0, 200)}`);
      break;
    }
    await new Promise((ok) => setTimeout(ok, 5000));
  }
  if (state !== "COMPLETED") {
    console.log(`컷 ${job.no} 아직 ${state} — 나중에 다시 받으세요`);
    continue;
  }

  const out = await json(`${QUEUE}/${APP}/requests/${job.id}`);
  const url = out?.video?.url ?? out?.videos?.[0]?.url;
  if (!url) {
    console.log(`컷 ${job.no} 결과에 영상이 없습니다: ${JSON.stringify(out).slice(0, 250)}`);
    continue;
  }
  const bin = Buffer.from(await (await fetch(url)).arrayBuffer());
  const file = path.join(outDir, `cut${String(job.no).padStart(2, "0")}.mp4`);
  await writeFile(file, bin);
  console.log(`컷 ${job.no} → ${file} (${(bin.length / 1024 / 1024).toFixed(1)}MB)`);
}
