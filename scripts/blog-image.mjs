/**
 * 블로그 도판 생성 — OpenAI gpt-image-1.
 *
 *   node scripts/blog-image.mjs <파일명> "<프롬프트>" [size]
 *   → public/blog/<파일명>.png
 *
 * 블로그 글에 쓸 그림은 사진이 아니라 **설명 도판**이다. 사례 사진을 우리가
 * 가져다 쓸 수는 없으니(남의 브랜드 자산이다), 글이 설명하는 구조를 그림으로
 * 다시 그린다. 프롬프트에 한글 텍스트를 넣지 않는다 — 모델이 한글을 그리면
 * 열에 아홉은 깨진 글자가 나온다. 글자는 캡션으로 따로 붙인다.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const [name, prompt, size = "1536x1024"] = process.argv.slice(2);
if (!name || !prompt) {
  console.error('사용법: node scripts/blog-image.mjs <파일명> "<프롬프트>" [size]');
  process.exit(1);
}

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const key = env.match(/^OPENAI_API_KEY=(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, "");
if (!key) throw new Error(".env.local 에 OPENAI_API_KEY 가 없습니다");

const res = await fetch("https://api.openai.com/v1/images/generations", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
  },
  body: JSON.stringify({
    model: "gpt-image-1",
    prompt,
    size,
    quality: "high",
    n: 1,
  }),
});

if (!res.ok) {
  console.error(await res.text());
  process.exit(1);
}

const json = await res.json();
const b64 = json.data?.[0]?.b64_json;
if (!b64) throw new Error(`이미지가 오지 않았습니다: ${JSON.stringify(json).slice(0, 400)}`);

const dir = new URL("../public/blog/", import.meta.url).pathname;
mkdirSync(dir, { recursive: true });
const out = join(dir, `${name}.png`);
writeFileSync(out, Buffer.from(b64, "base64"));
console.log(out);
