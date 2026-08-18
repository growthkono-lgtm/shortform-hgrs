/**
 * 캐릭터 시트 — 영상에 나올 인물을 **먼저 이미지로 고정한다.** (2026-08-16 신설)
 *
 *   node --env-file=.env.local scripts/adfilm-talent.mjs <슬러그>
 *
 * ── 왜 필요한가 ────────────────────────────────────────────────────────
 * v10 까지 우리는 텍스트만 주고 영상을 만들었다. 그러면 모델이 **컷마다 사람을
 * 새로 상상한다.** 사장님이 보신 "얼굴이 검게 깨진다"·"씬이 흐름에 안 맞는다"가
 * 거기서 나왔다. 2026년 현재 인물 영상의 해법은 얼굴을 피하는 게 아니라
 * **레퍼런스 이미지로 인물을 고정하는 것**이다(Veo 3.1 Ingredients,
 * Seedance reference-to-video, Kling @Element — 전부 같은 방향).
 *
 * ── 어떻게 고정하나 ────────────────────────────────────────────────────
 * 한 장(base)을 먼저 뽑고, **그 장을 레퍼런스로 넣어** 나머지 각도·표정을 그린다.
 * 각각을 따로 생성하면 서로 다른 사람이 나온다. 순서가 규격이다.
 *
 * 프롬프트는 아티클이 준 네 덩어리를 그대로 쓴다 — 인물 / 배경 / 카메라 / 스타일.
 * 추상어("멋지게")를 쓰지 않는다. 그건 통제를 포기하는 말이다.
 *
 * 결과물은 `drafts/<슬러그>/talent/` 에 떨어진다. 이걸 사장님이 보고 고르시면
 * 그 시트가 모든 컷의 레퍼런스가 된다. **고르기 전에는 영상을 만들지 않는다** —
 * 이미지는 몇 센트, 영상은 컷당 몇 달러다.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

import { recordSpend } from "./spend.mjs";

const MODEL = "gpt-image-2";
const SIZE = "1024x1536"; // 세로. 릴스·숏폼 비율에 맞춰 처음부터 세로로 잡는다

/* ── 인물 규격 ─────────────────────────────────────────────────────────
 * 이 값이 곧 "우리 인물 규격"이다. 제품이 바뀌면 여기만 바뀐다.
 * 광고 소재(A상품)는 클라마다 인물을 새로 만든다 — 초상권 없는 얼굴을
 * 재사용하면 브랜드가 겹치고 의미가 없어진다. */
const PERSONA = {
  "feliway-cat": {
    label: "펠리웨이 — 수혜자(고양이)",
    /**
     * 수혜자 시트. 보호자 시점형에서 **증거를 만드는 역할**이라 오히려 이쪽이
     * 더 중요하다. 컷마다 다른 고양이가 나오면 보는 사람은 설명 없이 안다.
     */
    who: "a Korean domestic shorthair cat, cream and grey tabby with white chest and paws, medium fluffy coat, amber-green eyes, adult but not old, a small nick on the left ear tip",
    where:
      "a small Korean apartment living room in daylight, beige wall, low fabric sofa, light wood floor, a cat tree in the background",
    style:
      "shot on a phone camera by the owner, natural indoor daylight from a window, realistic fur detail, no beauty retouching, documentary-like pet photo, not a studio shot",
  },
  feliway: {
    label: "펠리웨이 — 고양이 보호자",
    who: "A Korean woman in her early 30s, natural everyday face without heavy makeup, shoulder-length dark brown hair loosely tied back, wearing a soft oatmeal-colored cotton lounge sweater",
    where:
      "a small Korean apartment living room in daylight, beige wall, low fabric sofa, a cat tree in the background, warm and slightly lived-in",
    style:
      "shot on a phone camera by a friend, natural indoor daylight from a window, realistic skin texture with visible pores, no beauty retouching, documentary-like UGC look, not a studio portrait",
  },
};

/**
 * 시트 구성 — 각도 3 + 표정 2 + 관계컷 1.
 *
 * 각도 셋은 영상 모델이 얼굴을 3차원으로 잡게 하려는 것이고, 표정 둘은
 * 우리 서사 8단에서 실제로 쓰는 감정(문제 인식 / 안심)이다. 마지막 한 장은
 * 인물과 공간의 관계를 고정한다 — 컷마다 집이 바뀌는 것도 같은 종류의 사고다.
 */
/**
 * 수혜자(동물) 시트 — 사람과 프레임 구성이 다르다.
 *
 * 사람은 각도·표정으로 나누지만, 동물은 **행동**으로 나눈다. 우리가 실제로
 * 쓸 컷이 "긁는다 / 숨는다 / 다가와 냄새를 맡는다 / 늘어져 잔다" 라서
 * 그 자세를 미리 고정해 두지 않으면 영상 단계에서 다른 고양이가 나온다.
 */
const SUBJECT_FRAMES = [
  {
    key: "01-front",
    camera: "a straight-on close-up at the cat's eye level, face filling the frame",
    note: "sitting calmly, looking directly into the camera, ears forward",
    base: true,
  },
  {
    key: "02-scratching",
    camera: "a medium shot from the side at floor level",
    note: "standing on hind legs scratching the wall beside the sofa, front claws against the wallpaper",
  },
  {
    key: "03-hiding",
    camera: "a low-angle close-up looking into the gap under furniture",
    note: "crouched in the shadow under the sofa, only the face and eyes catching light, ears flattened back",
  },
  {
    key: "04-sniffing",
    camera: "a medium close-up at floor level",
    note: "walking toward a wall outlet and lifting its nose to sniff the air, tail raised",
  },
  {
    key: "05-relaxed",
    camera: "a full shot from a slightly high angle",
    note: "lying stretched out on its side in a patch of window sunlight on the wooden floor, eyes half closed",
  },
  {
    key: "06-cheek-rub",
    camera: "a tight close-up at floor level",
    note: "rubbing its cheek against the corner of a low object, eyes closed, relaxed",
  },
];

const FRAMES = [
  {
    key: "01-front",
    camera: "a straight-on medium close-up at eye level, head and shoulders filling the frame",
    note: "neutral relaxed expression, looking directly into the camera",
    base: true,
  },
  {
    key: "02-three-quarter",
    camera: "a three-quarter angle medium close-up at eye level",
    note: "same neutral expression, head turned about 45 degrees to her left",
  },
  {
    key: "03-profile",
    camera: "a side profile medium close-up at eye level",
    note: "same neutral expression, looking off-frame",
  },
  {
    key: "04-concerned",
    camera: "a straight-on medium close-up at eye level",
    note: "a worried, slightly frowning expression, looking down at something on the floor",
  },
  {
    key: "05-relieved",
    camera: "a straight-on medium close-up at eye level",
    note: "a calm relieved half-smile, eyes softened",
  },
  {
    key: "06-wide",
    camera: "a full shot from a slightly low angle, the whole room visible around her",
    note: "sitting on the floor beside the sofa, relaxed posture",
  },
];

const slug = process.argv[2] ?? "feliway";
const p = PERSONA[slug];
if (!p) {
  console.error(`인물 규격에 '${slug}' 가 없습니다. PERSONA 에 먼저 정의하세요`);
  process.exit(1);
}

/** 사람 시트인지 수혜자(동물) 시트인지 — 프레임 구성이 다르다 */
const frames = slug.endsWith("-cat") || slug.endsWith("-pet") ? SUBJECT_FRAMES : FRAMES;

const outDir = path.join("drafts", slug.replace(/-(cat|pet)$/, ""), slug.endsWith("-cat") || slug.endsWith("-pet") ? "subject" : "talent");
await mkdir(outDir, { recursive: true });

/** 아티클의 네 덩어리 — 인물 / 배경 / 카메라 / 스타일 */
const promptFor = (frame) =>
  [
    `${p.who}. ${frame.note}.`,
    `The setting is ${p.where}.`,
    `The camera captures ${frame.camera}.`,
    `Style: ${p.style}. Photorealistic, 9:16 vertical framing.`,
  ].join(" ");

const auth = { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` };

/**
 * gpt-image-2 는 장당 정액이 아니라 **토큰 과금**이다. (2026-08-18 공시 확인)
 *   입력 텍스트 $5/1M · 입력 이미지 $8/1M · 출력 이미지 $30/1M
 * 그래서 "장당 얼마" 로 지어내지 않고 응답의 `usage` 를 그대로 곱한다.
 */
const IMAGE_PRICE = { text: 5, imageIn: 8, imageOut: 30 };

function imageCost(usage) {
  if (!usage) return null;
  const d = usage.input_tokens_details ?? {};
  const text = d.text_tokens ?? usage.input_tokens ?? 0;
  const imgIn = d.image_tokens ?? 0;
  const out = usage.output_tokens ?? 0;
  return (
    (text / 1e6) * IMAGE_PRICE.text +
    (imgIn / 1e6) * IMAGE_PRICE.imageIn +
    (out / 1e6) * IMAGE_PRICE.imageOut
  );
}

async function generate(prompt) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, prompt, size: SIZE, n: 1 }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json).slice(0, 400));
  lastUsage = json.usage ?? null;
  return Buffer.from(json.data[0].b64_json, "base64");
}

/** 직전 호출의 실사용량 — 장부에 적을 때 쓴다 */
let lastUsage = null;

/** base 를 레퍼런스로 넣어 같은 사람을 유지한다 */
async function edit(prompt, baseBuf) {
  const form = new FormData();
  form.append("model", MODEL);
  form.append("prompt", prompt);
  form.append("size", SIZE);
  form.append("image[]", new Blob([baseBuf], { type: "image/png" }), "base.png");

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: auth,
    body: form,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json).slice(0, 400));
  lastUsage = json.usage ?? null;
  return Buffer.from(json.data[0].b64_json, "base64");
}

let base = null;
for (const frame of frames) {
  const file = path.join(outDir, `${frame.key}.png`);
  if (existsSync(file)) {
    console.log(`건너뜀 (이미 있음): ${file}`);
    continue;
  }

  const prompt = frame.base
    ? promptFor(frame)
    : `Keep the exact same subject from the reference image — same face, same markings, same coat or clothing, same room. ${promptFor(frame)}`;

  process.stdout.write(`${frame.key} … `);
  const buf = frame.base || !base ? await generate(prompt) : await edit(prompt, base);
  await writeFile(file, buf);
  if (frame.base) base = buf;
  console.log(`${(buf.length / 1024).toFixed(0)}KB`);

  const usd = imageCost(lastUsage);
  if (usd == null) {
    // 응답에 usage 가 없으면 지어내지 않는다. 얼마인지 모른다고 적는다
    console.warn("  [장부] 이 응답에 usage 가 없어 원가를 못 셌습니다");
  } else {
    await recordSpend("openai", "image", `${path.basename(outDir)}/${frame.key}`, usd, {
      model: MODEL,
      size: SIZE,
      usage: lastUsage,
    });
  }
}

console.log(`\n캐릭터 시트: ${outDir}`);
console.log("이 시트를 고르신 뒤에 영상을 만듭니다. 고르기 전에는 한 컷도 생성하지 않습니다.");
