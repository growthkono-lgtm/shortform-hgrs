import { createPublicClient } from "@/lib/supabase/server";

import { readingTime, type FormatKey, type PillarKey } from "./blog-spec";
import type { Source } from "./blog-sources";

/**
 * 발행면이 읽는 글 저장소.
 *
 * 2026-08-13 오전: 파일(`content/blog/*.md`)로 시작했다. 마이그레이션이 아직
 * 적용 전이라 글 한 편 띄우자고 스키마 배포를 앞세울 수 없었다.
 *
 * 2026-08-13 오후: **DB 로 옮겼다.** 사장님이 어드민에서 승인 버튼만 눌러
 * 발행하는 흐름을 원하셨는데, 파일이면 승인할 때마다 재배포가 필요하다.
 * DB 면 승인 즉시 반영되고, 스케줄이 밀어 넣은 초안도 같은 자리에 쌓인다.
 *
 * 읽기는 anon 클라이언트로 한다 — RLS 가 `status = 'published'` 만 열어 주므로
 * 초안이 공개면에 새어 나갈 경로가 애초에 없다. service key 로 읽으면 그 보호가
 * 사라지고, 필터를 한 번 빠뜨리는 순간 미승인 원고가 그대로 노출된다.
 *
 * 렌더러(renderBody)는 여기 하나뿐이다. `scripts/blog-preview.mjs` 는 검수용
 * 사본이라 조판이 갈릴 수 있는데, **발행면의 기준은 이 파일이다.**
 */

export type PostMeta = {
  slug: string;
  /** 발행 순번. 인사이트에만 붙는다 — 목록·어드민이 같은 번호로 글을 부른다 */
  seq: number | null;
  /** insight: 키워드를 노린 인사이트 / story: 우리가 한 프로젝트의 기록 */
  kind: "insight" | "story";
  /** 고객 이야기일 때만 채워진다 */
  client: { name: string; industry: string; period: string } | null;
  /** 발행 시각. 목록 정렬과 Article 스키마에 쓴다 */
  publishedAt: string | null;
  title: string;
  pillar: PillarKey;
  format: FormatKey;
  headKeyword: string;
  /** 본문에 깔린 연관 검색어 — Article 스키마의 keywords 가 된다 */
  subKeywords: string[];
  /** 순수 글자 수 — wordCount 로 나간다 */
  chars: number | null;
  readMinutes: number;
  /** 본문 첫 문단 — 목록의 요약이자 og:description 이 된다 */
  lead: string;
};

export type Post = PostMeta & {
  body: string;
  sources: Source[];
};

/**
 * 리드 문단 — 읽는 시간 표기와 목차를 건너뛴 첫 산문 문단.
 * 목록 카드와 메타 설명에 같은 문장을 쓰기 위해 한 곳에서 뽑는다.
 */
function leadOf(body: string): string {
  for (const block of body.split(/\n\s*\n/)) {
    const t = block.trim();
    if (!t || t.startsWith("#") || t.startsWith("📖") || t.startsWith(":::")) {
      continue;
    }
    return t.replace(/\*\*/g, "");
  }
  return "";
}

type Row = {
  slug: string;
  title: string;
  pillar: string;
  format: string;
  body: string | null;
  sources: unknown;
  plan: unknown;
  chars: number | null;
  read_minutes: number | null;
  published_at: string | null;
  seq: number | null;
  kind: string;
  client_name: string | null;
  client_industry: string | null;
  client_period: string | null;
};

function toPost(row: Row): Post {
  const body = row.body ?? "";
  return {
    slug: row.slug,
    seq: row.seq,
    kind: row.kind === "story" ? "story" : "insight",
    client: row.client_name
      ? {
          name: row.client_name,
          industry: row.client_industry ?? "",
          period: row.client_period ?? "",
        }
      : null,
    title: row.title,
    pillar: row.pillar as PillarKey,
    format: row.format as FormatKey,
    headKeyword:
      (row.plan as { head_keyword?: string } | null)?.head_keyword ?? "",
    subKeywords:
      (row.plan as { sub_keywords?: string[] } | null)?.sub_keywords ?? [],
    chars: row.chars ?? null,
    readMinutes: row.read_minutes ?? readingTime(body.length),
    publishedAt: row.published_at,
    lead: leadOf(body),
    body,
    sources: (row.sources as Source[] | null) ?? [],
  };
}

const COLUMNS =
  "slug, title, pillar, format, body, sources, plan, chars, read_minutes, published_at, seq, kind, client_name, client_industry, client_period";

export async function listPosts(): Promise<PostMeta[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("blog_post")
    .select(COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(100);

  return (data ?? []).map((row) => {
    const { body: _body, sources: _sources, ...meta } = toPost(row as Row);
    return meta;
  });
}

export async function getPost(slug: string): Promise<Post | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("blog_post")
    .select(COLUMNS)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  return data ? toPost(data as Row) : null;
}

/* ── 본문 렌더 ─────────────────────────────────────────────────────────── */

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** 인라인 — 링크를 먼저 처리해야 굵게 표시가 URL 안을 건드리지 않는다 */
function inline(text: string): string {
  return esc(text)
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (_, label: string, href: string) =>
        `<a href="${href}"${href.startsWith("/") ? "" : ' target="_blank" rel="noopener"'}>${label}</a>`,
    )
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

/**
 * 출처 한 줄 — **작게, 자료 바로 아래**. (2026-08-13 사장님 지적)
 *
 * 앞선 판은 출처를 모노스페이스 세 줄짜리 덩어리로 띄워서, 글 초반부터
 * 주석이 튀어나와 읽는 흐름을 끊었다. 명시는 하되 방해하면 안 된다 —
 * 한 줄로 줄이고, 기준은 title 속성으로 넘겨 필요할 때만 보이게 한다.
 */
function citation(source: Source): string {
  const who = source.author ? `${esc(source.author)} · ` : "";
  return (
    `<a href="${esc(source.url)}" target="_blank" rel="noopener" title="${esc(source.basis)}">` +
    `출처 ${who}${esc(source.title)} (${esc(source.year)}) ↗` +
    `</a>`
  );
}

/**
 * 자료 블록 — 임베드는 그 자리에서 재생되고, 출처는 바로 아래 한 줄로 붙는다.
 * 링크만 있는 자료는 문장 흐름을 끊지 않게 인라인에 가까운 형태로 둔다.
 */
function sourceBlock(source: Source): string {
  if (source.embedHtml) {
    /**
     * 임베드는 두 종류다 — 2026-08-15 에 갈랐다.
     *
     *  · iframe (유튜브)      16:9 비율 상자에 절대 배치한다
     *  · blockquote (틱톡·인스타)  플랫폼 스크립트가 자기 크기로 바꿔 끼운다.
     *    여기에 16:9 상자를 씌우면 잘려 나간다 — 전에는 전부 같은 상자에
     *    넣고 있어서 틱톡·인스타 임베드가 잘린 채 나갔다.
     */
    const shape = /^<iframe/i.test(source.embedHtml.trim())
      ? "embed embed-video"
      : "embed embed-social";
    return `<figure class="src src-embed"><div class="${shape}">${source.embedHtml}</div><figcaption>${citation(source)}</figcaption></figure>`;
  }
  return `<p class="src-inline">${citation(source)}</p>`;
}

/**
 * 강조 박스 — `:::point`(핵심 포인트) 와 `:::do`(실행 체크리스트).
 * 2026-08-15 신설. 규격은 `blog-spec.ts` 의 VISUAL_SPEC 에 있다.
 *
 * 둘 다 모양은 같고 성격만 다르다. point 는 "이것만 가져가라",
 * do 는 "이번 주에 이걸 해라". 그래서 do 만 번호가 붙는다.
 */
function calloutBlock(
  kind: "point" | "do",
  title: string,
  items: string[],
): string {
  const label = kind === "point" ? "핵심" : "실행";
  const list =
    kind === "do"
      ? `<ol>${items.map((t) => `<li>${inline(t)}</li>`).join("")}</ol>`
      : `<ul>${items.map((t) => `<li>${inline(t)}</li>`).join("")}</ul>`;
  return (
    `<aside class="callout callout-${kind}">` +
    `<p class="callout-title"><span class="callout-label">${label}</span>${inline(title)}</p>` +
    (items.length ? list : "") +
    `</aside>`
  );
}

export function renderBody(body: string, sources: Source[]): string {
  const lines = body.split("\n");
  const out: string[] = [];
  let i = 0;
  /**
   * 지금이 "## 목차" 아래인가.
   *
   * 2026-08-15 이전에는 **본문 어디에 있든 숫자 목록이면 무조건 목차로** 렌더했다.
   * 그래서 실행 순서를 1·2·3 으로 쓰면 회색 목차 상자에 담기고 각 항목에
   * 죽은 앵커 링크가 걸렸다. 목차인지 아닌지는 위치로 판단해야 한다.
   */
  let inToc = false;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    // 읽는 시간 표기는 페이지 헤더가 따로 보여 준다
    if (line.startsWith("📖")) {
      i += 1;
      continue;
    }

    const src = line.match(/^:::source\s+(\d+)\s*$/);
    if (src) {
      const n = Number(src[1]);
      const source = sources[n - 1];
      if (source) out.push(sourceBlock(source));
      i += 1;
      continue;
    }

    // 강조 박스 — `:::point 제목` … `:::` / `:::do 제목` … `:::`
    const callout = line.match(/^:::(point|do)\s*(.*)$/);
    if (callout) {
      const kind = callout[1] as "point" | "do";
      const title = callout[2].trim();
      const items: string[] = [];
      i += 1;
      while (i < lines.length && !/^:::\s*$/.test(lines[i])) {
        const item = lines[i].trim();
        if (item) items.push(item.replace(/^(?:[-*]|\d+\.)\s*/, ""));
        i += 1;
      }
      i += 1; // 닫는 ':::'
      out.push(calloutBlock(kind, title, items));
      continue;
    }

    if (line.startsWith("> ")) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quote.push(lines[i].slice(2));
        i += 1;
      }
      out.push(`<blockquote>${quote.map((q) => `<p>${inline(q)}</p>`).join("")}</blockquote>`);
      continue;
    }

    const h = line.match(/^(#{2,3})\s+(.+)$/);
    if (h) {
      const tag = h[1].length === 2 ? "h2" : "h3";
      const text = h[2].trim();
      if (tag === "h2") inToc = /^목차/.test(text);
      out.push(`<${tag} id="${slugifyHeading(text)}">${inline(text)}</${tag}>`);
      i += 1;
      continue;
    }

    if (line.startsWith("|")) {
      const rows: string[] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        rows.push(lines[i]);
        i += 1;
      }
      const cells = (row: string) =>
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
          .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`)
          .join("")}</tbody></table></div>`,
      );
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i += 1;
      }
      if (inToc) {
        // 목차 항목은 본문 H2 로 이동한다 — 앵커는 여기서 만든다
        out.push(
          `<ol class="toc">${items
            .map(
              (t) => `<li><a href="#${slugifyHeading(t)}">${inline(t)}</a></li>`,
            )
            .join("")}</ol>`,
        );
      } else {
        // 본문의 순서 목록 — 실행 단계·우선순위. 목차 상자에 담지 않는다
        out.push(
          `<ol class="steps">${items
            .map((t) => `<li>${inline(t)}</li>`)
            .join("")}</ol>`,
        );
      }
      continue;
    }

    /**
     * 불릿 목록 — 2026-08-15 신설.
     *
     * 그동안 이 분기가 **아예 없어서** `- 항목` 이 `<p>- 항목</p>` 로 나갔다.
     * 대안을 3~4개로 정리하라는 규격(FLOW 4)이 있는데 그걸 담을 그릇이 없었던 셈이다.
     */
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
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

    out.push(`<p>${inline(line)}</p>`);
    i += 1;
  }

  return out.join("\n");
}

/** 한글 제목에 쓸 앵커 — 영문·숫자만 남기면 전부 빈 문자열이 된다 */
export function slugifyHeading(text: string): string {
  return (
    "s-" +
    text
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-|-$/g, "")
  );
}

/** FAQ 섹션의 H3 질문과 그 답 — FAQPage 구조화 데이터에 쓴다 */
export function faqPairs(body: string): { q: string; a: string }[] {
  const section = body.split(/^##\s+자주 묻는 질문.*$/m)[1];
  if (!section) return [];
  const scoped = section.split(/^##\s+/m)[0];
  const pairs: { q: string; a: string }[] = [];
  const blocks = scoped.split(/^###\s+/m).slice(1);
  for (const block of blocks) {
    const nl = block.indexOf("\n");
    if (nl === -1) continue;
    const q = block.slice(0, nl).trim();
    const a = block
      .slice(nl + 1)
      .split(/\n\s*\n/)
      .map((x) => x.trim())
      .find((x) => x && !x.startsWith(":::"));
    if (q && a) pairs.push({ q, a: a.replace(/\*\*/g, "") });
  }
  return pairs;
}
