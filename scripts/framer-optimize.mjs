/**
 * 프레이머에서 받아 온 원본 이미지를 소개서·웹에 쓸 크기로 줄인다.
 *
 * 원본 그대로면 79MB 라 소개서 PDF 가 30MB 가 된다(메일 첨부 한도를 넘는다).
 * 가로 1600px 로 맞추고 PNG 는 팔레트 압축한다 — 도판의 글씨가 읽혀야 하므로
 * 그 아래로는 줄이지 않는다.
 */
import sharp from "sharp";
import { readdirSync, statSync, writeFileSync } from "node:fs";

const dir = "public/portfolio/framer";
let before = 0, after = 0, n = 0;
for (const f of readdirSync(dir)) {
  if (!/\.(png|jpe?g|webp)$/i.test(f)) continue;
  const p = `${dir}/${f}`;
  const size = statSync(p).size;
  before += size;
  const img = sharp(p);
  const meta = await img.metadata();
  if ((meta.width ?? 0) <= 1600 && size < 400_000) { after += size; continue; }
  const pipe = sharp(p).resize({ width: Math.min(meta.width ?? 1600, 1600), withoutEnlargement: true });
  const buf = /\.png$/i.test(f)
    ? await pipe.png({ compressionLevel: 9, palette: true }).toBuffer()
    : await pipe.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  if (buf.length < size) { writeFileSync(p, buf); n++; after += buf.length; } else after += size;
}
const mb = (b) => (b / 1048576).toFixed(1);
console.log(`${n}장 재인코딩 · ${mb(before)}MB → ${mb(after)}MB`);
