import {
  HOOKING,
  AEO_SPEC,
  BLOG_SPEC,
  SOURCE_SPEC,
  STRUCTURE,
  VISUAL_SPEC,
  WRITING_RULES,
  format,
  type FormatKey,
} from "./blog-spec";
import { citedSourceIndexes, countChars } from "./blog-ai";
import { readingTime } from "./blog-spec";
import { isDomestic, type Source } from "./blog-sources";

/**
 * 발행 규격 검사 — 단일 출처. (2026-08-13 라이브러리로 분리)
 *
 * 원래 `scripts/blog-audit.ts` 안에만 있었는데, 어드민 승인 버튼도 같은 검사를
 * 해야 한다. 검사식을 두 벌로 두면 CLI 는 통과하는데 어드민은 막거나 그 반대가
 * 되고, 그러면 아무도 검사식을 안 믿게 된다.
 *
 * 기준값은 전부 `blog-spec.ts` 에서 읽는다. 숫자를 여기 적지 않는다.
 */

export type AuditFinding = { level: "fail" | "warn"; message: string };

export type AuditResult = {
  chars: number;
  readMinutes: number;
  questionH2: number;
  tables: number;
  faqCount: number;
  internalLinks: number;
  citedSources: number;
  findings: AuditFinding[];
  /** fail 만 추린 것. 비어 있으면 발행 가능 */
  failures: string[];
  ok: boolean;
};

/** 본론 섹션만 — 목차·FAQ·맺으며는 자료를 붙이는 자리가 아니다 */
const STRUCTURAL = /^(목차|자주 묻는 질문|맺으며|관련 아티클)/;

function bodySections(body: string) {
  return body
    .split(/^##\s+/m)
    .slice(1)
    .map((chunk) => {
      const nl = chunk.indexOf("\n");
      return {
        heading: (nl === -1 ? chunk : chunk.slice(0, nl)).trim(),
        text: nl === -1 ? "" : chunk.slice(nl + 1),
      };
    })
    .filter((s) => !STRUCTURAL.test(s.heading));
}

export function auditPost(input: {
  body: string;
  formatKey: FormatKey;
  sources: Source[];
  title?: string;
  slug?: string;
}): AuditResult {
  const { body, sources } = input;
  const f = format(input.formatKey);
  const findings: AuditFinding[] = [];

  // HTML 헤딩 — 먼저 잡아 두지 않으면 아래 구조 검사가 전부 0 으로 나와 원인을 오해한다
  const htmlHeadings = (body.match(/<h[1-6][\s>]/gi) ?? []).length;
  if (htmlHeadings) {
    findings.push({
      level: "fail",
      message: `HTML 헤딩 ${htmlHeadings}개. 섹션 제목은 마크다운 '## ' 로만 씁니다`,
    });
  }

  const sections = bodySections(body);
  const questionH2 = sections.filter((s) => s.heading.includes("?")).length;

  // 섹션 총량 — 사장님 지시: 6~7 블록 안에서 끝낸다. 길면 B2B 담당자가 안 읽는다
  if (sections.length < f.minH2 || sections.length > f.maxH2) {
    findings.push({
      level: "fail",
      message: `본론 섹션 ${sections.length}개 (기준 ${f.minH2}~${f.maxH2}개). 길면 안 읽히고 짧으면 근거가 얇습니다`,
    });
  }
  // 검색·AEO 를 받으려면 절반 이상은 질문형이어야 한다
  if (questionH2 < Math.ceil(sections.length / 2)) {
    findings.push({
      level: "fail",
      message: `질문형 H2 ${questionH2}개 / 본론 ${sections.length}개. 절반 이상은 독자가 실제로 던지는 질문이어야 합니다`,
    });
  }

  // ── 실물 자료 ──
  const cited = citedSourceIndexes(body);

  sources.forEach((s, i) => {
    const missing: string[] = [];
    if (!s.title?.trim()) missing.push("출처명");
    if (!/^\d{4}$/.test(s.year ?? "")) missing.push("연도");
    if (!s.basis?.trim()) missing.push("기준");
    if (!s.url?.trim()) missing.push("URL");
    if (missing.length) {
      findings.push({
        level: "fail",
        message: `자료 ${i + 1}번에 ${missing.join("·")}이(가) 없습니다`,
      });
    }
  });

  /**
   * 모호어 — 뒤에 '무엇이' 가 안 붙은 채로 쓰였는가. (2026-08-14)
   *
   * 사장님 지적: *"가령 반응·성과 이런 말 썼으면 어떤 반응, 어떤 성과인지
   * 명확히 하라고."* 이 단어들이 홀로 서 있으면 독자는 아무것도 안 배운다.
   * 숫자나 구체 명사가 같은 문장 안에 있으면 통과시킨다.
   */
  const vagueHits = HOOKING.vague.filter((word) => {
    const re = new RegExp(`[^.!?\n]*${word}[^.!?\n]*`, "g");
    return (body.match(re) ?? []).some(
      (sentence) => !/\d/.test(sentence) && !/이(가)?\s|을(를)?\s/.test(sentence.split(word)[0]?.slice(-12) ?? ""),
    );
  });
  if (vagueHits.length >= 3) {
    findings.push({
      level: "warn",
      message: `무엇이 어떻게 달라졌는지 없이 쓴 말 ${vagueHits.length}개: ${vagueHits.slice(0, 4).join(", ")}`,
    });
  }

  const bogus = cited.filter((n) => n < 1 || n > sources.length);
  if (bogus.length) {
    findings.push({
      level: "fail",
      message: `없는 자료 번호를 인용했습니다: ${bogus.join(", ")}`,
    });
  }

  // 자료는 보유분 중 **골라 쓴다**. 남는 게 정상이므로 경고하지 않는다.

  /**
   * ── 시각 자료 — 2026-08-15 **세는 법이 바뀌었다.** ────────────────────
   *
   * 사장님 지적: *"시각적으로 임베드가 되든 이미지든 영상이든 레퍼런스는
   * 시각물이 3~4개가 필수라 그랬는데, 하나만 들어가고 나머진 그냥 링크더라."*
   *
   * 전 검사식은 `:::source` 지시자 개수를 그대로 시각물로 셌다. 그런데 그
   * 대부분은 **재생되지 않는 링크 한 줄**이다. 링크 4개 + 표 1개면 "시각 자료
   * 5개"로 찍혀 통과했고, 화면에는 아무것도 안 보였다.
   *
   * 이제 시각물 = 임베드 + 표다. 링크는 따로 세고 상한만 건다.
   */
  const citedValid = cited.filter((n) => n >= 1 && n <= sources.length);
  const citedSourceList = citedValid
    .map((n) => sources[n - 1])
    .filter(Boolean) as Source[];

  const embedded = citedSourceList.filter((s) => s.embedHtml).length;
  const linkOnly = citedSourceList.filter((s) => !s.embedHtml).length;
  const tableCount = (body.match(/^\|[\s:|-]+\|\s*$/gm) ?? []).length;
  const visuals = embedded + tableCount;

  if (visuals > STRUCTURE.maxVisuals) {
    findings.push({
      level: "fail",
      message: `시각 자료 ${visuals}개 (재생 ${embedded} + 표 ${tableCount}). ${STRUCTURE.maxVisuals}개 이내로 줄이세요`,
    });
  }
  if (visuals < STRUCTURE.minVisuals) {
    findings.push({
      level: "fail",
      message: `시각 자료 ${visuals}개 (기준 ${STRUCTURE.minVisuals}개 이상 — 재생 ${embedded} + 표 ${tableCount}). 링크 인용은 시각물로 세지 않습니다`,
    });
  }
  if (citedValid.length < f.minSources) {
    findings.push({
      level: "fail",
      message: `본문에 인용된 자료 ${citedValid.length}건 (기준 ${f.minSources}건)`,
    });
  }
  if (linkOnly > STRUCTURE.maxLinkOnlyCitations) {
    findings.push({
      level: "warn",
      message: `재생되지 않는 링크 인용 ${linkOnly}건 (권장 ${STRUCTURE.maxLinkOnlyCitations}건 이하). 각주가 본문을 덮습니다`,
    });
  }

  /**
   * **재생 가능한 자료**가 몇 건인가. (2026-08-14 추가, 08-15 기준 상향)
   *
   * 링크 인용과 임베드는 값이 다르다. 임베드는 독자를 페이지에 붙들고,
   * 생성형 검색에는 "이 글이 실물을 들고 있다" 는 신호가 된다.
   * 그래서 개수를 세고, 모자라면 발행을 막는다.
   */
  if (embedded < f.minEmbeds) {
    findings.push({
      level: "fail",
      message: `본문에서 재생되는 자료 ${embedded}건 (기준 ${f.minEmbeds}건). 링크 인용만으로는 안 됩니다 — 국내 유튜브·틱톡 실물이나 구글 트렌드를 최소 ${f.minEmbeds}건 인용하세요`,
    });
  }

  /**
   * ── 국내 자료 — 2026-08-15 신설 ───────────────────────────────────────
   *
   * 사장님 지적: *"레퍼런스가 국내 말고 해외(영상 등)가 있더라. 적절하지 않아."*
   *
   * 3편은 인용 5건 중 4건이 영문 자료였다(틱톡 영문 PDF·영문 헬프센터·구글
   * 애즈 블로그). 선을 둘로 나눠 검사한다 — **보여 주는 것은 100% 국내**,
   * 근거로 대는 것은 국내 비율 ${SOURCE_SPEC.region.minDomesticRatio} 이상.
   */
  const foreignVisuals = citedSourceList.filter(
    (s) => s.embedHtml && !isDomestic(s),
  );
  if (foreignVisuals.length) {
    findings.push({
      level: "fail",
      message: `본문에서 재생되는 해외 자료 ${foreignVisuals.length}건: ${foreignVisuals
        .map((s) => `"${s.title.slice(0, 24)}"`)
        .join(", ")} — 보여 주는 자료는 전부 국내 것이어야 합니다`,
    });
  }

  const domestic = citedSourceList.filter((s) => isDomestic(s)).length;
  const ratio = citedSourceList.length
    ? domestic / citedSourceList.length
    : 0;
  if (
    citedSourceList.length &&
    ratio < SOURCE_SPEC.region.minDomesticRatio
  ) {
    findings.push({
      level: "fail",
      message: `국내 자료 ${domestic}/${citedSourceList.length}건 (${Math.round(
        ratio * 100,
      )}% · 기준 ${Math.round(
        SOURCE_SPEC.region.minDomesticRatio * 100,
      )}% 이상). 해외는 플랫폼 공식 발표만 허용합니다 — 한국어 뉴스룸이 있으면 그쪽을 쓰세요`,
    });
  }

  /**
   * ── 핵심 강조와 실행 블록 — 2026-08-15 신설 ──────────────────────────
   *
   * 사장님 지적: *"본문에 핵심 포인트가 시각적으로 강조가 안 되니까 안 읽히더라.
   * 그래서 뭘 어떻게 하라는 건지에 대한 대안과 실제 방법도 안 나오는 것 같아서
   * 프로젝트 문의로 넘길 연결이 안 되더라."*
   */
  const pointBlocks = (body.match(/^:::point\s+.+$/gm) ?? []).length;
  if (pointBlocks < f.minPoints) {
    findings.push({
      level: "fail",
      message: `핵심 포인트 박스 ${pointBlocks}개 (기준 ${f.minPoints}개). 섹션마다 그 섹션의 결론을 \`:::point\` 박스로 세우세요`,
    });
  }
  if (pointBlocks > sections.length) {
    findings.push({
      level: "warn",
      message: `핵심 포인트 박스 ${pointBlocks}개 / 본론 ${sections.length}개 — 섹션당 1개를 넘기면 강조가 배경이 됩니다`,
    });
  }

  const doBlocks = (body.match(/^:::do\s+.+$/gm) ?? []).length;
  if (doBlocks !== VISUAL_SPEC.action.count) {
    findings.push({
      level: "fail",
      message: `실행 블록(\`:::do\`) ${doBlocks}개 (기준 ${VISUAL_SPEC.action.count}개). '이번 주에 무엇부터 할지'를 ${VISUAL_SPEC.action.minItems}~${VISUAL_SPEC.action.maxItems}단계로 적는 자리입니다`,
    });
  } else {
    const [, afterOpen = ""] = body.split(/^:::do\s+.+$/m);
    const [inside = "", afterClose = ""] = afterOpen.split(/^:::\s*$/m);
    const items = inside
      .split("\n")
      .map((x) => x.trim())
      .filter((x) => /^(?:[-*]|\d+\.)\s+/.test(x)).length;
    if (
      items < VISUAL_SPEC.action.minItems ||
      items > VISUAL_SPEC.action.maxItems
    ) {
      findings.push({
        level: "fail",
        message: `실행 블록 항목 ${items}개 (기준 ${VISUAL_SPEC.action.minItems}~${VISUAL_SPEC.action.maxItems}개)`,
      });
    }

    /**
     * 실행 블록 바로 다음 문단이 서비스로 이어지는가 — 문의 전환의 다리.
     * 독자가 "이건 우리가 직접 하기 어렵겠는데" 라고 느끼는 순간이 이 자리다.
     * 3편은 이 자리가 비어 있었고, 서비스 링크는 저 위 두 번째 섹션에 있었다.
     */
    const bridge = afterClose.split(/^##\s+/m)[0];
    if (!/\]\((?:\/shortform|\/sns-brand)/.test(bridge)) {
      findings.push({
        level: "fail",
        message:
          "실행 블록 다음에 서비스로 잇는 문단이 없습니다 — 그 항목 중 자체 인력으로 하기 어려운 것을 짚고 /shortform 또는 /sns-brand 로 이으세요",
      });
    }
  }

  const boldCount = (body.match(/\*\*[^*\n]+\*\*/g) ?? []).length;
  if (boldCount < VISUAL_SPEC.bold.min) {
    findings.push({
      level: "fail",
      message: `굵게 강조 ${boldCount}곳 (기준 ${VISUAL_SPEC.bold.min}곳 이상). 판단이 갈리는 어구를 문단마다 한 곳씩 굵게 하세요`,
    });
  }
  if (boldCount > VISUAL_SPEC.bold.max) {
    findings.push({
      level: "warn",
      message: `굵게 강조 ${boldCount}곳 (권장 ${VISUAL_SPEC.bold.max}곳 이하) — 다 굵으면 아무것도 안 굵습니다`,
    });
  }

  // 목차 밖의 목록 — 대안·조건·순서를 줄글 대신 목록으로 냈는가.
  // 08-15 이전엔 렌더러에 불릿 분기가 없어 목록을 써도 문단으로 나왔다
  const listItems = sections.reduce(
    (sum, s) => sum + (s.text.match(/^(?:[-*]|\d+\.)\s+\S/gm) ?? []).length,
    0,
  );
  if (listItems < VISUAL_SPEC.list.minBlocks) {
    findings.push({
      level: "warn",
      message:
        "본론에 목록이 없습니다 — 선택지·조건·순서는 줄글보다 목록이 읽힙니다",
    });
  }

  // ── AEO 직답 ──
  const badAnswers = sections.filter((s) => {
    const first = s.text
      .split(/\n\s*\n/)
      .map((x) => x.trim())
      .find((x) => x && !x.startsWith(":::") && !x.startsWith("|"));
    if (!first) return true;
    const len = countChars(first);
    return (
      len < AEO_SPEC.answerBlock.minChars || len > AEO_SPEC.answerBlock.maxChars
    );
  });
  if (badAnswers.length) {
    findings.push({
      level: "warn",
      message: `직답 블록이 규격(${AEO_SPEC.answerBlock.minChars}~${AEO_SPEC.answerBlock.maxChars}자)을 벗어난 섹션 ${badAnswers.length}개`,
    });
  }

  // ── 읽는 맛 ──
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((x) => x.trim())
    .filter(
      (x) =>
        x &&
        !x.startsWith("#") &&
        !x.startsWith("|") &&
        !x.startsWith(":::") &&
        !/^[-*\d]/.test(x),
    );
  const longOnes = paragraphs.filter(
    (x) => countChars(x) > BLOG_SPEC.maxParagraphChars,
  );
  if (longOnes.length) {
    findings.push({
      level: longOnes.length > paragraphs.length * 0.2 ? "fail" : "warn",
      message: `${BLOG_SPEC.maxParagraphChars}자를 넘는 문단 ${longOnes.length}개 / 전체 ${paragraphs.length}개`,
    });
  }

  const tables = (body.match(/^\|[\s:|-]+\|\s*$/gm) ?? []).length;
  if (tables < f.minTables) {
    findings.push({
      level: "fail",
      message: `표 ${tables}개 (기준 ${f.minTables}개)`,
    });
  }

  const faqSection = body.split(/^##\s+자주 묻는 질문.*$/m)[1] ?? "";
  const faqCount = (faqSection.split(/^##\s+/m)[0].match(/^###\s+/gm) ?? [])
    .length;
  if (faqCount !== BLOG_SPEC.faqCount) {
    findings.push({
      level: faqCount === 0 ? "fail" : "warn",
      message: `FAQ ${faqCount}문항 (기준 ${BLOG_SPEC.faqCount}문항)`,
    });
  }

  const chars = countChars(body);
  if (chars < f.minChars || chars > f.maxChars) {
    findings.push({
      level: "fail",
      message: `본문 ${chars}자 (기준 ${f.minChars}~${f.maxChars}자)`,
    });
  }

  const links = [...body.matchAll(/\]\((\/[^)]+|https?:\/\/[^)]+)\)/g)].map(
    (m) => m[1],
  );
  const internalLinks = links.filter(
    (href) => href.startsWith("/") || href.includes("hgrs.io"),
  ).length;
  if (internalLinks < BLOG_SPEC.minInternalLinks) {
    findings.push({
      level: "fail",
      message: `내부 링크 ${internalLinks}개 (기준 ${BLOG_SPEC.minInternalLinks}개)`,
    });
  }

  const images = (body.match(/!\[[^\]]*\]\(/g) ?? []).length;
  if (images > 0) {
    findings.push({
      level: "fail",
      message: `본문에 마크다운 이미지 ${images}개. 시각 요소는 검증된 자료(:::source)와 표뿐입니다`,
    });
  }

  if (input.slug && !BLOG_SPEC.slugPattern.test(input.slug)) {
    findings.push({
      level: "fail",
      message: `슬러그 '${input.slug}' 가 규격(영문-케밥-연도)에 안 맞습니다`,
    });
  }

  if (input.title && /(이란|란)\s*\?|무엇인가/.test(input.title)) {
    findings.push({
      level: "warn",
      message: "제목이 정의형입니다 — 주 독자(대표·이사급)는 정의를 검색하지 않습니다",
    });
  }

  // 내부 어휘 — 규격을 관리하려고 만든 말이 독자 화면에 나가면 안 된다.
  // 1편에서 "자료 15건 · 재생 7" 이 그대로 노출됐다(2026-08-13 사장님 지적)
  const leaked = WRITING_RULES.bannedWords.filter((w) =>
    new RegExp(w.replace("N", "\\d+")).test(body),
  );
  if (leaked.length) {
    findings.push({
      level: "fail",
      message: `독자가 모르는 내부 어휘가 본문에 있습니다: ${leaked.join(", ")}`,
    });
  }

  // 문단이 얇으면 잡는다 — 블록을 6~7개로 줄인 대신 각 문단이 깊어야 한다
  const thin = sections.filter(
    (x) => countChars(x.text) < STRUCTURE.minCharsPerSection,
  );
  if (thin.length) {
    findings.push({
      level: "fail",
      message: `${STRUCTURE.minCharsPerSection}자에 못 미치는 얇은 문단 ${thin.length}개: ${thin
        .map((x) => `"${x.heading.slice(0, 18)}"`)
        .join(", ")}`,
    });
  }

  // 질문형 H2 와 그 아래 첫 문장의 정합.
  // 2026-08-13: "무엇이 차이를 만들까?" 에 "표준이 됐기 때문입니다" 로 답해서
  // 질문과 답이 어긋났다. 완전 자동 판정은 불가능하지만, **원인형 어미로 답을 여는
  // 경우**는 잡을 수 있다 — "무엇/어디/어떻게" 질문에 "~때문입니다" 는 답이 아니다.
  //
  // 2026-08-16: 단, **이유를 물은 질문**은 예외다. "…이유는 무엇인가요?" 에
  // "…때문입니다" 는 어긋난 답이 아니라 정확한 답이다. 이 예외가 없어서 08-16 편이
  // 교정 2회를 이 한 줄에 다 쓰고 발행 보류됐다 — 모델은 맞게 썼고 검사식이 틀렸다.
  const mismatched = sections.filter((x) => {
    if (!/(무엇|어디|어떤|얼마)/.test(x.heading) || !x.heading.includes("?")) {
      return false;
    }
    // 이유·원인·왜를 물었으면 원인형 답이 정답이다
    if (/(이유|원인|왜|배경)/.test(x.heading)) return false;
    const first = x.text
      .split(/\n\s*\n/)
      .map((t) => t.trim())
      .find((t) => t && !t.startsWith(":::") && !t.startsWith("|") && !t.startsWith(">"));
    return Boolean(first && /때문입니다\.?\*{0,2}$|때문이다\.?$/.test(first.split(/(?<=\.)\s/)[0] ?? ""));
  });
  if (mismatched.length) {
    findings.push({
      level: "fail",
      message: `질문과 답이 어긋난 섹션 ${mismatched.length}개: ${mismatched
        .map((x) => `"${x.heading.slice(0, 22)}"`)
        .join(", ")} — '무엇/어디/어떤'을 물었으면 그것이 무엇인지로 답하세요`,
    });
  }

  // 첫 문단 — 선언형 명제로 열면 무슨 말인지 모른다.
  // "X가 아니라 Y다" 구조가 1편 리드였고, 사장님이 "뭔 말인지 모르겠다"고 하셨다
  const firstPara = body
    .split(/\n\s*\n/)
    .map((x) => x.trim())
    .find((x) => x && !x.startsWith("#") && !x.startsWith("📖") && !x.startsWith(":::"));
  if (firstPara && /이 아니라\s.{0,12}(다|입니다)/.test(firstPara)) {
    findings.push({
      level: "warn",
      message: `첫 문단이 선언형 명제입니다. ${WRITING_RULES.lead.shape} 구조로 여세요`,
    });
  }

  const stats = [
    ...body.matchAll(/(?:^|[^\d])(\d{1,3}(?:\.\d+)?)\s*(%|퍼센트|배)/g),
  ].map((m) => `${m[1]}${m[2]}`);
  if (stats.length) {
    findings.push({
      level: "warn",
      message: `수치 표현 ${stats.length}건 — 전부 자료에 근거가 있는지 확인하세요: ${[...new Set(stats)].slice(0, 8).join(", ")}`,
    });
  }

  const failures = findings
    .filter((x) => x.level === "fail")
    .map((x) => x.message);

  return {
    chars,
    readMinutes: readingTime(chars),
    questionH2,
    tables,
    faqCount,
    internalLinks,
    citedSources: cited.length,
    findings,
    failures,
    ok: failures.length === 0,
  };
}
