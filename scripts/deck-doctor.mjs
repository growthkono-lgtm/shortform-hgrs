/**
 * 소개서 조판 검사.
 *
 *   npm run deck:doctor
 *
 * `docs/deck/소개서.html` 을 실제 16:9 크기로 열어 **장표마다 무엇이 넘쳤고
 * 무엇이 잘렸는지** 숫자로 잡는다.
 *
 * 이걸 만든 이유 —
 * 2026-08-19~20 사이에 같은 사고가 세 번 났다.
 *  · `.bc-ev` 가 `overflow:hidden` 이라 **월별 실적표가 통째로 잘렸다.**
 *    화면에는 위 한 장만 보여서 "들어가 있는데 안 보이는" 상태였고, 사장님이
 *    눈으로 찾아 주시기 전까지 아무도 몰랐다.
 *  · 소재 실적표를 한 장 더 끼웠더니 **영상 캡처가 깎였다.** 역시 눈으로 발견.
 *  · CSS 치환이 실패했는데 확인 안 하고 "고쳤다"고 보고했다.
 *
 * `.page` 가 `overflow:hidden` 이라 **넘쳐도 화면이 멀쩡해 보인다.** 그래서
 * 사람 눈은 못 잡는다. 인쇄 전에 이걸 돌리고 말한다.
 *
 * 규격은 `docs/deck/LAYOUT.md`. 검사 항목은 아래 CHECKS 주석 참고.
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.argv[2] ?? "http://localhost:8909";
const URL_ = `${BASE}/docs/deck/소개서.html`;

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9336;
const profile = mkdtempSync(join(tmpdir(), "deck-doctor-"));

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

/* 인쇄와 같은 픽셀로 본다 — 1mm = 96/25.4 px, 338.67mm × 190.5mm */
await send(
  "Emulation.setDeviceMetricsOverride",
  { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false },
  sid,
);
await send("Page.enable", {}, sid);
await send("Page.navigate", { url: URL_ }, sid);
await sleep(3500);

/**
 * CHECKS — 페이지 안에서 도는 검사 본체.
 *
 *  1. 넘침   장표 안전영역(패딩 안쪽)을 벗어난 요소. `.page` 가
 *            overflow:hidden 이라 화면에는 멀쩡해 보이지만 인쇄에서 잘린다.
 *  2. 잘림   overflow 가 hidden/clip 인데 내용이 그릇보다 큰 요소.
 *            증빙 표가 사라졌던 바로 그 사고.
 *  3. 미로딩 naturalWidth 가 0 인 이미지. 경로 오타·누락.
 *  4. 빈칸   그리드에 정원보다 적게 들어간 장. 잘못은 아니지만 빈 칸이
 *            그대로 인쇄되니 알려 준다.
 */
const CHECKS = `(() => {
  const MM = 96 / 25.4;
  /* 정원은 고정값이 아니라 **덱 안에서 가장 많이 들어간 장** 기준으로 본다.
     8+6 을 7+7 로 바꿨더니 고정 8 과 어긋나 멀쩡한 장이 경고로 잡혔다. */
  const CAP = {};
  for (const cls of ["shorts", "thumbs", "imc", "logos"]) {
    CAP[cls] = Math.max(0, ...[...document.querySelectorAll("." + cls)].map((g) => g.children.length));
  }
  const out = [];

  for (const page of document.querySelectorAll(".page")) {
    const pr = page.getBoundingClientRect();
    const cs = getComputedStyle(page);
    const padT = parseFloat(cs.paddingTop);
    const padR = parseFloat(cs.paddingRight);
    const padB = parseFloat(cs.paddingBottom);
    const padL = parseFloat(cs.paddingLeft);
    const safe = {
      top: pr.top + padT,
      right: pr.right - padR,
      bottom: pr.bottom - padB,
      left: pr.left + padL,
    };

    const issues = [];
    const seen = new Set();

    for (const el of page.querySelectorAll(".page-body *")) {
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) continue;

      /* 1. 넘침 — 푸터는 안전영역 밖에 두는 게 정상이라 뺀다 */
      if (!el.closest(".page-foot")) {
        const over = [];
        if (r.bottom > safe.bottom + 1) over.push(\`아래 \${((r.bottom - safe.bottom) / MM).toFixed(1)}mm\`);
        if (r.right > safe.right + 1) over.push(\`오른쪽 \${((r.right - safe.right) / MM).toFixed(1)}mm\`);
        if (r.left < safe.left - 1) over.push(\`왼쪽 \${((safe.left - r.left) / MM).toFixed(1)}mm\`);
        if (over.length) {
          const k = "over:" + (el.className || el.tagName);
          if (!seen.has(k)) {
            seen.add(k);
            issues.push({ kind: "넘침", el: el.className || el.tagName, detail: over.join(" · ") });
          }
        }
      }

      /* 2. 잘림 */
      const es = getComputedStyle(el);
      const hidden = /hidden|clip/.test(es.overflow + es.overflowY + es.overflowX);
      if (hidden) {
        const dy = el.scrollHeight - el.clientHeight;
        const dx = el.scrollWidth - el.clientWidth;
        if (dy > 2 || dx > 2) {
          const k = "clip:" + (el.className || el.tagName);
          if (!seen.has(k)) {
            seen.add(k);
            issues.push({
              kind: "잘림",
              el: el.className || el.tagName,
              detail: [dy > 2 ? \`세로 \${(dy / MM).toFixed(1)}mm\` : "", dx > 2 ? \`가로 \${(dx / MM).toFixed(1)}mm\` : ""]
                .filter(Boolean)
                .join(" · "),
            });
          }
        }
      }

      /* 3. 미로딩 */
      if (el.tagName === "IMG" && el.naturalWidth === 0) {
        issues.push({ kind: "미로딩", el: (el.getAttribute("src") || "").split("/").slice(-2).join("/"), detail: "" });
      }
    }

    /* 4. 빈칸 */
    for (const [cls, cap] of Object.entries(CAP)) {
      const grid = page.querySelector("." + cls);
      if (grid && grid.children.length < cap) {
        issues.push({ kind: "빈칸", el: cls, detail: \`\${grid.children.length}/\${cap}칸\` });
      }
    }

    out.push({
      id: page.id,
      layout: page.dataset.layout,
      title: (page.querySelector("h1,h2,.part-t,.stmt-t")?.textContent || "").trim().slice(0, 34),
      issues,
    });
  }
  return JSON.stringify(out);
})()`;

const { result: r } = await send(
  "Runtime.evaluate",
  { expression: CHECKS, returnByValue: true },
  sid,
);

ws.close();
chrome.kill();
try {
  rmSync(profile, { recursive: true, force: true, maxRetries: 3 });
} catch {
  /* 프로필 정리 실패는 결과와 무관하다 */
}

if (!r?.result?.value) {
  console.error("검사 실패 — 페이지를 읽지 못했습니다. 로컬 서버가 떠 있습니까?");
  console.error(`  python3 -m http.server 8909 --directory .   그리고 ${URL_}`);
  process.exit(2);
}

const pages = JSON.parse(r.result.value);
const BAD = new Set(["넘침", "잘림", "미로딩"]);
let bad = 0;
let warn = 0;

console.log(`\n소개서 조판 검사 — ${pages.length}장\n`);

for (const p of pages) {
  if (!p.issues.length) continue;
  const hard = p.issues.filter((i) => BAD.has(i.kind));
  const soft = p.issues.filter((i) => !BAD.has(i.kind));
  bad += hard.length;
  warn += soft.length;
  console.log(`${hard.length ? "✗" : "·"} ${p.id} [${p.layout}] ${p.title}`);
  for (const i of p.issues) console.log(`    ${i.kind}  ${i.el}${i.detail ? `  ${i.detail}` : ""}`);
}

console.log(
  `\n넘침·잘림·미로딩 ${bad}건 / 빈칸 ${warn}건 · 깨끗한 장 ${pages.filter((p) => !p.issues.length).length}/${pages.length}\n`,
);

process.exit(bad ? 1 : 0);
