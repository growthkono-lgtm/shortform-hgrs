/**
 * 비밀값 유출 검사.
 *
 *   npm run build && node scripts/secret-scan.mjs
 *
 * "이 파일은 서버 전용이니까 괜찮다"는 추론 대신 **빌드 결과물에 실제 값이
 * 박혀 있는지**를 본다. 서버 전용 모듈 하나가 클라이언트 컴포넌트에 딸려
 * 들어가는 사고는 import 한 줄로 조용히 일어나고, 코드를 읽어서는 잘 안 보인다.
 *
 * NEXT_PUBLIC_ 은 애초에 브라우저로 나가라고 만든 값이라 검사 대상이 아니다.
 * SUPABASE_PROJECT_REF 처럼 공개 URL 의 일부인 값도 제외한다 — 매번 빨간불이
 * 뜨면 진짜 유출이 났을 때 그냥 넘기게 된다.
 */
import { readFileSync, existsSync } from "node:fs";
import { globSync } from "node:fs";

const envPath = new URL("../.env.local", import.meta.url);
if (!existsSync(envPath)) {
  console.error(".env.local 이 없습니다");
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const [k, ...rest] = l.split("=");
      return [k.trim(), rest.join("=").trim().replace(/^["']|["']$/g, "")];
    }),
);

/** 공개돼도 되는 값은 검사에서 뺀다 */
const publicValues = Object.entries(env)
  .filter(([k]) => k.startsWith("NEXT_PUBLIC_"))
  .map(([, v]) => v);

const secrets = Object.entries(env).filter(([k, v]) => {
  if (k.startsWith("NEXT_PUBLIC_")) return false;
  if (v.length < 12) return false;
  // 공개 값 안에 통째로 들어가는 조각(프로젝트 ref 등)은 비밀이 아니다
  if (publicValues.some((pv) => pv.includes(v))) return false;
  return true;
});

const targets = [
  ...globSync(".next/static/**/*.js"),
  ...globSync(".next/server/app/**/*.html"),
];

if (targets.length === 0) {
  console.error("빌드 결과물이 없습니다. npm run build 를 먼저 돌리세요.");
  process.exit(1);
}

console.log(
  `검사: 브라우저로 나가는 파일 ${targets.length}개 / 서버 전용 키 ${secrets.length}개`,
);

const leaks = [];
for (const file of targets) {
  const body = readFileSync(file, "utf8");
  for (const [key, value] of secrets) {
    if (body.includes(value)) leaks.push({ key, file });
  }
}

if (leaks.length) {
  console.error("\n🔴 클라이언트로 나가는 파일에서 서버 전용 값을 찾았습니다:");
  for (const l of leaks) console.error(`   ${l.key} → ${l.file}`);
  console.error("\n해당 값을 읽는 모듈이 클라이언트 컴포넌트에 딸려 들어갔습니다.");
  process.exit(1);
}

console.log("\n✅ 유출 없음.");
