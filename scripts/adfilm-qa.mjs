/**
 * 컷 QA — 납품 전에 기계가 먼저 본다. (2026-08-16 신설)
 *
 *   node scripts/adfilm-qa.mjs <작업폴더> <shot.json ...>
 *
 * ── 왜 만들었나 ───────────────────────────────────────────────────────
 * 사장님 지적: *"큐에이는 했니? 여전히 나레이션 어색한데."*
 * 안 했다. 컷을 뽑아 놓고 **눈으로만 훑고 조립으로 넘겼다.** 그래서
 * 발음이 뭉개진 컷, 화자가 바뀐 컷이 그대로 완성본에 들어갔다.
 *
 * 사람 눈은 8컷을 같은 기준으로 못 본다. 기계가 먼저 세고,
 * 걸린 것만 사람이 본다.
 *
 * ── 무엇을 보는가 ─────────────────────────────────────────────────────
 *  1. 대사 일치   — whisper 받아쓰기가 원문과 얼마나 같은가
 *  2. 발화 밀도   — 5초를 말로 채웠는가(침묵이 길면 조립에서 늘어진다)
 *  3. 길이        — 요청한 초와 실제가 맞는가
 *  4. 무음        — 오디오가 아예 없는 컷을 잡는다
 *
 * 화자 동일성은 여기서 못 잰다(사람이 봐야 한다). 대신 체인으로 만들었는지를
 * shot.json 의 `videos` 로 확인해 표시한다.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import ffmpeg from "ffmpeg-static";

const dir = process.argv[2];
const files = process.argv.slice(3);
if (!dir || !files.length) {
  console.error("사용법: node scripts/adfilm-qa.mjs <작업폴더> <shot.json ...>");
  process.exit(1);
}

const KEY = (() => {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  const env = readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
  return env.match(/^OPENAI_API_KEY=(.+)$/m)?.[1].trim().replace(/^["']|["']$/g, "");
})();

/** 대사에서 낱말만 남긴다 — 구두점·띄어쓰기 차이로 감점하지 않는다 */
const norm = (s) => s.replace(/[^가-힣0-9a-zA-Z]/g, "");

/** 글자 단위 편집거리 → 일치율 */
function similarity(a, b) {
  a = norm(a); b = norm(b);
  if (!a || !b) return 0;
  const d = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i += 1)
    for (let j = 1; j <= b.length; j += 1)
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
  return 1 - d[a.length][b.length] / Math.max(a.length, b.length);
}

function probeSeconds(file) {
  /* `ffmpeg -i` 는 출력 파일이 없으면 종료코드 1로 죽는다. 정보는 stderr 에
     이미 다 찍혀 있으므로 예외에서 꺼내 쓴다. */
  let out = "";
  try {
    out = execFileSync(ffmpeg, ["-i", file], { encoding: "utf8", stdio: ["ignore", "ignore", "pipe"] });
  } catch (e) {
    out = String(e.stderr ?? "");
  }
  const m = out.match(/Duration: (\d+):(\d+):([\d.]+)/);
  return m ? +m[1] * 3600 + +m[2] * 60 + parseFloat(m[3]) : 0;
}

let bad = 0;
console.log("");
for (const f of files) {
  const shot = JSON.parse(readFileSync(path.join(dir, f), "utf8"));
  const mp4 = path.join(dir, `${shot.label}.mp4`);
  if (!existsSync(mp4)) {
    console.log(`✗ ${shot.label} — 파일이 없습니다`);
    bad += 1;
    continue;
  }

  const want = (shot.prompt.match(/말한다: "([^"]+)"/) ?? [])[1] ?? "";
  const secs = probeSeconds(mp4);
  const chained = (shot.videos?.length ?? 0) > 0;

  const issues = [];
  if (Math.abs(secs - shot.seconds) > 0.6)
    issues.push(`길이 ${secs.toFixed(2)}초 (요청 ${shot.seconds}초)`);

  let heard = "";
  let sim = 1;
  let density = 1;

  if (want && shot.audio) {
    const wav = path.join(dir, `.qa-${shot.label}.mp3`);
    execFileSync(ffmpeg, ["-y", "-v", "error", "-i", mp4, "-vn", "-ac", "1", "-ar", "16000", wav],
      { stdio: ["ignore", "ignore", "pipe"] });

    const form = new FormData();
    form.append("file", new Blob([readFileSync(wav)], { type: "audio/mpeg" }), "a.mp3");
    form.append("model", "whisper-1");
    form.append("language", "ko");
    form.append("response_format", "verbose_json");
    form.append("timestamp_granularities[]", "word");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST", headers: { Authorization: `Bearer ${KEY}` }, body: form,
    });
    if (res.ok) {
      const tr = await res.json();
      heard = (tr.text ?? "").trim();
      sim = similarity(want, heard);
      const w = tr.words ?? [];
      // 말이 클립을 얼마나 채웠는가. 침묵이 길면 조립에서 늘어진다
      if (w.length) density = (w[w.length - 1].end - w[0].start) / secs;
      if (sim < 0.8) issues.push(`대사 일치 ${(sim * 100).toFixed(0)}%`);
      if (density < 0.7) issues.push(`발화 밀도 ${(density * 100).toFixed(0)}% (침묵이 깁니다)`);
    } else {
      issues.push("받아쓰기 실패");
    }
    execFileSync("rm", ["-f", wav]);
  }

  const ok = issues.length === 0;
  if (!ok) bad += 1;
  console.log(
    `${ok ? "✓" : "✗"} ${shot.label}  ${secs.toFixed(2)}초` +
      `${chained ? " · 체인" : " · 독립"}` +
      (want ? ` · 일치 ${(sim * 100).toFixed(0)}% · 밀도 ${(density * 100).toFixed(0)}%` : "") +
      (issues.length ? `\n    ${issues.join(" / ")}` : ""),
  );
  if (want && sim < 1) {
    console.log(`    원문: ${want}`);
    console.log(`    발화: ${heard}`);
  }
}

console.log(
  bad ? `\n${bad}개 컷이 기준 미달입니다. 조립 전에 확인하세요.` : `\n${files.length}개 컷 전부 통과.`,
);
process.exit(bad ? 1 : 0);
