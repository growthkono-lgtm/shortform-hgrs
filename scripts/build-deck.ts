/**
 * 소개서(PDF) 생성기 — 16:9 슬라이드.
 *
 * 플랜 문의가 들어오면 메일에 첨부해 보내는 **제안서**다.
 *
 * 조판 원칙 — 어긴 장이 한 장이라도 있으면 다시 짠다.
 *  · 한 장에 하나의 주제. 16:9(338.67×190.5mm) 고정
 *  · 제목은 **키워드 명사**로 단다. 존댓말 제안 멘트는 표지와 마지막 장에만
 *  · 우리가 우리를 소개하는 문서다. "이런 분들이 만듭니다" 같은 3인칭 소개투를 쓰지 않는다
 *  · 브랜드 두 색은 **배경과 도형 면**에 쓴다. 본문 글자에 색을 입혀 강조하지 않는다
 *  · 글줄로 흐르는 장표를 만들지 않는다. 도형·숫자·실제 화면으로 먼저 말한다
 *
 * 가격·단계·정책 문구는 **직접 쓰지 않고 `lib/`에서 읽는다.**
 *
 *   npm run deck        # HTML 생성 + Chrome 헤드리스로 인쇄
 *   소개서.html#pg7     # 그 장만 띄워 조판 확인
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { FRAMER_CASES } from "../lib/framer-portfolio";
import { FEATURED_STORIES, storyByFramer } from "@/lib/story-cards";
import { PLANS, POLICY, COMPANY, SERVICE, formatKRW,
  MODEL_OPTION,
  AI_EFFICIENCY_NOTE,
} from "@/lib/constants";
import { SEEDING_STAGES, SHORTS_STAGES } from "@/lib/stages";
import {
  ALL_BRAND_CLIPS,
  CLIPS_BY_BRAND,
  CLIPS_BY_PURPOSE,
  CLIP_PURPOSE,
  DECK_EXCLUDE,
  clipPoster,
  ytWatch,
} from "@/lib/clips";
/**
 * 소개서의 SNS·종합 파트는 **랜딩(/sns-brand)과 같은 데이터를 읽는다.**
 * 예전엔 여기서 문안을 새로 지어 썼는데, 사이트와 내용이 갈라져 두 번 고쳐야 했다.
 * 화면에 있는 걸 그대로 문서로 옮기는 게 맞다.
 */
import {
  ACTIONS,
  BLOG_CARD,
  HERO,
  CASES as SNS_CASES,
  FEATURES,
  PORTFOLIO,
  PROCESS,
  TEAM,
} from "@/lib/sns-brand";

/** <em> 강조 태그를 문서에서는 제거한다 (PDF 조판에는 밑줄 강조를 쓰지 않는다) */
const plain = (t: string) => t.replace(/<\/?em>/g, "");

const ROOT = resolve(import.meta.dirname, "..");
const BASE = process.env.DECK_BASE ?? `file://${ROOT}`;
const asset = (p: string) => `${BASE}/public${p}`;

/**
 * **PDF 안에서 영상을 재생하는 방법.** (2026-08-19 사장님 질문)
 *
 * *"소개서가 포트폴리오 역할 할 수 있게 영상 재생도 되긴 해야 하는데
 * 그건 어떻게 해결하나 pdf라."*
 *
 * PDF 규격에 영상 임베드(Rich Media)가 있긴 하지만 **Acrobat 에서만** 재생된다.
 * 맥 미리보기·크롬 뷰어·카톡 미리보기에서는 빈 칸으로 뜬다. 받는 사람이
 * 무엇으로 열지 우리가 못 정하므로 그 방식은 못 쓴다.
 *
 * 대신 **썸네일에 링크를 건다.** 링크는 어느 뷰어에서든 살아 있고, 누르면
 * 브라우저가 열려 실제 mp4 가 재생된다. 파일은 이미 공개 경로에 있다.
 */
const PLAY_ORIGIN = SERVICE.url.includes("localhost")
  ? "https://hgrs.io"
  : SERVICE.url;
const playUrl = (slug: string) => `${PLAY_ORIGIN}/portfolio/clips/${slug}.mp4`;
const font = (f: string) => `${BASE}/app/fonts/${f}`;

const singles = PLANS.filter((p) => p.code === "shorts_only");
const packages = PLANS.filter((p) => p.code === "full");
const perUnit = (won: number, count: number) => formatKRW(Math.round(won / count));

/* ───────────────────────── 내용 ───────────────────────── */

const CLIENTS = [
  "krafton", "riiid", "lotte-rental", "parklon", "moev", "greencar",
  "purum-wellness", "modu-training", "sambunui-il", "yeonae-jagyeok",
  "gochodaejol", "juwangsan", "zeroblock", "naechinso", "real-class",
  "curas", "dmand", "walla", "posh", "resq", "natura-health",
  "feliway", "banaco",
  "irvinelab", "cyberdigm", "code-i", "fitflex", "luvd", "mudit",
  "yeolda", "bluehouse-seoul",
];

const CASES = [
  { no: "01", key: "리얼아카데미", brand: "뤼이드 리얼 아카데미", scale: "투자 2,000억", role: "소재 제작 + 캠페인 운영",
    result: "3주 연속 고지출 & CPA 단가 견인 소재",
    scope: "풀 프로젝트 수행 성과 (소재 제작 + 캠페인 운영)",
    img: "/portfolio/clips/riiid-report.jpg",
    stats: [["3주", "연속 고지출"], ["▼1위", "CPA 단가"]] },
  { no: "02", key: "제로블럭", brand: "파크론 제로블럭", scale: "매출 200억대", role: "소재 제작 + 캠페인 운영",
    result: "메타 캠페인 예산 5배 증액 성공, CPA 9만원 절감 소재 중 일부",
    scope: "풀 프로젝트 수행 성과 (소재 제작 + 캠페인 운영)",
    img: "/portfolio/clips/parkron-tpu.jpg",
    stats: [["5배", "메타 예산 증액"], ["▼9만원", "CPA 절감"]] },
  { no: "03", key: "모에브", brand: "이노바인코리아 모에브", scale: "매출 300억대", role: "출시 고투마켓 소재 부스팅",
    result: "제품 출시 고투마켓 단계 소재 부스팅, 3개월 내 매출 4천만원 · ROAS 3배",
    scope: "풀 프로젝트 수행 성과",
    img: "/portfolio/cases/inovine-moev.jpg",
    stats: [["₩4,000만", "3개월 매출"], ["3배", "ROAS"]] },
  { no: "04", key: "크래프톤", brand: "크래프톤 배틀그라운드", scale: "글로벌", role: "연간 공식 바이럴 쇼츠 기획·제작",
    result: "대표이사 컨텐츠부터 협찬 연예인까지 다양한 바이럴 쇼츠 촬영 기획 제작",
    scope: "연간 공식 프로젝트 수행 (바이럴 컨텐츠 기획·제작)",
    img: "/portfolio/cases/krafton-jonathan.jpg",
    stats: [] as [string, string][] },
];

/* ─────────────────────────────────────────────────────────────
 * 실적 증빙 이미지. (2026-08-19 사장님이 직접 매칭해 주신 자료)
 *
 * `public/evidence/index.json` 을 읽는다 — 이미지 가공(개인정보 가리기)은
 * `scripts/evidence-prep.ts` 가 하고, 여기서는 **결과만 읽어 붙인다.**
 * 파일이 아직 없으면 조용히 건너뛴다: 증빙이 없다고 소개서 생성이 멈추면
 * 나머지 29장까지 못 만든다.
 *
 * ⚠️ **이 이미지들은 소개서에만 넣는다.** 사장님 지시 — 랜딩 페이지에는
 * 브랜드 내부 실적을 노출하지 않는다.
 * ───────────────────────────────────────────────────────────── */
type Evidence = {
  file: string;
  brand: string;
  kind: string;
  caption: string;
  width?: number;
  height?: number;
  masked?: boolean;
};

const EVIDENCE: Evidence[] = (() => {
  try {
    const raw = readFileSync(
      new URL("../public/evidence/index.json", import.meta.url),
      "utf8",
    );
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Evidence[]) : [];
  } catch {
    return [];
  }
})();

const evidenceOf = (brandKey: string) =>
  EVIDENCE.filter((e) => e.brand.replace(/\s+/g, "").includes(brandKey.replace(/\s+/g, "")));

const FLOW = [
  ["01", "브랜드 AI 기본 분석", "상세페이지 URL로 타겟·USP·객단가·금지 표현 구조화"],
  ["02", "컨텐츠 가이드라인 기획", "편별 포맷과 후킹 편성 — 무엇을 왜 찍을지 확정"],
  ["03", "인플루언서 시딩 · 바이럴", "크리에이터 선정 후 실제 채널 배포"],
  ["04", "2차 활용 소스컷 확보", "원본에서 광고용 컷 회수, 자산화"],
  ["05", "매출형 숏폼 기획제작", "확보 소스로 구매 전환 소재 제작"],
  ["06", "검수 · 납품", "미리보기 확인 · 1회 무상 수정 · 전체 다운로드"],
];

const CREDENTIALS = [
  "블랭크 코퍼레이션 출신",
  "라이브커머스 10종 이상 브랜드 밴더사",
  "구글·메타 코리아 우수 크리에이티브",
  "대형 종합몰 컨텐츠 담당 출신",
];

const ROLES = [
  ["숏폼 기획", "블랭크 코퍼레이션 출신"],
  ["커머스 컨텐츠 기획", "라이브커머스 종합몰 담당 출신"],
  ["퍼포먼스 미디어바이어", "구글·메타 코리아 우수 크리에이티브"],
  ["촬영", "현장 디렉팅 · 촬영"],
  ["편집", "컷 편집 · 리텐션 설계"],
  ["숏폼 에디터", "변주본 · A/B 파생"],
  ["모션 디자이너", "자막 · 모션 그래픽"],
  ["카피라이터", "훅 카피 · CTA 문구"],
  ["시딩 · 제작 PM", "일정 · 산출물 관리"],
];

/** 이용 방법 — 실제 화면과 함께 보여 준다 */
const USAGE = [
  ["01", "컨텐츠 진단", "5문항으로 현재 소재 컨디션 확인"],
  ["02", "플랜 문의", "브랜드 상황 입력 후 구성 제안 수신"],
  ["03", "상담 · 결제", "구성 확정 후 세금계산서 발행"],
  ["04", "가입 · 로그인", "이메일 인증 3단계"],
  ["05", "내 프로젝트 확인", "계정 · 플랜 · 기한 한 화면"],
  ["06", "진행 단계 확인", "시딩 6단계 · 숏폼 5단계 실시간"],
  ["07", "입력 · 피드백", "브랜드 소개 입력, 1차본 확인 후 수정 요청"],
];

const CONTRACT = [
  ["01", "플랜 문의", "브랜드 상황 접수 · 컨텐츠 진단 연동"],
  ["02", "구성 안내", "편수별 구성과 금액 회신"],
  ["03", "구성 확정", "편수 · 시딩 인원 · 일정 확정, 견적서 발행"],
  ["04", "결제", "세금계산서 발행 후 현금(계좌이체) 기본 · 카드 가능"],
  ["05", "프로젝트 개설", "대시보드 진행 단계 오픈"],
  ["06", "가이드라인 제출", "브랜드 정보 입력 · 확정까지 D-7"],
  ["07", "진행 · 검수", "단계 확인 · 편당 1회 무상 수정"],
  ["08", "납품", "프로젝트 폴더 전체 다운로드"],
];

const REVIEWS = [
  ["3년 내 최고 ROAS 달성했고, 가입 단가 CPA도 40% 절감했어요.", "G 대기업 실장"],
  ["조직이 고민하던 KPI 지표를 홀로 600% 달성. 오가닉 매출 2배 증대.", "Y 상담 스타트업 대표"],
  ["월 3백으로 시작한 신규 라인을 5개월 안에 2천까지 씁니다.", "M 헤어뷰티 커머스"],
  ["채용보다 저렴한 프로젝트 비용으로 DAU를 대폭 늘렸습니다.", "D HR 스타트업 공동대표"],
  ["브랜드 쿼리수를 올리는 방향으로 포지셔닝을 다시 잡아 주셨습니다.", "B 스포츠 커머스 이사"],
  ["리브랜딩부터 실질적인 마케팅까지 3개월에 끊어주시더군요.", "F 건기식 커머스 대표"],
];

const WALL = [
  "riiid-momcafe", "pet-portion", "moen-shampoo-ppl", "bone-w40s", "zeroblock-interview",
  "riiid-self-study", "seeding-patty", "pet-vet-pancreas", "bone-m50s", "riiid-parent-itv",
  "seeding-garnish", "pet-treats-plea",
];

/* ───────────────────────── 조판 ───────────────────────── */

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

let pageNo = 0;
/**
 * 장표 유형. `docs/deck/LAYOUT.md` 의 규격과 1:1로 붙는다.
 *
 * 유형을 `data-layout` 으로 심어 두면 **넘침 검사기**(`npm run deck:doctor`)가
 * 유형별 규칙으로 본다. 새 장을 만들 때는 반드시 기존 유형 중 하나를 고른다 —
 * 고를 게 없으면 유형을 먼저 LAYOUT.md 에 정의하고 나서 쓴다.
 */
export type Layout =
  | "cover" //   표지 · 클로징 (다크, 풀블리드)
  | "part" //    간지 (다크, 중앙 3줄)
  | "statement" // 선언 (텍스트만)
  | "diagram" // 도식 + 설명 카드 (6/6)
  | "cards" //   카드 그리드 (3×2 · 4×1 · 6칸)
  | "case" //    브랜드 케이스 (스탯+본문+미디어+증빙)
  | "wall" //    미디어 월 (9:16 12칸 · 16:9 8칸)
  | "table" //   표 (플랜)
  | "logos" //   로고월
  | "shots"; //  제품 화면 쇼케이스

/**
 * 장표 유형을 내용에서 알아낸다.
 *
 * 장마다 손으로 `layout:` 을 달게 하면 **새 장을 만들 때 빠뜨린다.** 뼈대
 * 클래스는 어차피 유형마다 다르니 그걸로 판정한다. 예외가 필요하면
 * `slide(body, { layout: "..." })` 로 덮어쓴다.
 */
const inferLayout = (body: string): Layout =>
  /class="cover/.test(body)
    ? "cover"
    : /class="part"/.test(body)
      ? "part"
      : /class="stmt"/.test(body)
        ? "statement"
        : /class="venn"/.test(body)
          ? "diagram"
          : /class="logos"/.test(body)
            ? "logos"
            : /class="(shorts|thumbs)"/.test(body)
              ? "wall"
              : /class="brandcase"/.test(body)
                ? "case"
                : /class="(plans|tbl)/.test(body)
                  ? "table"
                  : /class="board"/.test(body)
                    ? "shots"
                    : "cards";

const slide = (
  body: string,
  opts: {
    dark?: boolean;
    bare?: boolean;
    layout?: Layout;
    /** 홈페이지 `.hero-night` 그라디언트 (파트 간지 전용) */
    hero?: boolean;
    /** 웜그레이 교차 배경 #f7f5f3 — 소재가 주인공인 장 */
    alt?: boolean;
  } = {},
) => {
  pageNo += 1;
  const n = pageNo;
  const lay = opts.layout ?? inferLayout(body);
  const cls = [
    "page",
    opts.dark || opts.hero ? "dark" : "",
    opts.hero ? "hero" : "",
    opts.alt ? "alt" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `<section id="pg${n}" class="${cls}" data-layout="${lay}">
  <div class="page-body">${body}</div>
  ${opts.bare ? "" : `<footer class="page-foot"><span>${SERVICE.name}</span><span>${String(n).padStart(2, "0")}</span></footer>`}
</section>`;
};

/**
 * 파트 간지 = 홈페이지 히어로를 **그대로** 옮긴 것. (2026-08-20)
 *
 * 앞 판은 텍스트 세 줄만 있었다. 사장님: *"8번 장표도 히어로섹션 반영하랬는데
 * 디자인이랑 포함해서. 텍스트만 띡 작게 해놓고."*
 *
 * 옮긴 것 — `.hero-night` 그라디언트 · eyebrow · 헤드라인 · 서브 2줄 · 숫자칩 3개
 * · 우측 소재 컬럼.
 * 못 옮긴 것 — 세로 마퀴(정지 그리드로) · CTA 버튼(PDF에서 누를 대상이 없어 뺌).
 */
const partHero = (o: {
  eyebrow: string;
  title: string[];
  sub: string[];
  stats: { v: string; l: string }[];
  media: string[];
}) => `
<div class="phero">
  <div class="phero-l">
    <p class="phero-k">${esc(o.eyebrow)}</p>
    <h1 class="phero-t">${o.title.map(esc).join("<br>")}</h1>
    <p class="phero-s">${o.sub.map(esc).join("<br>")}</p>
    <div class="phero-stats">
${o.stats.map((st) => `      <div><strong>${esc(st.v)}</strong><span>${esc(st.l)}</span></div>`).join("\n")}
    </div>
  </div>
  <div class="phero-r">
${[0, 1, 2]
  .map(
    (col) =>
      `    <div class="phero-col">${o.media
        .filter((_, i) => i % 3 === col)
        .map((m) => `<img src="${asset(m)}" alt="">`)
        .join("")}</div>`,
  )
  .join("\n")}
  </div>
</div>`;

/**
 * 슬라이드 머리.
 *
 * **키워드가 먼저 크게 보여야 한다** — 어느 장인지 한눈에 잡히지 않으면
 * 제안 문장을 읽어 주지도 않는다. 그 아래 한 줄짜리 제안 문장을 붙인다.
 * 문장은 한 줄에 들어가는 길이로만 쓴다.
 */
const head = (keyword: string, subline: string) => `
<div class="shead">
  <h2>${keyword}</h2>
  <p class="subline">${subline}</p>
</div>`;

const planRows = (rows: typeof singles, kind: "single" | "package") =>
  rows
    .map((p) => {
      /**
       * ⚠️ **편당은 표 안에 안 넣는다.** (2026-08-19 사장님 지시)
       *
       * 싱글에만 "편당 ₩250,000" 이 붙고 멀티에는 안 붙어서 **양쪽 행 높이가
       * 어긋났다.** 멀티는 시딩이 섞여 편당이 성립하지 않으니 맞출 수도 없다.
       * 편당 할인 구조는 표 아래 각주 한 줄로 옮긴다.
       */
      /**
       * 체험 티어는 **깎아 준 값**이라는 걸 밝힌다. (2026-08-19 사장님 지적)
       *
       * *"체험 1건은 20% 할인 들어간 게 왜 표기가 안 됐어? 원가 원래
       * 얼마인데 깎아준 거잖아."* 216,000 만 적으면 그냥 싼 상품으로 읽히고,
       * **첫 거래를 트시라고 내준 값**이라는 뜻이 사라진다.
       */
      const unit = p.trialDiscount
        ? `정가 ${formatKRW(p.listPrice)} · ${Math.round(p.trialDiscount * 100)}% 할인`
        : "";
      return `<tr>
  <td class="t-name">${esc(p.label)}</td>
  <td class="t-desc">${esc(p.composition)}</td>
  <td class="t-price">${formatKRW(p.betaPrice)}${unit ? `<span>${unit}</span>` : ""}</td>
</tr>`;
    })
    .join("");

/* ───────────────────────── 슬라이드 ───────────────────────── */

const pages: string[] = [];

/**
 * 목차 구간 (2026-08-20 개편)
 *
 * 장표를 `addPage()` 한 순서대로 내지 않는다. **구간 키로 묶어 `ORDER` 대로
 * 다시 세운다.** 코드 블록을 통째로 옮기지 않아도 목차를 바꿀 수 있고, 한
 * 구간에 장을 더해도 위치가 흔들리지 않는다.
 *
 * 같은 구간 안에서는 코드에 적힌 순서 그대로 나간다.
 */
const secOf: string[] = [];
let SEC = "cover";
/** 이 아래로 만들어지는 장표가 속할 구간 */
const sec = (k: string) => {
  SEC = k;
};
/** `pages.push` 대신 — 어느 구간의 장표인지 함께 적어 둔다 */
const addPage = (html: string) => {
  pages[pages.length] = html;
  secOf.push(SEC);
};

// 01 표지
sec("cover");





addPage(
  slide(
    `<div class="cover">
  <div class="cover-l">
    <p class="cover-en">HGRS STUDIO</p>
    <h1>해그로시<br>스튜디오<br><span class="chip-title">종합 소개서</span></h1>
    <p class="cover-sub">인플루언서 시딩과 구매 전환 숏폼부터 브랜드 채널 마케팅까지<br>브랜드 퍼널을 완성하는 두 갈래를 함께 소개합니다.</p>
    <div class="cover-stats">
      <div><strong>30+</strong><span>브랜드 프로젝트</span></div>
      <div><strong>3억대</strong><span>연 거래액</span></div>
      <div><strong>₩2,000만</strong><span>평균 프로젝트 단가</span></div>
    </div>
    <p class="cover-org">${COMPANY.name} · ${SERVICE.url.replace("https://", "")}</p>
  </div>
  <div class="cover-r">
${["riiid-momcafe", "moen-shampoo-ppl", "zeroblock-interview", "bone-w40s"].map((s) => `<img src="${asset(`/portfolio/clips/${s}.jpg`)}" alt="">`).join("")}
  </div>
</div>`,
    { dark: true, bare: true },
  ),
);

// 02-1 관점 — 이 문서 전체의 전제
sec("hook");





addPage(
  slide(
    `<div class="stmt">
  <p class="stmt-k">HGRS STUDIO</p>
  <p class="stmt-t">요즘 브랜드는 컨텐츠에서 시작해<br>고객으로 전환시키는 그로스 퍼널로 끝납니다.</p>
  <p class="stmt-d">해그로시는 종합 마케팅과 브랜드 컨텐츠 덕션을 함께 운영하는 스튜디오입니다.<br>
  브랜드 유튜브·인스타그램 등 SNS 채널과, 인플루언서 시딩 바이럴 그리고 그 소스의<br>
  2차 활용을 통한 구매 전환형 숏폼 기획제작을 함께 진행합니다.</p>
</div>`,
    { dark: true, bare: true },
  ),
);

// 09 클라이언트
sec("corp");





addPage(
  slide(`
${head("클라이언트 히스토리", "커머스부터 서비스, 플랫폼까지 30여 브랜드와 함께했습니다")}
<div class="logos">
${CLIENTS.map((c) => `<div><img src="${asset(`/logos/${c}.png`)}" alt=""></div>`).join("")}
</div>`),
);

// 02-2 세 갈래
sec("lines");





addPage(
  slide(`
${head("무엇이 필요하신가요", "두 갈래 중 어디서 시작하셔도 같은 팀이 붙습니다")}
<div class="lines">
${/* 2026-08-20 — 세 갈래 → **두 갈래.** SNS 채널과 종합 마케팅을 하나로 합치면서
     LINE 02·03 이 한 서비스가 됐다. 플랜명을 카드 안에 같이 적어야
     "무엇을 사는 건지" 가 한 번에 잡힌다. */
[
  {
    k: "구매 전환 소재",
    t: "숏폼 스튜디오",
    d: "인플루언서 시딩과 2차 활용 소스로<br>광고 소재를 편수 단위로 제작합니다.",
    plans: ["싱글 플랜 — 보유 소스로 숏폼만", "멀티 플랜 — 시딩으로 소스부터 확보"],
    tag: "편수 단위 · 즉시 시작",
  },
  {
    /* 2026-08-20 — LINE 01/02 라벨을 뺐다. 번호가 순서처럼 읽혀서
       "1번 먼저 사고 2번" 으로 오해된다. 무엇을 사는지로 바꾼다.
       이 카드 제목은 사장님 지시로 **브랜드 종합 그로스팀**. */
    k: "브랜드 전담팀",
    t: "브랜드 종합 그로스팀",
    d: "채널·컨텐츠·광고를 하나의 전략으로 묶어<br>기간 단위로 함께 굴립니다.",
    plans: ["SNS 채널 활성화 플랜", "린 IMC 마케팅 구독제"],
    tag: "6개월 또는 1년 · 협의",
  },
].map(
  (l) => `<div class="line-card">
  <p class="line-k">${l.k}</p>
  <p class="line-t">${l.t}</p>
  <p class="line-d">${l.d}</p>
  <ul class="line-plans">${l.plans.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
  <p class="line-tag">${l.tag}</p>
</div>`,
).join("")}
</div>
`),
);

// PART1
sec("part-shortform");





addPage(
  slide(
    partHero({
      eyebrow: "HGRS Studio",
      title: ["인플루언서 시딩부터 매출형 숏폼까지", "숏폼 부스팅 프로젝트"],
      sub: ["인플루언서 시딩과 채널 바이럴", "그리고 구매 전환형 광고 소재를 한번에!"],
      stats: [
        { v: "30+", l: "브랜드 프로젝트 수행" },
        { v: "3억대", l: "연 거래액" },
        { v: "₩2,000만", l: "평균 프로젝트 단가" },
      ],
      media: [
        "/portfolio/clips/riiid-parent-itv.jpg",
        "/portfolio/clips/seeding-patty.jpg",
        "/portfolio/clips/moen-shampoo-ppl.jpg",
        "/portfolio/clips/zeroblock-interview.jpg",
        "/portfolio/clips/bone-w40s.jpg",
        "/portfolio/clips/krafton-pnc-salute.jpg",
      ],
    }),
    { hero: true, bare: true, layout: "part" },
  ),
);

// 04 포지션
sec("identity");





addPage(
  slide(`
${head("해그로시 서비스 영역", "소스 확보부터 구매전환 숏폼, 브랜드 채널 운영까지 한 팀 안에서 이어집니다")}
<div class="two vcenter">
  <div class="venn">
    <div class="venn-c venn-a"><span>인플루언서<br>시딩<em>숏폼 멀티 플랜</em></span></div>
    <div class="venn-c venn-b"><span>광고 숏폼<br>기획제작<em>숏폼 싱글 플랜</em></span></div>
    <div class="venn-c venn-d"><span>컨텐츠<br>채널 구축<em>SNS 채널 활성화 플랜</em></span></div>
    <div class="venn-mid"><strong>해그로시</strong><span>스튜디오</span></div>
  </div>
  <div class="pos-col">
${[
  ["소스부터 확보", "인플루언서 시딩으로 찍을 것을 만듭니다"],
  ["전환까지 연결", "그 소스로 구매 전환 소재를 제작합니다"],
  ["채널에 쌓습니다", "인스타그램 · 유튜브 · 블로그를 함께 굴립니다"],
]
  .map(([t, d]) => `<div class="pos"><p class="pos-t">${t}</p><p class="pos-d">${d}</p></div>`)
  .join("")}
    <div class="pos-note">여기에 퍼포먼스 · CRM · 데이터를 더하면 <b>린 IMC 마케팅 구독제</b>입니다</div>
  </div>
</div>`),
);

// 04-2 인플루언서 시딩 — 히어로 바로 밑 3단 밴드 (홈페이지 ServiceFlow 그대로)
sec("shortform-seeding");

/**
 * 사장님: *"숏폼 스튜디오에 인플루언서 시딩을 제목에서부터 제대로 언급하고
 * 전용 장표도 앞에 나와있어야돼. 히어로섹션 바로 밑에 3개 섹션들에서
 * 바이럴했으면 매출도 올려라 이런거 있잖아. 그 내용을 적어줘."*
 *
 * 홈페이지 `components/landing/s-service-flow.tsx:26-64` 의 1·2·3 밴드를
 * **문구 그대로** 옮긴다. 홈은 밴드 배경이 light → indigo → night 로 갈리는데,
 * 소개서는 한 장이라 **카드 세 장의 면 색**으로 그 교차를 살린다.
 */
addPage(
  slide(
    `
${head("인플루언서 시딩부터 시작합니다", "찍을 소스가 없는 브랜드는 여기서 출발합니다 — 시딩 → 소스컷 → 매출형 숏폼")}
<div class="flow3">
${[
  {
    k: "인플루언서 시딩&바이럴",
    t: "요즘 브랜드의 필수 요소,<br>인플루언서 리뷰 배포,<br>그것만으로 매출이 올랐나요?",
    d: "브랜드에 맞는 크리에이터를 골라 붙이고 리뷰를 실제 채널에 배포합니다.",
    c: "f3-light",
    img: "/portfolio/clips/riiid-parent-empathy.jpg",
  },
  {
    k: "2차 활용 소스 컷 확보",
    t: "“채널 바이럴했으면<br>광고 매출도<br>키우셔야죠!”",
    d: "배포로 끝내지 않고 원본에서 광고용 컷을 다시 뽑아 자산으로 남깁니다.",
    c: "f3-indigo",
    img: "/portfolio/clips/seeding-patty.jpg",
  },
  {
    k: "매출형 숏폼 기획제작",
    t: "오가닉 채널 트래픽부터<br>구매·CPA 특화형 소재까지<br>한번에 해결해 드립니다.",
    d: "확보한 소스로 구매 전환형 숏폼을 만들어 광고 계정에 바로 태웁니다.",
    c: "f3-night",
    img: "/portfolio/clips/moen-shampoo-ppl.jpg",
  },
]
  .map(
    (x) => `<div class="f3 ${x.c}">
  <img src="${asset(x.img)}" alt="">
  <div class="f3-b">
    <p class="f3-k">${x.k}</p>
    <p class="f3-t">${x.t}</p>
    <p class="f3-d">${x.d}</p>
  </div>
</div>`,
  )
  .join("")}
</div>
<div class="oneline">${esc(POLICY.seedingBundleOnly)}</div>`,
  ),
);

// 05 진행 라인
sec("how-shortform");




addPage(
  slide(`
${head("진행 프로세스", "가이드라인부터 납품까지, 넘길 때마다 다시 설명하실 일이 없습니다")}
<div class="flow">
${FLOW.map(
  ([n, t, d]) => `<div class="flow-row">
  <span class="flow-no">${n}</span>
  <div><p class="flow-t">${esc(t)}</p><p class="flow-d">${esc(d)}</p></div>
</div>`,
).join("")}
</div>
<div class="oneline">프로젝트 시작 시 전용 대시보드를 통해 진행 단계와 소통을 한번에 해결합니다.</div>`),
);

// 07 숏폼 성과 — 브랜드당 한 장
sec("numbers-shortform");





/**
 * 모에브 구매·ROAS 표. (2026-08-20 사장님 지시)
 *
 * 프레이머 포트폴리오 원문에 붙어 있던 표인데, 원본이 저해상도 스크린샷이라
 * 소개서에 그대로 넣으면 글자가 뭉갠다. 사장님: *"화질 개선해서 올려야 하고.
 * 다시 만들던가 동일하게."* → **같은 값으로 HTML 표를 다시 그렸다.** 인쇄가
 * 벡터로 나가므로 확대해도 깨지지 않는다. 숫자는 원문 그대로다.
 *
 * 원문 표는 중간 행이 잘려 있었고 마지막 줄만 강조(합계)되어 있었다. 보이지
 * 않는 행을 지어내지 않았다 — 캡션에 생략 사실을 적는다.
 */
const MOEV_ROAS = {
  head: ["Npay 구매금액", "일반 구매금액", "총 구매건수", "총 구매금액", "ROAS"],
  rows: [
    ["₩4,870,439", "₩3,246,556", "205", "₩8,116,995", "140%"],
    ["₩2,279,421", "₩1,359,791", "91", "₩3,639,212", "154%"],
    ["₩2,361,129", "₩1,679,416", "101", "₩4,040,545", "134%"],
    ["₩7,033,630", "₩3,905,706", "266", "₩10,939,336", "206%"],
  ],
  total: ["₩38,912,432", "₩22,177,453", "1,493", "₩61,089,885", "286%"],
  caption:
    "모에브 구매금액·구매건수·ROAS 실적. 프레이머 포트폴리오 원문 표를 같은 값으로 다시 조판했습니다(중간 행 일부 생략, 마지막 줄은 합계).",
};

const moevTable = () => `<div class="bc-tbl"><div class="tbl-sheet">
  <figure>
    <table class="dtable">
      <thead><tr>${MOEV_ROAS.head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
      <tbody>
        ${MOEV_ROAS.rows.map((r) => `<tr>${r.map((v) => `<td>${esc(v)}</td>`).join("")}</tr>`).join("")}
        <tr class="dtable-sum">${MOEV_ROAS.total.map((v) => `<td>${esc(v)}</td>`).join("")}</tr>
      </tbody>
    </table>
    </div>
    <figcaption>${esc(MOEV_ROAS.caption)}</figcaption>
  </figure>
</div>`;

/**
 * 증빙 한 장을 그리는 조각. 케이스 슬라이드와 증빙 슬라이드가 같이 쓴다.
 */
const evFigure = (e: Evidence) =>
  `<figure><img src="${asset(`/evidence/${e.file}`)}" alt=""><figcaption>${esc(e.caption)}${e.masked ? ' <span class="ev-mask">일부 가림</span>' : ""}</figcaption></figure>`;

/**
 * 케이스 슬라이드에 실을 증빙을 고른다.
 *
 * ⚠️ **월별 실적표를 맨 앞에 세운다.** 앞 판은 매칭된 순서대로 전부 넣었는데,
 * `.bc-ev` 가 `overflow:hidden` 이라 화면에 들어가는 만큼만 보이고 **뒤로 밀린
 * 장은 통째로 사라졌다.** 하필 사라진 게 월별 퍼포먼스 표였다 — 사장님이
 * *"정작 중요한 지표 좋아지는 실적이 안 들어갔다"* 고 한 것이 이것이다.
 *
 * 그래서 지표가 개선되는 표(kind: 퍼포먼스)를 먼저 세우고, 케이스 슬라이드에는
 * 잘리지 않을 만큼만 싣는다. 나머지는 버리지 않고 뒤의 실적 증빙 슬라이드로 간다.
 */
/** 가로로 아주 긴 표인가 — 전체 폭에 둬야 숫자가 읽힌다 */
const isWide = (e?: Evidence) => !!e && (e.width ?? 0) / (e.height ?? 1) >= 5;

const PERF_FIRST = (a: Evidence, b: Evidence) =>
  (b.kind === "퍼포먼스" ? 1 : 0) - (a.kind === "퍼포먼스" ? 1 : 0);

/** 케이스 슬라이드 왼쪽 열에 안 잘리고 들어가는 최대 장수 */
const EV_ON_CASE = 1;

/** 케이스 슬라이드에 못 실어 뒤로 넘긴 증빙 */
const overflowEvidence: Evidence[] = [];

/**
 * 홈페이지 `GrowthCases` 섹션을 그대로 옮긴다. (2026-08-20 사장님 지시)
 *
 * *"12번부터 15번까지 장표 등은 홈페이지에 나와 있는 배경색이나 디자인 다
 * 따라해서 그대로 넣되 지금처럼 숫자실적 표로 넣어준것들과 편성표 등은 유지."*
 *
 * 옮긴 것 — 다크 배경 #0a0a0c · 골드 세로선 성과 문구 · scope 칩 ·
 * GrowthMeter(우상향 선 + 골드 숫자). 실적 증빙표·편성표는 그대로 둔다.
 * 애니메이션은 **완성 상태**로 고정한다(선은 dashoffset 0, 끝점 원은 표시).
 */
const growthMeter = (stats: readonly (readonly string[])[]) =>
  !stats.length
    ? ""
    : `<div class="gm">
  <svg class="gm-line" viewBox="0 0 320 56" fill="none" aria-hidden="true">
    <path d="M2 54 L54 46 L106 40 L158 28 L210 22 L262 12 L318 2"
      stroke="var(--gold)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="318" cy="2" r="4" fill="var(--gold)"/>
  </svg>
  <dl class="gm-stats">
${stats.map((st) => `    <div><dd>${esc(st[0])}</dd><dt>${esc(st[1])}</dt></div>`).join("\n")}
  </dl>
</div>`;

CASES.forEach((c) => {
  const ev = evidenceOf(c.key).sort(PERF_FIRST);
  const onCase = ev.slice(0, EV_ON_CASE);
  overflowEvidence.push(...ev.slice(EV_ON_CASE));

  addPage(
    slide(
      `
<div class="gcase">
  <div class="gc-body">
    <p class="gc-eyebrow">Growth Case ${c.no}</p>
    <h2 class="gc-title">${esc(c.brand)}<span>${esc(c.scale)}</span></h2>
    <p class="gc-result">${esc(c.result)}</p>
    <p class="gc-scope">${esc(c.scope)}</p>
    ${growthMeter(c.stats)}
    ${/* 세로가 있는 증빙(편성표 등)은 **왼쪽 열 빈 자리**에 넣는다.
         전체 폭에 두면 object-fit:contain 이 세로 기준으로 줄여 좌우가 텅 빈다.
         크래프톤은 지표 숫자가 없어 이 자리가 마침 비어 있다. (2026-08-20) */
      onCase.length && !isWide(onCase[0])
        ? `<div class="bc-ev">${onCase.map(evFigure).join("")}</div>`
        : ""}
  </div>
  <div class="gc-media">
    <img src="${asset(c.img)}" alt="">
  </div>
</div>
${/* 가로로 아주 긴 표(5:1↑)만 전체 폭. 그 외는 위 왼쪽 열에 이미 들어갔다 */
  c.key === "모에브"
    ? moevTable()
    : onCase.length && isWide(onCase[0])
      ? `<div class="bc-ev-wide">${onCase.map(evFigure).join("")}</div>`
      : ""
}
<p class="foot-note">${esc(POLICY.noGuarantee)}</p>`,
      { dark: true, layout: "case" },
    ),
  );
});

// 02-6-2 숏폼 포트폴리오
sec("made-shortform");





/**
 * 숏폼 포트폴리오 — **폴더에 있는 소재를 전부** 싣는다. (2026-08-19)
 *
 * 사장님: *"영상 포트폴리오로 안 채워진 것들은 마저 넣어. 폴더에서 반영
 * 안 된 건 넣으라고 했잖아 거기 넣어."* 앞 판은 12칸 한 장이라 22편 중
 * 10편이 어디에도 안 나왔다. **12칸씩 끊어 필요한 만큼 장을 늘린다.**
 *
 * 브랜드명은 사장님이 그리드 순서대로 매칭해 주신 값이다(`lib/clips.ts`).
 */
{
  const perPage = 12;

  /**
   * 목적별로 묶어 보여 준다. (2026-08-20 사장님 지시)
   *
   * *"브랜드로 나누기보다 너가 영상을 보고 영상의 목적(후기형, 인터뷰형,
   * 스토리형 등등) 넣으면 되고."*
   *
   * 앞 판은 브랜드로 묶고 상한을 걸었는데, 그러면 한 장에 두세 브랜드밖에
   * 안 보여 "그 업종 전문"으로 읽힌다. 목적으로 묶으면 **"우리는 이런 각을
   * 만든다"** 가 보인다. 배지도 브랜드 대신 목적을 단다.
   *
   * 분류는 `lib/clips.ts` 의 `CLIP_PURPOSE` — 22편을 프레임으로 직접 보고 정한
   * 값이고, 근거를 줄마다 적어 뒀다.
   */
  /* 드라이브 38편이 들어와 60편이 됐다 — 그대로 깔면 9장이라 소개서가 소재
     카탈로그가 된다. **브랜드당 10편 상한**을 걸어 3장으로 맞춘다. 빠진 것은
     버리는 게 아니라 홈페이지 /portfolio 에 전부 있다. */
  const BRAND_CAP = Number(process.env.DECK_BRAND_CAP ?? 99); // 기본은 전부 — 줄이려면 DECK_BRAND_CAP=10

  /**
   * 같은 사람이 나란히 오지 않게 **브랜드를 번갈아** 깐다. (2026-08-20)
   *
   * 사장님: *"동일 인물들이 나란히 너무 자주나오는건 좀 섞어서 중복없어
   * 보이게끔해."* 목적으로 묶는 건 유지하되, 목적 안에서 브랜드를 라운드로빈
   * 한다. 트러스티 필독사전 6편·내추럴헬스 약사 편이 줄줄이 붙던 문제가
   * 이걸로 풀린다.
   */
  const brandKey = (slug: string) =>
    CLIPS_BY_BRAND.find((b) => b.slugs.includes(slug))?.brand ?? "";

  /**
   * **브랜드를 전 구간에 걸쳐 번갈아** 깐다. (2026-08-20)
   *
   * 앞 판은 목적 그룹 *안에서만* 돌려서, 한 그룹에 한 브랜드만 남으면 같은
   * 화자가 예닐곱 칸 줄줄이 붙었다(1장 인접중복 4, 3장 3).
   * 전체를 브랜드 기준으로 돌리면 편수 많은 브랜드만 남는 꼬리에서만 붙는다.
   * 각 브랜드 안의 순서는 목적 순서를 그대로 따라가므로 배지 흐름도 유지된다.
   */
  const order = new Map(CLIPS_BY_PURPOSE.flatMap((g) => g.slugs).map((s2, i2) => [s2, i2]));
  const used: Record<string, number> = {};
  const pools = new Map<string, string[]>();
  for (const b of CLIPS_BY_BRAND) {
    const arr = b.slugs
      .filter((x) => !DECK_EXCLUDE.has(x))
      .sort((x, y) => (order.get(x) ?? 0) - (order.get(y) ?? 0))
      .filter(() => (used[b.brand] = (used[b.brand] ?? 0) + 1) <= BRAND_CAP);
    if (arr.length) pools.set(b.brand, arr);
  }
  const all: string[] = [];
  while (pools.size)
    for (const [b, arr] of [...pools].sort((x, y) => y[1].length - x[1].length)) {
      const x = arr.shift();
      if (x) all.push(x);
      if (!arr.length) pools.delete(b);
    }

  /* 마지막 장에 한두 칸만 남지 않게 장 수로 나눠 균등 배분 */
  const per = all.length > perPage ? Math.ceil(all.length / Math.ceil(all.length / perPage)) : perPage;

  const brandOf = brandKey;

  for (let i = 0; i < all.length; i += per) {
    const chunk = all.slice(i, i + per);
    const page = Math.floor(i / per) + 1;
    const total = Math.ceil(all.length / per);

    addPage(
      slide(
        `
${head(
  total > 1 ? `최근 챔피언 숏폼 포트폴리오 (${page}/${total})` : "최근 챔피언 숏폼 포트폴리오",
  "브랜드가 아니라 소재의 목적으로 묶었습니다 — 누르면 영상이 재생됩니다",
)}
<div class="shorts">
${/* 마지막 장에 빈 칸이 남으면 "더 없는 줄" 알기 쉬워 한 칸을 (이하 생략)으로 채운다 */
  ""}${chunk
  .map(
    (slug) =>
      `<a class="short" href="${playUrl(slug)}"><img src="${asset(clipPoster(slug))}" alt=""><span class="play">▶</span><span class="short-b">${esc(CLIP_PURPOSE[slug] ?? "")}</span><span class="short-brand">${esc(brandOf(slug))}</span></a>`,
  )
  .join("")}${
  page === total && chunk.length < per
    ? `<div class="short-more"><span>(이하 생략)</span></div>`
    : ""
}
</div>`,
        { alt: true, layout: "wall" },
      ),
    );
  }
}

// 10 제작 조직 (현장)
sec("team");





addPage(
  slide(`
${head("브랜드 마케팅과 덕션의 일체화 집단", "전략을 아는 사람이 만들고, 만드는 사람이 성과를 봅니다")}
<div class="creds">
${CREDENTIALS.map((c) => `<span class="cred">${c}</span>`).join("")}
</div>
<div class="crew">
${Array.from({ length: 8 }, (_, i) => `<img src="${asset(`/portfolio/crew/crew-0${i + 1}.webp`)}" alt="">`).join("")}
</div>`),
);

// 14 이용 방법 (실제 화면)
sec("how-shortform");



addPage(
  slide(`
${head("프로젝트 대시보드 확인", "인플루언서 시딩부터 2차 활용, 숏폼 기획·제작, 컨텐츠 배포까지 대시보드에서 바로 확인하세요")}
<div class="board">
  <div class="board-side">
    <div class="board-item">
      <img src="${asset("/deck/ui-cpv.png")}" alt="">
      <p class="cap">1차 선정 심사 — 팔로워 · 평균 조회 · CPV를 보고 직접 선택</p>
    </div>
    <div class="board-item">
      <img src="${asset("/deck/ui-brandai.png")}" alt="">
      <p class="cap">브랜드 AI 기본 분석 — 타겟 · USP · 객단가 · 금지 표현 구조화</p>
    </div>
  </div>
  <div class="board-main">
    <img src="${asset("/deck/ui-dashboard.png")}" alt="">
    <p class="cap">진행중인 캠페인 — 진행 단계 · 플랜 · 기한을 한 화면에서</p>
  </div>
</div>`),
);

// 15 PLAN
sec("shortform-plan");




addPage(
  slide(`
${head("숏폼 플랜 안내", "정가로 결제하는 유일한 라인입니다 — 싱글과 멀티는 택일입니다")}

<div class="journey">
${[
  ["인플루언서 시딩", "가이드라인 · 배포", "j-gold"],
  ["2차 활용 소스컷", "광고용 컷 회수", "j-gold2"],
  ["구매전환 숏폼", "기획 · 제작", "j-indigo"],
  ["광고 집행", "계정 투입 · 변주", "j-ink"],
]
  .map(
    ([t, d, c], i, a) =>
      `<div class="j ${c}"><p class="j-t">${t}</p><p class="j-d">${d}</p></div>${i < a.length - 1 ? '<span class="j-arrow">▶</span>' : ""}`,
  )
  .join("")}
</div>

<div class="two plans">
  <div class="plan-col">
    <p class="plan-k">싱글 플랜</p>
    <p class="plan-h">보유 소스로 숏폼만</p>
    <p class="plan-d">촬영본 · UGC · 제품컷이 있으실 때. 구매 전환형 숏폼 기획제작만 편수 단위로 진행합니다.</p>
    <table class="tbl"><tbody>${planRows(singles, "single")}</tbody></table>
  </div>
  <div class="plan-stack">
    <div class="plan-col plan-col-pkg">
      <p class="plan-k">멀티 플랜</p>
      <p class="plan-h">시딩으로 소스부터 확보</p>
      <p class="plan-d">찍을 소스부터 없으실 때. 인플루언서 시딩으로 소스컷을 확보하고 숏폼까지 이어서 만듭니다.</p>
      <table class="tbl"><tbody>${planRows(packages, "package")}</tbody></table>
    </div>
    <!-- 모델 섭외 옵션 — 싱글 열이 4행이라 오른쪽이 짧다. 이 박스로 높이를 맞춘다 -->
    <div class="plan-opt">
      <div>
        <p class="opt-k">싱글 플랜 옵션</p>
        <p class="opt-h">${esc(MODEL_OPTION.label)}</p>
        <p class="opt-d">셀프캠 · 광고형 · 전용 기획 · 대본 · 콘티 · 수정 1회 포함</p>
      </div>
      <p class="opt-p">인당 ${formatKRW(MODEL_OPTION.unitPrice)}</p>
    </div>
  </div>
</div>

<p class="vat">※ 부가세 별도 · 싱글 플랜 편당 ₩250,000 → ₩220,000 (편수가 늘수록 낮아집니다) · ${esc(POLICY.seedingBundleOnly)}</p>`),
);

// 15-2 라인별 계약 구조 (2026-08-20 사장님 확인)
//
// 사장님: *"플랜 결제에서는 숏폼 뿐 아니라 나머지도 있는거지? 나머지는
// sns채널 운영(인스타,블로그,유튜브). 참고로 종합마케팅은 마크업+팀
// 구독료로 진행하는데 월 3곳 한정."*
//
// ⚠️ LINE 02·03 은 **정가가 없다.** 앞 장(숏폼)처럼 표로 금액을 적지 않는다.
// 여기서 파는 건 금액이 아니라 **과금 방식과 계약 단위**다. 숫자를 지어내지
// 않는다 — 확인된 것은 "마크업 + 팀 구독료", "월 3곳 한정", "최소 6개월 ·
// 기본 1년" 뿐이다.
sec("brand-plan");

/**
 * 브랜드 채널 마케팅 프로젝트 — 두 갈래. (2026-08-20 사장님 구술)
 *
 * ⚠️ **SNS 채널 활성화 플랜에는 투입 조직을 적지 않는다.** 광고·CRM 도 여기서
 * 말하지 않는다. 사장님: *"거기에 투입조직은 넣지마, 광고 crm은 말안할거야
 * 여기서."* — 그 둘은 린 IMC 쪽 이야기다.
 */
addPage(
  slide(`
${head("브랜드 채널 마케팅 프로젝트", "두 갈래로 나눠 진행합니다 — 필요한 쪽만 골라도 됩니다")}
<div class="two">
  <div class="plan-col">
    <p class="plan-k">PLAN A</p>
    <p class="plan-h">SNS 채널 활성화 플랜</p>
    <p class="plan-d">브랜드가 가진 채널을 실제로 도는 채널로 만듭니다.</p>
    <ul class="plan-list">
      <li><strong>유튜브 채널 운영</strong><span>+ 쇼츠 · 릴스 미러링</span></li>
      <li><strong>SEO / AEO</strong><span>+ 브랜드 블로그 최적화</span></li>
    </ul>
    <div class="kv">
      <div><dt>계약 단위</dt><dd>6개월 또는 1년</dd></div>
      <div><dt>금액</dt><dd>브랜드 상황에 따라 협의</dd></div>
    </div>
  </div>
  <div class="plan-col plan-col-pkg">
    <p class="plan-k">PLAN B</p>
    <p class="plan-h">린 IMC 마케팅 구독제</p>
    <p class="plan-d">꼭 필요한 우선순위 전략만 조합해 팀 단위로 투입합니다.</p>
    <ul class="plan-list">
      <li><strong>퍼포먼스 마케팅</strong><span>메타 · 구글 메인 + PMF 채널 · 버티컬 · 네트워크 조합</span></li>
      <li><strong>CRM 캠페인 최적화</strong><span>멤버십 설계</span></li>
      <li><strong>데이터 · 그로스 파이프라인 구축</strong><span></span></li>
    </ul>
    <div class="kv">
      <div><dt>진행 한도</dt><dd><strong>월 3곳 한정</strong></dd></div>
      <div><dt>금액</dt><dd>브랜드 단위 협의</dd></div>
    </div>
  </div>
</div>
<div class="oneline">편수 단위 정가 결제는 숏폼 스튜디오뿐입니다 · 부가세 별도</div>`),
);

// 16 계약 · 결제
sec("shortform-plan");





addPage(
  slide(`
${head("숏폼 계약 · 결제", "숏폼 플랜은 구성 확정부터 납품까지 이 순서로 진행됩니다")}
<div class="contract">
${CONTRACT.map(
  ([n, t, d]) => `<div class="ct"><span class="ct-no">${n}</span><p class="ct-t">${esc(t)}</p><p class="ct-d">${esc(d)}</p></div>`,
).join("")}
</div>
<div class="pay-band">세금계산서 발행 후 현금(계좌이체)이 기본이며, 카드 결제도 가능합니다 · 부가세 별도</div>`),
);

// PART2
sec("part-brand");

/**
 * SNS 채널 서비스와 종합 마케팅 서비스를 **한 파트로 합쳤다.** (2026-08-20)
 *
 * 사장님: *"sns브랜드 서비스와 종합마케팅 서비스를 합치자. 합쳐서 브랜드 채널
 * 마케팅 이라고해야하나 뭔가 너가 정해서."*
 *
 * 이름은 **브랜드 채널 마케팅** 으로 정했다. 둘을 갈라 두면 읽는 쪽에서
 * "채널만 하는 팀 / 광고까지 하는 팀" 으로 나눠 읽는데, 실제로는 같은 팀이
 * 채널을 중심에 두고 광고·CRM·이벤트까지 붙이는 하나의 계약이다.
 * 히어로 카피는 /sns-brand 원문을 그대로 쓰되 마지막 줄에 종합 범위를 더했다.
 */
addPage(
  slide(
    partHero({
      eyebrow: "Brand Channel Marketing",
      title: ["브랜드 퍼널을 완성하는", "채널 · 컨텐츠 · 광고 통합 운영"],
      sub: [...HERO.sub],
      stats: HERO.stats.map((x) => ({ v: x.figure, l: x.label })),
      media: [
        "/sns/krafton-contents.jpg",
        "/sns/lovedy-funnel.png",
        "/sns/yeolda-shoot.jpg",
        "/sns/trusty-vet.jpg",
        "/sns/krafton-3c.png",
        "/sns/lovedy-result.png",
      ],
    }),
    { hero: true, bare: true, layout: "part" },
  ),
);

// 15-6 주요 사례 10건 — 홈페이지 고객 이야기 제목·이미지 그대로
sec("brand-stories");

/**
 * 사장님: *"주요 사례들을 10개 정도 보여주면서 … 홈페이지에 있는거 최대한
 * 동일하게 따라해 카피와 이미지까지."* + *"썸네일 노출되는 곳 제목 문구
 * 잘 했잖아 그거 그대로 동일하게 쓰고."*
 *
 * 제목은 `lib/story-cards.ts`(= /blog 고객 이야기 제목 원문), 이미지는 프레이머
 * 대표 컷, 링크는 hgrs.io/blog/{slug}. 카드에서 눌러 글로 넘어간다.
 */
{
  const rows = FEATURED_STORIES;
  const page = 0;
  addPage(
    slide(
      `
<div class="shead">
  <p class="eyebrow-lime">Growth Stories</p>
  <h2>주요 성장 사례 ${rows.length}건</h2>
  <p class="subline">브랜드마다 무엇이 문제였고 무엇이 달라졌는지 — 누르면 전문이 열립니다</p>
</div>
<div class="stories">
${rows
  .map((st) => {
    const fc = FRAMER_CASES.find((c) => c.slug === st.framer);
    const cover = fc?.blocks.find((b) => "img" in b) as { img: string } | undefined;
    return `<a class="story" href="${PLAY_ORIGIN}/blog/${st.slug}">
  ${cover ? `<img src="${asset(cover.img)}" alt="">` : `<div class="imc-nopic"></div>`}
  <p class="story-t">${esc(st.title)}</p>
</a>`;
  })
  .join("")}
</div>`,
      { dark: true, layout: "cards" },
    ),
  );
}

// 02-4 SNS 종합 브랜드 마케팅 시스템 (랜딩 Process 섹션 그대로)
sec("how-sns");





addPage(
  slide(`
${head(PROCESS.title, "SNS 채널 연간 기획운영이 기본이며, 아래 범위는 필요 시 협의해 더합니다")}
<div class="cards4">
${PROCESS.items
  .map(
    (it) => `<div class="card4">
  <img class="card4-img" src="${asset(it.shot.src)}" alt="">
  <div class="card4-body">
    <span class="card4-no">${it.no}</span>
    <p class="card4-t">${esc(it.title)}</p>
    <p class="card4-d">${esc(it.body)}</p>
  </div>
</div>`,
  )
  .join("")}
</div>`),
);

// 02-6 채널 성과 — 브랜드당 한 장
sec("numbers-sns");





/**
 * 소개서에서만 갈아 끼우는 대표 컷.
 * 랜딩은 히어로 아래에 영상 카드가 붙어서 같은 프레임이 겹치지만,
 * 소개서는 장표 하나에 이미지 한 장이라 사장님이 지정한 수의사 롱폼 컷을 쓴다.
 */
const DECK_HERO: Record<string, string> = { trusty: "/sns/trusty-vet.jpg" };

/**
 * SNS 채널 케이스 — 홈페이지 `s-cases.tsx` 카드를 **그대로** 옮긴다. (2026-08-20)
 *
 * 사장님: *"포트폴리오 홈페이지 작업하면서 내용이랑 이미지랑 모든게 다 있는데
 * 카피도 그렇고 왜 안따라하고 자꾸 단순 나열을 이해못하게하는거야."*
 *
 * 앞 판이 쓴 건 `hero` 한 장뿐이었다. 원본에 있는데 안 쓰던 것들 —
 *   `label`(Feature 01) · `category` · `figures`(기획안·퍼널맵 도판) ·
 *   `videos`(유튜브) · `channels`(채널 타일·구독자 수) · `channelsNote`
 * 를 전부 싣는다. 한 장에 다 넣으면 넘치므로 **케이스당 두 장**으로 나눈다.
 *
 *   ① 이야기 — 카테고리/메타 · 타이틀 · 본문 · 성과 3칸 · 대표 도판
 *   ② 산출물 — 기획안·퍼널맵 도판 · 유튜브 · 굴린 채널 · 실적 증빙
 *
 * 롱폼을 따로 나열하지 않고 여기 ②로 넣는다. 앞 판은 롱폼 장이 뒤에 뚝
 * 떨어져 있어 *"어떻게 이어지는지 전혀 모를"* 상태였다.
 */
FEATURES.forEach((f) => {
  const brandName = f.meta.split(/[\s(]/)[0];
  const matched = EVIDENCE.filter((e) => e.brand.startsWith(brandName)).sort(PERF_FIRST);

  // ① 이야기
  addPage(
    slide(
      `
<div class="fcard">
  <div class="fcard-h">
    <p class="fcard-cat">${esc(f.category)}</p>
    <p class="fcard-meta">${esc(f.meta)}</p>
  </div>
  <div class="fcard-b">
    <div>
      <h2 class="fcard-t">${esc(f.title)}</h2>
      ${f.body
        .slice(0, 3)
        .map((t) => `<p class="fcard-p">${esc(plain(t))}</p>`)
        .join("")}
      <ul class="fstats">
        ${f.stats
          .map(
            (st) =>
              `<li><strong>${esc(st.v)}</strong>${st.note ? `<span>${esc(st.note)}</span>` : ""}</li>`,
          )
          .join("")}
      </ul>
    </div>
    <div class="fcard-m">
      <figure><img src="${asset(DECK_HERO[f.id] ?? f.hero.src)}" alt=""><figcaption>${esc(f.hero.caption)}</figcaption></figure>
    </div>
  </div>
</div>`,
      { dark: true, layout: "case" },
    ),
  );

  // ② 산출물 — 도판 · 유튜브 · 채널 · 증빙
  /**
   * ⚠️ **도판을 전부 싣는다.** 앞 판은 `figures` 를 2장으로 자르고 오른쪽 열은
   * 채널이 없는 브랜드(럽디·열다)에서 통째로 비었다. 사장님: *"프레이머 옮길
   * 때 거기 내용들 충분히 있었을텐데. 좀 채워넣던가."*
   *
   * 채널이 있으면 좌(도판)/우(유튜브·채널) 두 열, 없으면 도판을 **2열로 펴서**
   * 장을 채운다.
   */
  const figs = f.figures ?? [];
  const vids = f.videos ?? [];
  const chans = f.channels ?? [];
  /**
   * 세로 도판(인스타 릴스 9:16)은 **가로 칸에 넣으면 손톱만 해진다.**
   * 가로로 긴 것과 갈라서, 세로는 세로 칸 두 개를 나란히 세운다.
   * (2026-08-20 — 트러스티 릴스 두 편이 실제로 그렇게 눌렸다)
   */
  const isPortrait = (w: number, h: number) => h > w * 1.2;
  const portraits = figs.filter((g) => isPortrait(g.width, g.height));
  const plates = [
    ...figs
      .filter((g) => !isPortrait(g.width, g.height))
      .map((g) => ({ src: g.src, cap: g.caption, mask: false })),
    ...matched.slice(0, 2).map((e) => ({ src: `/evidence/${e.file}`, cap: e.caption, mask: e.masked })),
  ];
  const plateHtml =
    (portraits.length
      ? `<div class="fout-reels">${portraits
          .map(
            (g) =>
              `<figure><img src="${asset(g.src)}" alt=""><figcaption>${esc(g.caption)}</figcaption></figure>`,
          )
          .join("")}</div>`
      : "") +
    plates
      .map(
        (g) =>
          `<figure><img src="${asset(g.src)}" alt=""><figcaption>${esc(g.cap)}${g.mask ? ' <span class="ev-mask">일부 가림</span>' : ""}</figcaption></figure>`,
      )
      .join("");
  const vidHtml = vids.length
    ? `<div class="fvids">${vids.slice(0, chans.length ? 2 : 4).map((v) => `<a class="thumb" href="${ytWatch(v.id)}"><img src="https://i.ytimg.com/vi/${v.id}/mqdefault.jpg" alt=""><span class="play">▶</span><span>${esc(v.title)}</span></a>`).join("")}</div>`
    : "";
  const chanHtml = chans.length
    ? `<p class="fchan-k">굴린 채널</p>${f.channelsNote ? `<p class="fchan-n">${esc(f.channelsNote)}</p>` : ""}
      <div class="fchan">${chans
        .map(
          (c) => `<div class="chan">
        <img src="${asset(c.thumb)}" alt="">
        <p class="chan-n">${esc(c.name)}</p>
        <p class="chan-h">${esc(c.platform)} · ${esc(c.handle)}</p>
        <p class="chan-m">${esc(c.metric ?? "")}</p>
      </div>`,
        )
        .join("")}</div>`
    : "";
  const split = !!(chanHtml || vidHtml);

  addPage(
    slide(
      `
<div class="fcard">
  <div class="fcard-h">
    <p class="fcard-cat">${esc(f.label)}</p>
    <p class="fcard-meta">${esc(f.meta)} — 산출물</p>
  </div>
  ${
    split
      ? `<div class="fout">
    <div class="fout-l">${plateHtml}</div>
    <div class="fout-r">${vidHtml}${chanHtml}</div>
  </div>`
      : `<div class="fout-grid">${plateHtml}</div>`
  }
</div>`,
      { dark: true, layout: "case" },
    ),
  );
});

// 15-7 운영한 채널 모음 — 유튜브 · 인스타그램 · 블로그
sec("brand-channels");

/**
 * 사장님: *"운영했던 블로그도 넣고 운영했던 인스타그램 채널들도 있잖아 넣고."*
 * `FEATURES[].channels` 를 전부 모아 한 장으로 편다 — 플랫폼이 섞여 있어야
 * "채널 하나만 하는 팀이 아니다"가 보인다.
 */
{
  /* ⚠️ 블로그는 FEATURES 가 아니라 `BLOG_CARD`(Feature 05 공식 블로그 운영)에
     따로 들어 있다. 처음에 이걸 빠뜨려 유튜브·인스타 4개만 나왔다. */
  const all = [...FEATURES.flatMap((f) => f.channels ?? []), ...BLOG_CARD.channels];
  addPage(
    slide(
      `
${head("직접 운영한 브랜드 채널", esc(BLOG_CARD.body[0]))}
<div class="chan-wall">
${all
  .map(
    (c) => `<div class="chan">
  <img src="${asset(c.thumb)}" alt="">
  <p class="chan-p">${esc(c.platform)}</p>
  <p class="chan-n">${esc(c.name)}</p>
  <p class="chan-h">${esc(c.handle)}</p>
  ${c.metric ? `<p class="chan-m">${esc(c.metric)}</p>` : ""}
  ${"note" in c && c.note ? `<p class="chan-note">${esc(String(c.note))}</p>` : ""}
</div>`,
  )
  .join("")}
</div>
<p class="foot-note">계약 범위에 따라 메인 채널을 정하고 나머지 채널에는 컨텐츠 미러링을 병행합니다.</p>`,
      { dark: true, layout: "cards" },
    ),
  );
}

// 02-5 투입 조직 (랜딩 Team 섹션 그대로)
sec("team");





addPage(
  slide(`
${head("채널 프로젝트 투입 조직", plain(TEAM.lead))}
<div class="teams">
${TEAM.teams
  .map(
    (t) => `<div class="team">
  <img class="team-img" src="${asset(t.photo)}" alt="">
  <p class="team-name">${esc(t.name)}</p>
  <ul class="team-list">${t.items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
</div>`,
  )
  .join("")}
</div>
<p class="foot-note">${esc(plain(TEAM.footnote))}</p>`),
);

// 02-6-1 최근 주요 포트폴리오 — 8장씩 나눠 담는다 (한 장에 12개를 넣으니 잘렸다)
sec("made-longform");





/* 4열×2행 = **한 장 정원 8칸**. 반씩 나누면 10칸이 되어 3행이 되고 넘친다
   (2026-08-20 검사기가 잡음). 정원 안에서 장 수를 정하고 균등 배분한다. */
const LONG_PAGES = Math.ceil(PORTFOLIO.videos.length / 8);
const LONG_PER = Math.ceil(PORTFOLIO.videos.length / LONG_PAGES);
Array.from({ length: LONG_PAGES }, (_, i) => i * LONG_PER).forEach((from, page) => {
  const rows = PORTFOLIO.videos.slice(from, from + LONG_PER);
  if (!rows.length) return;
  addPage(
    slide(
      `
${head(page === 0 ? "팬덤 시리즈 롱폼 포트폴리오" : `팬덤 시리즈 롱폼 포트폴리오 (${page + 1})`, page === 0 ? "앞의 네 브랜드 채널에 실제로 올린 컨텐츠입니다 — 누르면 유튜브에서 재생됩니다" : "이어서 보여드립니다")}
<div class="thumbs">
${rows
  .map(
    /* 롱폼도 눌러서 보게 한다. 숏폼(.short)만 링크가 걸려 있고 롱폼은
       이미지뿐이라 "누르면 재생됩니다"가 반만 참이었다. */
    (v) =>
      `<a class="thumb" href="${ytWatch(v.id)}"><img src="https://i.ytimg.com/vi/${v.id}/mqdefault.jpg" alt=""><span class="play">▶</span><span>${esc(v.title)}</span></a>`,
  )
  .join("")}
</div>
${page === LONG_PAGES - 1 ? `<p class="foot-note">${esc(PORTFOLIO.note)}</p>` : ""}`,
      { alt: true, layout: "wall" },
    ),
  );
});

// PART3 간지는 삭제했다 — SNS 파트와 종합 파트를 하나로 합치면서
// 간지가 둘일 이유가 없어졌다. (2026-08-20)

// 15-4 IMC 프로젝트 기록 — 프레이머 CMS 포트폴리오 28건을 그대로 싣는다 (2026-08-20)
sec("imc");





/**
 * 사장님: *"그 프레이머 읽은 건 홈페이지에 포트폴리오인가 성장사례 있는 칸에도
 * 다 동일하게 넣으면 돼. 소개서에도 넣고."* — 요약하거나 골라 담지 않는다.
 * 두 줄 설명은 프레이머 원문 그대로다.
 */
/* 앞의 "주요 성장 사례 10건"과 겹치지 않게 **나머지만** 싣는다.
   사장님: *"35-39번이 위에 주요 10개 포폴이랑 겹치지않아?"* */
const REST = FRAMER_CASES.filter((c) => !FEATURED_STORIES.some((st) => st.framer === c.slug));
/* 6칸씩 자르면 19건이 6·6·6·1 이 되어 마지막 장이 거의 빈다.
   장 수를 먼저 정하고 균등 배분한다 (5·5·5·4). */
const IMC_PAGES = Math.ceil(REST.length / 6);
const IMC_PER = Math.ceil(REST.length / IMC_PAGES);
for (let from = 0; from < REST.length; from += IMC_PER) {
  const rows = REST.slice(from, from + IMC_PER);
  const page = from / IMC_PER;
  const total = IMC_PAGES;
  addPage(
    slide(
      `
<div class="shead">
  <p class="eyebrow-lime">IMC PROJECTS</p>
  <h2>${total > 1 ? `그 밖의 프로젝트 ${REST.length}건 (${page + 1}/${total})` : `그 밖의 프로젝트 ${REST.length}건`}</h2>
  <p class="subline">${page === 0 ? `앞의 10건을 포함해 브랜드를 통으로 맡았던 프로젝트는 모두 ${FRAMER_CASES.length}건입니다 — 누르면 상세로 넘어갑니다` : "이어서 보여드립니다"}</p>
</div>
<div class="imc">
${rows
  .map((c) => {
    const cover = c.blocks.find((b) => "img" in b) as { img: string } | undefined;
    /* 카드마다 홈페이지로 넘어가는 링크를 단다. 고객 이야기가 있으면 그 글로,
       없으면 포트폴리오 상세로. (2026-08-20 사장님 지시) */
    const story = storyByFramer(c.slug);
    const href = story
      ? `${PLAY_ORIGIN}/blog/${story.slug}`
      : `${PLAY_ORIGIN}/portfolio/${encodeURIComponent(c.slug)}`;
    return `<a class="imc-card" href="${href}">
  ${cover ? `<img src="${asset(cover.img)}" alt="">` : `<div class="imc-nopic"></div>`}
  <div class="imc-body">
    <strong>${esc(c.name)}</strong>
    ${c.summary.map((line) => `<span>${esc(line)}</span>`).join("")}
    <em class="imc-go">${story ? "프로젝트 기록 읽기 →" : "자세히 보기 →"}</em>
  </div>
</a>`;
  })
  .join("")}
</div>`,
      { dark: true },
    ),
  );
}

// 15-5 통합 브랜드 액션 — 랜딩의 원형 다이어그램을 정지 상태로
sec("brand-aarrr");





[0, 4].forEach((actFrom, actPage) => {
  addPage(
    slide(`
${head(actPage === 0 ? "AARRR 퍼널로 묶은 브랜드 액션" : "AARRR 퍼널로 묶은 브랜드 액션 (2)", actPage === 0 ? "각 궤도는 한 브랜드에서 실제로 손 댄 지점입니다 — 유입·활성·유지·매출·추천을 한 전략으로 묶습니다" : "이어서 보여드립니다")}
<div class="orbits">
${ACTIONS.items
  .slice(actFrom, actFrom + 4)
  .map(
    (a) => `<div class="orbit-card">
  <div class="orbit">
    <span class="orbit-ring"></span>
    <span class="orbit-ring2"></span>
    <span class="orbit-orb"></span>
    ${a.items
      .slice(0, 4)
      .map((x, k) => `<span class="sat sat-${k}">${esc(x)}</span>`)
      .join("")}
    <span class="orbit-label">${esc(a.brand)}<em>브랜드</em>${a.period ? `<i>${esc(a.period)}</i>` : ""}</span>
  </div>
  <p class="orbit-r">${esc(a.results[a.results.length - 1])}</p>
</div>`,
  )
  .join("")}
</div>
${actPage === 1 ? `<p class="foot-note">${esc(POLICY.noGuarantee)}</p>` : ""}`),
  );
});

// 18 Appendix — AI와 일하는 방식 / 진행·정산·소통 (2026-08-20 사장님 지시)
sec("appendix");

/**
 * 사장님: *"1번은 AI 내용을 너가 추가해주라. 기존에 준 내용도 같이 들어갔으면
 * 해서 너가 제목이랑 알아서해줘."*
 *
 * ⚠️ AI 쪽 문구는 **레포에서 확인된 것만** 쓴다. 지어내지 않았다 —
 *  · `브랜드 AI 기본 분석` : 실제 대시보드 기능 (`/deck/ui-brandai.png` 스크린샷)
 *  · `AI_EFFICIENCY_NOTE` : lib/constants.ts:177 원문
 *  · `AI 강연자 출신 총괄 디렉터` : components/landing/s-system.tsx:51-52
 *  · `담당이 소재 판독을 맡습니다` : 같은 파일 System 카드 3
 * 두 번째 장의 네 항목은 사장님이 불러 주신 문구 그대로다.
 */
addPage(
  slide(
    `
${head("Appendix. 해그로시가 AI와 일하는 방식", esc(AI_EFFICIENCY_NOTE) + " — 다만 무엇을 왜 만들지는 사람이 정합니다")}
<p class="ai-lead">해그로시는 브랜드 단가 경쟁력을 맞추기 위해 오래 긴밀하게 일한 팀원들이 원격으로 매일 함께 업무하며, AI(AX) 시스템 구축을 통해 휴먼 에러를 최대한 줄이고 클라이언트 커뮤니케이션 및 시너지 프로세스에 집중합니다.</p>
<div class="two ai2">
  <div class="ai-col">
    <p class="ai-k">AI가 맡는 것</p>
    <ul class="ai-list">
      <li><strong>브랜드 기본 분석</strong><span>상세페이지 URL 하나로 타겟 · USP · 객단가 · 금지 표현을 구조화합니다. 넘길 때마다 브랜드를 다시 설명하실 일이 없습니다.</span></li>
      <li><strong>제작 전반의 효율화</strong><span>기획 정리부터 편집 보조까지, 사람이 오래 붙잡던 반복 작업을 줄여 같은 예산에서 편수를 늘립니다.</span></li>
      <li><strong>진행 상황 정리</strong><span>단계 · 기한 · 산출물을 대시보드에 자동으로 쌓아 지금 어디까지 왔는지 바로 보이게 합니다.</span></li>
    </ul>
  </div>
  <div class="ai-col ai-col-h">
    <p class="ai-k">사람이 맡는 것</p>
    <ul class="ai-list">
      <li><strong>무엇을 왜 찍을지</strong><span>컨텐츠 가이드라인과 후킹 편성은 사람이 확정합니다. 이 판단이 성과의 대부분을 가릅니다.</span></li>
      <li><strong>소재 판독</strong><span>숏폼 납품 이력이 다수인 담당이 어떤 각이 도는 소재인지 직접 봅니다.</span></li>
      <li><strong>브랜드 톤과 금지선</strong><span>과장 표현 · 업종 규제 · 브랜드 어휘는 사람이 마지막으로 확인하고 내보냅니다.</span></li>
    </ul>
    <p class="ai-note">중소기업청 모두의창업 AI 강연자로 선 총괄 디렉터가 제작 감도를 잡습니다.</p>
  </div>
</div>`,
    { alt: true, layout: "cards" },
  ),
);

addPage(
  slide(
    `
${head("Appendix. 진행 · 정산 · 소통", "계약 후 실제로 이렇게 굴러갑니다")}
<div class="appx">
${[
  [
    "어드민 대시보드",
    "브랜드 프로젝트 진행은 어드민 대시보드를 제공해 업무 진행과 성과를 실시간 트래킹할 수 있게 제공합니다. 서로간 효율적인 커뮤니케이션을 전제로 합니다.",
  ],
  [
    "재계약 고객 정산",
    "재계약 고객은 에스크로 결제 및 세금계산서 자동 발행과 카드결제 등을 제공합니다.",
  ],
  [
    "숏폼 프로젝트 소통",
    "클라이언트와 담당자와의 소통은 어드민 대시보드를 통해 진행되고, 필요 시 PM이 줌미팅으로 조율합니다.",
  ],
  [
    "채널 운영 · 종합 마케팅 소통",
    "그 외 채널 운영 및 종합 마케팅의 경우 오프라인 정기 미팅을 제공합니다.",
  ],
]
  .map(
    ([t, d], i) => `<div class="appx-row">
  <span class="appx-no">${String(i + 1).padStart(2, "0")}</span>
  <div><p class="appx-t">${t}</p><p class="appx-d">${d}</p></div>
</div>`,
  )
  .join("")}
</div>`,
    { alt: true, layout: "cards" },
  ),
);

// 17 문의처
sec("close");





addPage(
  slide(
    `<div class="cover end">
  <div class="cover-l">
    <p class="cover-en">CONTACT</p>
    <h1>컨텐츠로<br>브랜드 스케일업을 완성하세요.</h1>
    <p class="cover-sub">브랜드 상황을 남겨 주시면 구성과 금액을 정리해 회신드립니다.<br><a class="mailcta" href="mailto:contact@h-grs.com?subject=%5B%ED%95%B4%EA%B7%B8%EB%A1%9C%EC%8B%9C%5D%20%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%EB%AC%B8%EC%9D%98">contact@h-grs.com 으로 문의하기</a></p>
    <p class="cover-org">${COMPANY.name} · 사업자등록번호 ${COMPANY.bizRegNumber}<br>${COMPANY.address}</p>
  </div>
  <div class="contact-grid">
    <div><p class="ck">플랜 신청 · 내 프로젝트</p><p class="cv">${SERVICE.url.replace("https://", "")}${SERVICE.path}</p></div>
    <div><p class="ck">문의 메일</p><p class="cv">contact@h-grs.com</p></div>
    <div><p class="ck">브랜드 SNS 채널</p><p class="cv">${SERVICE.url.replace("https://", "")}/sns-brand</p></div>
    <div><p class="ck">응대 시간</p><p class="cv">평일 10:00 – 19:00</p></div>
  </div>
</div>`,
    { dark: true, bare: true },
  ),
);

/* ───────────────────────── 목차 순서 ───────────────────────── */

/**
 * 최종 목차 (2026-08-20)
 *
 * 사이트 `/shortform` 의 설득 순서를 따른다 —
 * 훅 → 정체 → 만든 것 → 숫자 → 방법 → 규모 → 시작.
 * 브랜드 하나가 여러 구간에 겹쳐 나오지 않도록 구간을 나눴다.
 */
const ORDER = [
  "cover", "hook", "identity", "lines", "team", "corp",

  /* ── 서비스 1. 숏폼 스튜디오 */
  "part-shortform",
  "shortform-seeding", //  인플루언서 시딩 3단 (히어로 바로 밑)
  "numbers-shortform", //  브랜드 성과 4건
  "made-shortform", //     숏폼 포트폴리오
  "how-shortform", //      프로세스 · 대시보드
  "shortform-plan",

  /* ── 서비스 2. 브랜드 채널 마케팅 프로젝트 */
  "part-brand",
  "brand-aarrr",
  "brand-stories", //      주요 성장 사례 10건
  "numbers-sns", //        채널 케이스 (이야기 + 산출물)
  "brand-channels", //     직접 운영한 채널
  "made-longform", //      팬덤 시리즈 롱폼 — 채널 케이스 뒤로
  "how-sns",
  "imc", //                나머지 프로젝트 목록
  "brand-plan",

  "appendix",
  "close",
];

const unknown = secOf.filter((k) => !ORDER.includes(k));
if (unknown.length) throw new Error(`목차에 없는 구간: ${[...new Set(unknown)].join(", ")}`);

const ordered = ORDER.flatMap((k) => pages.filter((_, i) => secOf[i] === k));

/* ───────────────────────── 스타일 ───────────────────────── */

const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<title>${SERVICE.name} 소개서</title>
<style>
@font-face{font-family:Pyeojin;src:url("${font("PyeojinGothic-Light.woff2")}") format("woff2");font-weight:300}
@font-face{font-family:Pyeojin;src:url("${font("PyeojinGothic-Regular.woff2")}") format("woff2");font-weight:400}
@font-face{font-family:Pyeojin;src:url("${font("PyeojinGothic-Bold.woff2")}") format("woff2");font-weight:700}

/* 16:9 — 13.333in × 7.5in */
@page{size:338.67mm 190.5mm;margin:0}
body:has(.page:target) .page:not(:target){display:none}

:root{
  --indigo:#4d5fe8; --indigo-deep:#3948b8; --indigo-tint:#eceefb;
  --gold:#b89b8d; --gold-deep:#8e6b68; --gold-tint:#f6efeb;
  --navy:#0c0a3d;
  --ink:#030303; --muted:#595959; --line:#e6e6e6; --alt:#f7f5f3; --night:#0a0a0c;

  /* ── 그리드 (2026-08-20) ─────────────────────────────────────
     매번 mm 를 손으로 맞추다 같은 실수를 반복했다(증빙 표가 잘리고,
     원 지름을 눈대중으로 고치고). 치수를 여기 한 곳에 두고 장표는
     이 값만 쓴다. 규격 설명은 docs/deck/LAYOUT.md.

       페이지  338.67 × 190.5mm (16:9)
       안전영역 306.67 × 163.5mm  (패딩 15/16/12)
       머리     32mm  (h2 26pt + 서브라인 15pt + 아래 여백)
       푸터      8mm
       본문     123.5mm  ← 본문 요소는 이 높이를 절대 넘지 않는다
       12칼럼 · 거터 6mm · 칼럼 20.06mm · 세로 리듬 4mm            */
  --pg-w:338.67mm; --pg-h:190.5mm;
  --pad-t:15mm; --pad-x:16mm; --pad-b:12mm;
  --safe-w:306.67mm; --safe-h:163.5mm;
  --head-h:32mm; --foot-h:8mm; --body-h:123.5mm;
  --gut:6mm; --col:20.06mm; --u:4mm;
}

/* ── 그리드 유틸 ─────────────────────────────────────────────
   .grid  12칼럼. 자식은 .c{n} 으로 폭을 잡는다 (.c6 = 절반)
   .fit   본문 밴드를 넘지 않는다 — 넘치면 잘리지 말고 장을 나눈다
   .rows2 2행 균등                                              */
.grid{display:grid;grid-template-columns:repeat(12,1fr);gap:var(--gut);flex:1;min-height:0}
.grid.rows2{grid-template-rows:1fr 1fr}
.c3{grid-column:span 3}.c4{grid-column:span 4}.c5{grid-column:span 5}
.c6{grid-column:span 6}.c7{grid-column:span 7}.c8{grid-column:span 8}.c12{grid-column:span 12}
.fit{max-height:var(--body-h);min-height:0}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Pyeojin,-apple-system,sans-serif;color:var(--ink);-webkit-print-color-adjust:exact;print-color-adjust:exact}

.page{width:338.67mm;height:190.5mm;padding:15mm 16mm 12mm;position:relative;page-break-after:always;overflow:hidden;background:#fff}
.page:last-child{page-break-after:auto}
.page.dark{background:var(--night);color:#fff}
.page-body{height:100%;display:flex;flex-direction:column}
.page-foot{position:absolute;left:16mm;right:16mm;bottom:6mm;display:flex;justify-content:space-between;font-size:7pt;color:#a8a8a8}

.shead{margin-bottom:8mm;flex-shrink:0}
.eyebrow{font-size:8pt;letter-spacing:.06em;color:var(--gold-deep);font-weight:700}
h1{font-size:34pt;line-height:1.24;font-weight:700;letter-spacing:-.02em}
.chip-title{display:inline-block;background:var(--indigo);color:#fff;padding:0 4mm;border-radius:2mm}
h2{font-size:26pt;line-height:1.25;font-weight:700;letter-spacing:-.02em}
.subline{font-size:15pt;line-height:1.55;color:#3a3a3a;margin-top:4mm;font-weight:400}
.foot-note{font-size:7.5pt;color:#9a9a9a;margin-top:auto;padding-top:4mm}

/* 표지 · 문의처 */
.cover{height:100%;display:grid;grid-template-columns:1fr 118mm;gap:14mm;align-items:center}
.cover-l{display:flex;flex-direction:column;justify-content:center;height:100%}
.cover-en{font-size:7.5pt;letter-spacing:.3em;color:var(--gold);font-weight:700;margin-bottom:7mm}
.cover-sub{font-size:10.5pt;line-height:1.9;color:rgba(255,255,255,.62);margin-top:7mm}
.cover-stats{display:flex;gap:12mm;margin-top:auto;padding-top:9mm;border-top:1px solid rgba(255,255,255,.16)}
.cover-stats strong{display:block;font-size:16pt;font-weight:700}
.cover-stats span{font-size:7.5pt;color:rgba(255,255,255,.5)}
.cover-org{font-size:7pt;color:rgba(255,255,255,.42);line-height:1.8;margin-top:6mm}
.cover-r{display:grid;grid-template-columns:1fr 1fr;gap:4mm}
.cover-r img{width:100%;height:72mm;object-fit:cover;border-radius:2mm}
.end .cover{grid-template-columns:1fr 130mm}
.end h1{font-size:28pt}
.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:8mm}
.contact-grid>div{border-top:2px solid var(--indigo);padding-top:4mm}
.ck{font-size:7.5pt;color:rgba(255,255,255,.5)}
.cv{font-size:12pt;font-weight:700;margin-top:2mm}

/* 공통 레이아웃 */
.two{display:grid;grid-template-columns:1fr 1fr;gap:8mm;flex:1;min-height:0}
.two.t-6040{grid-template-columns:1.5fr 1fr}
.two.t-4060{grid-template-columns:1fr 1.35fr}
.two.vcenter{align-items:center}

.panel{border-radius:3mm;padding:9mm;display:flex;flex-direction:column;justify-content:center}
.panel-ink{background:var(--night);color:#fff}
.panel-indigo{background:var(--indigo);color:#fff}
.pk{font-size:7.5pt;letter-spacing:.14em;color:var(--gold)}
.pk.light{color:rgba(255,255,255,.75)}
.pt{font-size:15pt;font-weight:700;line-height:1.6;margin-top:4mm}
.pt2{font-size:13pt;font-weight:700;line-height:1.55;margin-top:3mm}
.pt3{font-size:9pt;line-height:1.85;margin-top:3mm;color:rgba(255,255,255,.9)}
.fig{margin-top:6mm;padding-top:5mm;border-top:1px solid rgba(255,255,255,.18)}
.fig strong{display:block;font-size:22pt;font-weight:700}
.fig span{font-size:7.5pt;color:rgba(255,255,255,.55)}

.kv{align-self:center;width:100%}
.kv>div{display:flex;gap:6mm;padding:3.4mm 0;border-bottom:1px solid #f0f0f0;font-size:9pt}
.kv dt{width:34mm;flex-shrink:0;color:#8a8a8a}
.kv dd{line-height:1.6}

.band3{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm;margin-top:7mm;flex-shrink:0}
.band3.tall{flex:1;margin-top:0}
.bd{border-radius:3mm;padding:7mm}
.bd-indigo{background:var(--indigo);color:#fff}
.bd-gold{background:var(--gold);color:#fff}
.bd-alt{background:var(--alt)}
.bd-n{font-size:8pt;font-weight:700;opacity:.7}
.bd-t{font-size:11.5pt;font-weight:700;margin-top:2mm}
.bd-d{font-size:8.5pt;line-height:1.8;margin-top:2.5mm;opacity:.85}

/* 시장 구조 */
.split{display:grid;grid-template-columns:1fr 62mm 1fr;gap:8mm;align-items:center;flex:1}
.split-side{text-align:center}
.circle{width:56mm;height:56mm;border-radius:50%;margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:11pt;font-weight:700;line-height:1.5;color:#fff}
.circle-indigo{background:var(--indigo)}
.circle-gold{background:var(--gold)}
.split-t{font-size:8.5pt;color:#8a8a8a;margin-top:4mm}
.split-d{font-size:9.5pt;color:var(--muted);margin-top:1.5mm}
.split-gap{border:1.5px dashed var(--gold);border-radius:3mm;padding:7mm 5mm;text-align:center;background:var(--gold-tint)}
.gap-label{font-size:9.5pt;font-weight:700;color:var(--gold-deep)}
.gap-list{list-style:none;margin-top:3mm}
.gap-list li{font-size:9pt;color:var(--gold-deep);padding:2.6mm 0;border-top:1px solid rgba(142,107,104,.25)}
.verdict{background:var(--night);color:#fff;border-radius:3mm;padding:7mm 8mm;font-size:10.5pt;line-height:1.8;margin-top:6mm;flex-shrink:0}

/* 벤 */
/* 원 3개 삼각 배치 (2026-08-20)
   지름 78mm, 중심 삼각형 한 변 48mm → 세로 오프셋 48*0.866≈42mm.
   컨테이너 높이 = 78+42 = 120mm 로 2원 때와 같다.
   교집합 라벨은 세 중심의 무게중심(=위 두 원 중심선에서 42/3≈14mm 아래) */
.venn{position:relative;height:120mm;max-height:var(--body-h)}
.venn-c{position:absolute;width:78mm;height:78mm;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9.5pt;font-weight:700;line-height:1.5;text-align:center}
.venn-a{top:0;left:calc(50% - 63mm);background:rgba(77,95,232,.16);border:1.5px solid var(--indigo);color:var(--indigo-deep)}
.venn-a span{transform:translate(-15mm,-12mm)}
.venn-b{top:0;left:calc(50% - 15mm);background:rgba(184,155,141,.24);border:1.5px solid var(--gold);color:var(--gold-deep)}
.venn-b span{transform:translate(15mm,-12mm)}
.venn-d{top:42mm;left:calc(50% - 39mm);background:rgba(12,10,61,.16);border:1.5px solid #0c0a3d;color:#0c0a3d}
.venn-d span{transform:translate(0,19mm)}
.venn-mid{position:absolute;left:50%;top:58mm;transform:translate(-50%,-50%);text-align:center;z-index:2}
/* 원마다 플랜명을 한 줄 더 — 명칭만으로는 뭘 사는 건지 안 잡힌다
   (2026-08-20 사장님 지시) */
.line-plans{list-style:none;margin-top:4mm;display:flex;flex-direction:column;gap:2mm}
.line-plans li{background:var(--alt);border-radius:2mm;padding:2.6mm 3.4mm;font-size:9pt;font-weight:600;line-height:1.5}
.venn-c em{display:block;margin-top:1.6mm;font-size:7.2pt;font-weight:600;font-style:normal;opacity:.75;letter-spacing:-.01em}
.venn-mid strong{display:block;font-size:14pt;font-weight:700}
.venn-mid span{font-size:8pt;color:var(--muted)}
.pos-col{display:flex;flex-direction:column;gap:5mm}
.pos{border-left:4px solid var(--indigo);background:var(--alt);border-radius:0 2mm 2mm 0;padding:6mm 7mm}
.pos-t{font-size:12pt;font-weight:700}
.pos-d{font-size:9pt;color:var(--muted);margin-top:2mm}
.pos-note{background:var(--indigo);color:#fff;border-radius:2mm;padding:5mm 7mm;font-size:11pt;font-weight:700;text-align:center}

/* 라인 */
.chain{display:grid;grid-template-columns:1fr 8mm 1fr 8mm 1fr 8mm 1fr;align-items:stretch;flex-shrink:0}
.chain-node{background:var(--alt);border-top:4px solid var(--indigo);border-radius:0 0 3mm 3mm;padding:7mm 6mm}
.chain-no{font-size:8pt;font-weight:700;color:var(--indigo-deep)}
.chain-t{font-size:11.5pt;font-weight:700;margin-top:2mm}
.chain-d{font-size:8.5pt;color:var(--muted);margin-top:2.5mm}
.chain-arrow{display:flex;align-items:center;justify-content:center;color:var(--gold);font-size:9pt}
.oneline{margin-top:7mm;background:var(--night);color:#fff;border-radius:3mm;padding:7mm;font-size:13pt;font-weight:700;text-align:center;flex-shrink:0}

/* 효과 */
.impact{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm;flex:1}
.imp{background:var(--indigo);color:#fff;border-radius:3mm;padding:8mm;display:flex;flex-direction:column}
.imp-alt{background:var(--gold)}
.imp-no{font-size:9pt;font-weight:700;opacity:.7}
.imp-t{font-size:14pt;font-weight:700;margin-top:3mm;line-height:1.4}
.imp-d{font-size:9pt;line-height:1.85;margin-top:4mm;opacity:.9}

/* 크루 */
.creds{display:flex;flex-wrap:wrap;gap:3mm;margin-bottom:6mm;flex-shrink:0}
.cred{font-size:9pt;font-weight:700;color:#fff;background:var(--indigo);border-radius:99px;padding:2.4mm 6mm}
.cred:nth-child(even){background:var(--gold)}
.crew{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:repeat(2,minmax(0,1fr));gap:3.5mm;flex:1 1 0;min-height:0;overflow:hidden}
.crew img{width:100%;height:100%;object-fit:cover;display:block;border-radius:2.5mm}

/* 역할 */
.roles{display:grid;grid-template-columns:repeat(3,1fr);gap:3.5mm;align-content:start}
.role{background:var(--alt);border-radius:2mm;padding:5.5mm}
.role-t{font-size:10pt;font-weight:700}
.role-d{font-size:7.5pt;color:#8a8a8a;margin-top:1.5mm;line-height:1.6}
.side-col{display:flex;flex-direction:column;gap:4mm}
.side-col .panel{flex:1}

/* 사례 */
.cases{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm;flex:1}
.case{border:1px solid var(--line);border-radius:3mm;padding:0 0 6mm;display:flex;flex-direction:column;overflow:hidden;align-self:start}
.case-img{width:100%;height:68mm;object-fit:cover;background:#f2f2f2}
.case-head{padding:6mm 6mm 0}
.case-stats{padding:0 6mm}
.case-role{margin:0 6mm}
.case-head{display:flex;gap:3.5mm;align-items:flex-start;padding:6mm 6mm 0}
.case-no{font-size:7.5pt;font-weight:700;color:#fff;background:var(--indigo);border-radius:50%;width:7mm;height:7mm;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.case-brand{font-size:11pt;font-weight:700;line-height:1.35}
.case-scale{font-size:7.5pt;color:#8a8a8a;margin-top:1mm}
.case-stats{display:flex;gap:6mm;margin-top:auto;padding-top:5mm}
.case-stats strong{display:block;font-size:13pt;font-weight:700}
.case-stats span{font-size:7pt;color:#8a8a8a}
.case-role{font-size:7pt;color:#9a9a9a;margin-top:4mm;border-top:1px solid #f0f0f0;padding-top:3mm}

/* 로고 */
.logos{display:grid;grid-template-columns:repeat(6,1fr);gap:7mm 10mm;flex:1;align-content:center}
.logos div{display:flex;align-items:center;justify-content:center}
.logos img{max-width:100%;max-height:20mm;object-fit:contain;filter:grayscale(1);opacity:.8}

/* 흐름 */
.flow{display:grid;grid-template-columns:repeat(3,1fr);gap:5mm;flex:1}
.flow-row{display:flex;gap:5mm;background:var(--alt);border-radius:3mm;padding:7mm}
.flow-no{font-size:13pt;font-weight:700;color:var(--indigo);flex-shrink:0}
.flow-t{font-size:11.5pt;font-weight:700}
.flow-d{font-size:8.5pt;line-height:1.8;color:var(--muted);margin-top:2mm}

/* 포트폴리오 */
.wall{display:grid;grid-template-columns:repeat(6,1fr);grid-template-rows:1fr 1fr;gap:3.5mm;flex:1;min-height:0}
.wall img{width:100%;height:100%;object-fit:cover;border-radius:2mm;background:#f2f2f2}

/* 플랜 */
.tbl-h{font-size:12pt;font-weight:700}
.tbl-lead{font-size:8pt;color:#8a8a8a;margin-top:1.5mm;margin-bottom:3mm}
.tbl{width:100%;border-collapse:collapse;font-size:11pt}
.tbl td{padding:3.4mm 0;border-bottom:1px solid #f0f0f0;vertical-align:top}
.t-name{font-weight:700;white-space:nowrap;width:38mm;font-size:12pt}
.t-desc{font-size:9.5pt;color:var(--muted)}
.t-price{text-align:right;font-weight:700;white-space:nowrap}
.t-price span{display:block;font-size:8.5pt;font-weight:400;color:#8a8a8a;margin-top:.8mm}
.seed-band{display:grid;grid-template-columns:auto repeat(3,1fr);gap:8mm;align-items:center;background:var(--gold);color:#fff;border-radius:3mm;padding:6mm 8mm;margin-top:6mm;flex-shrink:0}
.seed-k{font-size:9pt;font-weight:700;line-height:1.5}
.seed-i span{font-size:8pt;opacity:.85}
.seed-i strong{display:block;font-size:12pt;margin-top:1mm}
.vat{font-size:7.5pt;color:#8a8a8a;margin-top:4mm}

.pick{display:grid;grid-template-columns:repeat(5,1fr);gap:4mm;margin-top:5mm;flex-shrink:0}
.pick>div{border-top:3px solid var(--indigo);padding-top:3.5mm}
.pick span{font-size:9.5pt;font-weight:700}
.pick p{font-size:8pt;color:var(--muted);margin-top:1.5mm;line-height:1.6}

.journey{display:flex;align-items:stretch;gap:2mm;flex-shrink:0}
.j{flex:1;border-radius:2mm;padding:4mm 6mm;color:#fff}
.j-gold{background:var(--gold)}
.j-gold2{background:var(--gold-deep)}
.j-indigo{background:var(--indigo)}
.j-ink{background:var(--night)}
.j-t{font-size:10.5pt;font-weight:700}
.j-d{font-size:8pt;opacity:.85;margin-top:1.5mm}
.j-arrow{display:flex;align-items:center;color:var(--gold);font-size:9pt}
.plans{margin-top:6mm;align-items:start;flex:1}
.plan-col{border:1px solid var(--line);border-radius:3mm;padding:7mm}
.plan-col-pkg{border-color:var(--indigo);background:rgba(77,95,232,.04)}
/* 오른쪽 열 — 멀티 박스 아래에 옵션 박스를 쌓아 왼쪽 열과 높이를 맞춘다 */
.plan-stack{display:flex;flex-direction:column;gap:4mm}
.plan-opt{border:1px solid var(--line);border-radius:3mm;padding:5mm 6mm;display:flex;align-items:center;justify-content:space-between;gap:5mm}
.opt-k{font-size:8pt;font-weight:700;color:var(--gold-deep)}
.opt-h{font-size:11.5pt;font-weight:700;margin-top:1mm}
.opt-d{font-size:8pt;color:var(--muted);margin-top:1.5mm;line-height:1.6}
.opt-p{font-size:12pt;font-weight:700;white-space:nowrap}
.plan-k{font-size:9pt;font-weight:700;color:var(--gold-deep)}
.plan-h{font-size:15pt;font-weight:700;margin-top:2mm}
.plan-d{font-size:9.5pt;color:var(--muted);line-height:1.7;margin-top:2mm;margin-bottom:4mm}
.seed-in{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm;margin-top:4mm;background:var(--gold);color:#fff;border-radius:2mm;padding:5mm 6mm}
.seed-in span{font-size:8.5pt;opacity:.9}
.seed-in strong{display:block;font-size:12pt;margin-top:1mm}
.spec{display:grid;grid-template-columns:repeat(5,1fr);gap:4mm;margin-top:5mm;flex-shrink:0}
.spec>div{border-top:2px solid var(--gold);padding-top:3mm}
.spec span{font-size:9pt;font-weight:700}
.spec p{font-size:7.5pt;color:var(--muted);margin-top:1mm}

/* 내 프로젝트 보드 */
.board{display:grid;grid-template-columns:1fr 1.6fr;gap:6mm;flex:1;min-height:0}
.board-main{display:flex;flex-direction:column;min-height:0}
.board-main img{width:100%;flex:1;min-height:0;object-fit:contain;object-position:top;border:1px solid var(--line);border-radius:3mm}
.board-side{display:flex;flex-direction:column;gap:5mm;min-height:0}
.board-item{display:flex;flex-direction:column;min-height:0}
.board-item{flex:1}
.board-item img{width:100%;flex:1;min-height:0;object-fit:contain;object-position:center;border:1px solid var(--line);border-radius:2mm;background:#fff}
.cap{font-size:7.5pt;color:var(--muted);margin-top:2.5mm}

/* 이용 방법 */
.usage{display:flex;flex-direction:column;gap:2mm;justify-content:space-between}
.use{display:flex;gap:5mm;background:var(--alt);border-radius:2mm;padding:3.6mm 6mm;align-items:baseline;flex:1}
.use-no{font-size:9pt;font-weight:700;color:var(--indigo);flex-shrink:0}
.use-t{font-size:10.5pt;font-weight:700}
.use-d{font-size:8pt;color:var(--muted);margin-top:1mm}
.shots{position:relative;display:flex;align-items:center;justify-content:center}
.shot-main{width:100%;border:1px solid var(--line);border-radius:3mm}
.shot-sub{position:absolute;right:-3mm;bottom:-3mm;width:54mm;border:1px solid var(--line);border-radius:2mm;background:#fff;box-shadow:0 2mm 6mm rgba(0,0,0,.14)}

/* 단계 */
.track{border-radius:3mm;padding:8mm;color:#fff}
.track-indigo{background:var(--indigo)}
.track-gold{background:var(--gold)}
.track-t{font-size:13pt;font-weight:700}
.track-d{font-size:8pt;opacity:.8;margin-top:1.5mm}
.track ol{list-style:none;counter-reset:s;margin-top:4mm}
.track li{counter-increment:s;font-size:10pt;padding:3.6mm 0;border-top:1px solid rgba(255,255,255,.25);display:flex;gap:4mm}
.track li::before{content:counter(s);font-weight:700;width:5mm;opacity:.75}

/* 계약 */
.contract{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm;flex:1}
.ct{background:var(--alt);border-top:4px solid var(--indigo);border-radius:0 0 3mm 3mm;padding:6mm}
.ct-no{font-size:8pt;font-weight:700;color:var(--indigo-deep)}
.ct-t{font-size:10.5pt;font-weight:700;margin-top:2mm}
.ct-d{font-size:8pt;line-height:1.75;color:var(--muted);margin-top:2.5mm}
.pay-band{background:var(--indigo);color:#fff;border-radius:3mm;padding:6mm 8mm;font-size:10.5pt;font-weight:700;margin-top:6mm;flex-shrink:0;text-align:center}

/* 조건 */
.terms{display:flex;flex-direction:column;gap:3mm}
.term{border-left:4px solid var(--gold);background:var(--alt);border-radius:0 2mm 2mm 0;padding:5mm 6mm;font-size:9pt;line-height:1.7;color:var(--muted)}

.mailcta{display:inline-block;margin-top:5mm;background:#fff;color:#030303;text-decoration:none;border-radius:99mm;padding:3.5mm 8mm;font-size:9.5pt;font-weight:700}

/* 통합 브랜드 액션 — 원형 다이어그램 (사이트와 같은 구도, 정지 상태) */
.orbits{display:grid;grid-template-columns:repeat(4,1fr);gap:5mm;flex:1;align-content:start}
.orbit-card{display:flex;flex-direction:column;gap:4mm}
.orbit{position:relative;width:100%;aspect-ratio:1}
.orbit-ring{position:absolute;inset:0;border:1px solid rgba(3,3,3,.10);border-radius:50%}
.orbit-ring2{position:absolute;inset:13%;border:1px solid rgba(3,3,3,.14);border-radius:50%}
.orbit-orb{position:absolute;inset:26%;border-radius:50%;background:radial-gradient(circle at 38% 32%,#8f9cf2,var(--indigo) 55%,#2b39aa)}
.sat{position:absolute;width:47%;height:47%;border-radius:50%;background:rgba(77,95,232,.55);color:#fff;display:flex;align-items:center;justify-content:center;text-align:center;font-size:6pt;font-weight:700;line-height:1.3;padding:1.5mm}
.sat-0{left:50%;top:0;transform:translateX(-50%)}
.sat-1{right:0;top:50%;transform:translateY(-50%)}
.sat-2{left:50%;bottom:0;transform:translateX(-50%)}
.sat-3{left:0;top:50%;transform:translateY(-50%)}
.orbit-label{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-size:11pt;font-weight:700;z-index:2}
.orbit-label em{font-style:normal;font-size:6.5pt;font-weight:400;opacity:.8}
.orbit-label i{font-style:normal;font-size:6pt;opacity:.7;margin-top:.6mm}
.orbit-r{font-size:8pt;line-height:1.6;font-weight:700;color:var(--indigo);text-align:center}

/* 법인 소개 — 메인 화면 + 세 서비스 */
.corp{display:grid;grid-template-columns:minmax(0,7fr) minmax(0,5fr);gap:7mm;flex:1}
.corp-shot{width:100%;border:1px solid var(--line);border-radius:3mm;object-fit:cover;object-position:top;align-self:start}
.corp-side{display:flex;flex-direction:column;gap:6mm}
.corp-lines{display:flex;flex-direction:column;gap:3mm;margin-top:auto}
.corp-lines li{background:var(--alt);border-radius:2.5mm;padding:5mm 6mm;font-size:9.5pt;line-height:1.6;color:var(--muted)}
.corp-lines strong{color:var(--ink)}

/* 케이스 성과 — 문장 그대로 (숫자만 뽑아 쪼개면 문맥이 깨진다) */
.case-facts{margin:4mm 6mm 0;display:flex;flex-direction:column;gap:2.5mm;list-style:none}
.case-facts li{font-size:8.5pt;line-height:1.5;font-weight:700;color:var(--ink)}
.case-facts li span{display:block;font-size:7pt;font-weight:400;color:var(--muted);margin-top:1mm}

/* 브랜드 케이스 머리 — 제목이 길어 두 줄까지 허용 */
.bc-head{margin-bottom:7mm}
.bc-meta{font-size:8pt;letter-spacing:.06em;color:var(--gold-deep);font-weight:700}
.bc-title{font-size:19pt;font-weight:700;line-height:1.45;margin-top:3mm;max-width:200mm}

/* 브랜드 케이스 — 한 브랜드 한 장 */
/* 사례 슬라이드의 실적 증빙 (2026-08-19) */
/* 증빙은 **남은 높이 안에서만** 큰다. 앞 판은 img 에 상한이 없어 원본
   높이대로 밀고 나갔고, .bc-ev 의 overflow:hidden 이 그걸 잘라 냈다.
   flex:1 1 0 + object-fit:contain 이면 넘치는 대신 줄어든다. */
.bc-ev{display:flex;flex-direction:column;gap:3mm;margin-top:5mm;flex:1 1 0;min-height:0;overflow:hidden;justify-content:flex-start}
.bc-ev figure{margin:0;min-height:0;display:flex;flex-direction:column;flex:1 1 0}
.bc-ev img{width:100%;min-height:0;flex:1 1 0;border:1px solid var(--line);border-radius:1.5mm;display:block;object-fit:contain;object-position:left top}
.bc-ev-1 img{max-height:74mm}
.bc-ev-2 img{max-height:30mm}
.bc-ev-3 img{max-height:19mm}
.bc-ev figcaption{font-size:7pt;color:var(--muted);margin-top:1.5mm;line-height:1.5}
.ev-mask{display:inline-block;background:#f0f0f0;color:#666;border-radius:1mm;padding:.3mm 1.5mm;font-size:6.5pt;font-weight:700}
/* 브랜드별 포트폴리오 장표 */
.bp{display:flex;flex-direction:column;gap:5mm;flex:1;min-height:0;overflow:hidden}
.bp-clips{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:3mm;flex:0 0 auto}
.bp-ev{display:flex;flex-direction:column;gap:3mm;min-height:0;overflow:hidden}
.bp-ev figure{margin:0}
.bp-ev img{width:100%;border:1px solid var(--line);border-radius:1.5mm;display:block}
.bp-ev figcaption{font-size:7pt;color:var(--muted);margin-top:1.5mm;line-height:1.5}
.bp-none{font-size:9pt;color:var(--muted)}
/* ── 배경 체계 (2026-08-20) ──────────────────────────────────────
   사장님: *"어떤 건 검정색 어떤건 흰색배경인데. 우리 브랜드 색상은 어디에도
   반영이 통일감있게 안되어있다."* → 장표 유형마다 배경을 고정한다.

     다크 #0a0a0c   표지 · 파트 간지 · 성과 사례 · 클로징
     웜그레이 #f7f5f3  포트폴리오·도판 나열 (소재가 주인공인 장)
     화이트 #ffffff  프로세스 · 시스템 · 표 · 플랜 (읽는 장)

   아이브로우는 어느 장이든 골드, 단계 번호는 어느 장이든 인디고.       */
.page.alt{background:var(--alt)}

/* ── 파트 간지 = 홈페이지 .hero-night 그대로 (globals.css:104-140)
   color-mix(in oklab, X n%, transparent) 를 rgba 로 풀어 동일하게 깐다 */
.page.hero{position:relative;overflow:hidden;background:var(--night)}
.page.hero::before,.page.hero::after{content:"";position:absolute;inset:-20% -10%;z-index:0;pointer-events:none}
.page.hero::before{background:
  radial-gradient(60% 45% at 78% 18%,rgba(77,95,232,.55),transparent 70%),
  radial-gradient(55% 40% at 12% 88%,rgba(77,95,232,.42),transparent 72%);
  filter:blur(10px)}
.page.hero::after{background:radial-gradient(50% 38% at 22% 12%,rgba(184,155,141,.38),transparent 68%);filter:blur(14px)}
.page.hero .page-body{position:relative;z-index:1}

.phero{display:grid;grid-template-columns:minmax(0,7fr) minmax(0,5fr);gap:14mm;align-items:center;flex:1;min-height:0}
.phero-k{font-size:9pt;font-weight:500;letter-spacing:.02em;color:var(--gold)}
.phero-t{margin-top:5mm;font-size:34pt;font-weight:700;line-height:1.24;letter-spacing:-.04em}
.phero-s{margin-top:5mm;font-size:15pt;font-weight:700;line-height:1.7;color:rgba(255,255,255,.7)}
.phero-stats{margin-top:9mm;display:flex;border:1px solid rgba(255,255,255,.12);border-radius:4mm;background:rgba(10,10,12,.7);overflow:hidden}
.phero-stats>div{flex:1;padding:5mm 4mm;border-left:1px solid rgba(255,255,255,.12)}
.phero-stats>div:first-child{border-left:0}
.phero-stats strong{display:block;font-size:19pt;font-weight:600;line-height:1;letter-spacing:-.04em;color:var(--gold)}
.phero-stats span{display:block;margin-top:2mm;font-size:8pt;color:rgba(255,255,255,.55)}
/* 홈은 3열 세로 마퀴 — PDF엔 움직임이 없으니 같은 소재의 정지 그리드로 */
/* 홈페이지는 3열 세로 마퀴(높이 560px). PDF엔 움직임이 없으니 같은 3열을
   **꽉 채운 정지 컬럼**으로 낸다. 앞 판은 9:16 6칸을 작게 욱여넣어 자막이
   잘렸다 — 열마다 2칸씩, 가운데 열을 어긋나게 내려 홈과 같은 리듬을 준다. */
.phero-r{display:grid;grid-template-columns:repeat(3,1fr);gap:3.5mm;height:var(--body-h);min-height:0}
.phero-col{display:flex;flex-direction:column;gap:3.5mm;min-height:0}
/* 9:16 을 고정하면 2칸이 밴드보다 길어져 넘친다 — 남은 높이를 나눠 갖게 한다 */
.phero-r img{width:100%;flex:1 1 0;min-height:0;object-fit:cover;border-radius:3mm;background:#171717;display:block}

/* ── 성장 사례 — 홈페이지 GrowthCases 이식 (2026-08-20) ──────────
   웹 1px = 0.755pt 로 환산했다 (홈 본문 1152px ↔ 소개서 306.67mm).
   다크 위 색 세트도 홈페이지 값 그대로: 본문 #fff, 보조 .70/.60/.55/.50,
   구분선 .10, 카드 면 .03                                            */
.gcase{display:grid;grid-template-columns:minmax(0,7fr) minmax(0,5fr);gap:14mm;align-items:stretch;flex:1 1 auto;min-height:0}
.page.dark .gcase+.bc-ev-wide{flex:1.1 1 auto}
.gc-eyebrow{font-size:9pt;font-weight:500;letter-spacing:.02em;text-transform:uppercase;color:var(--gold)}
.gc-title{margin-top:4mm;font-size:21pt;font-weight:700;line-height:1.3;letter-spacing:-.04em}
.gc-title span{margin-left:2mm;font-size:13.5pt;font-weight:700;color:rgba(255,255,255,.5);letter-spacing:-.02em}
.gc-result{margin-top:7mm;border-left:.5mm solid var(--gold);padding-left:5mm;font-size:15pt;font-weight:700;line-height:1.6}
.gc-scope{margin-top:5mm;display:inline-block;border-radius:99mm;background:rgba(255,255,255,.1);padding:1.6mm 3.7mm;font-size:9pt;font-weight:700;color:rgba(255,255,255,.7)}
.gc-media img{width:100%;border-radius:4mm;border:1px solid rgba(255,255,255,.1);box-shadow:0 8mm 18mm -8mm rgba(0,0,0,.8);display:block;max-height:96mm;object-fit:contain;background:rgba(255,255,255,.04)}
.gm{margin-top:8mm}
.gm-line{width:100%;max-width:85mm;height:13mm;display:block}
.gm-stats{margin-top:4mm;display:flex;flex-wrap:wrap;column-gap:10mm;row-gap:4mm}
.gm-stats dd{font-size:22pt;font-weight:600;line-height:1;letter-spacing:-.04em;color:var(--gold)}
.gm-stats dt{margin-top:1.6mm;font-size:9pt;color:rgba(255,255,255,.55)}

/* 다크 장표 위의 증빙·표 — 흰 스크린샷이 뜨지 않도록 테두리를 낮춘다 */
.page.dark .bc-ev-wide img,.page.dark .bc-ev img{border-color:rgba(255,255,255,.14)}
.page.dark .bc-ev figcaption{color:rgba(255,255,255,.5)}
.gc-body{display:flex;flex-direction:column;min-height:0;justify-content:center}
.gc-body .bc-ev{margin-top:7mm;flex:1 1 0;min-height:0;overflow:visible}
.gc-body .bc-ev figcaption{font-size:7pt;line-height:1.5}
.gc-media{display:flex;flex-direction:column;justify-content:center;min-height:0}
.page.dark .bc-ev-wide figcaption,.page.dark .foot-note{color:rgba(255,255,255,.5)}
/* 표는 배경이 다크든 아니든 **흰 종이**로 낸다. 다크 위에 얹었더니 줄과
   숫자가 사라져 안 보였다. (2026-08-20 사장님 스크린샷) */
.tbl-sheet{background:#fff;border-radius:2mm;padding:3mm;border:1px solid var(--line)}
.page.dark .tbl-sheet,.page.dark .tbl-sheet .dtable{color:var(--ink)}
.page.dark .tbl-sheet .dtable td{border-bottom:1px solid var(--line)}
.page.dark .tbl-sheet .dtable tbody tr:nth-child(even){background:var(--alt)}

/* ── SNS 채널 케이스 — 홈페이지 s-cases.tsx 카드 그대로 ───────────
   원본: article rounded-2xl border-white/12 bg-white/[0.03] p-8
   웹 px → pt 는 ×0.755 (16px=12.1pt). 카드 안 요소 색·간격 모두 원본 값. */
.fcard{display:flex;flex-direction:column;flex:1;min-height:0;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.03);border-radius:5mm;padding:7mm 8mm}
.fcard-h{display:flex;justify-content:space-between;align-items:baseline;gap:4mm;flex-shrink:0}
.fcard-cat{font-size:8pt;font-weight:700;letter-spacing:.02em;text-transform:uppercase;color:var(--gold)}
.fcard-meta{font-size:9pt;color:rgba(255,255,255,.45)}
.fcard-b{margin-top:5mm;display:grid;grid-template-columns:minmax(0,7fr) minmax(0,5fr);gap:10mm;flex:1;min-height:0}
.fcard-t{font-size:17pt;line-height:1.45;font-weight:700;color:#fff;letter-spacing:-.03em}
.fcard-p{margin-top:4mm;font-size:9.5pt;line-height:1.85;color:rgba(255,255,255,.8)}
.fstats{margin-top:6mm;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.35mm;background:rgba(255,255,255,.12);border-radius:3mm;overflow:hidden;list-style:none}
.fstats li{background:var(--night);padding:4mm 3.5mm}
.fstats strong{display:block;font-size:9.5pt;font-weight:700;color:#fff;line-height:1.4}
.fstats span{display:block;margin-top:1.4mm;font-size:8pt;line-height:1.6;color:rgba(255,255,255,.45)}
.fcard-m{min-width:0;display:flex;flex-direction:column;min-height:0}
.fcard-m figure{margin:0;display:flex;flex-direction:column;flex:1;min-height:0}
.fcard-m img{width:100%;flex:1 1 0;min-height:0;object-fit:contain;object-position:center top;border:1px solid rgba(255,255,255,.12);border-radius:3mm;background:#171717;padding:1.5mm}
.fcard-m figcaption{margin-top:2.5mm;font-size:8pt;line-height:1.7;color:rgba(255,255,255,.5)}

/* ② 산출물 장 — 도판·유튜브·채널 */
.fout{margin-top:5mm;display:grid;grid-template-columns:minmax(0,7fr) minmax(0,5fr);gap:9mm;flex:1;min-height:0}
.fout-l{display:flex;flex-direction:column;gap:4mm;min-height:0}
.fout-l figure{margin:0;display:flex;flex-direction:column;flex:1 1 0;min-height:0}
.fout-l img{width:100%;flex:1 1 0;min-height:0;object-fit:contain;object-position:left top;border:1px solid rgba(255,255,255,.12);border-radius:2.5mm;background:#171717;padding:1.5mm}
.fout-l figcaption{margin-top:2mm;font-size:7.6pt;line-height:1.6;color:rgba(255,255,255,.5)}
.fout-r{display:flex;flex-direction:column;gap:4mm;min-height:0}
.fvids{display:grid;grid-template-columns:1fr 1fr;gap:3mm}
.fchan-k{font-size:8pt;font-weight:700;letter-spacing:.02em;text-transform:uppercase;color:rgba(255,255,255,.45)}
.fchan-n{margin-top:1mm;font-size:9pt;font-weight:700;line-height:1.6;color:rgba(255,255,255,.8)}
.fchan{margin-top:3mm;display:grid;grid-template-columns:1fr 1fr;gap:4mm}
.chan img{width:100%;aspect-ratio:16/9;object-fit:cover;border:1px solid rgba(255,255,255,.12);border-radius:2.5mm;background:var(--night);display:block}
.chan-n{margin-top:2mm;font-size:9pt;font-weight:700;color:#fff;line-height:1.5}
.chan-h{margin-top:.6mm;font-size:8pt;color:rgba(255,255,255,.6);line-height:1.5}
.chan-m{margin-top:.6mm;font-size:8pt;color:rgba(255,255,255,.45);line-height:1.6}
.page.dark .thumb{background:var(--night);border:1px solid rgba(255,255,255,.12)}
.page.dark .thumb>span:not(.play){color:rgba(255,255,255,.6)}

/* 채널·유튜브가 없는 케이스는 도판을 2열로 펴서 장을 채운다 */
.fout-grid{margin-top:5mm;display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:1fr;gap:6mm;flex:1;min-height:0}
.fout-grid figure{margin:0;display:flex;flex-direction:column;min-height:0}
.fout-grid img{width:100%;flex:1 1 0;min-height:0;object-fit:contain;object-position:center;border:1px solid rgba(255,255,255,.12);border-radius:2.5mm;background:#171717;padding:2mm}
.fout-grid figcaption{margin-top:2mm;font-size:7.8pt;line-height:1.6;color:rgba(255,255,255,.5)}
.fout-l figure{flex:1 1 0}
/* 세로 릴스는 나란히 두 칸 — 가로 칸에 넣으면 손톱만 해진다 */
.fout-reels{display:flex;gap:4mm;flex:1.4 1 0;min-height:0}
.fout-reels figure{flex:0 1 auto;display:flex;flex-direction:column;min-height:0;max-width:34mm}
.fout-reels img{width:100%;flex:1 1 0;min-height:0;object-fit:cover;border-radius:2.5mm;border:1px solid rgba(255,255,255,.12);background:#171717;padding:0}

/* ── 시딩 3단 밴드 (홈 ServiceFlow 의 light→indigo→night 교차를 면 색으로) */
.flow3{display:grid;grid-template-columns:repeat(3,1fr);gap:6mm;flex:1;min-height:0}
.f3{display:flex;flex-direction:column;border-radius:4mm;overflow:hidden;min-height:0}
.f3 img{width:100%;flex:1 1 0;min-height:0;object-fit:cover;display:block}
.f3-b{padding:5mm 5mm 6mm}
.f3-k{font-size:8pt;font-weight:700;letter-spacing:.02em}
.f3-t{margin-top:2.5mm;font-size:12.5pt;font-weight:700;line-height:1.5;letter-spacing:-.02em}
.f3-d{margin-top:3mm;font-size:8.4pt;line-height:1.7}
.f3-light{background:var(--alt);color:var(--ink)}
.f3-light .f3-k{color:var(--gold-deep)}
.f3-light .f3-d{color:var(--muted)}
.f3-indigo{background:var(--indigo);color:#fff}
.f3-indigo .f3-k{color:rgba(255,255,255,.72)}
.f3-indigo .f3-d{color:rgba(255,255,255,.78)}
.f3-night{background:var(--night);color:#fff}
.f3-night .f3-k{color:var(--gold)}
.f3-night .f3-d{color:rgba(255,255,255,.7)}

/* ── 플랜 항목 목록 */
.plan-list{list-style:none;margin-top:5mm;display:flex;flex-direction:column;gap:3mm}
.plan-list li{background:var(--alt);border-radius:2.5mm;padding:3.5mm 4mm}
.plan-list strong{display:block;font-size:10pt;font-weight:700}
.plan-list span{display:block;margin-top:1.2mm;font-size:8.4pt;line-height:1.6;color:var(--muted)}

/* ── Appendix · AI 분업 */
.ai-lead{margin-bottom:6mm;border-left:.5mm solid var(--indigo);padding-left:5mm;font-size:10.5pt;line-height:1.85;color:#2a2a2a;flex-shrink:0}
.ai2{flex:1;min-height:0}
.ai-col{background:#fff;border:1px solid var(--line);border-radius:4mm;padding:6mm 6.5mm;display:flex;flex-direction:column;min-height:0}
.ai-col-h{background:var(--night);border-color:var(--night);color:#fff}
.ai-k{font-size:9pt;font-weight:700;letter-spacing:.02em;color:var(--gold-deep)}
.ai-col-h .ai-k{color:var(--gold)}
.ai-list{list-style:none;margin-top:4mm;display:flex;flex-direction:column;gap:4mm;flex:1;min-height:0}
.ai-list li{border-left:.5mm solid var(--indigo);padding-left:4mm}
.ai-col-h .ai-list li{border-left-color:var(--gold)}
.ai-list strong{display:block;font-size:11pt;font-weight:700}
.ai-list span{display:block;margin-top:1.6mm;font-size:9pt;line-height:1.75;color:#3a3a3a}
.ai-col-h .ai-list span{color:rgba(255,255,255,.72)}
.ai-note{margin-top:4mm;font-size:8pt;line-height:1.7;color:rgba(255,255,255,.5)}

/* ── Appendix */
.appx{display:flex;flex-direction:column;gap:5mm;flex:1;min-height:0;justify-content:center}
.appx-row{display:grid;grid-template-columns:16mm 1fr;gap:5mm;align-items:start;background:#fff;border:1px solid var(--line);border-radius:3.5mm;padding:5mm 6mm}
.appx-no{font-size:15pt;font-weight:700;color:var(--indigo);line-height:1}
.appx-t{font-size:11pt;font-weight:700}
.appx-d{margin-top:2mm;font-size:9.5pt;line-height:1.8;color:#333}

/* ── 주요 성장 사례 카드 — 제목은 /blog 고객 이야기 원문 그대로 ─── */
/* 5×2 로 장을 채운다 — 한 줄만 두면 아래가 통째로 빈다 (2026-08-20) */
.stories{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));grid-auto-rows:1fr;gap:4.5mm;flex:1;min-height:0}
.story{display:flex;flex-direction:column;text-decoration:none;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);border-radius:3.5mm;padding:2.6mm;min-height:0}
.story img{width:100%;flex:1 1 0;min-height:0;object-fit:cover;border-radius:2.5mm;border:1px solid rgba(255,255,255,.1);background:#171717;display:block}
.story-t{margin-top:2.6mm;font-size:8.6pt;font-weight:600;line-height:1.5;color:#fff;letter-spacing:-.02em;flex:0 0 auto}

/* IMC 카드가 <a> 가 됐다 — 링크 표시 */
.imc-card{text-decoration:none}
.page.dark .imc-go{display:block;margin-top:2.5mm;font-size:7.6pt;font-weight:600;font-style:normal;color:#bbf451}

/* ── 운영 채널 모음 ─────────────────────────────────────────────── */
.chan-wall{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-auto-rows:1fr;gap:5mm;flex:1;min-height:0}
.chan-p{margin-top:2.5mm;font-size:7.4pt;font-weight:700;letter-spacing:.02em;color:var(--gold)}
.page.dark .chan-wall .chan{display:flex;flex-direction:column;min-height:0}
.page.dark .chan-wall .chan img{flex:1 1 0;min-height:0;height:auto;aspect-ratio:auto;object-fit:cover}
.chan-note{margin-top:1mm;font-size:7.4pt;line-height:1.5;color:rgba(255,255,255,.45)}

/* ── IMC 카드 — 홈페이지 /portfolio FramerCases 이식 ─────────────── */
/* ⚠️ 홈페이지의 **색·테두리·카드 면**만 가져오고 **글자 크기는 소개서 값**을
   쓴다. 홈 카드는 373px 폭에 세로로 흐르는 페이지지만, 소개서는 한 행이
   60mm 뿐이라 16px/14px 를 그대로 옮기면 카드가 7mm 넘친다(검사기가 잡음). */
.page.dark .imc-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.1);border-radius:3.5mm;padding:3mm}
.page.dark .imc-card img{height:24mm;object-fit:cover;border-radius:2.5mm;border:1px solid rgba(255,255,255,.1);background:#171717;width:100%;display:block}
.page.dark .imc-body{padding:0;gap:1.2mm}
.page.dark .imc-body strong{display:block;margin-top:3mm;font-size:9.5pt;font-weight:600;letter-spacing:-.03em;color:#fff}
.page.dark .imc-body span{display:block;font-size:7.8pt;line-height:1.55;color:rgba(255,255,255,.6)}
.page.dark .imc-nopic{height:24mm;border-radius:2.5mm;background:#171717;border:1px solid rgba(255,255,255,.1)}
.page.dark .eyebrow-lime{font-size:9pt;font-weight:600;letter-spacing:.2em;color:#bbf451}
.page.dark .subline{color:rgba(255,255,255,.6)}
.page.dark h2{color:#fff}

.brandcase{display:grid;grid-template-columns:minmax(0,6fr) minmax(0,6fr);gap:8mm;flex:1 1 auto;min-height:0;overflow:hidden}
.bc-body{display:flex;flex-direction:column;min-width:0}
.bc-p{font-size:9.5pt;line-height:1.9;color:var(--ink-soft, #171717);margin-bottom:4mm}
.bc-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:3mm;list-style:none;margin-bottom:7mm}
.bc-stats-2{grid-template-columns:repeat(2,minmax(0,1fr))}
.bc-stats .big{font-size:15pt;line-height:1.2}
.bc-stats li{background:var(--alt);border-radius:2.5mm;padding:4mm}
.bc-stats strong{display:block;font-size:8.5pt;line-height:1.45}
.bc-stats span{display:block;font-size:7pt;color:var(--muted);margin-top:1.5mm;line-height:1.5}
.bc-media{display:flex;flex-direction:column;gap:4mm;min-width:0;min-height:0}
.bc-media img{width:100%;flex:1 1 0;min-height:0;object-fit:cover;border:1px solid var(--line);border-radius:3mm}

/* 다시 조판한 데이터 표 — 저해상도 스크린샷 대신 벡터로 인쇄된다 (2026-08-20) */
.dtable{width:100%;border-collapse:collapse;font-size:7.5pt;font-variant-numeric:tabular-nums}
.dtable th{background:#1f3864;color:#fff;font-weight:700;padding:1.8mm 1.5mm;text-align:right;white-space:nowrap}
.dtable th:first-child{text-align:left}
.dtable td{padding:1.6mm 1.5mm;text-align:right;border-bottom:1px solid var(--line);white-space:nowrap}
.dtable tbody tr:nth-child(even){background:var(--alt)}
.dtable .dtable-sum{background:#fff7d6;font-weight:700}
.dtable .dtable-sum td{border-bottom:none}

/* 사례 슬라이드의 실적표 — 가로 전체 폭 (2026-08-20)
   왼쪽 열 안에 두면 가로로 긴 표가 40px 높이로 눌려 숫자가 안 읽힌다 */
/* HTML 표(모에브)는 이미지가 아니라 flex 로 줄지 않는다 — 따로 둔다 */
.bc-tbl{flex:0 0 auto;margin-top:6mm;display:flex;flex-direction:column;gap:3mm}
.bc-tbl figure{margin:0}
.bc-tbl figcaption{font-size:7.5pt;color:var(--muted);margin-top:2mm;line-height:1.55}
.page.dark .bc-tbl figcaption{color:rgba(255,255,255,.5)}
/* 증빙 이미지는 flex 로 늘려 장을 채운다 — 고정 높이면 아래가 비고 표는 작아진다 */
.bc-ev-wide{flex:1 1 auto;min-height:0;margin-top:6mm;display:flex;flex-direction:column;gap:3mm}
.bc-ev-wide figure{margin:0}
/* 표는 왼쪽 기준으로 붙이고 크게 — 가운데 띄우면 여백에 떠 있는 것처럼 보이고
   34mm 로는 숫자가 안 읽힌다 (2026-08-20 사장님 스크린샷) */
.bc-ev-wide figure{margin:0;display:flex;flex-direction:column;flex:1 1 0;min-height:0}
.bc-ev-wide img{width:100%;flex:1 1 0;min-height:0;object-fit:contain;object-position:left top;border:1px solid var(--line);border-radius:1.5mm;display:block;margin:0}
.bc-ev-wide figcaption{font-size:7.5pt;color:var(--muted);margin-top:2mm;line-height:1.55}

/* 실적 증빙 전용 장표 */
.evpage{display:flex;flex-direction:column;gap:7mm;flex:1;min-height:0;overflow:hidden;justify-content:center}
.evpage figure{margin:0}
.evpage-solo img{max-height:105mm}
.evpage img{width:auto;max-width:100%;max-height:48mm;border:1px solid var(--line);border-radius:1.5mm;display:block;margin:0 auto}
.evpage figcaption{font-size:8pt;color:var(--muted);margin-top:2mm;line-height:1.6}

/* IMC 프로젝트 기록 — 프레이머 포트폴리오 (2026-08-20) */
.imc{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5mm;flex:1;min-height:0;overflow:hidden;align-content:start}
.imc-card{display:flex;flex-direction:column;border:1px solid var(--line);border-radius:2.5mm;overflow:hidden;min-height:0}
.imc-card img{width:100%;height:26mm;object-fit:cover;display:block}
.imc-nopic{width:100%;height:26mm;background:var(--alt)}
.imc-body{padding:3.5mm;display:flex;flex-direction:column;gap:1.5mm}
.imc-body strong{font-size:9pt;line-height:1.4}
.imc-body span{font-size:7.5pt;color:var(--muted);line-height:1.55}

/* 숏폼 포트폴리오 */
/* 소재마다 어느 브랜드 것인지 밝힌다 — 소개서는 증빙 문서다 (2026-08-19) */
.short{position:relative;display:block;text-decoration:none}
.play{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:9mm;height:9mm;border-radius:50%;background:rgba(0,0,0,.55);color:#fff;font-size:8pt;display:flex;align-items:center;justify-content:center;padding-left:.6mm}
.short-b{position:absolute;left:2mm;bottom:2mm;background:rgba(0,0,0,.72);color:#fff;font-size:6.5pt;font-weight:700;padding:.8mm 2mm;border-radius:1mm;letter-spacing:-.01em}
.shorts{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));grid-template-rows:repeat(2,minmax(0,1fr));gap:3.5mm;flex:1 1 0;min-height:0;overflow:hidden}
.short{border-radius:2.5mm;overflow:hidden;background:var(--alt);min-height:0}
/* 배지 둘 — 위는 소재의 목적(주), 아래는 브랜드(부) */
.short-more{display:flex;align-items:center;justify-content:center;border:1px dashed var(--line);border-radius:2.5mm;color:var(--muted);font-size:9pt;font-weight:600;min-height:0}
.short-brand{position:absolute;left:2mm;top:2mm;font-size:5.6pt;font-weight:500;color:rgba(255,255,255,.82);background:rgba(0,0,0,.42);border-radius:1mm;padding:.5mm 1.4mm;letter-spacing:-.01em}
.short img{width:100%;height:100%;object-fit:cover;display:block}

/* 4분할 카드 (이미지 + 본문) */
.cards4{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm;flex:1}
.card4{border:1px solid var(--line);border-radius:3mm;display:flex;flex-direction:column;overflow:hidden;align-self:start}
.card4-img{width:100%;aspect-ratio:16/10;object-fit:cover;object-position:center;display:block;border-bottom:1px solid var(--line)}
.card4-body{padding:7mm;text-align:center;display:flex;flex-direction:column;align-items:center}
.card4-no{font-size:7.5pt;font-weight:700;color:#fff;background:var(--indigo);border-radius:50%;width:7mm;height:7mm;display:flex;align-items:center;justify-content:center}
.card4-t{font-size:13pt;font-weight:700;margin-top:4mm}
.card4-d{font-size:9.5pt;line-height:1.8;color:var(--muted);margin-top:3.5mm}

/* 영상 썸네일 그리드 */
.thumbs{display:grid;grid-template-columns:repeat(4,1fr);gap:3.5mm;flex:1;align-content:start}
/* 롱폼도 <a> 가 됐다 — .play 배지가 캡션 스타일에 먹히지 않도록 분리 */
.thumb{position:relative;display:block;text-decoration:none;border-radius:2.5mm;overflow:hidden;background:var(--alt)}
.thumb img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block}
.thumb>span:not(.play){display:block;font-size:7.5pt;line-height:1.5;color:var(--muted);padding:3mm 3.5mm}
.thumb .play{top:calc(50% - 5mm)}

/* 관점 선언 (전면) */
.stmt{height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 26mm}
.stmt-k{font-size:8pt;letter-spacing:.18em;color:var(--gold)}
.stmt-t{font-size:22pt;font-weight:700;line-height:1.5;margin-top:8mm}
.stmt-d{font-size:10.5pt;line-height:1.9;color:rgba(255,255,255,.62);margin-top:10mm}

/* 파트 표지 */
.part{height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 26mm}
.part-k{font-size:8pt;letter-spacing:.18em;color:var(--gold)}
.part-t{font-size:30pt;font-weight:700;line-height:1.3;margin-top:6mm}
.part-d{font-size:11pt;line-height:1.8;color:rgba(255,255,255,.6);margin-top:6mm}

/* 세 갈래 */
.lines{display:grid;grid-template-columns:repeat(3,1fr);gap:5mm;flex:1}
.line-card{border:1px solid var(--line);border-radius:3mm;padding:9mm 8mm;display:flex;flex-direction:column}
.line-k{font-size:7.5pt;letter-spacing:.14em;color:var(--gold-deep)}
.line-t{font-size:14pt;font-weight:700;line-height:1.4;margin-top:5mm}
.line-d{font-size:9pt;line-height:1.85;color:var(--muted);margin-top:5mm}
.line-tag{font-size:8pt;font-weight:700;color:var(--indigo);background:rgba(77,95,232,.08);border-radius:99mm;padding:2.5mm 5mm;margin-top:auto;align-self:flex-start}

/* 팀 4분할 */
.teams{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm;flex:1}
.team{border:1px solid var(--line);border-radius:3mm;padding:0 0 7mm;display:flex;flex-direction:column;overflow:hidden;align-self:start}
.team-img{width:100%;aspect-ratio:4/3;object-fit:cover;object-position:top;display:block}
.team-name{font-size:11.5pt;font-weight:700;margin:5mm 6mm 0}
.team-list{margin:4mm 6mm 0 !important}
.team-list{margin-top:5mm;display:flex;flex-direction:column;gap:3mm;list-style:none}
.team-list li{font-size:8.5pt;line-height:1.65;color:var(--muted);padding-left:4mm;position:relative;list-style:none}
.team-list li:before{content:"";position:absolute;left:0;top:2.6mm;width:1.6mm;height:1.6mm;border-radius:50%;background:var(--gold)}

/* 통합 브랜드 액션 */
.acts{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm;flex:1}
.act{background:var(--alt);border-radius:3mm;padding:7mm;display:flex;flex-direction:column}
.act-b{font-size:11pt;font-weight:700}
.act-p{font-size:8pt;line-height:1.7;color:var(--muted);margin-top:3mm}
.act-r{font-size:8.5pt;line-height:1.6;font-weight:700;color:var(--indigo);margin-top:auto;padding-top:4mm}

/* 후기 */
.reviews{display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:1fr 1fr;gap:4mm;flex:1}
.rv{background:var(--alt);border-radius:3mm;padding:7mm;display:flex;flex-direction:column}
.rv p{font-size:9.5pt;line-height:1.9}
.rv span{display:block;font-size:7.5pt;color:#8a8a8a;margin-top:auto;padding-top:4mm}
</style></head>
<body>
${ordered.join("\n")}
</body></html>`;

const out = resolve(ROOT, "docs/deck/소개서.html");
writeFileSync(out, html, "utf-8");
console.log(`생성: ${out} (${ordered.length}슬라이드 · 16:9)`);
