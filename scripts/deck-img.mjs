/**
 * 소개서용 이미지 다이어트.
 *
 *   node scripts/deck-img.mjs
 *
 * 홈페이지가 쓰는 원본(1920px PNG 등)을 소개서에 그대로 박으면 PDF 가 34MB 가
 * 된다. **Gmail 첨부 한도가 25MB** 라 그 상태로는 소개서 메일이 반송될 수 있다.
 *
 * 소개서에서 그 이미지들이 실제로 차지하는 폭은 100mm 안쪽(≈380px @96dpi)이라
 * 1920px 은 과하다. 1200px JPEG(q82)로 줄여 `public/deck/img/` 에 두고,
 * `build-deck.ts` 가 그걸 쓴다. **원본은 건드리지 않는다** — 홈페이지는 그대로.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";

const FF = "node_modules/ffmpeg-static/ffmpeg";
const OUT = "public/deck/img";
const SRC_DIRS = [
  "public/portfolio/framer",
  "public/portfolio/clips",
  "public/portfolio/shorts-yt",
  "public/portfolio/crew",
  "public/sns",
  "public/evidence",
  "public/deck",
];
const MAX_W = 1000;

/**
 * ⚠️ **투명 PNG 는 건드리지 않는다.** (2026-08-20 사고)
 *
 * 로고월을 통째로 망가뜨렸다. `public/logos/*.png` 는 **투명 배경에 검정 단색**
 * 인데 JPEG 로 바꾸니 알파가 사라져 배경이 검게 칠해졌고, 검정 로고가 검정
 * 바탕에 얹혀 **전부 어두운 사각형**이 됐다. 알파가 있는 파일은 원본을 쓴다.
 */
const KEEP_ALPHA = (f) => /\.png$/i.test(f) && /\/logos\//.test(f);

let n = 0,
  before = 0,
  after = 0;

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return p.startsWith(OUT) ? [] : walk(p);
    return /\.(png|jpg|jpeg|webp)$/i.test(e.name) ? [p] : [];
  });
}

for (const dir of SRC_DIRS) {
  for (const f of walk(dir)) {
    if (f.startsWith(OUT)) continue;
    if (KEEP_ALPHA(f)) continue;
    const rel = f.replace(/^public\//, "");
    const dest = join(OUT, rel.replace(/\.(png|jpg|jpeg|webp)$/i, ".jpg"));
    mkdirSync(dirname(dest), { recursive: true });
    try {
      execFileSync(FF, ["-v", "error", "-y", "-i", f,
        "-vf", `scale='min(${MAX_W},iw)':-2`, "-q:v", "6", dest]);
      before += statSync(f).size;
      after += statSync(dest).size;
      n++;
    } catch {
      /* 변환 실패한 것은 원본을 그대로 쓴다 — 빠지는 것보다 낫다 */
    }
  }
}
const mb = (b) => (b / 1048576).toFixed(1) + "MB";
console.log(`소개서용 이미지 ${n}장: ${mb(before)} → ${mb(after)}`);
