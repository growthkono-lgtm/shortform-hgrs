/**
 * 합성 레퍼런스 — **한 화면에 둘 이상이 나오는 씬용.** (2026-08-16)
 *
 *   node --env-file=.env.local scripts/adfilm-compose-ref.mjs feliway pair \
 *     talent/06-wide.png subject/01-front.png "같은 여자와 같은 고양이가 같은 거실에 함께 있다"
 *
 * ── 왜 필요한가 ────────────────────────────────────────────────────────
 * sora 는 `input_reference` 를 **한 장만** 받는다. 사람·고양이·제품이 같이 나오는
 * 씬에서 사람 시트만 넣으면 고양이는 모델이 새로 만든다 — 실제로 마지막 씬에서
 * **크림 태비가 흰 고양이로 바뀌었다.** 시트를 두 장 넣을 수 없으니, 두 장을
 * 먼저 **한 장으로 합쳐** 두고 그걸 레퍼런스로 넣는다.
 *
 * gpt-image-2 는 이미지 여러 장을 입력으로 받아 편집할 수 있다. 그 한 번의
 * 합성이 영상 쪽 일관성을 만든다 — 이미지는 몇 센트, 영상은 초당 과금이다.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";

import { recordSpend } from "./spend.mjs";

const [slug, name, ...rest] = process.argv.slice(2);
const prompt = rest.pop();
const refs = rest;
if (!slug || !name || !refs.length || !prompt) {
  console.error("사용법: <제품slug> <출력이름> <레퍼런스…> <프롬프트>");
  process.exit(1);
}

const root = path.join("drafts", slug);
const outDir = path.join(root, "pairs");
await mkdir(outDir, { recursive: true });

const form = new FormData();
form.append("model", "gpt-image-2");
form.append("size", "1024x1536");
form.append(
  "prompt",
  `${prompt}. Keep every person, animal, object and the room exactly as they appear in the reference images — same face, same fur pattern and markings, same clothing, same furniture and wall. Photorealistic, shot on a phone by a friend, natural indoor daylight, no beauty retouching, 9:16 vertical framing.`,
);
for (const rel of refs) {
  const p = path.join(root, rel);
  form.append("image[]", new Blob([readFileSync(p)], { type: "image/png" }), path.basename(p));
}

const r = await fetch("https://api.openai.com/v1/images/edits", {
  method: "POST",
  headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
  body: form,
});
const j = await r.json();
if (!r.ok) throw new Error(JSON.stringify(j).slice(0, 400));

const file = path.join(outDir, `${name}.png`);
await writeFile(file, Buffer.from(j.data[0].b64_json, "base64"));
console.log(`합성 레퍼런스: ${file}`);

/**
 * gpt-image-2 는 토큰 과금이다 — 입력 텍스트 $5/1M · 입력 이미지 $8/1M ·
 * 출력 이미지 $30/1M (2026-08-18 공시 확인). 합성은 입력 이미지가 여러 장이라
 * 생성보다 비싸다. 장당 정액으로 짐작하지 않고 응답의 usage 를 그대로 곱한다.
 */
const u = j.usage;
if (!u) {
  console.warn("  [장부] 이 응답에 usage 가 없어 원가를 못 셌습니다");
} else {
  const d = u.input_tokens_details ?? {};
  const usd =
    ((d.text_tokens ?? u.input_tokens ?? 0) / 1e6) * 5 +
    ((d.image_tokens ?? 0) / 1e6) * 8 +
    ((u.output_tokens ?? 0) / 1e6) * 30;
  await recordSpend("openai", "image", `${slug}/${name}`, usd, {
    model: "gpt-image-2",
    size: "1024x1536",
    inputImages: rest.length - 1,
    usage: u,
  });
}
