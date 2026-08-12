/**
 * 모바일 화면 캡처.
 *
 *   node scripts/mobile-shots.mjs <path> [outDir] [baseUrl] [width]
 *
 * 한 페이지를 390px 폭으로 열어 한 화면씩 아래로 훑으며 PNG 로 떨군다.
 * {@link ./mobile-audit.mjs} 가 "넘쳤다"를 숫자로 잡는다면, 이건 눈으로 볼
 * 그림을 만든다 — 겹침·중복·이상한 여백은 숫자로 안 잡힌다.
 */
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PATH_ = process.argv[2] ?? "/";
const OUT = process.argv[3] ?? "/tmp/mobile-shots";
const BASE = process.argv[4] ?? "http://localhost:3000";
const WIDTH = Number(process.argv[5] ?? 390);
const HEIGHT = 844;

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9334;
const profile = mkdtempSync(join(tmpdir(), "mobile-shots-"));
mkdirSync(OUT, { recursive: true });

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--disable-gpu",
    "--hide-scrollbars",
  ],
  { stdio: "ignore" },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function wsUrl() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      return (await res.json()).webSocketDebuggerUrl;
    } catch {
      await sleep(250);
    }
  }
  throw new Error("Chrome CDP 가 뜨지 않았습니다");
}

const ws = new WebSocket(await wsUrl());
await new Promise((r) => (ws.onopen = r));

let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
  }
};
const send = (method, params = {}, sessionId) =>
  new Promise((resolve) => {
    const n = ++id;
    pending.set(n, resolve);
    ws.send(JSON.stringify({ id: n, method, params, sessionId }));
  });

const { result: t } = await send("Target.createTarget", { url: "about:blank" });
const { result: a } = await send("Target.attachToTarget", {
  targetId: t.targetId,
  flatten: true,
});
const sid = a.sessionId;

await send(
  "Emulation.setDeviceMetricsOverride",
  { width: WIDTH, height: HEIGHT, deviceScaleFactor: 2, mobile: true },
  sid,
);
await send("Page.enable", {}, sid);
await send("Page.navigate", { url: BASE + PATH_ }, sid);
await sleep(4000);

const { result: h } = await send(
  "Runtime.evaluate",
  { expression: "document.body.scrollHeight", returnByValue: true },
  sid,
);
const total = h.result.value;
const slug = PATH_.replace(/\//g, "_") || "_root";

for (let i = 0, y = 0; y < total; i++, y += HEIGHT) {
  await send(
    "Runtime.evaluate",
    { expression: `window.scrollTo(0, ${y})` },
    sid,
  );
  await sleep(700);
  const { result: shot } = await send(
    "Page.captureScreenshot",
    { format: "png" },
    sid,
  );
  const file = join(OUT, `${slug}-${String(i).padStart(2, "0")}.png`);
  writeFileSync(file, Buffer.from(shot.data, "base64"));
  console.log(file);
}

ws.close();
chrome.kill();
try {
  rmSync(profile, { recursive: true, force: true, maxRetries: 3 });
} catch {
  /* 프로필 정리 실패는 결과와 무관하다 */
}
