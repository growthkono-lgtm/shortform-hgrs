import { AUDIENCE, LEAD_TARGETS, PILLARS, SOURCE_SPEC } from "@/lib/blog-spec";
import type { Difficulty } from "@/lib/keyword-filter";
import type { Source } from "@/lib/blog-sources";

/**
 * **자료 적합성 — 6축 이중 검사.** (2026-08-22 신설)
 *
 * ── 왜 만들었나 ────────────────────────────────────────────────────────
 * 9편("브랜드 블로그 운영 → 방문 전환")에 **삼성전자서비스 에어컨 A/S 안내
 * 영상 4편**이 붙어서 나갔다. 5편("인스타 메타 예산 배분 · 뷰티 전환 소재")
 * 에는 뷰티 브랜드가 한 곳도 없고 2021년 TVCF(포카리스웨트·지그재그·야놀자)
 * 만 들어갔다. 6편은 같은 광고 하나를 길이만 다르게 4번 넣었다.
 *
 * 원인은 규격이었다. 자료에 대해 검사하던 것이 전부 이랬다.
 *
 *   출처명 있나 · 연도 4자리인가 · 기준 있나 · URL 있나
 *   임베드 3건 넘나 · 한글이 들어있나(국내 판정)
 *
 * **주제와 맞는지 보는 항목이 하나도 없었다.** 그래서 매일 초록불이 떴다.
 * 게다가 프롬프트에는 *"재생 가능한 자료를 최소 4건 반드시 포함한다.
 * 조사 보고에 그런 URL 이 있으면 무조건 넣어라"* 가 박혀 있었다.
 * 4건을 채우려다 같은 채널에서 연속으로 긁어온 것이다.
 *
 * ── 사장님 지시 (2026-08-22) ──────────────────────────────────────────
 * *"적합성검사는 기준을 더 세분화해서 키워드-주제-타겟-페르소나-
 * 키워드난이도-리드확보 시 진행할 서비스영역까지 고려해서 이중으로
 * 기획수집단계에서 한번 제작배포단계에서 한번해서 더블체크하고 배포해."*
 */

/** 사장님이 짚어 주신 여섯 축. 순서까지 그대로 쓴다 */
export const FIT_AXES = [
  {
    key: "keyword",
    label: "키워드",
    ask: "이 자료가 그 검색어를 친 사람이 **찾던 것**인가. 검색어와 자료가 같은 대상을 말하는가.",
  },
  {
    key: "topic",
    label: "주제",
    ask: `이 자료가 글의 논지와 **같은 것을 말하는가.**

⚠️ 영상·게시물은 논지를 **분석**하는 게 아니라 그 논지가 **실제로 벌어진 실물**이다.
   "전략적 분석이 없다" "성과 인사이트가 없다" 는 이유로 떨어뜨리지 마라.
   판정 기준은 하나다 — **이 자료가 이 글이 말하는 그것을 하고 있나.**
   (예: "브랜드 블로그 운영" 글에 에어컨 A/S 안내 영상 → 미달)

통계·리포트는 반대다. 수치가 논지를 받쳐야 한다.`,
  },
  {
    key: "audience",
    label: "타겟",
    ask: `**${AUDIENCE.primary.split(".")[0]}** 이 이걸 보고 **"오, 이런 게 있네. 우리도 해볼까"** 싶을 것인가.

⚠️ 요구하는 건 관심이 붙느냐지 **의사결정 근거냐가 아니다.**
   "거래액·전환율 같은 수치가 없다" "전략 분석이 아니다" 로 떨어뜨리지 마라.
   그런 잣대는 **우리가 직접 만든 성과 사례**에만 해당한다.
   미달은 층위가 아예 다른 것뿐이다 — 소비자용 A/S 안내, 제품 사용 설명서.`,
  },
  {
    key: "persona",
    label: "페르소나",
    ask: `이 자료 속 브랜드·상황을 리드 타겟이 **자기 얘기로 읽을** 것인가.

**국내**면 된다. 규모는 안 따진다 — 스몰브랜드·스타트업도 그대로 쓴다.
업종이 달라도 겪는 상황이 겹치면 통과다. 업종 일치를 요구하지 마라.`,
  },
  {
    key: "difficulty",
    label: "키워드난이도",
    ask: `난이도에 맞는 깊이인가. 마이크로·니치는 **좁고 구체적인** 실물이, 빅·일반어는 **넓게 통하는 근거**가 맞다.
난이도 정보가 없으면 **통과로 둔다.** 이 축으로 떨어뜨리지 마라.`,
  },
  {
    key: "service",
    label: "서비스영역",
    ask: `이걸 본 사람이 **"여긴 이런 걸 다루는 곳이구나, 어떻게 작업해 주는 데지?"** 하고
우리 쪽으로 궁금해질 방향인가. 우리가 팔 것과 자료가 어긋나지 않으면 통과다.

⚠️ 플랫폼 기능 발표·업계 뉴스도 그 방향이면 통과다. **정확히 우리 서비스 사례일 필요는 없다.**`,
  },
] as const;

export type FitAxis = (typeof FIT_AXES)[number]["key"];

/** 한 자료에 대한 판정 */
export type FitVerdict = {
  /** sources 배열에서의 위치 */
  index: number;
  /** 축별 통과 여부 */
  axes: Partial<Record<FitAxis, boolean>>;
  /** 통과한 축 수 */
  score: number;
  pass: boolean;
  /** 왜 떨어졌나 — 사람이 읽고 바로 고칠 수 있게 */
  reason: string;
};

/**
 * 여섯 축 중 몇 개를 넘겨야 통과인가.
 *
 * 6/6 을 요구하면 아무것도 못 넣는다. 4/6 이면 "대충 관련 있음" 이 통과한다.
 * **5/6** 으로 두되 `topic` 과 `service` 는 **필수**다 — 이 둘이 어긋난 것이
 * 9편(에어컨)과 5편(뷰티인데 뷰티 없음)의 실제 증상이었다.
 */
export const FIT_PASS_SCORE = 5;
export const FIT_REQUIRED_AXES: FitAxis[] = ["topic", "service"];

export function isFitPass(axes: Partial<Record<FitAxis, boolean>>): boolean {
  const score = FIT_AXES.filter((a) => axes[a.key]).length;
  if (score < FIT_PASS_SCORE) return false;
  return FIT_REQUIRED_AXES.every((k) => axes[k]);
}

/* ─────────────────────────────────────────────────────────────
 * 발행처 등급
 * ───────────────────────────────────────────────────────────── */

/**
 * 이 자료가 **경쟁 사업자**의 것인가.
 *
 * 미디어렙·광고대행사·마케팅 리서치사. 사장님: *"자료가 정말 쓰기 좋지.
 * … 출처를 아주 작게 명시하고 거기로 임베드 안 되면 되지 않을까."*
 * 그래서 금지가 아니라 **취급을 달리한다** — 쓰되 트래픽과 시선을 안 준다.
 */
export function isCompetitorSource(source: {
  author?: string | null;
  url?: string | null;
  title?: string | null;
}): boolean {
  const hay = `${source.author ?? ""} ${source.title ?? ""} ${source.url ?? ""}`
    .replace(/\s+/g, "")
    .toLowerCase();
  return SOURCE_SPEC.publisherTier.competitor.names.some((n) =>
    hay.includes(n.replace(/\s+/g, "").toLowerCase()),
  );
}

/**
 * 같은 자료를 **베껴 채운 것**만 잡는다. (2026-08-22 · 08-22 재정의)
 *
 * ── 첫 판이 틀렸다 ────────────────────────────────────────────────────
 * 처음에는 "한 발행처 2건 이상 금지" 로 짰다. 그런데 **사장님이 좋았다고
 * 하신 4편이 그 규칙에 걸린다** — 국순당 백세주 캠페인 영상이 3건이다.
 * 그 3건은 "바이럴을 매출로 잇는다" 는 논지를 **한 사례의 여러 각도**로
 * 보여 준 것이라 반복이 아니다. 좋았던 편을 내 규칙이 막고 있었다.
 *
 * 진짜 문제는 개수가 아니라 **같은 것을 여러 개로 세는 것**이었다.
 * 6편의 동서식품 옥수수차 43초·6초·15초A·15초B 가 그 예다 —
 * 광고 하나를 길이만 바꿔 네 건으로 세었다.
 *
 * 그래서 판정 기준을 바꾼다: 같은 발행처의 자료라도 **제목이 사실상 같으면**
 * 중복, **다른 내용이면 통과**. 주제와 맞는지는 6축 검사가 따로 본다.
 */
export function duplicatePublishers(sources: Source[]): string[] {
  /** 길이·회차 표기를 지운 제목 — "옥수수차 (15s A)" 와 "옥수수차 (43s)" 를 같게 만든다 */
  const core = (t: string) =>
    t
      .replace(/\(([^)]*\d+\s*(?:s|초|sec)[^)]*)\)/gi, "")
      .replace(/\b\d+\s*(?:s|초|sec)\b/gi, "")
      .replace(/[\s·\-_#]+/g, "")
      .toLowerCase();

  const seen = new Map<string, Set<string>>();
  for (const s of sources) {
    const who = (s.author ?? "").replace(/\s+/g, "").toLowerCase();
    if (!who) continue;
    const set = seen.get(who) ?? new Set<string>();
    set.add(core(s.title ?? ""));
    seen.set(who, set);
  }

  const dupes: string[] = [];
  for (const s of sources) {
    const who = (s.author ?? "").replace(/\s+/g, "").toLowerCase();
    if (!who) continue;
    const count = sources.filter(
      (x) => (x.author ?? "").replace(/\s+/g, "").toLowerCase() === who,
    ).length;
    // 같은 발행처에서 여러 건인데 **제목의 알맹이가 하나뿐**이면 베껴 채운 것이다
    if (count > 1 && (seen.get(who)?.size ?? 0) < count && !dupes.includes(who)) {
      dupes.push(who);
    }
  }
  return dupes;
}

/**
 * 자료가 너무 낡았나. 트렌드형은 12개월, 그 밖은 24개월.
 *
 * 5편에 2021년 TVCF 가 세 건 들어간 것이 이 검사가 없어서였다.
 * 브랜드 캠페인 사례는 **지금 돌고 있는 것**이라야 독자가 자기 얘기로 읽는다.
 */
export function isStale(
  source: { year?: string | null },
  formatKey: string,
  now = new Date(),
): boolean {
  const y = Number(source.year);
  if (!Number.isFinite(y)) return false;
  const months = formatKey === "trend" ? 12 : 24;
  const cutoff = now.getFullYear() - Math.floor(months / 12);
  return y < cutoff;
}

/* ─────────────────────────────────────────────────────────────
 * 프롬프트 조각 — 수집 단계와 집필 단계가 같은 문장을 본다
 * ───────────────────────────────────────────────────────────── */

export type FitContext = {
  keyword: string;
  topic: string;
  pillarKey: string;
  leadTargetKey: string;
  difficulty: Difficulty | null;
};

/** 여섯 축을 프롬프트에 그대로 박는다 */
export function fitBriefing(ctx: FitContext): string {
  const pillar = PILLARS.find((p) => p.key === ctx.pillarKey);
  const lead = LEAD_TARGETS.find((t) => t.key === ctx.leadTargetKey);

  return `[자료 적합성 — 이 여섯 축을 **자료 하나하나**에 적용한다]

이번 글의 좌표:
· 키워드      ${ctx.keyword}
· 주제        ${ctx.topic}
· 타겟        ${AUDIENCE.primary}
· 페르소나    ${lead ? `${lead.label} — ${lead.bottleneck}` : "미지정"}
· 키워드난이도 ${ctx.difficulty ?? "미지정"}
· 서비스영역   ${pillar ? `${pillar.label} (${pillar.scope})` : "미지정"}

${FIT_AXES.map((a, i) => `${i + 1}. **${a.label}** — ${a.ask}`).join("\n")}

━━ 판정 전에 반드시 읽어라 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
위 좌표는 **이 글이 어디에 서 있는지**를 알려 주는 것이지,
자료 하나하나가 저걸 다 해결해야 한다는 뜻이 **아니다.**

· 자료는 논지를 **주장할 필요가 없다.** 그 논지가 벌어지는 **한 장면**이면 된다.
· 자료가 페르소나의 **병목을 풀어 줄 필요가 없다.** 그 사람이 **읽을 만한 것**이면 된다.
· 수치·전환율·거래액이 **없어도 된다.** 그건 우리가 만든 성과 사례에만 요구한다.

통과 기준은 이 한 줄이다 —
**"주제가 맞고, 읽는 사람이 '오 이런 게 있네, 우리도 해볼까' 하는가."**
미달은 층위가 아예 다를 때다 (소비자용 A/S 안내, 제품 사용법, 주제와 무관한 업계 뉴스).
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

판정: 여섯 축 중 **${FIT_PASS_SCORE}개 이상**을 넘겨야 쓴다.
그중 **주제·서비스영역은 반드시** 넘겨야 한다. 하나라도 어긋나면 그 자료는 버리고 **다시 찾는다.**

🚫 실제로 이렇게 나가서 글을 망친 사례다. 같은 실수를 하지 마라.
· "브랜드 블로그 운영 → 방문 전환" 글에 **삼성전자서비스 에어컨 A/S 안내 영상 4편**
· "인스타 메타 예산 배분 · **뷰티** 전환 소재" 글에 음료·패션플랫폼·여행 **2021년 TVCF**
· "상품 등록 대행" 글에 **같은 광고의 길이 변주 4건**(43초/6초/15초A/15초B)

⚠️ **개수를 채우려고 아무거나 넣지 마라.** 못 찾으면 검색어를 바꿔서 다시 찾는다.
비워 두는 것도 답이 아니다 — **맞는 것을 찾아서 채운다.**`;
}

/** 발행처 규칙을 프롬프트에 박는다 */
export function publisherBriefing(): string {
  const t = SOURCE_SPEC.publisherTier;
  return `[발행처 — 어디서 가져오나]

마음껏 인용하고 시각물로도 세우는 곳:
${t.open.map((x) => `· ${x}`).join("\n")}

⚠️ **경쟁 사업자** — 미디어렙·광고대행사·마케팅 리서치사
(${t.competitor.names.slice(0, 8).join(" · ")} 등)
자료 자체는 좋으니 **쓰되** 다음을 지킨다:
${t.competitor.rules.map((x) => `· ${x}`).join("\n")}

📌 **한 이름을 두 번 쓰지 않는다.** 같은 발행처·같은 브랜드에서 두 건 이상 가져오지 않는다.
국내에는 업종별 협회·진흥원·전문매체·커뮤니티가 수백 곳 있다. 주제에 맞는 곳을 **새로 찾아라.**
${SOURCE_SPEC.region.discovery.map((x) => `· ${x}`).join("\n")}`;
}
