/**
 * 배포 전 관문. (2026-08-19 신설)
 *
 *   npm run qa
 *
 * ── 왜 만들었나 ────────────────────────────────────────────────────────
 * 사장님 지적: *"너가 QA를 잘해. 왜 QA 단계를 다 설계해놓고도 스스로 놓쳐?
 * 그걸 내가 지금처럼 어떻게 매번 잡아줘."*
 *
 * 정확한 지적이다. 08-12 에 검사 스크립트 3종을 만들어 두고 메모리에도 적어
 * 놨는데, 오늘 확인해 보니 그중 **`mobile-audit.mjs`·`secret-scan.mjs` 는
 * 파일 자체가 없다.** 문서는 있다고 하고 파일은 없었다.
 *
 * 그리고 있었더라도 안 돌렸을 것이다. "고쳤으면 돌려라" 가 **내 판단에
 * 맡겨져 있었기 때문**이다. 판단에 맡긴 규율은 바쁠 때 제일 먼저 빠진다.
 * 오늘 하루에 그렇게 다섯 번 빠졌다 —
 *
 *   CSV 한글 파일명(응답 자체가 터짐)      비로그인 404 만 확인하고 통과 처리
 *   편성표 유령 행                          화면을 한 번도 안 열어 봄
 *   난이도 요약이 두 구간만                 같은 이유
 *   "발행 완료 0"                           같은 이유
 *   표가 세로로 깨짐                        같은 이유
 *
 * 그래서 이 파일은 **하나의 명령**이어야 한다. 여러 스크립트를 기억해서
 * 골라 돌리는 구조면 또 빠진다. `npm run qa` 하나만 남긴다.
 *
 * 종료 코드: 0 = 통과 / 1 = 하나라도 실패
 */
import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const results = [];
const add = (구분, 항목, ok, 결과) =>
  results.push({ 구분, 항목, 결과, 판정: ok ? "✅" : "❌" });

const run = (cmd) =>
  execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

/* ── 1. 타입 ──────────────────────────────────────────────────── */
try {
  run("npx tsc --noEmit");
  add("코드", "타입체크", true, "통과");
} catch (e) {
  add("코드", "타입체크", false, (e.stdout || e.message).split("\n").slice(0, 3).join(" / "));
}

/* ── 2. 린트 — **레포 전체** ────────────────────────────────────
 *
 * ⚠️ 그동안 나는 `npx eslint <바꾼 파일>` 만 돌렸다. 그래서
 * `components/sns/s-capability.tsx` 의 `react-hooks/refs` **에러 2개**가
 * 언제부터인지 모르게 남아 있었다(오늘 이 관문을 만들자마자 잡혔다).
 * 바꾼 파일만 보는 검사는 "내가 오늘 안 건드린 곳은 멀쩡하다" 는 가정인데,
 * 그 가정이 틀렸다는 걸 오늘 확인했다.
 *
 * **경고로는 막지 않는다.** 지금 18개가 있고 전부 미사용 변수(대부분 옛
 * 스크립트)다. 못 고칠 것으로 관문을 막으면 내가 관문을 끄게 된다 —
 * 그러면 안 만든 것과 같다. 에러만 막고 경고는 숫자로 보여 준다.
 */
{
  let out = "";
  try {
    out = run("npx eslint .");
  } catch (e) {
    out = (e.stdout || "") + (e.stderr || "");
  }
  const m = /✖ \d+ problems? \((\d+) errors?, (\d+) warnings?\)/.exec(out);
  const errors = m ? Number(m[1]) : /error/.test(out) ? 1 : 0;
  const warnings = m ? Number(m[2]) : 0;
  add(
    "코드",
    "린트 (레포 전체)",
    errors === 0,
    errors === 0
      ? `에러 0 · 경고 ${warnings}`
      : `에러 ${errors}개 — ${out.split("\n").filter((l) => /error/.test(l)).slice(0, 2).join(" / ")}`,
  );
}

/* ── 3. 빌드 ──────────────────────────────────────────────────── */
let built = false;
try {
  run("npm run build");
  built = true;
  add("코드", "빌드", true, "성공");
} catch (e) {
  add("코드", "빌드", false, (e.stdout || e.message).split("\n").slice(-4).join(" / "));
}

/* ── 4. 빌드 결과물에 서버 키가 박혔나 ─────────────────────────
 *
 * 08-12 에 만들었다던 `secret-scan.mjs` 가 사라져 있었다. 여기로 흡수한다.
 * 클라이언트 번들에 서비스 롤 키나 API 키가 인라인되면 그 자리에서 사고다 —
 * `NEXT_PUBLIC_` 없이 쓴 값을 클라이언트 컴포넌트에서 건드리면 실제로 새어
 * 나간다. 되돌릴 수 없는 종류의 실수라 기계가 매번 세는 게 맞다.
 */
if (built && existsSync(".next")) {
  const SECRET_KEYS = [
    "SUPABASE_SERVICE_ROLE_KEY",
    "TOSS_SECRET_KEY",
    "ANTHROPIC_API_KEY",
    "OPENAI_API_KEY",
    "RESEND_API_KEY",
    "GOOGLE_PRIVATE_KEY",
    "CRON_SECRET",
    "BLOG_DRAFT_SECRET",
    "SUPABASE_ACCESS_TOKEN",
    "GITHUB_TOKEN",
    "APIFY_TOKEN",
    "FAL_KEY",
    "SUPERTONE_API_KEY",
    "NAVER_AD_SECRET_KEY",
    "INSTAGRAM_SCRAPER_API_KEY",
  ];
  /** .env.local 의 실제 값을 읽어 그 값이 번들에 있는지 본다 (이름이 아니라 값) */
  const values = [];
  if (existsSync(".env.local")) {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const i = line.indexOf("=");
      if (i < 0 || line.startsWith("#")) continue;
      const name = line.slice(0, i).trim();
      const value = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
      // 짧은 값은 우연히 겹칠 수 있어 20자 이상만 본다
      if (SECRET_KEYS.includes(name) && value.length >= 20) values.push({ name, value });
    }
  }

  const walk = (dir, out = []) => {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      const st = statSync(p);
      if (st.isDirectory()) walk(p, out);
      else if (/\.(js|mjs|css|map)$/.test(f)) out.push(p);
    }
    return out;
  };

  // 클라이언트에 내려가는 것만 본다. 서버 번들에는 당연히 들어 있다
  const clientDir = join(".next", "static");
  const files = existsSync(clientDir) ? walk(clientDir) : [];
  const leaks = [];
  for (const p of files) {
    const text = readFileSync(p, "utf8");
    for (const { name, value } of values) {
      if (text.includes(value)) leaks.push(`${name} → ${p}`);
    }
  }
  add(
    "보안",
    "클라이언트 번들 비밀값",
    leaks.length === 0,
    leaks.length ? leaks.slice(0, 3).join(" / ") : `${files.length}개 파일 · 검사한 키 ${values.length}개 · 유출 0`,
  );
} else {
  add("보안", "클라이언트 번들 비밀값", false, "빌드 실패로 검사 못 함");
}

/* ── 5. 블로그 자동화 살아 있나 ────────────────────────────────
 *
 * `blog-doctor.ts` 를 여기서 같이 부른다. 따로 기억해야 하는 명령이
 * 하나라도 남으면 그게 빠지는 것이 하나 남는 것이다.
 */
try {
  const out = run("npx tsx --env-file=.env.local scripts/blog-doctor.ts");
  const blocked = /❌/.test(out);
  add("자동화", "blog-doctor", !blocked, blocked ? "막힌 항목 있음 — 따로 돌려서 확인" : "13항목 통과");
} catch (e) {
  add("자동화", "blog-doctor", false, (e.stdout || e.message).split("\n").slice(-2).join(" / "));
}

/* ── 결과 ─────────────────────────────────────────────────────── */
console.table(results);

const failed = results.filter((r) => r.판정 === "❌");
if (failed.length) {
  console.error(`\n❌ ${failed.length}항목 실패 — 배포하지 않는다.`);
  process.exit(1);
}

/**
 * ⚠️ 여기까지 통과해도 **화면을 본 것은 아니다.**
 *
 * 오늘 놓친 다섯 개 중 셋(난이도 요약·발행 완료 0·표 깨짐)은 타입·린트·빌드를
 * 전부 통과한 상태에서 화면에만 있던 문제였다. 그래서 마지막 줄로 못을 박는다.
 */
console.log(`
✅ 코드 관문 통과.

⚠️ 화면이 바뀌는 변경이었다면 이것만으로 "고쳤다" 고 말하지 않는다.
   배포한 뒤 실제 주소를 브라우저로 열어 눈으로 확인하고, 스크린샷을 남긴다.
   오늘 놓친 5개 중 3개는 이 관문을 전부 통과한 상태에서 화면에만 있었다.`);
