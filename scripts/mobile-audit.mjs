/**
 * 모바일 넘침 검사기.
 *
 *   node scripts/mobile-audit.mjs [baseUrl] [width]
 *
 * 소개서 조판을 잡을 때 쓴 것과 같은 방식이다: 화면을 눈으로 보는 대신
 * **화면 밖으로 나간 요소를 DOM 에서 직접 집어낸다.** 사장님이 "잘리는 부분
 * 있네"라고 할 때마다 스크린샷을 왕복하는 대신 이걸 돌린다.
 *
 * 잡는 것:
 *   - 가로 스크롤이 생겼는가 (documentElement.scrollWidth > 뷰포트)
 *   - 어떤 요소가 뷰포트 오른쪽/왼쪽 밖으로 나갔는가 (범인 지목)
 * 안 잡는 것:
 *   - 일부러 넘치게 만든 스크롤 컨테이너 안쪽 (overflow: auto/scroll 조상 아래)
 *
 * Chrome 헤드리스 + CDP. 별도 의존성 없이 Node 내장 WebSocket 만 쓴다.
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.argv[2] ?? "http://localhost:3000";
const WIDTH = Number(process.argv[3] ?? 390);
const HEIGHT = 844;
const PATHS = ["/", "/shortform", "/sns-brand", "/portfolio", "/blog"];

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9333;
const profile = mkdtempSync(join(tmpdir(), "mobile-audit-"));

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    `--window-size=${WIDTH},${HEIGHT}`,
    "--no-first-run",
    "--disable-gpu",
    "--hide-scrollbars",
  ],
  { stdio: "ignore" },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** CDP 엔드포인트가 뜰 때까지 기다린다 */
async function waitForTarget() {
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

/** 뷰포트를 넘어간 요소를 찾는 페이지 내 스크립트 */
const PROBE = `(() => {
  const vw = document.documentElement.clientWidth;
  const bad = [];
  const seen = new Set();

  // 일부러 넘치게 만든 컨테이너 안쪽은 봐준다 —
  // 가로 마퀴(overflow:hidden 으로 마스킹)와 가로 스크롤 트랙 둘 다.
  const inScroller = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const ov = getComputedStyle(p).overflowX;
      if (ov === "auto" || ov === "scroll" || ov === "hidden") return true;
    }
    return false;
  };

  const label = (el) => {
    const cls = (el.className && typeof el.className === "string")
      ? "." + el.className.trim().split(/\\s+/).slice(0, 4).join(".")
      : "";
    return el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + cls;
  };

  for (const el of document.body.querySelectorAll("*")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const over = Math.round(Math.max(r.right - vw, -r.left));
    if (over <= 1) continue;
    if (inScroller(el)) continue;
    // 부모가 이미 같은 만큼 넘쳤으면 부모만 보고한다 (자식 도배 방지)
    const pr = el.parentElement?.getBoundingClientRect();
    if (pr && Math.round(Math.max(pr.right - vw, -pr.left)) >= over) continue;
    const key = label(el) + "|" + over;
    if (seen.has(key)) continue;
    seen.add(key);
    bad.push({ el: label(el), over, top: Math.round(r.top + scrollY) });
  }

  return {
    scrollWidth: document.documentElement.scrollWidth,
    vw,
    offenders: bad.sort((a, b) => b.over - a.over).slice(0, 12),
  };
})()`;

const ws = new WebSocket(await waitForTarget());
await new Promise((r) => (ws.onopen = r));

let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
};
const send = (method, params = {}, sessionId) =>
  new Promise((resolve) => {
    const n = ++id;
    pending.set(n, resolve);
    ws.send(JSON.stringify({ id: n, method, params, sessionId }));
  });

const { result: target } = await send("Target.createTarget", {
  url: "about:blank",
});
const { result: attach } = await send("Target.attachToTarget", {
  targetId: target.targetId,
  flatten: true,
});
const sid = attach.sessionId;

await send(
  "Emulation.setDeviceMetricsOverride",
  { width: WIDTH, height: HEIGHT, deviceScaleFactor: 2, mobile: true },
  sid,
);
await send("Page.enable", {}, sid);

let problems = 0;
for (const path of PATHS) {
  await send("Page.navigate", { url: BASE + path }, sid);
  await sleep(3500);
  // 끝까지 훑어야 lazy 로 붙는 것들도 자리를 잡는다
  await send(
    "Runtime.evaluate",
    {
      expression: `(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) {
          window.scrollTo(0, y);
          await new Promise(r => setTimeout(r, 60));
        }
        window.scrollTo(0, 0);
      })()`,
      awaitPromise: true,
    },
    sid,
  );
  await sleep(800);

  const { result } = await send(
    "Runtime.evaluate",
    { expression: PROBE, returnByValue: true },
    sid,
  );
  const v = result.result.value;
  const overflow = v.scrollWidth - v.vw;

  if (overflow <= 1 && v.offenders.length === 0) {
    console.log(`✓ ${path}`);
    continue;
  }
  problems++;
  console.log(`✗ ${path} — 가로 넘침 ${overflow}px (문서 ${v.scrollWidth} / 화면 ${v.vw})`);
  for (const o of v.offenders) {
    console.log(`    +${o.over}px  y=${o.top}  ${o.el}`);
  }
}

ws.close();
chrome.kill();
try {
  rmSync(profile, { recursive: true, force: true, maxRetries: 3 });
} catch {
  /* 프로필 정리 실패는 검사 결과와 무관하다 */
}
console.log(problems ? `\n${problems}개 페이지에 넘침이 있습니다.` : "\n넘침 없음.");
process.exit(problems ? 1 : 0);
