/**
 * 소개서(PDF) 생성기.
 *
 * 플랜 문의가 들어오면 메일로 첨부해 보내는 **회사·서비스 소개서**다.
 * 홈페이지에 있는 내용을 문서로 옮기고, 홈페이지에 없는 것(계약·결제 절차,
 * 회사 개요, 산출물 사양)을 더한다.
 *
 * 가격·단계·정책 문구는 **직접 쓰지 않고 `lib/`에서 읽는다.** 소개서는 한 번 만들면
 * 손을 안 대는 문서라, 하드코딩해 두면 사이트만 고치고 소개서는 옛 가격을 들고
 * 돌아다니게 된다. 값이 바뀌면 이 스크립트를 다시 돌리기만 하면 된다.
 *
 *   npm run deck        # HTML 생성 + Chrome 헤드리스로 PDF 인쇄
 *
 * 지어낸 숫자를 넣지 않는다. 홈페이지에서 검증된 수치와 법인 등기 정보만 쓴다.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { PLANS, POLICY, COMPANY, SERVICE, formatKRW } from "@/lib/constants";
import { SEEDING_STAGES, SHORTS_STAGES } from "@/lib/stages";

const ROOT = resolve(import.meta.dirname, "..");

/**
 * 자산 주소. 기본은 로컬 정적 서버(`scripts/deck.sh`가 띄운다) —
 * file:// 로 걸면 브라우저에서 열어 확인할 수가 없어 조판을 눈으로 못 본다.
 */
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
    line: "3주 연속 고지출 & CPA 단가 견인 소재",
    note: "풀 프로젝트 수행 성과 (소재 제작 + 캠페인 운영)",
    stats: [["3주", "연속 고지출"], ["1위", "CPA 단가"]],
  },
  {
    no: "02",
    brand: "파크론 제로블럭",
    scale: "매출 200억대",
    line: "메타 캠페인 예산 5배 증액, CPA 9만원 절감 소재 중 일부",
    note: "풀 프로젝트 수행 성과",
    stats: [["5배", "메타 예산 증액"], ["9만원", "CPA 절감"]],
  },
  {
    no: "03",
    brand: "이노바인코리아 모에브",
    scale: "매출 300억대",
    line: "제품 출시 고투마켓 단계 소재 부스팅",
    note: "풀 프로젝트 수행 성과",
    stats: [["₩4,000만", "3개월 매출"], ["3배", "ROAS"]],
  },
  {
    no: "04",
    brand: "크래프톤 배틀그라운드",
    scale: "글로벌",
    line: "대표이사 컨텐츠부터 협찬 연예인까지 바이럴 쇼츠 기획·제작",
    note: "연간 공식 프로젝트 수행",
    stats: [],
  },
];

const FLOW = [
  ["01", "브랜드 AI 기본 분석", "상세페이지 URL만 주시면 타겟·USP·객단가·금지 표현을 구조화해 초안을 잡습니다."],
  ["02", "컨텐츠 가이드라인 세부 기획", "편별로 포맷과 후킹을 갈라 편성합니다. 무엇을 왜 그렇게 찍을지가 여기서 정해집니다."],
  ["03", "인플루언서 시딩 & 바이럴", "브랜드에 맞는 크리에이터를 골라 붙이고 리뷰를 실제 채널에 배포합니다."],
  ["04", "2차 활용 소스 컷 확보", "배포로 끝내지 않고 원본에서 광고용 컷을 다시 뽑아 자산으로 남깁니다."],
  ["05", "매출형 숏폼 기획제작", "확보한 소스로 구매 전환형 숏폼을 만들어 광고 계정에 바로 태웁니다."],
  ["06", "검수 · 납품", "미리보기로 확인하고 1회 무상 수정을 거쳐 최종본을 그대로 내려받습니다."],
];

const SYSTEM = [
  ["위너 기준이 먼저 정의됩니다", "조회수가 아니라 구매 전환이 기준입니다. 소재별로 훅 유지율·CPA·ROAS를 판독하고, 지출이 꺾이지 않고 이어지는 소재만 ‘위너’로 분류해 변주합니다."],
  ["프로젝트에서 굴리던 사이클 그대로", "기획 → 제작 → 집행 데이터 판독 → 변주 제작으로 이어지는 사이클을 프로젝트 단위에서 수십 회 반복해 왔습니다. 이 패키지는 그 사이클 중 ‘기획 → 제작’ 구간을 상품화한 것입니다."],
  ["역할이 분업된 팀이 붙습니다", "기획·촬영·편집·모션·퍼포먼스 판독이 각자 담당으로 붙는 10인 팀 시스템입니다. 한 명의 프리랜서가 아니라, 담당이 빠져도 멈추지 않는 구조로 납품합니다."],
];

const ROLES = [
  ["CD", "숏폼 기획", "블랭크 코퍼레이션 출신"],
  ["CM", "커머스 컨텐츠 기획", "대형 라이브커머스 종합몰 컨텐츠 담당 출신"],
  ["PF", "퍼포먼스 미디어바이어", "구글·메타 코리아 우수 크리에이티브 리얼클래스 출신"],
  ["DP", "촬영", "현장 디렉팅·촬영"],
  ["ED", "편집", "컷 편집·리텐션 설계"],
  ["SE", "숏폼 에디터", "변주본·A/B 파생"],
  ["MG", "모션 디자이너", "자막·모션 그래픽"],
  ["CW", "카피라이터", "훅 카피·CTA 문구"],
  ["PM", "시딩 · 제작 PM", "일정·산출물 관리"],
];

/** 계약·결제 절차 — 홈페이지에 없던 내용. 소개서에서 처음 정리한다 */
const CONTRACT = [
  ["01", "플랜 문의", "홈페이지 신청 폼 또는 메일로 브랜드 상황을 남겨 주십니다. 컨텐츠 진단(5문항)을 함께 마치시면 구성 제안이 더 정확해집니다."],
  ["02", "소개서 · 구성 안내", "브랜드 상황에 맞는 구성과 편수별 금액을 정리해 이메일로 회신드립니다. 조정이 필요하면 이 단계에서 맞춥니다."],
  ["03", "구성 확정", "편수·시딩 인원·일정을 확정합니다. 확정된 내용은 견적서로 정리해 드립니다."],
  ["04", "결제", "세금계산서 발행 후 현금(계좌이체)이 기본이며, 카드 결제도 가능합니다. 금액은 모두 부가세 별도 기준입니다."],
  ["05", "계정 개설 · 프로젝트 시작", "담당자가 플랜을 적용하면 내 프로젝트에서 진행 단계가 열립니다. 시작 안내 메일이 자동 발송됩니다."],
  ["06", "컨텐츠 가이드라인 제출", "브랜드 소개·타겟·USP·금지 표현 등을 작성해 주십니다. 기획제작 요청 확정까지 D-7이 기준 일정입니다."],
  ["07", "진행 · 검수", "단계별 진행 상황을 대시보드에서 확인하시고, 1차 완성본에 대해 편당 1회 무상 수정을 요청하실 수 있습니다."],
  ["08", "납품", "최종본은 프로젝트 폴더 하나로 전체 다운로드하십니다. 인플루언서 배포 결과물도 같은 화면에서 확인하십니다."],
];

const FAQ = [
  ["인플루언서 선정 및 결과는 어디서 확인하나요?", "내 프로젝트 대시보드에서 후보 채널의 팔로워·컨텐츠수·평균 조회/좋아요/댓글과 CPV를 보고 직접 선택하실 수 있습니다. 배포 결과도 같은 화면에서 확인하십니다."],
  ["인플루언서 컨텐츠를 확정 전에 수정 요청할 수 있나요?", "사전 제출된 컨텐츠 가이드라인 기준으로 최저가에 소스컷 확보를 목표하므로, 완성본 단계에서 확인 가능합니다."],
  ["배포되면 바로 광고 숏폼 기획제작이 들어가나요?", "네. 소스컷 확보 및 바이럴 배포로부터 약 7일 내외로 숏폼 컨텐츠가 지속적으로 공유됩니다."],
  ["소스컷을 따로 받을 수 있나요?", "모두 대시보드에서 다운로드 가능하되, 별도의 소스컷이 아닌 인플루언서 편집본을 받아보실 수 있습니다."],
  ["숏폼 기획제작은 어떤 전문가가 하나요?", "블랭크 코퍼레이션 출신, 대형 라이브커머스 종합몰 컨텐츠 담당자 출신 등 소재와 마케팅 사이클을 함께 운영해 본 제작자들이 진행합니다."],
  ["기존 프로젝트와 이 패키지는 어떻게 다른가요?", "해그로시는 브랜드 하나를 맡아 기획부터 소재 제작, 캠페인 운영까지 수행하는 프로젝트 팀입니다(평균 프로젝트 단가 2,000만원대). 이 패키지는 그 프로젝트에서 검증된 소재 제작 시스템만 편수 단위로 잘라 연 것으로, 제작 품질과 팀 구성은 동일합니다."],
  ["결제는 어떻게 하나요?", "세금계산서 발행 후 현금(계좌이체)이 기본이며, 카드 결제도 가능합니다."],
  ["소재의 광고 사용 기간에 제한이 있나요?", "인플루언서 출연 컷이 포함된 소재는 다운로드일로부터 5개월간 광고에 사용하실 수 있습니다. 출연자가 없는 소재는 기간 제한이 없습니다."],
];

const REVIEWS = [
  ["3년 내 최고 ROAS 달성했고, 가입 단가 CPA도 40% 절감했어요.", "G 대기업 실장"],
  ["조직이 고민하던 KPI 지표를 홀로 600% 달성. 오가닉 매출 2배 증대, 구매전환율 10%P 개선.", "Y 상담 스타트업 대표"],
  ["월에 3백 쓰며 시작한 신규 브랜드 라인을 통으로 맡겼는데 5개월 안에 2천까지 씁니다.", "M 헤어뷰티 커머스"],
  ["다음 투자 라운드 준비에 앞서 채용보다 저렴한 프로젝트 비용으로 DAU를 대폭 늘렸습니다.", "D HR 스타트업 공동대표"],
  ["온라인 광고를 멈추게 하더니 브랜드 쿼리수를 올리는 방향으로 포지셔닝을 다시 잡아 주셨고, 이제 매출도 순항중입니다.", "B 스포츠 커머스 이사"],
  ["리브랜딩부터 실질적인 마케팅까지 3개월에 끊어주시더군요.", "F 건기식 커머스 대표"],
  ["성장·성과에 대한 집념이 굉장히 강했어요. 일반 대행 대비 결코 저렴하지는 않지만, 그렇다고 절대 비싼 것도 아니었어요.", "C 서비스업 팀장"],
  ["처음에는 비싸다 싶었는데 여긴 저렴한 액셀러레이팅 집단이에요.", "예비 창업자"],
  ["MVP 검증이라는 걸 결제 기능 없이도 지표 기준만으로 이렇게 할 수 있단 걸 진즉 알았더라면.", "연쇄 창업자"],
  ["저희가 진짜 아무것도 모르고 시작했는데, 업무 범위 이상으로 정성을 다하시더라구요. SEO 확실히 잡습니다.", "W 플랫폼 공동대표"],
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
  ${opts.bare ? "" : `<footer class="page-foot"><span>${SERVICE.name}</span><span>${String(n).padStart(2, "0")}</span></footer>`}
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

// 1 — 표지
pages.push(
  page(
    `<div class="cover">
  <div>
    <p class="cover-en">HGRS SHORTFORM STUDIO</p>
    <h1>인플루언서 시딩과 채널 바이럴,<br>그리고 구매 전환형 광고 소재를<br><em>한번에</em></h1>
    <p class="cover-lead">대기업부터 스타트업까지 숏폼 부스팅 프로젝트를 수행해 온 팀이<br>검증된 소재 제작 시스템만 편수 단위로 열었습니다.</p>
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

// 2 — 대표 인사말
pages.push(
  page(`
${head("Director's Message", "왜 이 스튜디오를 열었는가")}

<div class="msg">
  <div class="msg-quote">
    <p>“단순 납품, 단순 AI,<br>마케팅을 모르는 기획,<br>서사가 없는 저감도.”</p>
    <span>지금 숏폼 시장을 바로잡기 위해 만들었습니다.</span>
  </div>
  <div class="msg-body">
    <div><p class="msg-k">해그로시는</p><p>브랜드 전략과 그로스 마케팅, 광고 컨텐츠 에이전시의 역할을 수행하면서 유튜브 영상 프로덕션 프로젝트를 동시에 수행해 온 <b>기간제 프로젝트 집단</b>입니다.</p></div>
    <div><p class="msg-k">붙는 사람</p><p>숏폼과 퍼포먼스 크리에이티브가 효과를 보기 시작한 <b>2018년경부터 그 업을 해 온 전문가 집단</b>이 그대로 투입됩니다.</p></div>
    <div><p class="msg-k">일하는 기준</p><p><b>세일즈·매출·전환율에 대한 이해</b>를 기반으로 숏폼을 기획하고 제작합니다. 시딩에 필요한 컨텐츠 가이드라인과 소스컷 확보 같은 번거로운 작업은 저희가 대신합니다.</p></div>
  </div>
</div>

<div class="sign">
  <span>해그로시 대표 디렉터</span>
  <strong>송건호</strong>
</div>`),
);

// 3 — 시장의 문제
pages.push(
  page(`
${head("Problem", "지금 시장은 이렇게 나뉘어 있습니다", "인플루언서 시딩과 구매 전환형 광고 컨텐츠를 서로 다른 곳에 따로 발주합니다. 그래서 둘 다 반쪽이 됩니다.")}

<div class="vs">
  <div class="vs-box">
    <p class="vs-tag">따로 발주 A</p>
    <p class="vs-t">인플루언서 시딩</p>
    <p class="vs-d">각 잡은 컨텐츠로 채널 협업을 하지 않는 이상, 남는 건 결국 <b>소스컷 일부와 약간의 바이럴</b>입니다.</p>
  </div>
  <div class="vs-mid">＋</div>
  <div class="vs-box">
    <p class="vs-tag">따로 발주 B</p>
    <p class="vs-t">광고 숏폼 제작</p>
    <p class="vs-d">마케팅 의도를 모르는 채 받은 소스로 만듭니다. <b>전환을 못 만드는 납품물</b>이 쌓입니다.</p>
  </div>
</div>

<div class="gaps">
${[
  ["단순 납품", "편수만 채우고 끝난다"],
  ["단순 AI", "도구가 기획을 대신한다"],
  ["마케팅 부재", "왜 그렇게 찍는지가 없다"],
  ["서사 없는 저감도", "끝까지 보게 만들지 못한다"],
]
  .map(([t, d]) => `<div><p class="gap-t">${t}</p><p class="gap-d">${d}</p></div>`)
  .join("")}
</div>

<p class="verdict">둘을 나눠 발주하는 순간, <b>가이드라인도 소스컷도 전환도 아무도 책임지지 않습니다.</b></p>`),
);

// 4 — 통합 구조
pages.push(
  page(`
${head("Solution", "그래서 하나의 라인으로 묶었습니다", "컨텐츠 가이드라인을 먼저 잡아 필요한 컷을 효율적으로 확보하고, 그 소스로 구매 전환형 숏폼 부스팅까지 이어서 진행합니다.")}

<div class="chain">
${[
  ["01", "컨텐츠 가이드라인", "무엇을 왜 찍을지 먼저 정합니다. 여기서 필요한 컷이 정해집니다."],
  ["02", "인플루언서 시딩", "가이드라인대로 배포하고, 바이럴과 소스컷을 동시에 가져옵니다."],
  ["03", "소스컷 확보", "배포로 끝내지 않고 원본에서 광고용 컷을 다시 뽑습니다."],
  ["04", "전환형 숏폼 부스팅", "확보한 소스로 구매 전환 소재를 만들어 광고 계정에 태웁니다."],
]
  .map(
    ([n, t, d], i, a) => `<div class="chain-node">
  <span class="chain-no">${n}</span>
  <p class="chain-t">${t}</p>
  <p class="chain-d">${d}</p>
</div>${i < a.length - 1 ? '<div class="chain-arrow">→</div>' : ""}`,
  )
  .join("")}
</div>

<div class="outcome">
${[
  ["바이럴 도달", "실제 채널에 배포된 리뷰"],
  ["광고용 소스 자산", "원본에서 회수한 컷"],
  ["전환 소재", "광고 계정에 바로 태우는 숏폼"],
]
  .map(([t, d]) => `<div><p class="oc-t">${t}</p><p class="oc-d">${d}</p></div>`)
  .join("")}
</div>

<div class="one-line">
  <p class="one-t">한 번의 발주 · 하나의 담당 · 하나의 대시보드</p>
  <p class="one-d">가이드라인을 쓴 사람이 소스컷을 뽑고, 그 소스로 숏폼을 만듭니다. 넘길 때마다 새로 설명할 일이 없습니다.</p>
</div>`),
);

// 5 — 클라이언트가 얻는 것
pages.push(
  page(`
${head("Impact", "묶으면 이렇게 달라집니다")}

<div class="impact">
${[
  ["챔피언 소재", "몇 종의 위너 소재로 매출이 스케일업됩니다. 이긴 소재에 예산을 몰고 파생본을 계속 갈아 끼웁니다."],
  ["쉬워지는 운영", "소재가 마르지 않으니 예산을 올릴 때 CPA가 먼저 오르지 않습니다."],
  ["사라지는 잡무", "크리에이터 선정, 가이드라인 작성, 배송, 소스컷 회수까지 저희가 대신합니다."],
  ["빨라지는 피드백", "내 프로젝트 대시보드에서 진행 단계를 보고 피드백을 일괄로 넘깁니다."],
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

// 6 — 왜 해그로시인가
pages.push(
  page(`
${head("Why HGRS", "왜 해그로시여야 하는가")}

<div class="why">
  <div class="why-big">
    <strong>100억</strong>
    <span>디렉터 본인의 셀프 집행 규모</span>
    <p>대행이 아니라 직접 태워 본 사람이 소재를 설계합니다. 무엇이 지출을 이어가게 하는지 계정 안에서 배웠습니다.</p>
  </div>
  <div class="why-big">
    <strong>2018~</strong>
    <span>숏폼·퍼포먼스 크리에이티브 업력</span>
    <p>유행이 시작되던 시점부터 지금까지 같은 업을 해 왔습니다. 최근에 들어온 팀이 아닙니다.</p>
  </div>
</div>

<div class="why-row">
${[
  ["고연차 검증된 크루", "블랭크 코퍼레이션 출신, 대형 라이브커머스 종합몰 컨텐츠 담당 출신, 구글·메타 코리아 우수 크리에이티브 출신이 각자 담당으로 붙습니다."],
  ["AI는 수단으로만", "브랜드 분석처럼 손이 많이 가는 구간에만 씁니다. 마케팅 의도의 반영은 담당자가 감도 있게 핸들링합니다."],
  ["현업 속도에 맞춘 제작", "클라이언트의 현업 일정을 전제로 프로세스를 짰습니다. 확인과 수정이 한 화면에서 일괄로 돕니다."],
]
  .map(([t, d]) => `<div class="why-c"><p class="why-t">${t}</p><p class="why-d">${d}</p></div>`)
  .join("")}
</div>`),
);

// 7 — 회사 개요
pages.push(
  page(`
${head("About", "회사 개요", "저희는 원래 편당 단가로 소재를 파는 팀이 아니었습니다. 브랜드 하나를 맡아 기획부터 소재 제작, 캠페인 운영까지 통으로 수행해 온 프로젝트 팀입니다.")}

<div class="kv">
  <div><dt>상호</dt><dd>${COMPANY.name}</dd></div>
  <div><dt>사업자등록번호</dt><dd>${COMPANY.bizRegNumber}</dd></div>
  <div><dt>${COMPANY.addressLabel}</dt><dd>${COMPANY.address}</dd></div>
  <div><dt>서비스</dt><dd>${SERVICE.name} (${SERVICE.nameEn})</dd></div>
  <div><dt>사업 영역</dt><dd>브랜드 그로스 프로젝트 · 인플루언서 시딩 · 광고 숏폼 기획제작</dd></div>
  <div><dt>문의</dt><dd>ceo@h-grs.com</dd></div>
</div>

<h3>우리가 하는 일</h3>
<div class="cards-3">
  <div class="card"><p class="card-t">브랜드 단위 프로젝트</p><p>포지셔닝 재정의, SNS 채널 브랜드마케팅, 캠페인 설계까지 브랜드 전체를 맡습니다. 크래프톤·뤼이드·파크론과의 성과는 그 방식에서 나왔습니다.</p></div>
  <div class="card"><p class="card-t">인플루언서 시딩 · 바이럴</p><p>브랜드에 맞는 크리에이터를 골라 리뷰를 실제 채널에 배포하고, 원본에서 광고용 소스컷을 다시 확보합니다.</p></div>
  <div class="card"><p class="card-t">광고 숏폼 기획제작</p><p>구매 전환을 기준으로 소재를 기획·제작하고 변주합니다. 이 소개서가 다루는 서비스입니다.</p></div>
</div>

<h3>숫자로 보는 지금</h3>
<div class="stats-row">
  <div><strong>30+</strong><span>브랜드 그로스·컨텐츠 프로젝트<br><i>소재만 만든 게 아니라 매출 사이클을 함께 돌린 횟수입니다.</i></span></div>
  <div><strong>10</strong><span>컨텐츠 스케일업 팀<br><i>업종·마케팅 이해도가 높은 팀원들이 붙습니다.</i></span></div>
  <div><strong>₩2,000만+</strong><span>평균 프로젝트 단가<br><i>브랜드 업무를 하던 역량이 그대로 투입됩니다.</i></span></div>
</div>`),
);

// 3 — 클라이언트
pages.push(
  page(`
${head("Clients", "함께한 클라이언트", "커머스부터 서비스, 플랫폼까지 30여 브랜드의 그로스·컨텐츠 프로젝트를 수행했습니다.")}
<div class="logos">
${CLIENTS.map((c) => `<div><img src="${asset(`/logos/${c}.png`)}" alt=""></div>`).join("")}
</div>
<p class="foot-note">위 성과는 소재 제작을 포함한 풀 프로젝트 수행에서 나온 결과입니다. 이 패키지는 그 프로젝트의 소재 제작 시스템을 동일하게 사용합니다.</p>`),
);

// 4 — 성장 사례
pages.push(
  page(`
${head("Growth Cases", "성장 사례")}
<div class="cases">
${CASES.map(
  (c) => `<div class="case">
  <p class="case-no">Growth Case ${c.no}</p>
  <p class="case-brand">${esc(c.brand)} <span>(${esc(c.scale)})</span></p>
  <p class="case-line">${esc(c.line)}</p>
  ${
    c.stats.length
      ? `<div class="case-stats">${c.stats.map(([v, l]) => `<div><strong>${v}</strong><span>${l}</span></div>`).join("")}</div>`
      : ""
  }
  <p class="case-note">${esc(c.note)}</p>
</div>`,
).join("")}
</div>`),
);

// 5 — 서비스 흐름
pages.push(
  page(`
${head("Service", "서비스 진행 흐름", "인플루언서 시딩으로 광고에 쓸 소스컷을 확보하고, 그 소스로 구매 전환형 숏폼을 만듭니다. 소스가 충분한 브랜드는 후자만 진행합니다.")}
<div class="flow">
${FLOW.map(
  ([n, t, d]) => `<div class="flow-row">
  <span class="flow-no">${n}</span>
  <div><p class="flow-t">${esc(t)}</p><p class="flow-d">${esc(d)}</p></div>
</div>`,
).join("")}
</div>`),
);

// 6 — 제작 시스템
pages.push(
  page(`
${head("System", "왜 이 가격에 이 퀄리티가 가능한가", "브랜드 프로젝트 안에서 반복 검증된 ‘위너 소재 제작 시스템’만 잘라내, 편수 단위로 결제할 수 있게 연 것이 이 패키지입니다.")}
<div class="sys">
${SYSTEM.map(
  ([t, d], i) => `<div class="sys-row"><span class="sys-no">${i + 1}</span><div><p class="sys-t">${esc(t)}</p><p>${esc(d)}</p></div></div>`,
).join("")}
</div>

<h3>숏폼 한 편에 붙는 역할</h3>
<div class="roles">
${ROLES.map(
  ([k, t, d]) => `<div class="role"><span class="role-k">${k}</span><div><p class="role-t">${esc(t)}</p><p class="role-d">${esc(d)}</p></div></div>`,
).join("")}
</div>`),
);

// 7 — 제작팀 현장
pages.push(
  page(`
${head("Crew", "누가 만드나", "프리랜서 한 명에게 넘기고 연락을 기다리는 방식이 아닙니다. 기획·촬영·편집·모션·퍼포먼스가 각자 담당으로 붙는 팀 시스템 안에서 진행되고, 담당 한 명이 빠져도 일정이 멈추지 않습니다.")}
<div class="crew">
${Array.from({ length: 8 }, (_, i) => `<img src="${asset(`/portfolio/crew/crew-0${i + 1}.webp`)}" alt="">`).join("")}
</div>
<p class="foot-note">스톡 이미지가 아니라 저희 팀이 브랜드 현장과 촬영 현장에서 직접 찍은 사진입니다.</p>`),
);

// 8 — 포트폴리오
pages.push(
  page(`
${head("Portfolio", "위너 숏폼 포트폴리오", "기획과 서사, 마케팅과 세일즈를 아는 팀이 만드는 광고형 숏폼 전문입니다. 최근 진행한 캠페인 중 주요 위너 소재만 추렸습니다.")}
<div class="wall">
${WALL.map((s) => `<img src="${asset(`/portfolio/clips/${s}.jpg`)}" alt="">`).join("")}
</div>`),
);

// 9 — 플랜
pages.push(
  page(`
${head("Plans", "플랜 및 금액", "싱글과 패키지는 함께 구매하는 구성이 아닙니다 — 둘 중 하나를 고르시면 됩니다.")}

<h3>싱글 · 숏폼 기획제작</h3>
<p class="tbl-lead">국내 유수 라이브커머스·브랜드 숏폼 기획제작자 집단의 시스템. 브랜드가 보유한 소스(촬영본·UGC·제품컷)로 바로 시작합니다.</p>
<table class="tbl"><thead><tr><th>구성</th><th>내역</th><th>금액</th></tr></thead><tbody>${planRows(singles, "single")}</tbody></table>

<h3>패키지 · 숏폼 + 인플루언서 시딩</h3>
<p class="tbl-lead">인플루언서 컨텐츠 가이드라인 및 소스컷 확보와 구매전환 광고를 한번에. 찍을 소스부터 없는 브랜드를 위한 구성입니다.</p>
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
  <p class="foot-note">${POLICY.seedingBundleOnly}. ${POLICY.trialSingle}.</p>
</div>

<p class="vat">※ 위 금액은 부가세 별도 기준입니다.</p>`),
);

// 10 — 진행 단계
pages.push(
  page(`
${head("Process", "진행 단계", "플랜이 적용되면 내 프로젝트 대시보드가 열리고, 아래 단계가 실시간으로 갱신됩니다. 기획제작 요청 확정까지 D-7이 기준 일정입니다.")}
<div class="tracks">
  <div class="track">
    <p class="track-t">인플루언서 시딩</p>
    <p class="track-d">패키지 플랜에만 있습니다. 싱글 플랜은 ‘해당없음’으로 표시됩니다.</p>
    <ol>${SEEDING_STAGES.map((s) => `<li>${esc(s.label)}</li>`).join("")}</ol>
  </div>
  <div class="track">
    <p class="track-t">숏폼 기획제작</p>
    <p class="track-d">모든 플랜에 있습니다. 마지막 단계에서 최종본을 내려받습니다.</p>
    <ol>${SHORTS_STAGES.map((s) => `<li>${esc(s.label)}</li>`).join("")}</ol>
  </div>
</div>

<h3>대시보드에서 하시는 일</h3>
<div class="cards-3">
  <div class="card"><p class="card-t">컨텐츠 가이드라인 작성</p><p>브랜드 소개·핵심 타겟·USP·가격대·톤앤매너·금지 표현·레퍼런스를 남겨 주시면 그대로 기획에 들어갑니다.</p></div>
  <div class="card"><p class="card-t">1차 선정 심사</p><p>후보 채널의 팔로워·컨텐츠수·평균 조회/좋아요/댓글·CPV를 보고 함께 진행할 크리에이터를 직접 고르십니다.</p></div>
  <div class="card"><p class="card-t">검수 · 수정 요청</p><p>1차 완성본을 미리보기로 확인하고 편당 1회 무상 수정을 요청하십니다. 최종본은 폴더 하나로 전체 다운로드합니다.</p></div>
</div>`),
);

// 11 — 계약 과정
pages.push(
  page(`
${head("Contract", "계약 및 결제 절차")}
<div class="contract">
${CONTRACT.map(
  ([n, t, d]) => `<div class="ct-row"><span class="ct-no">${n}</span><div><p class="ct-t">${esc(t)}</p><p class="ct-d">${esc(d)}</p></div></div>`,
).join("")}
</div>
<div class="pay-note">
  <p class="card-t">결제 · 세금계산서</p>
  <p><b>세금계산서 발행 후 현금(계좌이체)이 기본</b>이며, 카드 결제도 가능합니다. 발행에 필요한 사업자 정보는 확정 단계에서 요청드립니다. 금액은 모두 부가세 별도 기준입니다.</p>
</div>`),
);

// 12 — 진행 조건
pages.push(
  page(`
${head("Terms", "진행 조건 및 산출물")}
<ul class="policy">
${[
  POLICY.revisionOnce,
  POLICY.usagePeriod,
  POLICY.sourceRequired,
  POLICY.noIndividualEdit,
  POLICY.seedingBundleOnly,
  POLICY.singleOrPackage,
  POLICY.downloadExpiry,
]
  .map((p) => `<li>${esc(p)}</li>`)
  .join("")}
</ul>

<h3>산출물 사양</h3>
<div class="kv">
  <div><dt>영상 비율</dt><dd>9:16 세로형 기본 · 요청 시 1:1 정사각 파생</dd></div>
  <div><dt>납품 형식</dt><dd>MP4 (H.264) · 광고 계정 업로드 가능한 사양</dd></div>
  <div><dt>전달 방식</dt><dd>프로젝트 폴더 하나로 전체 다운로드 (대시보드 링크)</dd></div>
  <div><dt>수정</dt><dd>편당 1회 무상 · 추가 수정은 편당 별도 견적</dd></div>
  <div><dt>인플루언서 결과물</dt><dd>배포된 채널 링크 및 인플루언서 편집본</dd></div>
  <div><dt>광고 사용기간</dt><dd>출연 컷 포함 소재는 다운로드일로부터 5개월</dd></div>
</div>

<p class="foot-note">${esc(POLICY.noGuarantee)}</p>`),
);

// 13 — FAQ
pages.push(
  page(`
${head("FAQ", "자주 묻는 질문")}
<div class="faq">
${FAQ.map(
  ([q, a]) => `<div class="faq-row"><p class="faq-q">${esc(q)}</p><p class="faq-a">${esc(a)}</p></div>`,
).join("")}
</div>`),
);

// 14 — 후기
pages.push(
  page(`
${head("Reviews", "실제 클라이언트 후기", "평균 2천만원(최소 5백 ~ 최대 2억) 규모 프로젝트를 진행하며 받은 후기입니다.")}
<div class="reviews">
${REVIEWS.map(
  ([t, who]) => `<div class="rv"><p>“${esc(t)}”</p><span>${esc(who)}</span></div>`,
).join("")}
</div>`),
);

// 15 — 마지막
pages.push(
  page(
    `<div class="cover end">
  <div>
    <p class="cover-en">CONTACT</p>
    <h1>다음 달 광고 소재,<br>아직 없으신가요?</h1>
    <p class="cover-lead">${esc(POLICY.revisionOnce.split(" · ")[0])}부터 최종 납품까지, 진행 상황은 전부 대시보드에서 보입니다.<br>브랜드 상황을 남겨 주시면 구성과 금액을 정리해 회신드립니다.</p>
  </div>
  <div class="cover-foot">
    <div class="kv dark-kv">
      <div><dt>신청</dt><dd>${SERVICE.url.replace("https://", "")}</dd></div>
      <div><dt>메일</dt><dd>ceo@h-grs.com</dd></div>
      <div><dt>브랜드 단위 프로젝트</dt><dd>${SERVICE.parentUrl.replace("https://", "")}/partnership</dd></div>
    </div>
    <p class="cover-org">${COMPANY.name} · 사업자등록번호 ${COMPANY.bizRegNumber} · ${COMPANY.address}</p>
  </div>
</div>`,
    { dark: true, bare: true },
  ),
);

/* ───────────────────────── 출력 ───────────────────────── */

const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<title>${SERVICE.name} 소개서</title>
<style>
@font-face{font-family:Pyeojin;src:url("${font("PyeojinGothic-Light.woff2")}") format("woff2");font-weight:300}
@font-face{font-family:Pyeojin;src:url("${font("PyeojinGothic-Regular.woff2")}") format("woff2");font-weight:400}
@font-face{font-family:Pyeojin;src:url("${font("PyeojinGothic-Bold.woff2")}") format("woff2");font-weight:700}

@page{size:A4;margin:0}
/* #pg9 처럼 페이지를 지목하면 그 장만 띄운다 — 조판 확인용. 인쇄에는 영향 없다 */
body:has(.page:target) .page:not(:target){display:none}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Pyeojin,-apple-system,sans-serif;color:#030303;-webkit-print-color-adjust:exact;print-color-adjust:exact}

.page{width:210mm;height:297mm;padding:20mm 18mm 14mm;position:relative;page-break-after:always;overflow:hidden;background:#fff}
.page:last-child{page-break-after:auto}
.page.dark{background:#0a0a0c;color:#fff}
.page-body{height:100%}
.page-foot{position:absolute;left:18mm;right:18mm;bottom:9mm;display:flex;justify-content:space-between;font-size:7.5pt;color:#9a9a9a;border-top:1px solid #ececec;padding-top:3mm}

.eyebrow{font-size:8pt;letter-spacing:.16em;text-transform:uppercase;color:#8e6b68;font-weight:700}
h1{font-size:30pt;line-height:1.32;font-weight:700;letter-spacing:-.02em}
h1 em{font-style:normal;color:#8ea2ff}
h2{font-size:19pt;line-height:1.35;font-weight:700;margin-top:3mm;letter-spacing:-.01em}
h3{font-size:11pt;font-weight:700;margin-top:9mm;margin-bottom:3mm}
.lead{font-size:9.5pt;line-height:1.85;color:#595959;margin-top:4mm;max-width:150mm}
.foot-note{font-size:7.5pt;line-height:1.8;color:#8a8a8a;margin-top:5mm}

/* 표지 */
.cover{height:100%;display:flex;flex-direction:column;justify-content:space-between}
.cover-en{font-size:8pt;letter-spacing:.3em;color:#8ea2ff;font-weight:700;margin-bottom:9mm}
.cover-lead{font-size:10pt;line-height:1.9;color:rgba(255,255,255,.62);margin-top:9mm}
.cover-foot{border-top:1px solid rgba(255,255,255,.16);padding-top:7mm}
.cover-stats{display:flex;gap:14mm;margin-bottom:7mm}
.cover-stats strong{display:block;font-size:17pt;font-weight:700}
.cover-stats span{font-size:8pt;color:rgba(255,255,255,.55)}
.cover-org{font-size:7.5pt;color:rgba(255,255,255,.4);line-height:1.8}
.end h1{font-size:26pt}
.cover-strip{display:grid;grid-template-columns:repeat(5,1fr);gap:3mm}
.cover-strip img{width:100%;height:60mm;object-fit:cover;border-radius:2mm;opacity:.92}

/* 정보표 */
.kv{margin-top:6mm;border-top:1px solid #e6e6e6}
.kv>div{display:flex;gap:8mm;padding:3.2mm 0;border-bottom:1px solid #f0f0f0;font-size:9pt}
.kv dt{width:38mm;flex-shrink:0;color:#8a8a8a}
.kv dd{line-height:1.7}
.dark-kv{border-color:rgba(255,255,255,.16);margin-bottom:6mm}
.dark-kv>div{border-color:rgba(255,255,255,.1)}
.dark-kv dt{color:rgba(255,255,255,.45)}

/* 카드 */
.cards-3{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm;margin-top:4mm}
.card{border:1px solid #e6e6e6;border-radius:3mm;padding:5mm;font-size:8pt;line-height:1.8;color:#595959}
.card-t{font-size:9.5pt;font-weight:700;color:#030303;margin-bottom:2.5mm}

.stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:5mm;margin-top:4mm}
.stats-row strong{display:block;font-size:16pt;font-weight:700}
.stats-row span{font-size:8pt;line-height:1.7;color:#595959}
.stats-row i{font-style:normal;color:#9a9a9a;font-size:7.5pt}

/* 로고 */
.logos{display:grid;grid-template-columns:repeat(5,1fr);gap:5mm;margin-top:9mm}
.logos div{height:25mm;border:1px solid #eee;border-radius:2mm;display:flex;align-items:center;justify-content:center;padding:3mm}
.logos img{max-width:100%;max-height:100%;object-fit:contain;filter:grayscale(1);opacity:.72}

/* 사례 */
.cases{display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:7mm}
.case{border:1px solid #e6e6e6;border-radius:3mm;padding:7mm;min-height:98mm;display:flex;flex-direction:column}
.case-no{font-size:7.5pt;letter-spacing:.14em;color:#8e6b68;font-weight:700}
.case-brand{font-size:12pt;font-weight:700;margin-top:2.5mm}
.case-brand span{font-size:8pt;font-weight:400;color:#8a8a8a}
.case-line{font-size:9pt;line-height:1.85;color:#595959;margin-top:3mm;min-height:16mm}
.case-stats{display:flex;gap:8mm;border-top:1px solid #f0f0f0;padding-top:4mm}
.case-stats strong{display:block;font-size:14pt;font-weight:700;color:#3948b8}
.case-stats span{font-size:7.5pt;color:#8a8a8a}
.case-note{font-size:7pt;color:#9a9a9a;margin-top:auto;padding-top:5mm}

/* 흐름 */
.flow{margin-top:7mm}
.flow-row{display:flex;gap:7mm;padding:7mm 0;border-bottom:1px solid #f0f0f0}
.flow-no{font-size:13pt;font-weight:700;color:#4d5fe8;width:11mm;flex-shrink:0}
.flow-t{font-size:11pt;font-weight:700}
.flow-d{font-size:8.5pt;line-height:1.8;color:#595959;margin-top:1.5mm}

/* 시스템 */
.sys{margin-top:5mm}
.sys-row{display:flex;gap:5mm;padding:4mm 0;border-bottom:1px solid #f0f0f0;font-size:8.5pt;line-height:1.8;color:#595959}
.sys-no{width:7mm;flex-shrink:0;font-size:11pt;font-weight:700;color:#4d5fe8}
.sys-t{font-size:10pt;font-weight:700;color:#030303;margin-bottom:1.5mm}

.roles{display:grid;grid-template-columns:1fr 1fr;gap:3mm}
.role{display:flex;gap:4mm;border:1px solid #eee;border-radius:2mm;padding:3.4mm 4mm;align-items:center}
.role-k{font-size:8pt;font-weight:700;color:#4d5fe8;width:9mm;flex-shrink:0}
.role-t{font-size:9pt;font-weight:700}
.role-d{font-size:7.5pt;color:#8a8a8a;margin-top:.8mm}

/* 사진 */
.crew{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm;margin-top:9mm}
.crew img{width:100%;height:82mm;object-fit:cover;border-radius:2mm}
.wall{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm;margin-top:7mm}
.wall img{width:100%;height:62mm;object-fit:cover;border-radius:2mm;background:#f2f2f2}

/* 표 */
.tbl-lead{font-size:8pt;color:#8a8a8a;line-height:1.7;margin-bottom:3mm}
.tbl{width:100%;border-collapse:collapse;font-size:9pt}
.tbl th{text-align:left;font-size:7.5pt;font-weight:400;color:#9a9a9a;border-bottom:1px solid #d8d8d8;padding-bottom:2mm}
.tbl th:last-child{text-align:right}
.tbl td{padding:3.4mm 0;border-bottom:1px solid #f0f0f0;vertical-align:top}
.t-name{font-weight:700;white-space:nowrap;width:36mm}
.t-desc{font-size:8pt;color:#8a8a8a}
.t-price{text-align:right;font-weight:700;white-space:nowrap}
.t-price span{display:block;font-size:7.5pt;font-weight:400;color:#9a9a9a;margin-top:.6mm}

.seeding-box{border:1px solid #e6e6e6;border-radius:3mm;padding:5mm;margin-top:6mm}
.seeding-row{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm;margin-top:3mm}
.seeding-row div{font-size:8pt;color:#8a8a8a}
.seeding-row strong{display:block;font-size:11pt;color:#030303;margin-top:1mm}
.vat{font-size:8pt;color:#8a8a8a;margin-top:4mm}

/* 단계 */
.tracks{display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:6mm}
.track{border:1px solid #e6e6e6;border-radius:3mm;padding:6mm}
.track-t{font-size:11pt;font-weight:700}
.track-d{font-size:7.5pt;color:#8a8a8a;margin-top:1.5mm;line-height:1.7;min-height:9mm}
.track ol{list-style:none;counter-reset:s}
.track li{counter-increment:s;font-size:9.5pt;padding:4mm 0;border-top:1px solid #f2f2f2;display:flex;gap:4mm}
.track li::before{content:counter(s);color:#4d5fe8;font-weight:700;width:5mm}

/* 계약 */
.contract{margin-top:6mm}
.ct-row{display:flex;gap:5mm;padding:3.3mm 0;border-bottom:1px solid #f2f2f2}
.ct-no{font-size:10pt;font-weight:700;color:#4d5fe8;width:9mm;flex-shrink:0}
.ct-t{font-size:10pt;font-weight:700}
.ct-d{font-size:8pt;line-height:1.75;color:#595959;margin-top:1.2mm}
.pay-note{border:1px solid #e6e6e6;border-radius:3mm;padding:5mm;margin-top:6mm;font-size:8.5pt;line-height:1.8;color:#595959}

/* 조건 */
.policy{list-style:none;margin-top:6mm}
.policy li{font-size:9pt;line-height:1.8;color:#595959;padding:3mm 0 3mm 6mm;border-bottom:1px solid #f2f2f2;position:relative}
.policy li::before{content:"";position:absolute;left:1mm;top:5.6mm;width:1.6mm;height:1.6mm;border-radius:50%;background:#4d5fe8}

/* FAQ */
.faq{margin-top:6mm}
.faq-row{padding:5.2mm 0;border-bottom:1px solid #f2f2f2}
.faq-q{font-size:9.5pt;font-weight:700}
.faq-a{font-size:8.5pt;line-height:1.8;color:#595959;margin-top:1.5mm}

/* 대표 인사말 */
.msg{display:grid;grid-template-columns:74mm 1fr;gap:9mm;margin-top:11mm}
.msg-quote{background:#0a0a0c;color:#fff;border-radius:3mm;padding:8mm 7mm;display:flex;flex-direction:column;justify-content:space-between}
.msg-quote p{font-size:17pt;font-weight:700;line-height:1.55;letter-spacing:-.01em}
.msg-quote span{font-size:8pt;color:rgba(255,255,255,.55);line-height:1.7;margin-top:8mm}
.msg-body>div{border-bottom:1px solid #f0f0f0;padding:11mm 0}
.msg-body>div:first-child{padding-top:0}
.msg-k{font-size:7.5pt;letter-spacing:.1em;color:#8e6b68;font-weight:700;margin-bottom:2mm}
.msg-body p:last-child{font-size:10pt;line-height:1.95;color:#595959}
.msg-body b{color:#030303}
.sign{margin-top:10mm;padding-top:5mm;border-top:1px solid #e6e6e6;display:flex;align-items:baseline;gap:4mm}
.sign span{font-size:8pt;color:#8a8a8a}
.sign strong{font-size:13pt;font-weight:700}

/* 문제 대비 */
.vs{display:grid;grid-template-columns:1fr 12mm 1fr;align-items:stretch;margin-top:8mm}
.vs-box{border:1px solid #e0e0e0;border-radius:3mm;padding:10mm;background:#faf9f8;min-height:86mm}
.vs-mid{display:flex;align-items:center;justify-content:center;font-size:16pt;color:#c4c4c4;font-weight:700}
.vs-tag{display:inline-block;font-size:7pt;letter-spacing:.1em;color:#8a8a8a;border:1px solid #dcdcdc;border-radius:99px;padding:1mm 3mm}
.vs-t{font-size:13pt;font-weight:700;margin-top:4mm}
.vs-d{font-size:9.5pt;line-height:1.95;color:#595959;margin-top:4mm}
.vs-d b{color:#030303}
.gaps{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm;margin-top:7mm}
.gaps>div{border-top:2px solid #4d5fe8;padding-top:6mm;min-height:32mm}
.gap-t{font-size:9.5pt;font-weight:700}
.gap-d{font-size:7.5pt;color:#8a8a8a;margin-top:1.5mm;line-height:1.7}
.verdict{margin-top:10mm;background:#0a0a0c;color:#fff;border-radius:3mm;padding:11mm 9mm;font-size:13pt;line-height:1.75;font-weight:400}
.verdict b{color:#8ea2ff}

/* 통합 체인 */
.chain{display:grid;grid-template-columns:1fr 7mm 1fr 7mm 1fr 7mm 1fr;align-items:stretch;margin-top:9mm}
.chain-node{border:1px solid #e0e0e0;border-top:3px solid #4d5fe8;border-radius:3mm;padding:8mm 5mm;min-height:80mm}
.chain-no{font-size:8pt;font-weight:700;color:#4d5fe8}
.chain-t{font-size:10.5pt;font-weight:700;margin-top:2.5mm;line-height:1.4}
.chain-d{font-size:7.5pt;line-height:1.75;color:#8a8a8a;margin-top:3mm}
.chain-arrow{display:flex;align-items:center;justify-content:center;color:#4d5fe8;font-size:13pt}
.one-line{margin-top:8mm;border:1px solid #4d5fe8;background:rgba(77,95,232,.05);border-radius:3mm;padding:9mm}
.one-t{font-size:13pt;font-weight:700;color:#3948b8}
.one-d{font-size:9pt;line-height:1.85;color:#595959;margin-top:2.5mm}

.outcome{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm;margin-top:8mm}
.outcome>div{background:#f7f5f3;border-radius:3mm;padding:6mm;text-align:center}
.oc-t{font-size:10.5pt;font-weight:700}
.oc-d{font-size:8pt;color:#8a8a8a;margin-top:2mm;line-height:1.7}

/* 효과 */
.impact{display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:9mm}
.imp{border:1px solid #e6e6e6;border-radius:3mm;padding:9mm;min-height:88mm}
.imp-no{font-size:20pt;font-weight:700;color:#eceefb;line-height:1}
.imp-t{font-size:13pt;font-weight:700;margin-top:3mm}
.imp-d{font-size:9pt;line-height:1.9;color:#595959;margin-top:3mm}

/* 차별점 */
.why{display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:8mm}
.why-big{background:#0a0a0c;color:#fff;border-radius:3mm;padding:10mm;min-height:96mm}
.why-big strong{display:block;font-size:26pt;font-weight:700;letter-spacing:-.02em;color:#8ea2ff}
.why-big span{display:block;font-size:8pt;color:rgba(255,255,255,.55);margin-top:1.5mm}
.why-big p{font-size:8.5pt;line-height:1.85;color:rgba(255,255,255,.72);margin-top:5mm}
.why-row{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm;margin-top:5mm}
.why-c{border:1px solid #e6e6e6;border-radius:3mm;padding:8mm;min-height:76mm}
.why-t{font-size:10pt;font-weight:700;padding-bottom:3mm;border-bottom:2px solid #b89b8d;display:inline-block}
.why-d{font-size:8.5pt;line-height:1.85;color:#595959;margin-top:4mm}

/* 후기 */
.reviews{display:grid;grid-template-columns:1fr 1fr;gap:4mm;margin-top:8mm;grid-auto-rows:1fr}
.rv{border:1px solid #e6e6e6;border-radius:3mm;padding:6mm;display:flex;flex-direction:column}
.rv p{font-size:9pt;line-height:1.85}
.rv span{display:block;font-size:7.5pt;color:#8a8a8a;margin-top:auto;padding-top:4mm}
</style></head>
<body>
${pages.join("\n")}
</body></html>`;

const out = resolve(ROOT, "docs/deck/소개서.html");
writeFileSync(out, html, "utf-8");
console.log(`생성: ${out} (${pages.length}페이지)`);
