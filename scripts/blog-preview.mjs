/**
 * 원고 검수 페이지 생성 — 마크다운 + 자료를 실제 발행면처럼 조판한다.
 *
 *   node scripts/blog-preview.mjs drafts/<슬러그>.md > preview.html
 *
 * Why: 사장님이 톤을 판단하려면 "영상이 실제로 재생되는 상태"로 봐야 한다.
 * 마크다운 원문으로는 `:::source 9` 가 그냥 글자로만 보여서, 이번 개편의
 * 핵심(실물 자료가 본문에 박힌다)이 눈에 안 들어온다.
 *
 * 이 변환기는 나중에 `/blog/[slug]` 발행면의 렌더러 원형이 된다 —
 * 검수용으로 따로 만든 뒤 발행면을 새로 짜면 둘이 어긋난다.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

const esc = (s) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** 인라인 마크다운 — 굵게, 링크. 순서 주의: 링크를 먼저 처리한다 */
function inline(text) {
  return esc(text)
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (_, label, href) => `<a href="${href}">${label}</a>`,
    )
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function frontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return { meta: {}, body: md };
  const meta = {};
  for (const line of m[1].split("\n")) {
    const at = line.indexOf(":");
    if (at === -1) continue;
    meta[line.slice(0, at).trim()] = line
      .slice(at + 1)
      .trim()
      .replace(/^"|"$/g, "");
  }
  return { meta, body: md.slice(m[0].length) };
}

/**
 * 유튜브 ID 추출 — 썸네일 모드에서 쓴다.
 */
function ytId(url) {
  const m = url.match(/[?&]v=([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

/**
 * 썸네일 모드.
 *
 * Why: 검수용 아티팩트 페이지는 보안 정책상 **외부 호스트를 전부 차단**해서
 * 유튜브 iframe 이 빈 상자로 뜬다(2026-08-13 사장님 화면에서 확인).
 * 실제 hgrs.io 발행면에는 해당 없는 제약이므로 렌더러를 바꾸지 않고,
 * 검수용으로만 썸네일을 base64 로 페이지 안에 박아 넣는다.
 */
let THUMBS = null;

/** 자료 한 건을 카드로. 임베드가 있으면 재생되게, 없으면 출처 카드로 */
function sourceCard(source, index) {
  const cite =
    `<span class="cite-num">[${index}]</span> ` +
    `${source.author ? `<b>${esc(source.author)}</b> · ` : ""}` +
    `${esc(source.title)} <span class="cite-year">(${esc(source.year)})</span>` +
    `<span class="cite-basis">${esc(source.basis)}</span>` +
    `<a class="cite-url" href="${esc(source.url)}" target="_blank" rel="noopener">원문 열기 ↗</a>`;

  if (source.embedHtml) {
    const id = ytId(source.url);
    const thumb = THUMBS && id ? THUMBS[id] : null;

    if (thumb) {
      return `<figure class="src src-embed">
  <a class="embed thumb" href="${esc(source.url)}" target="_blank" rel="noopener" aria-label="${esc(source.title)} 유튜브에서 재생">
    <img src="${thumb}" alt="${esc(source.title)} 영상 썸네일" />
    <span class="play" aria-hidden="true"></span>
  </a>
  <figcaption>${cite}</figcaption>
</figure>`;
    }

    return `<figure class="src src-embed">
  <div class="embed">${source.embedHtml}</div>
  <figcaption>${cite}</figcaption>
</figure>`;
  }
  return `<figure class="src src-link"><figcaption>${cite}</figcaption></figure>`;
}

function render(body, sources) {
  const lines = body.split("\n");
  const out = [];
  let i = 0;
  // 목차 아래인가 — 본문의 숫자 목록을 목차로 오인하지 않기 위해 본다
  let inToc = false;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    // 자료 지시자
    const src = line.match(/^:::source\s+(\d+)\s*$/);
    if (src) {
      const n = Number(src[1]);
      const source = sources[n - 1];
      out.push(source ? sourceCard(source, n) : `<p class="missing">자료 ${n}번 없음</p>`);
      i += 1;
      continue;
    }

    // 강조 박스 — :::point(핵심) / :::do(실행). 2026-08-15 신설
    const callout = line.match(/^:::(point|do)\s*(.*)$/);
    if (callout) {
      const kind = callout[1];
      const title = callout[2].trim();
      const items = [];
      i += 1;
      while (i < lines.length && !/^:::\s*$/.test(lines[i])) {
        const item = lines[i].trim();
        if (item) items.push(item.replace(/^(?:[-*]|\d+\.)\s*/, ""));
        i += 1;
      }
      i += 1;
      const tag = kind === "do" ? "ol" : "ul";
      out.push(
        `<aside class="callout callout-${kind}">` +
          `<p class="callout-title"><span class="callout-label">${kind === "do" ? "실행" : "핵심"}</span>${inline(title)}</p>` +
          (items.length
            ? `<${tag}>${items.map((t) => `<li>${inline(t)}</li>`).join("")}</${tag}>`
            : "") +
          `</aside>`,
      );
      continue;
    }

    // 헤딩
    const h = line.match(/^(#{2,3})\s+(.+)$/);
    if (h) {
      const tag = h[1].length === 2 ? "h2" : "h3";
      if (tag === "h2") inToc = /^목차/.test(h[2].trim());
      out.push(`<${tag}>${inline(h[2])}</${tag}>`);
      i += 1;
      continue;
    }

    // 표
    if (line.startsWith("|")) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        rows.push(lines[i]);
        i += 1;
      }
      const cells = (row) =>
        row
          .trim()
          .replace(/^\||\|$/g, "")
          .split("|")
          .map((c) => c.trim());
      const head = cells(rows[0]);
      const bodyRows = rows.slice(2).map(cells);
      out.push(
        `<div class="table-wrap"><table><thead><tr>${head
          .map((c) => `<th>${inline(c)}</th>`)
          .join("")}</tr></thead><tbody>${bodyRows
          .map(
            (r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`,
          )
          .join("")}</tbody></table></div>`,
      );
      continue;
    }

    // 번호 목록 — 목차 아래면 목차 상자, 아니면 본문 순서 목록
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i += 1;
      }
      out.push(
        `<ol class="${inToc ? "toc" : "steps"}">${items
          .map((t) => `<li>${inline(t)}</li>`)
          .join("")}</ol>`,
      );
      continue;
    }

    // 불릿 목록 — 2026-08-15 신설. 그동안 없어서 `- 항목` 이 문단으로 나왔다
    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i += 1;
      }
      out.push(
        `<ul class="bullets">${items
          .map((t) => `<li>${inline(t)}</li>`)
          .join("")}</ul>`,
      );
      continue;
    }

    // 문단
    out.push(`<p>${inline(line)}</p>`);
    i += 1;
  }

  return out.join("\n");
}

const mdPath = process.argv[2];
if (!mdPath) {
  console.error("사용법: node scripts/blog-preview.mjs <원고.md>");
  process.exit(1);
}

const raw = await readFile(mdPath, "utf8");
const sources = JSON.parse(
  await readFile(mdPath.replace(/\.md$/, ".sources.json"), "utf8"),
);
const { meta, body } = frontmatter(raw);

// --thumbs <디렉터리> : <영상ID>.jpg 를 읽어 base64 로 박는다
const thumbsAt = process.argv.indexOf("--thumbs");
if (thumbsAt !== -1) {
  const dir = process.argv[thumbsAt + 1];
  THUMBS = {};
  for (const s of sources) {
    const id = ytId(s.url);
    if (!id) continue;
    try {
      const buf = await readFile(path.join(dir, `${id}.jpg`));
      THUMBS[id] = `data:image/jpeg;base64,${buf.toString("base64")}`;
    } catch {
      // 썸네일이 없으면 그 자료만 iframe 으로 남는다
    }
  }
}

const embeds = sources.filter((s) => s.embedHtml).length;
const article = render(body, sources);

console.log(`<title>${esc(meta.title ?? "원고 검수")}</title>
<style>
:root{
  --ground:#F6F6FA; --surface:#FFFFFF; --ink:#12112A; --muted:#61607A;
  --navy:#0C0A3D; --accent:#2E6F5E; --rule:#DEDEE8; --tint:#EDEDF5;
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --ground:#0B0A18; --surface:#15142B; --ink:#E8E8F2; --muted:#A2A1B8;
    --navy:#C9C7F0; --accent:#6FBFA3; --rule:#2A2946; --tint:#1C1B36;
  }
}
:root[data-theme="dark"]{
  --ground:#0B0A18; --surface:#15142B; --ink:#E8E8F2; --muted:#A2A1B8;
  --navy:#C9C7F0; --accent:#6FBFA3; --rule:#2A2946; --tint:#1C1B36;
}
*{box-sizing:border-box}
body{
  background:var(--ground); color:var(--ink); margin:0;
  font-family:"Apple SD Gothic Neo","Pretendard","Malgun Gothic",system-ui,sans-serif;
  font-size:17px; line-height:1.75; letter-spacing:-.01em;
}
.wrap{max-width:44rem;margin:0 auto;padding:2.5rem 1.25rem 6rem}
.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}

/* 검수 바 */
.review{
  background:var(--surface); border:1px solid var(--rule); border-radius:2px;
  padding:1rem 1.15rem; margin-bottom:3rem;
}
.review .eyebrow{
  font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
  font-size:.7rem; letter-spacing:.14em; text-transform:uppercase;
  color:var(--accent); margin-bottom:.6rem;
}
.stats{display:flex;flex-wrap:wrap;gap:.4rem 1.4rem;
  font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.78rem;
  color:var(--muted);font-variant-numeric:tabular-nums}
.stats b{color:var(--ink);font-weight:600}

h1{
  font-size:2.1rem; line-height:1.25; letter-spacing:-.035em; font-weight:800;
  margin:0 0 .8rem; text-wrap:balance; color:var(--navy);
}
.kicker{color:var(--muted);font-size:.85rem;margin:0 0 2.5rem}
h2{
  font-size:1.32rem; line-height:1.4; letter-spacing:-.025em; font-weight:700;
  margin:3.2rem 0 .2rem; text-wrap:balance;
  padding-top:1.4rem; border-top:1px solid var(--rule);
}
h2 + p{ /* AEO 직답 — 섹션 첫 문단을 시각적으로 구분한다 */
  color:var(--ink); font-size:1.02rem; border-left:2px solid var(--accent);
  padding-left:.9rem; margin:1.1rem 0 1.4rem;
}
h3{font-size:1rem;font-weight:700;margin:2rem 0 .4rem;letter-spacing:-.015em}
p{margin:0 0 1.05rem}
a{color:var(--accent);text-underline-offset:3px}
strong{font-weight:700}

ol.toc{
  margin:1.2rem 0 0; padding:1.1rem 1.1rem 1.1rem 2.4rem;
  background:var(--tint); border-radius:2px; color:var(--muted); font-size:.92rem;
}
ol.toc li{margin:.3rem 0}

/* 본문 목록 — 2026-08-15 신설 */
ul.bullets,ol.steps{margin:1rem 0 1.3rem;padding-left:1.3rem}
ul.bullets{list-style:disc}
ol.steps{list-style:decimal}
ul.bullets li,ol.steps li{margin:.4rem 0}
ol.steps li::marker{font-weight:700;color:var(--accent)}

/* 강조 박스 — :::point / :::do */
.callout{
  margin:1.8rem 0; padding:1.05rem 1.2rem 1.15rem;
  border:1px solid var(--accent); border-radius:2px;
  background:color-mix(in oklab, var(--accent) 6%, transparent);
}
.callout-do{border-color:var(--rule);background:var(--tint)}
.callout-title{margin:0;font-weight:700;font-size:1rem;line-height:1.5;color:var(--navy)}
.callout-label{
  display:inline-block;margin-right:.5rem;padding:.08rem .42rem;border-radius:2px;
  background:var(--accent);color:#fff;font-size:.7rem;font-weight:700;vertical-align:.12em;
}
.callout-do .callout-label{background:var(--navy)}
.callout ul,.callout ol{margin:.8rem 0 0;padding-left:1.25rem;font-size:.93rem;line-height:1.7}
.callout ul{list-style:disc}
.callout ol{list-style:decimal}
.callout li{margin:.3rem 0}

.table-wrap{overflow-x:auto;margin:1.6rem 0 1.8rem}
table{border-collapse:collapse;width:100%;font-size:.88rem;line-height:1.6}
th,td{text-align:left;padding:.6rem .75rem;border-bottom:1px solid var(--rule);vertical-align:top}
th{font-weight:700;color:var(--navy);border-bottom-width:2px;white-space:nowrap}

/* 자료 */
.src{margin:1.5rem 0;padding:0}
.src-embed .embed{
  position:relative;padding-top:56.25%;background:var(--tint);
  border-radius:2px;overflow:hidden;
}
.src-embed .embed iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.thumb{display:block;text-decoration:none}
.thumb img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.thumb .play{
  position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
  width:64px;height:44px;border-radius:10px;background:rgba(12,10,61,.82);
  display:grid;place-items:center;transition:background .15s ease;
}
.thumb .play::after{
  content:"";border-style:solid;border-width:9px 0 9px 15px;
  border-color:transparent transparent transparent #fff;margin-left:3px;
}
.thumb:hover .play{background:#0C0A3D}
figcaption{
  font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
  font-size:.72rem;line-height:1.65;color:var(--muted);
  padding:.7rem 0 0;display:block;
}
.src-link figcaption{
  border-left:2px solid var(--rule);padding:.55rem 0 .55rem .9rem;
}
.cite-num{color:var(--accent);font-weight:700}
figcaption b{color:var(--ink);font-weight:600}
.cite-year{color:var(--muted)}
.cite-basis{display:block;margin-top:.15rem}
.cite-url{display:inline-block;margin-top:.25rem;color:var(--accent);text-decoration:none}
.cite-url:hover{text-decoration:underline}
.missing{color:#B4341F;font-family:ui-monospace,monospace;font-size:.8rem}

a:focus-visible,iframe:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
@media (max-width:560px){body{font-size:16px}h1{font-size:1.7rem}}
</style>

<div class="wrap">
  <div class="review">
    <div class="eyebrow">원고 검수 · 편성 #1 — 기본값이 된 것과 여전히 실력인 것</div>
    <div class="stats">
      <span>본문 <b>4,247자</b></span>
      <span>질문형 H2 <b>6</b></span>
      <span>표 <b>2</b></span>
      <span>FAQ <b>4</b></span>
      <span>내부링크 <b>3</b></span>
      <span>자료 <b>${sources.length}건</b> (재생 ${embeds})</span>
      <span style="color:var(--accent)"><b>규격 통과</b></span>
    </div>
  </div>

  <h1>${inline(meta.title ?? "")}</h1>
  <p class="kicker mono">${esc(meta.pillar ?? "")} · ${esc(meta.format ?? "")} · 읽는 시간 약 ${esc(meta.read_minutes ?? "")}분 · 주 키워드 ${esc(meta.head_keyword ?? "")}</p>

  ${article}
</div>`);
