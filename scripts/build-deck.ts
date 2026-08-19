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
import { PLANS, POLICY, COMPANY, SERVICE, formatKRW,
  MODEL_OPTION,
} from "@/lib/constants";
import { SEEDING_STAGES, SHORTS_STAGES } from "@/lib/stages";
import { ALL_BRAND_CLIPS, CLIPS_BY_BRAND, clipPoster } from "@/lib/clips";
/**
 * 소개서의 SNS·종합 파트는 **랜딩(/sns-brand)과 같은 데이터를 읽는다.**
 * 예전엔 여기서 문안을 새로 지어 썼는데, 사이트와 내용이 갈라져 두 번 고쳐야 했다.
 * 화면에 있는 걸 그대로 문서로 옮기는 게 맞다.
 */
import {
  ACTIONS,
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
  "curas", "dmand", "walla", "posh", "resq", "natura-health", "banaco",
  "irvinelab", "cyberdigm", "code-i", "fitflex", "luvd", "mudit",
  "yeolda", "bluehouse-seoul",
];

const CASES = [
  { no: "01", key: "리얼아카데미", brand: "뤼이드 리얼 아카데미", scale: "투자 2,000억", role: "소재 제작 + 캠페인 운영",
    img: "/portfolio/clips/riiid-report.jpg",
    stats: [["3주", "연속 고지출"], ["1위", "CPA 단가"]] },
  { no: "02", key: "제로블럭", brand: "파크론 제로블럭", scale: "매출 200억대", role: "소재 제작 + 캠페인 운영",
    img: "/portfolio/clips/parkron-tpu.jpg",
    stats: [["5배", "메타 예산 증액"], ["9만원", "CPA 절감"]] },
  { no: "03", key: "모에브", brand: "이노바인코리아 모에브", scale: "매출 300억대", role: "출시 고투마켓 소재 부스팅",
    img: "/portfolio/cases/inovine-moev.jpg",
    stats: [["₩4,000만", "3개월 매출"], ["3배", "ROAS"]] },
  { no: "04", key: "크래프톤", brand: "크래프톤 배틀그라운드", scale: "글로벌", role: "연간 공식 바이럴 쇼츠 기획·제작",
    img: "/portfolio/cases/krafton-jonathan.jpg",
    stats: [["연간", "공식 프로젝트"], ["팬덤", "바이럴"]] },
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
const slide = (body: string, opts: { dark?: boolean; bare?: boolean } = {}) => {
  pageNo += 1;
  const n = pageNo;
  return `<section id="pg${n}" class="page${opts.dark ? " dark" : ""}">
  <div class="page-body">${body}</div>
  ${opts.bare ? "" : `<footer class="page-foot"><span>${SERVICE.name}</span><span>${String(n).padStart(2, "0")}</span></footer>`}
</section>`;
};

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

// 01 표지





pages.push(
  slide(
    `<div class="cover">
  <div class="cover-l">
    <p class="cover-en">HGRS STUDIO</p>
    <h1>해그로시<br>스튜디오<br><span class="chip-title">종합 소개서</span></h1>
    <p class="cover-sub">브랜드 SNS 채널 커뮤니케이션부터 구매 전환 숏폼까지<br>브랜드 퍼널을 완성하는 두 서비스 라인을 함께 소개합니다.</p>
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





pages.push(
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

// 03 법인 소개 — 메인 화면과 세 서비스





pages.push(
  slide(`
${head("해그로시 스튜디오", "하나의 스튜디오에서 세 갈래로 붙습니다 — hgrs.io")}
<div class="corp">
  <img class="corp-shot" src="${asset("/deck/home-hero.jpg")}" alt="">
  <div class="corp-side">
    <div class="kv">
      <div><dt>상호</dt><dd>${COMPANY.name}</dd></div>
      <div><dt>사업자등록번호</dt><dd>${COMPANY.bizRegNumber}</dd></div>
      <div><dt>${COMPANY.addressLabel}</dt><dd>${COMPANY.address}</dd></div>
      <div><dt>문의</dt><dd>contact@h-grs.com</dd></div>
    </div>
    <ul class="corp-lines">
      <li><strong>매출 스케일업</strong> 구매 전환형 숏폼</li>
      <li><strong>브랜드 SNS 채널</strong> 컨텐츠 활성화</li>
      <li><strong>종합 브랜드 마케팅</strong> 전개</li>
    </ul>
  </div>
</div>`),
);

// 09 클라이언트





pages.push(
  slide(`
${head("클라이언트 히스토리", "커머스부터 서비스, 플랫폼까지 30여 브랜드와 함께했습니다")}
<div class="logos">
${CLIENTS.map((c) => `<div><img src="${asset(`/logos/${c}.png`)}" alt=""></div>`).join("")}
</div>`),
);

// 02-2 세 갈래





pages.push(
  slide(`
${head("무엇이 필요하신가요", "세 갈래 중 어디서 시작하셔도 같은 팀이 붙습니다")}
<div class="lines">
${[
  {
    k: "LINE 01",
    t: "구매 전환형 숏폼",
    d: "인플루언서 시딩과 2차 활용 소스로<br>광고 소재를 편수 단위로 제작합니다.",
    tag: "편수 단위 · 즉시 시작",
  },
  {
    k: "LINE 02",
    t: "SNS 채널 활성화",
    d: "유튜브·인스타그램 채널의 기획·전략·운영을<br>연 단위 파트너십으로 진행합니다.",
    tag: "최소 6개월 · 기본 1년",
  },
  {
    k: "LINE 03",
    t: "종합 브랜드 마케팅",
    d: "채널·컨텐츠·광고에 이벤트·프로모션·CRM 까지<br>하나의 전략으로 묶습니다.",
    tag: "브랜드 단위 · 협의",
  },
].map(
  (l) => `<div class="line-card">
  <p class="line-k">${l.k}</p>
  <p class="line-t">${l.t}</p>
  <p class="line-d">${l.d}</p>
  <p class="line-tag">${l.tag}</p>
</div>`,
).join("")}
</div>
`),
);

// PART1





pages.push(
  slide(
    `<div class="part">
  <p class="part-k">LINE 01</p>
  <p class="part-t">매출 스케일업 구매 전환형 숏폼</p>
  <p class="part-d">인플루언서 시딩 바이럴 · 2차 활용 소스 · 광고 숏폼 기획제작</p>
</div>`,
    { dark: true, bare: true },
  ),
);

// 04 포지션





pages.push(
  slide(`
${head("숏폼 스튜디오 서비스 영역", "시딩과 2차 활용 영상 확보부터 구매전환 숏폼 기획제작까지 하나로 해결해 드립니다")}
<div class="two vcenter">
  <div class="venn">
    <div class="venn-c venn-a"><span>인플루언서<br>시딩</span></div>
    <div class="venn-c venn-b"><span>광고 숏폼<br>기획제작</span></div>
    <div class="venn-mid"><strong>해그로시</strong><span>숏폼 스튜디오</span></div>
  </div>
  <div class="pos-col">
${[
  ["가이드라인부터", "무엇을 왜 찍을지 먼저 확정"],
  ["필요한 컷만", "광고에 쓸 컷을 설계해 확보"],
  ["전환까지 연결", "그 소스로 구매 전환 소재 제작"],
]
  .map(([t, d]) => `<div class="pos"><p class="pos-t">${t}</p><p class="pos-d">${d}</p></div>`)
  .join("")}
    <div class="pos-note">인플 시딩부터 매출형 숏폼까지 해결합니다.</div>
  </div>
</div>`),
);

// 05 진행 라인




pages.push(
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
<div class="oneline">한 번의 발주 · 하나의 담당 · 하나의 대시보드</div>`),
);

// 07 숏폼 성과 — 브랜드당 한 장





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

const moevTable = () => `<div class="bc-ev-wide">
  <figure>
    <table class="dtable">
      <thead><tr>${MOEV_ROAS.head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
      <tbody>
        ${MOEV_ROAS.rows.map((r) => `<tr>${r.map((v) => `<td>${esc(v)}</td>`).join("")}</tr>`).join("")}
        <tr class="dtable-sum">${MOEV_ROAS.total.map((v) => `<td>${esc(v)}</td>`).join("")}</tr>
      </tbody>
    </table>
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
const PERF_FIRST = (a: Evidence, b: Evidence) =>
  (b.kind === "퍼포먼스" ? 1 : 0) - (a.kind === "퍼포먼스" ? 1 : 0);

/** 케이스 슬라이드 왼쪽 열에 안 잘리고 들어가는 최대 장수 */
const EV_ON_CASE = 1;

/** 케이스 슬라이드에 못 실어 뒤로 넘긴 증빙 */
const overflowEvidence: Evidence[] = [];

CASES.forEach((c) => {
  const ev = evidenceOf(c.key).sort(PERF_FIRST);
  const onCase = ev.slice(0, EV_ON_CASE);
  overflowEvidence.push(...ev.slice(EV_ON_CASE));

  pages.push(
    slide(`
<div class="bc-head">
  <p class="bc-meta">${esc(c.scale)} · ${esc(c.role)}</p>
  <h2 class="bc-title">${esc(c.brand)}</h2>
</div>
<div class="brandcase">
  <div class="bc-body">
    <ul class="bc-stats bc-stats-2">
      ${c.stats.map(([v, l]) => `<li><strong class="big">${v}</strong><span>${esc(l)}</span></li>`).join("")}
    </ul>
    <p class="bc-p">${esc(c.role)} — 소재 기획부터 캠페인 운영까지 한 팀이 맡아 진행했습니다.</p>
  </div>
  <div class="bc-media">
    <img src="${asset(c.img)}" alt="">
  </div>
</div>
${
  /* 실적표는 **가로 전체 폭**으로 뺀다. (2026-08-20)
     왼쪽 열(폭 절반) 안에 두었더니 원본이 가로로 긴 표라 높이가 40px 대로
     눌려 숫자가 안 읽혔다. 표는 읽히라고 넣는 것이다. */
  c.key === "모에브"
    ? moevTable()
    : onCase.length
      ? `<div class="bc-ev-wide">${onCase.map(evFigure).join("")}</div>`
      : ""
}
<p class="foot-note">${esc(POLICY.noGuarantee)}</p>`),
  );
});

// 02-5-2 실적 증빙 — 케이스 슬라이드에서 넘친 자료를 버리지 않고 모아 싣는다





/**
 * 사장님이 파일명으로 직접 매칭해 주신 자료다. 케이스 슬라이드 공간이 모자라
 * 뒤로 밀린 것뿐이므로 **한 장도 빼지 않는다.** 한 장에 두 개씩 담는다 —
 * 표 이미지는 가로로 길어서 세 개를 넣으면 다시 아래가 잘린다.
 */
for (let from = 0; from < overflowEvidence.length; from += 2) {
  const rows = overflowEvidence.slice(from, from + 2);
  const page = from / 2;
  const total = Math.ceil(overflowEvidence.length / 2);
  pages.push(
    slide(`
${head(
  total > 1 ? `실적 증빙 (${page + 1}/${total})` : "실적 증빙",
  page === 0 ? "앞 사례의 실제 운영 데이터입니다" : "이어서 보여드립니다",
)}
<div class="evpage">${rows.map(evFigure).join("")}</div>`),
  );
}

// 02-6-2 숏폼 포트폴리오





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
  const all = ALL_BRAND_CLIPS;
  const brandOf = (slug: string) =>
    CLIPS_BY_BRAND.find((b) => b.slugs.includes(slug))?.brand ?? "";

  for (let i = 0; i < all.length; i += perPage) {
    const chunk = all.slice(i, i + perPage);
    const page = Math.floor(i / perPage) + 1;
    const total = Math.ceil(all.length / perPage);

    pages.push(
      slide(`
${head(
  total > 1 ? `숏폼 포트폴리오 (${page}/${total})` : "숏폼 포트폴리오",
  "브랜드 광고 계정에 바로 태운 구매 전환형 소재입니다 — 누르면 영상이 재생됩니다",
)}
<div class="shorts">
${chunk
  .map(
    (slug) =>
      `<a class="short" href="${playUrl(slug)}"><img src="${asset(clipPoster(slug))}" alt=""><span class="play">▶</span><span class="short-b">${esc(brandOf(slug))}</span></a>`,
  )
  .join("")}
</div>`),
    );
  }
}

// 10 제작 조직 (현장)





pages.push(
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



pages.push(
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




pages.push(
  slide(`
${head("플랜 안내", "브랜드 상황에 맞는 구성을 고르시면 됩니다 — 싱글과 멀티는 택일입니다")}

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

// 16 계약 · 결제





pages.push(
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





pages.push(
  slide(
    `<div class="part">
  <p class="part-k">LINE 02</p>
  <p class="part-t">브랜드 SNS 채널 컨텐츠 활성화</p>
  <p class="part-d">브랜드 유튜브 · 인스타그램 채널의 기획 · 전략 · 운영</p>
</div>`,
    { dark: true, bare: true },
  ),
);

// 02-4 SNS 종합 브랜드 마케팅 시스템 (랜딩 Process 섹션 그대로)





pages.push(
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





/**
 * 소개서에서만 갈아 끼우는 대표 컷.
 * 랜딩은 히어로 아래에 영상 카드가 붙어서 같은 프레임이 겹치지만,
 * 소개서는 장표 하나에 이미지 한 장이라 사장님이 지정한 수의사 롱폼 컷을 쓴다.
 */
const DECK_HERO: Record<string, string> = { trusty: "/sns/trusty-vet.jpg" };

FEATURES.forEach((f) => {
  pages.push(
    slide(`
<div class="bc-head">
  <p class="bc-meta">${esc(f.meta)} · ${esc(f.category)}</p>
  <h2 class="bc-title">${esc(f.title)}</h2>
</div>
<div class="brandcase">
  <div class="bc-body">
    <ul class="bc-stats">
      ${f.stats
        .map(
          (st) =>
            `<li><strong>${esc(st.v)}</strong>${st.note ? `<span>${esc(st.note)}</span>` : ""}</li>`,
        )
        .join("")}
    </ul>
    ${f.body.map((t) => `<p class="bc-p">${esc(plain(t))}</p>`).join("")}
    ${(() => {
      /**
       * SNS 사례에도 실적 증빙을 붙인다. (2026-08-19)
       *
       * 사장님이 `럽디 리데이트.png` 를 넣으며 **이 장표**라고 지목하셨다.
       * `meta` 첫 낱말이 브랜드명이라(예: "럽디 (연애 상담 서비스…") 그걸로
       * 증빙을 찾는다.
       */
      const brandName = f.meta.split(/[\s(]/)[0];
      const ev = EVIDENCE.filter((e) => e.brand.startsWith(brandName));
      if (!ev.length) return "";
      return `<div class="bc-ev">${ev
        .map(
          (e) =>
            `<figure><img src="${asset(`/evidence/${e.file}`)}" alt=""><figcaption>${esc(e.caption)}${e.masked ? ' <span class="ev-mask">일부 가림</span>' : ""}</figcaption></figure>`,
        )
        .join("")}</div>`;
    })()}
  </div>
  <div class="bc-media">
    <img src="${asset(DECK_HERO[f.id] ?? f.hero.src)}" alt="">
  </div>
</div>`),
  );
});

// 02-5 투입 조직 (랜딩 Team 섹션 그대로)





pages.push(
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





[0, 8].forEach((from, page) => {
  const rows = PORTFOLIO.videos.slice(from, from + 8);
  if (!rows.length) return;
  pages.push(
    slide(`
${head(page === 0 ? "롱폼 주요 포트폴리오" : "롱폼 주요 포트폴리오 (2)", page === 0 ? "실제로 편성·제작한 롱폼 컨텐츠입니다" : "이어서 보여드립니다")}
<div class="thumbs">
${rows
  .map(
    (v) => `<div class="thumb"><img src="https://i.ytimg.com/vi/${v.id}/mqdefault.jpg" alt=""><span>${esc(v.title)}</span></div>`,
  )
  .join("")}
</div>
${page === 1 ? `<p class="foot-note">${esc(PORTFOLIO.note)}</p>` : ""}`),
  );
});

// PART3





pages.push(
  slide(
    `<div class="part">
  <p class="part-k">LINE 03</p>
  <p class="part-t">종합 브랜드 마케팅 전개</p>
  <p class="part-d">구독형 또는 SNS 채널 커뮤니케이션의 패키지 옵션으로 진행합니다</p>
</div>`,
    { dark: true, bare: true },
  ),
);

// 15-4 IMC 프로젝트 기록 — 프레이머 CMS 포트폴리오 28건을 그대로 싣는다 (2026-08-20)





/**
 * 사장님: *"그 프레이머 읽은 건 홈페이지에 포트폴리오인가 성장사례 있는 칸에도
 * 다 동일하게 넣으면 돼. 소개서에도 넣고."* — 요약하거나 골라 담지 않는다.
 * 두 줄 설명은 프레이머 원문 그대로다.
 */
for (let from = 0; from < FRAMER_CASES.length; from += 6) {
  const rows = FRAMER_CASES.slice(from, from + 6);
  const page = from / 6;
  const total = Math.ceil(FRAMER_CASES.length / 6);
  pages.push(
    slide(`
${head(
  total > 1 ? `IMC 프로젝트 기록 (${page + 1}/${total})` : "IMC 프로젝트 기록",
  page === 0
    ? `브랜드를 통으로 맡았던 프로젝트 ${FRAMER_CASES.length}건입니다`
    : "이어서 보여드립니다",
)}
<div class="imc">
${rows
  .map((c) => {
    const cover = c.blocks.find((b) => "img" in b) as { img: string } | undefined;
    return `<div class="imc-card">
  ${cover ? `<img src="${asset(cover.img)}" alt="">` : `<div class="imc-nopic"></div>`}
  <div class="imc-body">
    <strong>${esc(c.name)}</strong>
    ${c.summary.map((line) => `<span>${esc(line)}</span>`).join("")}
  </div>
</div>`;
  })
  .join("")}
</div>`),
  );
}

// 15-5 통합 브랜드 액션 — 랜딩의 원형 다이어그램을 정지 상태로





[0, 4].forEach((actFrom, actPage) => {
  pages.push(
    slide(`
${head(actPage === 0 ? "통합 브랜드 액션 수행 결과" : "통합 브랜드 액션 수행 결과 (2)", actPage === 0 ? ACTIONS.lead : "이어서 보여드립니다")}
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

// 17 문의처





pages.push(
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
  --ink:#030303; --muted:#595959; --line:#e6e6e6; --alt:#f7f5f3; --night:#0a0a0c;
}
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
.venn{position:relative;height:120mm}
.venn-c{position:absolute;top:0;width:106mm;height:106mm;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10.5pt;font-weight:700;line-height:1.5;text-align:center}
.venn-a{left:0;background:rgba(77,95,232,.18);border:1.5px solid var(--indigo);color:var(--indigo-deep)}
.venn-a span{margin-right:38mm}
.venn-b{right:0;background:rgba(184,155,141,.26);border:1.5px solid var(--gold);color:var(--gold-deep)}
.venn-b span{margin-left:38mm}
.venn-mid{position:absolute;left:50%;top:53mm;transform:translate(-50%,-50%);text-align:center;z-index:2}
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
.bc-ev{display:flex;flex-direction:column;gap:3mm;margin-top:5mm;min-height:0;overflow:hidden}
.bc-ev figure{margin:0;min-height:0}
.bc-ev img{width:100%;border:1px solid var(--line);border-radius:1.5mm;display:block}
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
.bc-ev-wide{flex:0 0 auto;margin-top:5mm}
.bc-ev-wide figure{margin:0}
.bc-ev-wide img{width:100%;border:1px solid var(--line);border-radius:1.5mm;display:block}
.bc-ev-wide figcaption{font-size:7.5pt;color:var(--muted);margin-top:2mm;line-height:1.55}

/* 실적 증빙 전용 장표 */
.evpage{display:flex;flex-direction:column;gap:7mm;flex:1;min-height:0;overflow:hidden;justify-content:center}
.evpage figure{margin:0}
.evpage img{width:100%;border:1px solid var(--line);border-radius:1.5mm;display:block}
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
.thumb{border-radius:2.5mm;overflow:hidden;background:var(--alt)}
.thumb img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block}
.thumb span{display:block;font-size:7.5pt;line-height:1.5;color:var(--muted);padding:3mm 3.5mm}

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
${pages.join("\n")}
</body></html>`;

const out = resolve(ROOT, "docs/deck/소개서.html");
writeFileSync(out, html, "utf-8");
console.log(`생성: ${out} (${pages.length}슬라이드 · 16:9)`);
