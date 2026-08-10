/**
 * 소개서(PDF) 생성기.
 *
 * 플랜 문의가 들어오면 메일에 첨부해 보내는 **제안서**다. 홈페이지 복사본이 아니다.
 * 지금 시장이 어떻게 나뉘어 있고, 그 사이에서 해그로시가 무엇을 메우며,
 * 그래서 무엇이 달라지는지를 **도식으로** 세운다.
 *
 * 조판 원칙 — 어긴 장이 한 장이라도 있으면 다시 짠다.
 *  · 글줄로 흐르는 장표를 만들지 않는다. 도형·숫자·사진으로 먼저 말하고
 *    부연은 두 줄 안에서 끝낸다
 *  · 모든 문장은 존댓말. 제목도 "~드립니다 / ~신가요?" 로 제안한다
 *  · 개인 이름을 쓰지 않는다. 우리는 법인이고 집단이다
 *  · 브랜드 두 색(인디고 #4d5fe8 · 골드탄 #b89b8d)을 도형과 강조에 일관되게 쓴다
 *
 * 가격·단계·정책 문구는 **직접 쓰지 않고 `lib/`에서 읽는다.** 하드코딩해 두면
 * 사이트만 고치고 소개서는 옛 가격을 들고 돌아다니게 된다.
 *
 *   npm run deck        # HTML 생성 + Chrome 헤드리스로 A4 인쇄
 *   소개서.html#pg7     # 그 장만 띄워 조판 확인
 *
 * 지어낸 숫자를 넣지 않는다. 홈페이지에서 검증된 수치와 법인 등기 정보만 쓴다.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { PLANS, POLICY, COMPANY, SERVICE, formatKRW } from "@/lib/constants";
import { SEEDING_STAGES, SHORTS_STAGES } from "@/lib/stages";

const ROOT = resolve(import.meta.dirname, "..");

/** 자산 주소. 기본은 로컬 정적 서버(`scripts/deck.sh`가 띄운다) */
const BASE = process.env.DECK_BASE ?? `file://${ROOT}`;
const asset = (p: string) => `${BASE}/public${p}`;
const font = (f: string) => `${BASE}/app/fonts/${f}`;

const singles = PLANS.filter((p) => p.code === "shorts_only");
const packages = PLANS.filter((p) => p.code === "full");

const perUnit = (won: number, count: number) =>
  formatKRW(Math.round(won / count));

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
  {
    no: "01",
    brand: "뤼이드 리얼 아카데미",
    scale: "투자 2,000억",
    role: "소재 제작 + 캠페인 운영",
    stats: [["3주", "연속 고지출"], ["1위", "CPA 단가"]],
  },
  {
    no: "02",
    brand: "파크론 제로블럭",
    scale: "매출 200억대",
    role: "소재 제작 + 캠페인 운영",
    stats: [["5배", "메타 예산 증액"], ["9만원", "CPA 절감"]],
  },
  {
    no: "03",
    brand: "이노바인코리아 모에브",
    scale: "매출 300억대",
    role: "출시 고투마켓 소재 부스팅",
    stats: [["₩4,000만", "3개월 매출"], ["3배", "ROAS"]],
  },
  {
    no: "04",
    brand: "크래프톤 배틀그라운드",
    scale: "글로벌",
    role: "연간 공식 바이럴 쇼츠 기획·제작",
    stats: [["연간", "공식 프로젝트"], ["대표이사·연예인", "출연 기획"]],
  },
];

const FLOW = [
  ["01", "브랜드 AI 기본 분석", "상세페이지 URL만 주시면 타겟·USP·객단가·금지 표현을 구조화해 초안을 잡아 드립니다."],
  ["02", "컨텐츠 가이드라인 기획", "편별로 포맷과 후킹을 갈라 편성합니다. 무엇을 왜 찍을지가 여기서 정해집니다."],
  ["03", "인플루언서 시딩 · 바이럴", "브랜드에 맞는 크리에이터를 붙이고 리뷰를 실제 채널에 배포합니다."],
  ["04", "2차 활용 소스컷 확보", "배포로 끝내지 않고 원본에서 광고용 컷을 다시 뽑아 자산으로 남겨 드립니다."],
  ["05", "매출형 숏폼 기획제작", "확보한 소스로 구매 전환형 숏폼을 만들어 광고 계정에 바로 태우실 수 있게 합니다."],
  ["06", "검수 · 납품", "미리보기로 확인하시고 1회 무상 수정을 거쳐 최종본을 그대로 내려받으십니다."],
];

/** 출신·역량 키워드 — 현장 사진과 함께 보여 준다 */
const CREDENTIALS = [
  "블랭크 코퍼레이션 출신",
  "라이브커머스 10종 이상 브랜드 밴더사",
  "구글·메타 코리아 우수 크리에이티브",
  "대형 종합몰 컨텐츠 담당 출신",
];

const ROLES = [
  ["숏폼 기획", "블랭크 코퍼레이션 출신"],
  ["커머스 컨텐츠 기획", "대형 라이브커머스 종합몰 담당 출신"],
  ["퍼포먼스 미디어바이어", "구글·메타 코리아 우수 크리에이티브"],
  ["촬영", "현장 디렉팅 · 촬영"],
  ["편집", "컷 편집 · 리텐션 설계"],
  ["숏폼 에디터", "변주본 · A/B 파생"],
  ["모션 디자이너", "자막 · 모션 그래픽"],
  ["카피라이터", "훅 카피 · CTA 문구"],
  ["시딩 · 제작 PM", "일정 · 산출물 관리"],
];

const SYSTEM = [
  ["위너 기준이 먼저 정의됩니다", "조회수가 아니라 구매 전환이 기준입니다. 지출이 꺾이지 않는 소재만 위너로 분류해 변주합니다."],
  ["프로젝트 사이클을 그대로 씁니다", "기획 → 제작 → 데이터 판독 → 변주. 이 사이클 중 ‘기획 → 제작’ 구간을 상품화했습니다."],
  ["담당이 나뉜 팀이 붙습니다", "한 명의 프리랜서가 아니라, 담당이 빠져도 멈추지 않는 구조로 납품해 드립니다."],
];

const CONTRACT = [
  ["01", "플랜 문의", "브랜드 상황을 남겨 주십니다. 컨텐츠 진단을 함께 마치시면 제안이 정확해집니다."],
  ["02", "소개서 · 구성 안내", "브랜드에 맞는 구성과 편수별 금액을 정리해 회신드립니다."],
  ["03", "구성 확정", "편수 · 시딩 인원 · 일정을 확정하고 견적서로 정리해 드립니다."],
  ["04", "결제", "세금계산서 발행 후 현금(계좌이체)이 기본이며, 카드 결제도 가능합니다."],
  ["05", "프로젝트 시작", "플랜을 적용해 드리면 내 프로젝트에서 진행 단계가 열립니다."],
  ["06", "가이드라인 제출", "브랜드 정보를 남겨 주십니다. 기획제작 요청 확정까지 D-7이 기준입니다."],
  ["07", "진행 · 검수", "단계를 대시보드에서 보시고 편당 1회 무상 수정을 요청하십니다."],
  ["08", "납품", "최종본을 프로젝트 폴더 하나로 전체 다운로드하십니다."],
];

const REVIEWS = [
  ["3년 내 최고 ROAS 달성했고, 가입 단가 CPA도 40% 절감했어요.", "G 대기업 실장"],
  ["조직이 고민하던 KPI 지표를 홀로 600% 달성. 오가닉 매출 2배 증대, 구매전환율 10%P 개선.", "Y 상담 스타트업 대표"],
  ["월에 3백 쓰며 시작한 신규 브랜드 라인을 통으로 맡겼는데 5개월 안에 2천까지 씁니다.", "M 헤어뷰티 커머스"],
  ["채용보다 저렴한 프로젝트 비용으로 DAU를 대폭 늘렸습니다.", "D HR 스타트업 공동대표"],
  ["브랜드 쿼리수를 올리는 방향으로 포지셔닝을 다시 잡아 주셨고, 이제 매출도 순항중입니다.", "B 스포츠 커머스 이사"],
  ["리브랜딩부터 실질적인 마케팅까지 3개월에 끊어주시더군요.", "F 건기식 커머스 대표"],
];

const WALL = [
  "riiid-momcafe", "pet-portion", "moen-shampoo-ppl", "bone-w40s",
  "zeroblock-interview", "riiid-self-study", "seeding-patty",
  "pet-vet-pancreas", "bone-m50s", "riiid-parent-itv", "seeding-garnish",
  "pet-treats-plea",
];

/* ───────────────────────── 조판 ───────────────────────── */

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

let pageNo = 0;
const page = (body: string, opts: { dark?: boolean; bare?: boolean } = {}) => {
  pageNo += 1;
  const n = pageNo;
  return `<section id="pg${n}" class="page${opts.dark ? " dark" : ""}">
  <div class="page-body">${body}</div>
  ${opts.bare ? "" : `<footer class="page-foot"><span>${SERVICE.name} 소개서</span><span>${String(n).padStart(2, "0")}</span></footer>`}
</section>`;
};

const head = (eyebrow: string, title: string, lead?: string) => `
<p class="eyebrow">${eyebrow}</p>
<h2>${title}</h2>
${lead ? `<p class="lead">${lead}</p>` : ""}`;

const planRows = (rows: typeof singles, kind: "single" | "package") =>
  rows
    .map((p) => {
      const unit =
        p.shortsCount > 1
          ? `${kind === "package" ? "숏폼 편당 " : "편당 "}${perUnit(p.shortsPrice ?? p.betaPrice, p.shortsCount)}`
          : "";
      return `<tr>
  <td class="t-name">${esc(p.label)}</td>
  <td class="t-desc">${esc(p.composition)}</td>
  <td class="t-price">${formatKRW(p.betaPrice)}${unit ? `<span>${unit}</span>` : ""}</td>
</tr>`;
    })
    .join("");

/* ───────────────────────── 페이지 ───────────────────────── */

const pages: string[] = [];

// 01 — 표지
pages.push(
  page(
    `<div class="cover">
  <div>
    <p class="cover-en">HGRS SHORTFORM STUDIO</p>
    <h1>해그로시 숏폼 스튜디오<br><span>소개서</span></h1>
    <p class="cover-sub">인플루언서 시딩부터 구매 전환 숏폼까지,<br><b>따로 발주하시던 두 가지를 한 라인으로 만들어 드립니다.</b></p>
  </div>
  <div class="cover-strip">
${["riiid-momcafe", "moen-shampoo-ppl", "zeroblock-interview", "bone-w40s", "seeding-patty"].map((s) => `<img src="${asset(`/portfolio/clips/${s}.jpg`)}" alt="">`).join("")}
  </div>
  <div class="cover-foot">
    <div class="cover-stats">
      <div><strong>30+</strong><span>브랜드 프로젝트 수행</span></div>
      <div><strong>3억대</strong><span>연 거래액</span></div>
      <div><strong>₩2,000만</strong><span>평균 프로젝트 단가</span></div>
    </div>
    <p class="cover-org">${COMPANY.name} · ${SERVICE.url.replace("https://", "")}</p>
  </div>
</div>`,
    { dark: true, bare: true },
  ),
);

// 02 — 인사말
pages.push(
  page(`
${head("Greeting", "매출로 이어지는 숏폼을 만들어 드립니다")}

<div class="greet">
  <div class="greet-mark">
    <span class="dot dot-indigo"></span>
    <span class="dot dot-gold"></span>
  </div>
  <p class="greet-lead">해그로시는 브랜드 전략과 그로스 마케팅, 광고 컨텐츠와<br>영상 프로덕션을 함께 수행해 온 <b>프로젝트 집단</b>입니다.</p>
</div>

<div class="greet-grid">
${[
  ["무엇을 바로잡습니까", "단순 납품 · 단순 AI · 마케팅 없는 기획 · 서사 없는 저감도"],
  ["무엇을 기준으로 합니까", "조회수가 아니라 세일즈 · 매출 · 전환율"],
  ["무엇을 대신해 드립니까", "컨텐츠 가이드라인 작성과 소스컷 확보 전 과정"],
]
  .map(
    ([q, a], i) => `<div class="gq">
  <span class="gq-no">0${i + 1}</span>
  <p class="gq-q">${q}</p>
  <p class="gq-a">${a}</p>
</div>`,
  )
  .join("")}
</div>

<div class="greet-sign">
  <p>브랜드의 매출 사이클을 함께 돌려 온 팀이<br><b>편수 단위로 붙어 드립니다.</b></p>
  <span>${SERVICE.name}</span>
</div>`),
);

// 03 — 시장 구조
pages.push(
  page(`
${head("Market", "지금 이렇게 따로 발주하고 계신가요?", "인플루언서 시딩과 구매 전환형 광고 컨텐츠를 서로 다른 곳에 맡기면, 사이에 남는 일은 아무도 하지 않습니다.")}

<div class="split">
  <div class="split-side">
    <div class="circle circle-indigo"><span>인플루언서<br>시딩</span></div>
    <p class="split-t">A사에 발주</p>
    <ul class="split-l"><li>채널 배포</li><li>소스컷 일부</li></ul>
  </div>

  <div class="split-gap">
    <p class="gap-label">아무도 하지 않는 구간</p>
    <ul class="gap-list"><li>컨텐츠 가이드라인</li><li>필요한 컷 설계</li><li>전환 소재 연결</li></ul>
  </div>

  <div class="split-side">
    <div class="circle circle-gold"><span>광고 숏폼<br>제작</span></div>
    <p class="split-t">B사에 발주</p>
    <ul class="split-l"><li>받은 소스로 편집</li><li>마케팅 의도 부재</li></ul>
  </div>
</div>

<p class="verdict">각 잡은 채널 협업이 아닌 이상 시딩에 남는 건 <b>소스컷과 약간의 바이럴</b>입니다.<br>그 소스를 <b>전환 소재로 잇는 일</b>이 비어 있습니다.</p>`),
);

// 04 — 해그로시 포지션
pages.push(
  page(`
${head("Position", "해그로시는 그 사이를 메웁니다", "두 발주를 하나로 묶으면, 가이드라인을 쓴 팀이 소스컷을 뽑고 그 소스로 전환 소재까지 만들어 드립니다.")}

<div class="venn">
  <div class="venn-c venn-a"><span>인플루언서<br>시딩</span></div>
  <div class="venn-c venn-b"><span>광고 숏폼<br>기획제작</span></div>
  <div class="venn-mid"><strong>해그로시</strong><span>숏폼 스튜디오</span></div>
</div>

<div class="pos-row">
${[
  ["가이드라인부터", "무엇을 왜 찍을지 먼저 정합니다"],
  ["필요한 컷만", "광고에 쓸 컷을 설계해 확보합니다"],
  ["전환까지 연결", "그 소스로 구매 전환 소재를 만듭니다"],
]
  .map(([t, d]) => `<div class="pos"><p class="pos-t">${t}</p><p class="pos-d">${d}</p></div>`)
  .join("")}
</div>

<div class="one-line">
  <p class="one-t">시딩과 숏폼을 한 팀이 맡습니다</p>
  <p class="one-d">가이드라인 · 소스컷 · 전환 소재가 같은 기준 위에서 만들어집니다.</p>
</div>`),
);

// 05 — 진행 라인
pages.push(
  page(`
${head("Line", "한 라인으로 이어 드립니다")}

<div class="chain">
${[
  ["01", "컨텐츠 가이드라인", "필요한 컷이 여기서 정해집니다"],
  ["02", "인플루언서 시딩", "배포와 소스컷을 동시에 확보합니다"],
  ["03", "소스컷 회수", "원본에서 광고용 컷을 다시 뽑습니다"],
  ["04", "전환형 숏폼", "광고 계정에 바로 태울 소재로 만듭니다"],
]
  .map(
    ([n, t, d], i, a) => `<div class="chain-node">
  <span class="chain-no">${n}</span>
  <p class="chain-t">${t}</p>
  <p class="chain-d">${d}</p>
</div>${i < a.length - 1 ? '<div class="chain-arrow">▶</div>' : ""}`,
  )
  .join("")}
</div>

<div class="outcome">
${[
  ["바이럴 도달", "실제 채널 배포"],
  ["소스 자산", "회수한 광고용 컷"],
  ["전환 소재", "계정에 태우는 숏폼"],
]
  .map(([t, d]) => `<div><p class="oc-t">${t}</p><p class="oc-d">${d}</p></div>`)
  .join("")}
</div>

<div class="one-line">
  <p class="one-t">한 번의 발주 · 하나의 담당 · 하나의 대시보드</p>
  <p class="one-d">넘길 때마다 처음부터 다시 설명하실 일이 없습니다.</p>
</div>`),
);

// 06 — 효과
pages.push(
  page(`
${head("Impact", "묶으면 이렇게 달라집니다")}

<div class="impact">
${[
  ["매출을 늘려 드립니다", "챔피언 소재 몇 종으로 스케일업합니다. 이긴 소재에 예산을 몰고 파생본을 이어 갑니다."],
  ["광고 운영이 쉬워집니다", "소재가 마르지 않으니, 예산을 올릴 때 CPA가 먼저 오르지 않습니다."],
  ["잡무가 사라집니다", "크리에이터 선정 · 가이드라인 · 배송 · 소스컷 회수까지 대신해 드립니다."],
  ["피드백이 빨라집니다", "대시보드에서 단계를 보시고 수정을 일괄로 넘기십니다."],
]
  .map(
    ([t, d], i) => `<div class="imp">
  <span class="imp-no">0${i + 1}</span>
  <p class="imp-t">${t}</p>
  <p class="imp-d">${d}</p>
</div>`,
  )
  .join("")}
</div>`),
);

// 07 — 누가 만드나
pages.push(
  page(`
${head("Crew", "이런 분들이 직접 만듭니다")}

<div class="creds">
${CREDENTIALS.map((c) => `<span class="cred">${c}</span>`).join("")}
</div>

<div class="crew">
${Array.from({ length: 8 }, (_, i) => `<img src="${asset(`/portfolio/crew/crew-0${i + 1}.webp`)}" alt="">`).join("")}
</div>

<div class="crew-foot">
  <p><b>스톡 이미지가 아닙니다.</b><br>브랜드 현장과 촬영 현장에서 저희 팀이 직접 찍은 사진입니다.</p>
  <div class="crew-stats">
    <div><strong>10</strong><span>컨텐츠 스케일업 팀</span></div>
    <div><strong>30+</strong><span>브랜드 프로젝트</span></div>
  </div>
</div>`),
);

// 08 — 역할 · 디렉터
pages.push(
  page(`
${head("Team", "숏폼 한 편에 이 역할이 붙습니다")}

<div class="roles">
${ROLES.map(
  ([t, d]) => `<div class="role"><p class="role-t">${t}</p><p class="role-d">${d}</p></div>`,
).join("")}
</div>

<div class="director">
  <div>
    <p class="dir-k">디렉터</p>
    <p class="dir-t">직접 태워 본 사람이 소재를 설계합니다</p>
    <p class="dir-d">대행이 아니라 계정 안에서 배웠습니다. 무엇이 지출을 이어가게 하는지를 기준으로 기획합니다.</p>
  </div>
  <div class="dir-fig">
    <strong>100억</strong>
    <span>디렉터 개인의<br>누적 광고 집행 경험</span>
  </div>
</div>

<div class="ai-note">
  <p class="ai-t">AI는 수단으로만 씁니다</p>
  <p class="ai-d">손이 많이 가는 분석 구간에만 활용하고, 마케팅 의도의 반영은 담당자가 감도 있게 핸들링합니다.</p>
</div>`),
);

// 09 — 성과 사례
pages.push(
  page(`
${head("Results", "성과로 말씀드립니다", "아래는 소재 제작을 포함한 프로젝트 수행 결과입니다. 이 패키지는 같은 제작 시스템을 사용합니다.")}

<div class="cases">
${CASES.map(
  (c) => `<div class="case">
  <div class="case-head">
    <span class="case-no">${c.no}</span>
    <div>
      <p class="case-brand">${esc(c.brand)}</p>
      <p class="case-scale">${esc(c.scale)}</p>
    </div>
  </div>
  <div class="case-stats">${c.stats.map(([v, l]) => `<div><strong>${v}</strong><span>${l}</span></div>`).join("")}</div>
  <p class="case-role">${esc(c.role)}</p>
</div>`,
).join("")}
</div>

<p class="foot-note">${esc(POLICY.noGuarantee)}</p>`),
);

// 10 — 클라이언트
pages.push(
  page(`
${head("Clients", "이런 브랜드와 함께했습니다", "커머스부터 서비스, 플랫폼까지 30여 브랜드의 그로스·컨텐츠 프로젝트를 수행했습니다.")}
<div class="logos">
${CLIENTS.map((c) => `<div><img src="${asset(`/logos/${c}.png`)}" alt=""></div>`).join("")}
</div>`),
);

// 11 — 진행 흐름
pages.push(
  page(`
${head("Process", "이렇게 진행해 드립니다")}
<div class="flow">
${FLOW.map(
  ([n, t, d]) => `<div class="flow-row">
  <span class="flow-no">${n}</span>
  <div><p class="flow-t">${esc(t)}</p><p class="flow-d">${esc(d)}</p></div>
</div>`,
).join("")}
</div>`),
);

// 12 — 제작 시스템
pages.push(
  page(`
${head("System", "이 퀄리티가 가능한 이유입니다", "브랜드 프로젝트 안에서 반복 검증한 위너 소재 제작 시스템만 잘라내, 편수 단위로 결제하실 수 있게 열었습니다.")}
<div class="sys">
${SYSTEM.map(
  ([t, d], i) => `<div class="sys-row"><span class="sys-no">${i + 1}</span><div><p class="sys-t">${esc(t)}</p><p>${esc(d)}</p></div></div>`,
).join("")}
</div>

<div class="cards-3">
  <div class="card"><p class="card-t">기준</p><p>조회수가 아니라 구매 전환. 훅 유지율 · CPA · ROAS로 판독합니다.</p></div>
  <div class="card"><p class="card-t">사이클</p><p>기획 → 제작 → 판독 → 변주. 프로젝트에서 수십 회 반복한 순서입니다.</p></div>
  <div class="card"><p class="card-t">구조</p><p>담당이 나뉘어 붙습니다. 한 명이 빠져도 일정이 멈추지 않습니다.</p></div>
</div>`),
);

// 13 — 포트폴리오
pages.push(
  page(`
${head("Portfolio", "최근 작업한 소재입니다", "기획과 서사, 마케팅과 세일즈를 아는 팀이 만드는 광고형 숏폼입니다.")}
<div class="wall">
${WALL.map((s) => `<img src="${asset(`/portfolio/clips/${s}.jpg`)}" alt="">`).join("")}
</div>`),
);

// 14 — 플랜
pages.push(
  page(`
${head("Plans", "플랜과 금액을 안내드립니다", "싱글과 패키지는 함께 구매하는 구성이 아닙니다. 둘 중 하나를 고르시면 됩니다.")}

<h3>싱글 · 숏폼 기획제작</h3>
<p class="tbl-lead">브랜드가 보유한 소스(촬영본 · UGC · 제품컷)로 바로 시작합니다.</p>
<table class="tbl"><thead><tr><th>구성</th><th>내역</th><th>금액</th></tr></thead><tbody>${planRows(singles, "single")}</tbody></table>

<h3>패키지 · 숏폼 + 인플루언서 시딩</h3>
<p class="tbl-lead">찍을 소스부터 없으실 때, 소스컷 확보까지 함께 진행합니다.</p>
<table class="tbl"><thead><tr><th>구성</th><th>내역</th><th>금액</th></tr></thead><tbody>${planRows(packages, "package")}</tbody></table>

<div class="seeding-box">
  <p class="card-t">패키지에 포함된 인플루언서 시딩 단가</p>
  <div class="seeding-row">
${packages
  .map(
    (p) => `<div><span>${esc(p.label.replace(" 패키지", ""))} · ${p.influencerCount}명</span><strong>${formatKRW(p.seedingPrice ?? 0)}</strong></div>`,
  )
  .join("")}
  </div>
</div>

<p class="vat">※ 부가세 별도 · ${esc(POLICY.seedingBundleOnly)}</p>`),
);

// 15 — 진행 단계
pages.push(
  page(`
${head("Dashboard", "진행 단계를 실시간으로 보실 수 있습니다", "플랜이 적용되면 내 프로젝트 대시보드가 열립니다. 기획제작 요청 확정까지 D-7이 기준 일정입니다.")}
<div class="tracks">
  <div class="track">
    <p class="track-t">인플루언서 시딩</p>
    <p class="track-d">패키지 플랜에만 있습니다</p>
    <ol>${SEEDING_STAGES.map((s) => `<li>${esc(s.label)}</li>`).join("")}</ol>
  </div>
  <div class="track">
    <p class="track-t">숏폼 기획제작</p>
    <p class="track-d">모든 플랜에 있습니다</p>
    <ol>${SHORTS_STAGES.map((s) => `<li>${esc(s.label)}</li>`).join("")}</ol>
  </div>
</div>

<div class="cards-3">
  <div class="card"><p class="card-t">가이드라인 작성</p><p>브랜드 정보를 남겨 주시면 그대로 기획에 들어갑니다.</p></div>
  <div class="card"><p class="card-t">1차 선정 심사</p><p>후보 채널의 지표를 보고 직접 고르십니다.</p></div>
  <div class="card"><p class="card-t">검수 · 수정</p><p>편당 1회 무상 수정 후 전체 다운로드하십니다.</p></div>
</div>`),
);

// 16 — 계약
pages.push(
  page(`
${head("Contract", "계약과 결제는 이렇게 진행됩니다")}
<div class="contract">
${CONTRACT.map(
  ([n, t, d]) => `<div class="ct-row"><span class="ct-no">${n}</span><div><p class="ct-t">${esc(t)}</p><p class="ct-d">${esc(d)}</p></div></div>`,
).join("")}
</div>
<div class="pay-note">
  <p class="card-t">결제 · 세금계산서</p>
  <p><b>세금계산서 발행 후 현금(계좌이체)이 기본</b>이며, 카드 결제도 가능합니다. 발행에 필요한 사업자 정보는 확정 단계에서 요청드립니다.</p>
</div>`),
);

// 17 — 조건 · 산출물
pages.push(
  page(`
${head("Terms", "진행 조건과 산출물을 안내드립니다")}
<div class="terms">
${[
  POLICY.revisionOnce,
  POLICY.usagePeriod,
  POLICY.sourceRequired,
  POLICY.noIndividualEdit,
  POLICY.downloadExpiry,
  POLICY.singleOrPackage,
]
  .map((p) => `<div class="term">${esc(p)}</div>`)
  .join("")}
</div>

<h3>산출물 사양</h3>
<div class="kv">
  <div><dt>영상 비율</dt><dd>9:16 세로형 기본 · 요청 시 1:1 정사각 파생</dd></div>
  <div><dt>납품 형식</dt><dd>MP4 (H.264) · 광고 계정 업로드 가능 사양</dd></div>
  <div><dt>전달 방식</dt><dd>프로젝트 폴더 하나로 전체 다운로드</dd></div>
  <div><dt>인플루언서 결과물</dt><dd>배포 채널 링크 및 인플루언서 편집본</dd></div>
</div>`),
);

// 18 — 후기
pages.push(
  page(`
${head("Reviews", "실제 클라이언트 후기입니다", "평균 2천만원(최소 5백 ~ 최대 2억) 규모 프로젝트를 진행하며 받은 후기입니다.")}
<div class="reviews">
${REVIEWS.map(
  ([t, who]) => `<div class="rv"><p>“${esc(t)}”</p><span>${esc(who)}</span></div>`,
).join("")}
</div>`),
);

// 19 — 문의처
pages.push(
  page(
    `<div class="cover end">
  <div>
    <p class="cover-en">CONTACT</p>
    <h1>다음 달 광고 소재,<br>함께 준비해 <span>드릴까요?</span></h1>
    <p class="cover-sub">브랜드 상황을 남겨 주시면 구성과 금액을 정리해 회신드립니다.</p>
  </div>

  <div class="contact-grid">
    <div><p class="ck">플랜 신청 · 내 프로젝트</p><p class="cv">${SERVICE.url.replace("https://", "")}</p></div>
    <div><p class="ck">문의 메일</p><p class="cv">ceo@h-grs.com</p></div>
    <div><p class="ck">브랜드 단위 프로젝트</p><p class="cv">${SERVICE.parentUrl.replace("https://", "")}/partnership</p></div>
    <div><p class="ck">응대 시간</p><p class="cv">평일 10:00 – 19:00</p></div>
  </div>

  <div class="cover-foot">
    <p class="cover-org">${COMPANY.name} · 사업자등록번호 ${COMPANY.bizRegNumber}<br>${COMPANY.address}</p>
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

@page{size:A4;margin:0}
/* #pg7 처럼 지목하면 그 장만 띄운다 — 조판 확인용. 인쇄에는 영향 없다 */
body:has(.page:target) .page:not(:target){display:none}

:root{
  --indigo:#4d5fe8; --indigo-deep:#3948b8; --indigo-tint:#eceefb;
  --gold:#b89b8d; --gold-deep:#8e6b68; --gold-tint:#f6efeb;
  --ink:#030303; --muted:#595959; --line:#e6e6e6; --alt:#f7f5f3; --night:#0a0a0c;
}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Pyeojin,-apple-system,sans-serif;color:var(--ink);-webkit-print-color-adjust:exact;print-color-adjust:exact}

.page{width:210mm;height:297mm;padding:20mm 18mm 14mm;position:relative;page-break-after:always;overflow:hidden;background:#fff}
.page:last-child{page-break-after:auto}
.page.dark{background:var(--night);color:#fff}
.page-body{height:100%}
.page-foot{position:absolute;left:18mm;right:18mm;bottom:9mm;display:flex;justify-content:space-between;font-size:7.5pt;color:#9a9a9a;border-top:1px solid #ececec;padding-top:3mm}

.eyebrow{font-size:8pt;letter-spacing:.16em;text-transform:uppercase;color:var(--gold-deep);font-weight:700}
h1{font-size:31pt;line-height:1.3;font-weight:700;letter-spacing:-.02em}
h1 span{color:var(--indigo)}
h2{font-size:20pt;line-height:1.35;font-weight:700;margin-top:3mm;letter-spacing:-.01em}
h3{font-size:11pt;font-weight:700;margin-top:9mm;margin-bottom:2.5mm}
.lead{font-size:9.5pt;line-height:1.85;color:var(--muted);margin-top:4mm;max-width:152mm}
.foot-note{font-size:7.5pt;line-height:1.8;color:#8a8a8a;margin-top:6mm}

/* 표지 · 마지막 */
.cover{height:100%;display:flex;flex-direction:column;justify-content:space-between}
.cover-en{font-size:8pt;letter-spacing:.3em;color:var(--gold);font-weight:700;margin-bottom:9mm}
.cover-sub{font-size:11pt;line-height:1.9;color:rgba(255,255,255,.6);margin-top:8mm}
.cover-sub b{color:#fff;font-weight:700}
.cover-strip{display:grid;grid-template-columns:repeat(5,1fr);gap:3mm}
.cover-strip img{width:100%;height:56mm;object-fit:cover;border-radius:2mm}
.cover-foot{border-top:1px solid rgba(255,255,255,.16);padding-top:7mm}
.cover-stats{display:flex;gap:14mm;margin-bottom:7mm}
.cover-stats strong{display:block;font-size:17pt;font-weight:700;color:var(--indigo)}
.cover-stats span{font-size:8pt;color:rgba(255,255,255,.55)}
.cover-org{font-size:7.5pt;color:rgba(255,255,255,.42);line-height:1.9}
.end h1{font-size:27pt}
.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:7mm}
.contact-grid>div{border-top:2px solid var(--indigo);padding-top:4mm}
.ck{font-size:8pt;color:rgba(255,255,255,.5)}
.cv{font-size:13pt;font-weight:700;margin-top:2mm}

/* 인사말 */
.greet{display:flex;gap:8mm;align-items:flex-start;margin-top:11mm;background:var(--alt);border-radius:3mm;padding:10mm}
.greet-mark{display:flex;flex-shrink:0;padding-top:2mm}
.dot{width:11mm;height:11mm;border-radius:50%}
.dot-indigo{background:var(--indigo)}
.dot-gold{background:var(--gold);margin-left:-4mm}
.greet-lead{font-size:14pt;line-height:1.75}
.greet-lead b{font-weight:700;color:var(--indigo-deep)}
.greet-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:5mm;margin-top:9mm}
.gq{border:1px solid var(--line);border-radius:3mm;padding:7mm;min-height:64mm}
.gq-no{font-size:9pt;font-weight:700;color:var(--gold)}
.gq-q{font-size:10.5pt;font-weight:700;margin-top:3mm;line-height:1.5}
.gq-a{font-size:9pt;line-height:1.85;color:var(--muted);margin-top:4mm}
.greet-sign{margin-top:9mm;background:var(--night);color:#fff;border-radius:3mm;padding:9mm;display:flex;justify-content:space-between;align-items:flex-end;gap:6mm}
.greet-sign p{font-size:12pt;line-height:1.7}
.greet-sign b{color:#8ea2ff}
.greet-sign span{font-size:8pt;color:rgba(255,255,255,.5);white-space:nowrap}

/* 시장 구조 */
.split{display:grid;grid-template-columns:1fr 46mm 1fr;gap:5mm;margin-top:18mm;align-items:start}
.split-side{text-align:center}
.circle{width:58mm;height:58mm;border-radius:50%;margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:11pt;font-weight:700;line-height:1.5;color:#fff}
.circle-indigo{background:var(--indigo)}
.circle-gold{background:var(--gold)}
.split-t{font-size:9pt;color:#8a8a8a;margin-top:5mm}
.split-l{list-style:none;margin-top:3mm}
.split-l li{font-size:9.5pt;color:var(--muted);padding:3.2mm 0}
.split-gap{border:1.5px dashed var(--gold);border-radius:3mm;padding:9mm 5mm;text-align:center;background:var(--gold-tint);margin-top:10mm}
.gap-label{font-size:9.5pt;font-weight:700;color:var(--gold-deep)}
.gap-list{list-style:none;margin-top:3mm}
.gap-list li{font-size:9pt;color:var(--gold-deep);padding:3.4mm 0;border-top:1px solid rgba(142,107,104,.25)}
.verdict{margin-top:22mm;background:var(--night);color:#fff;border-radius:3mm;padding:16mm 10mm;font-size:13pt;line-height:1.9}
.verdict b{color:#8ea2ff}

/* 벤 다이어그램 */
.venn{position:relative;height:112mm;margin-top:11mm}
.venn-c{position:absolute;top:0;width:112mm;height:112mm;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11pt;font-weight:700;line-height:1.5;text-align:center}
.venn-a{left:6mm;background:rgba(77,95,232,.16);border:1.5px solid var(--indigo);color:var(--indigo-deep)}
.venn-a span{margin-right:40mm}
.venn-b{right:6mm;background:rgba(184,155,141,.24);border:1.5px solid var(--gold);color:var(--gold-deep)}
.venn-b span{margin-left:40mm}
.venn-mid{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center;z-index:2}
.venn-mid strong{display:block;font-size:15pt;font-weight:700}
.venn-mid span{font-size:8pt;color:var(--muted)}
.pos-row{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm;margin-top:14mm}
.pos{border-top:3px solid var(--indigo);padding-top:6mm;min-height:30mm}
.pos-t{font-size:11pt;font-weight:700}
.pos-d{font-size:8.5pt;color:var(--muted);margin-top:2.5mm;line-height:1.75}

/* 라인 */
.chain{display:grid;grid-template-columns:1fr 7mm 1fr 7mm 1fr 7mm 1fr;align-items:stretch;margin-top:10mm}
.chain-node{border:1px solid var(--line);border-top:3px solid var(--indigo);border-radius:3mm;padding:8mm 5mm;min-height:62mm}
.chain-no{font-size:8pt;font-weight:700;color:var(--indigo)}
.chain-t{font-size:10.5pt;font-weight:700;margin-top:2.5mm;line-height:1.4}
.chain-d{font-size:8pt;line-height:1.75;color:#8a8a8a;margin-top:3mm}
.chain-arrow{display:flex;align-items:center;justify-content:center;color:var(--gold);font-size:9pt}
.outcome{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm;margin-top:10mm}
.outcome>div{background:var(--gold-tint);border-radius:3mm;padding:8mm;text-align:center}
.oc-t{font-size:11pt;font-weight:700;color:var(--gold-deep)}
.oc-d{font-size:8pt;color:var(--muted);margin-top:2mm}
.one-line{margin-top:10mm;background:var(--indigo);color:#fff;border-radius:3mm;padding:10mm;text-align:center}
.one-t{font-size:14pt;font-weight:700}
.one-d{font-size:9.5pt;margin-top:2.5mm;color:rgba(255,255,255,.75)}

/* 효과 */
.impact{display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:9mm}
.imp{border:1px solid var(--line);border-radius:3mm;padding:9mm;min-height:88mm}
.imp-no{font-size:20pt;font-weight:700;color:var(--indigo-tint);line-height:1}
.imp-t{font-size:13pt;font-weight:700;margin-top:3mm;color:var(--indigo-deep)}
.imp-d{font-size:9pt;line-height:1.9;color:var(--muted);margin-top:3mm}

/* 크루 */
.creds{display:flex;flex-wrap:wrap;gap:3mm;margin-top:8mm}
.cred{font-size:9pt;font-weight:700;color:var(--indigo-deep);background:var(--indigo-tint);border-radius:99px;padding:2.6mm 6mm}
.crew{display:grid;grid-template-columns:repeat(4,1fr);gap:3.5mm;margin-top:7mm}
.crew img{width:100%;height:70mm;object-fit:cover;border-radius:2mm}
.crew-foot{display:flex;justify-content:space-between;align-items:center;gap:8mm;margin-top:9mm;border-top:1px solid var(--line);padding-top:7mm}
.crew-foot p{font-size:9.5pt;color:var(--muted);line-height:1.85}
.crew-stats{display:flex;gap:10mm;flex-shrink:0}
.crew-stats strong{display:block;font-size:17pt;font-weight:700;color:var(--indigo)}
.crew-stats span{font-size:7.5pt;color:#8a8a8a}

/* 역할 */
.roles{display:grid;grid-template-columns:repeat(3,1fr);gap:3.5mm;margin-top:8mm}
.role{border:1px solid var(--line);border-radius:3mm;padding:6mm;min-height:28mm}
.role-t{font-size:10pt;font-weight:700}
.role-d{font-size:8pt;color:#8a8a8a;margin-top:2mm;line-height:1.7}
.director{display:grid;grid-template-columns:1fr 62mm;gap:6mm;margin-top:8mm;background:var(--night);color:#fff;border-radius:3mm;padding:10mm;align-items:center}
.dir-k{font-size:8pt;letter-spacing:.1em;color:var(--gold)}
.dir-t{font-size:14pt;font-weight:700;margin-top:2.5mm}
.dir-d{font-size:9pt;line-height:1.85;color:rgba(255,255,255,.65);margin-top:3mm}
.dir-fig{text-align:right}
.dir-fig strong{display:block;font-size:28pt;font-weight:700;color:var(--indigo);letter-spacing:-.02em}
.dir-fig span{font-size:7.5pt;color:rgba(255,255,255,.5);line-height:1.6;display:block;margin-top:1mm}
.ai-note{margin-top:5mm;border:1px solid var(--gold);background:var(--gold-tint);border-radius:3mm;padding:8mm}
.ai-t{font-size:11pt;font-weight:700;color:var(--gold-deep)}
.ai-d{font-size:9pt;line-height:1.85;color:var(--muted);margin-top:2mm}

/* 사례 */
.cases{display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:8mm}
.case{border:1px solid var(--line);border-radius:3mm;padding:8mm;min-height:84mm;display:flex;flex-direction:column}
.case-head{display:flex;gap:4mm;align-items:flex-start}
.case-no{font-size:8pt;font-weight:700;color:#fff;background:var(--indigo);border-radius:50%;width:8mm;height:8mm;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.case-brand{font-size:12pt;font-weight:700;line-height:1.4}
.case-scale{font-size:8pt;color:#8a8a8a;margin-top:1mm}
.case-stats{display:flex;gap:8mm;margin-top:auto;padding-top:6mm}
.case-stats strong{display:block;font-size:15pt;font-weight:700;color:var(--indigo-deep)}
.case-stats span{font-size:7.5pt;color:#8a8a8a}
.case-role{font-size:7.5pt;color:#9a9a9a;margin-top:5mm;border-top:1px solid #f0f0f0;padding-top:3.5mm}

/* 로고 */
.logos{display:grid;grid-template-columns:repeat(5,1fr);gap:5mm;margin-top:9mm}
.logos div{height:27mm;border:1px solid #eee;border-radius:2mm;display:flex;align-items:center;justify-content:center;padding:4mm}
.logos img{max-width:100%;max-height:100%;object-fit:contain;filter:grayscale(1);opacity:.72}

/* 흐름 */
.flow{margin-top:8mm}
.flow-row{display:flex;gap:7mm;padding:7mm 0;border-bottom:1px solid #f0f0f0}
.flow-no{font-size:13pt;font-weight:700;color:var(--indigo);width:11mm;flex-shrink:0}
.flow-t{font-size:11pt;font-weight:700}
.flow-d{font-size:8.5pt;line-height:1.8;color:var(--muted);margin-top:1.5mm}

/* 시스템 */
.sys{margin-top:6mm}
.sys-row{display:flex;gap:5mm;padding:6mm 0;border-bottom:1px solid #f0f0f0;font-size:9pt;line-height:1.85;color:var(--muted)}
.sys-no{width:7mm;flex-shrink:0;font-size:11pt;font-weight:700;color:var(--indigo)}
.sys-t{font-size:10.5pt;font-weight:700;color:var(--ink);margin-bottom:1.5mm}
.cards-3{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm;margin-top:7mm}
.card{border:1px solid var(--line);border-radius:3mm;padding:7mm;font-size:8.5pt;line-height:1.85;color:var(--muted);min-height:44mm}
.card-t{font-size:10pt;font-weight:700;color:var(--ink);margin-bottom:2.5mm}

/* 포트폴리오 */
.wall{display:grid;grid-template-columns:repeat(4,1fr);gap:3.5mm;margin-top:8mm}
.wall img{width:100%;height:62mm;object-fit:cover;border-radius:2mm;background:#f2f2f2}

/* 플랜 표 */
.tbl-lead{font-size:8.5pt;color:#8a8a8a;line-height:1.7;margin-bottom:3mm}
.tbl{width:100%;border-collapse:collapse;font-size:9pt}
.tbl th{text-align:left;font-size:7.5pt;font-weight:400;color:#9a9a9a;border-bottom:1px solid #d8d8d8;padding-bottom:2mm}
.tbl th:last-child{text-align:right}
.tbl td{padding:3.6mm 0;border-bottom:1px solid #f0f0f0;vertical-align:top}
.t-name{font-weight:700;white-space:nowrap;width:36mm}
.t-desc{font-size:8pt;color:#8a8a8a}
.t-price{text-align:right;font-weight:700;white-space:nowrap}
.t-price span{display:block;font-size:7.5pt;font-weight:400;color:#9a9a9a;margin-top:.6mm}
.seeding-box{border:1px solid var(--indigo);background:rgba(77,95,232,.05);border-radius:3mm;padding:7mm;margin-top:8mm}
.seeding-row{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm;margin-top:3mm}
.seeding-row div{font-size:8pt;color:#8a8a8a}
.seeding-row strong{display:block;font-size:12pt;color:var(--indigo-deep);margin-top:1mm}
.vat{font-size:8pt;color:#8a8a8a;margin-top:5mm}

/* 단계 */
.tracks{display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:7mm}
.track{border:1px solid var(--line);border-radius:3mm;padding:7mm}
.track-t{font-size:11pt;font-weight:700}
.track-d{font-size:8pt;color:#8a8a8a;margin-top:1.5mm}
.track ol{list-style:none;counter-reset:s;margin-top:3mm}
.track li{counter-increment:s;font-size:9.5pt;padding:4mm 0;border-top:1px solid #f2f2f2;display:flex;gap:4mm}
.track li::before{content:counter(s);color:var(--indigo);font-weight:700;width:5mm}

/* 계약 */
.contract{margin-top:7mm}
.ct-row{display:flex;gap:5mm;padding:4.6mm 0;border-bottom:1px solid #f2f2f2}
.ct-no{font-size:10pt;font-weight:700;color:var(--indigo);width:9mm;flex-shrink:0}
.ct-t{font-size:10.5pt;font-weight:700}
.ct-d{font-size:8.5pt;line-height:1.75;color:var(--muted);margin-top:1.2mm}
.pay-note{border:1px solid var(--indigo);background:rgba(77,95,232,.05);border-radius:3mm;padding:8mm;margin-top:8mm;font-size:9pt;line-height:1.85;color:var(--muted)}
.pay-note b{color:var(--ink)}

/* 조건 */
.terms{display:grid;grid-template-columns:1fr 1fr;gap:4mm;margin-top:8mm}
.term{border-left:3px solid var(--gold);background:var(--alt);border-radius:0 2mm 2mm 0;padding:7mm;font-size:9pt;line-height:1.8;color:var(--muted);min-height:30mm}
.kv{margin-top:4mm;border-top:1px solid var(--line)}
.kv>div{display:flex;gap:8mm;padding:4.6mm 0;border-bottom:1px solid #f0f0f0;font-size:9pt}
.kv dt{width:38mm;flex-shrink:0;color:#8a8a8a}
.kv dd{line-height:1.7}

/* 후기 */
.reviews{display:grid;grid-template-columns:1fr 1fr;gap:4mm;margin-top:8mm;grid-auto-rows:1fr}
.rv{border:1px solid var(--line);border-radius:3mm;padding:7mm;display:flex;flex-direction:column}
.rv p{font-size:9.5pt;line-height:1.9}
.rv span{display:block;font-size:7.5pt;color:#8a8a8a;margin-top:auto;padding-top:5mm;border-top:2px solid var(--gold);align-self:flex-start}
</style></head>
<body>
${pages.join("\n")}
</body></html>`;

const out = resolve(ROOT, "docs/deck/소개서.html");
writeFileSync(out, html, "utf-8");
console.log(`생성: ${out} (${pages.length}페이지)`);
