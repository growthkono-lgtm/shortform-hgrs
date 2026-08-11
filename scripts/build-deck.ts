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
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { PLANS, POLICY, COMPANY, SERVICE, formatKRW } from "@/lib/constants";
import { SEEDING_STAGES, SHORTS_STAGES } from "@/lib/stages";

const ROOT = resolve(import.meta.dirname, "..");
const BASE = process.env.DECK_BASE ?? `file://${ROOT}`;
const asset = (p: string) => `${BASE}/public${p}`;
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
  { no: "01", brand: "뤼이드 리얼 아카데미", scale: "투자 2,000억", role: "소재 제작 + 캠페인 운영",
    img: "/portfolio/clips/riiid-report.jpg",
    stats: [["3주", "연속 고지출"], ["1위", "CPA 단가"]] },
  { no: "02", brand: "파크론 제로블럭", scale: "매출 200억대", role: "소재 제작 + 캠페인 운영",
    img: "/portfolio/clips/parkron-tpu.jpg",
    stats: [["5배", "메타 예산 증액"], ["9만원", "CPA 절감"]] },
  { no: "03", brand: "이노바인코리아 모에브", scale: "매출 300억대", role: "출시 고투마켓 소재 부스팅",
    img: "/portfolio/cases/inovine-moev.jpg",
    stats: [["₩4,000만", "3개월 매출"], ["3배", "ROAS"]] },
  { no: "04", brand: "크래프톤 배틀그라운드", scale: "글로벌", role: "연간 공식 바이럴 쇼츠 기획·제작",
    img: "/portfolio/cases/krafton-jonathan.jpg",
    stats: [["연간", "공식 프로젝트"], ["팬덤", "바이럴"]] },
];

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

// 02 브랜드 · 법인 소개





pages.push(
  slide(`
${head("법인 소개", "브랜드 전략부터 광고 컨텐츠·영상 프로덕션까지 함께 수행해 온 프로젝트 집단입니다")}
<div class="two">
  <div class="panel panel-ink">
    <p class="pk">해그로시</p>
    <p class="pt">브랜드 하나를 맡아<br>전략 · 마케팅 · 컨텐츠 · 영상까지<br>턴 키로 진행해 왔습니다</p>
  </div>
  <div class="kv">
    <div><dt>상호</dt><dd>${COMPANY.name}</dd></div>
    <div><dt>사업자등록번호</dt><dd>${COMPANY.bizRegNumber}</dd></div>
    <div><dt>${COMPANY.addressLabel}</dt><dd>${COMPANY.address}</dd></div>
    <div><dt>서비스</dt><dd>${SERVICE.name}</dd></div>
    <div><dt>사업 영역</dt><dd>브랜드 그로스 · 인플루언서 시딩 · 광고 숏폼 기획제작 · AI 기획제작</dd></div>
    <div><dt>문의</dt><dd>contact@h-grs.com</dd></div>
  </div>
</div>
<div class="band3">
  <div class="bd bd-indigo"><p class="bd-t">브랜드 단위 프로젝트</p><p class="bd-d">포지셔닝 · 채널 마케팅 · 캠페인 설계</p></div>
  <div class="bd bd-gold"><p class="bd-t">인플루언서 시딩</p><p class="bd-d">가이드라인 · 배포 · 소스컷 확보</p></div>
  <div class="bd bd-alt"><p class="bd-t">광고 숏폼 기획제작</p><p class="bd-d">구매 전환 기준의 기획과 변주</p></div>
</div>`),
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
<div class="oneline">소재로 시작해 채널로 넓히는 순서가 가장 많습니다</div>`),
);

// 02-3 PART 1 표지 — SNS 채널





pages.push(
  slide(
    `<div class="part">
  <p class="part-k">LINE 01</p>
  <p class="part-t">SNS 채널 활성화</p>
  <p class="part-d">브랜드 유튜브 · 인스타그램 채널의 기획 · 전략 · 운영</p>
</div>`,
    { dark: true, bare: true },
  ),
);

// 02-4 SNS 채널 — 무엇을 하나





pages.push(
  slide(`
${head("SNS 종합 브랜드 마케팅 시스템", "SNS 채널 연간 기획운영으로 진행하되, 필요 시 추가 범위를 협의합니다")}
<div class="flow">
${[
  ["01", "인스타그램 · 유튜브", "메인 채널을 둘 중 선정 후 그 외 채널에는 컨텐츠 미러링을 병행"],
  ["02", "광고 부스팅", "챔피언성 인기 피드에 퍼포먼스마케팅 및 채널 자체 트래픽을 붓습니다"],
  ["03", "인플루언서 게스트 콜라보", "유튜버·연예인·인플루언서·스트리머 콜라보 시 협업을 매니징"],
  ["04", "브랜드 CRM 퍼널 연결", "고객 DB로의 연결이 필요할 때 그 시스템을 함께 구축·관리"],
].map(
  ([n, t, d]) => `<div class="flow-row">
  <span class="flow-no">${n}</span>
  <div><p class="flow-t">${esc(t)}</p><p class="flow-d">${esc(d)}</p></div>
</div>`,
).join("")}
</div>
<div class="oneline">전략과 컨텐츠와 에디팅을 한번에 — 최소 6개월, 기본 1년 단위 파트너십</div>`),
);

// 02-5 SNS 채널 — 어떤 팀이 붙나





pages.push(
  slide(`
${head("투입 조직", "분기별 신규 4-5개 프로젝트만 추가로 진행합니다")}
<div class="teams">
${[
  ["PM/CP", "기획총괄", ["프로젝트 마일스톤 관리", "전략 기획 및 세부 지표 싱크", "브랜드 종합 목표 달성 체크"]],
  ["CT", "컨텐츠팀", ["브랜딩 크리에이티브", "시니어 출신 촬영 감독진", "방송/예능/유튜브/마케팅 PD"]],
  ["FN", "퍼널팀", ["AARRR 전환율 고도화", "AEO/SEO/리드 제너레이션", "GA4 및 CRM 그로스툴 최적화"]],
  ["PF", "퍼포먼스팀", ["매출 지표 스케일업", "구매 전환형 숏폼 기획제작", "인플루언서 리뷰 시딩 바이럴"]],
].map(
  ([tag, name, items]) => `<div class="team">
  <span class="team-tag">${tag}</span>
  <p class="team-name">${name}</p>
  <ul class="team-list">${(items as string[]).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
</div>`,
).join("")}
</div>`),
);

// 02-6 SNS 채널 — 성과





pages.push(
  slide(`
${head("채널 성과", "실제로 채널을 기획·제작·운영한 프로젝트 기록입니다")}
<div class="cases">
${[
  { no: "01", brand: "크래프톤 배틀그라운드", scale: "12개월 · 이스포츠", role: "공식 SNS 5개 채널 IMC", img: "/sns/krafton-contents.jpg", stats: [["300편", "유튜브 기획제작"], ["5개", "공식 채널 운영"]] },
  { no: "02", brand: "럽디 연애상담", scale: "12개월 · 서비스", role: "온드 유튜브 인물 브랜딩", img: "/sns/lovedy-funnel.png", stats: [["600%P", "퍼널 리드 성장"], ["60%", "CRM 전환율"]] },
  { no: "03", brand: "열다 옷장정리", scale: "4개월 · 스타트업", role: "인물 브랜딩 + 광고 Multi-Use", img: "/sns/yeolda-shoot.jpg", stats: [["17%P", "CAC 개선"], ["1화", "알고리즘 노출"]] },
  { no: "04", brand: "트러스티푸드", scale: "펫푸드 커머스", role: "컨텐츠 기반 IMC", img: "/sns/trusty-product.jpg", stats: [["1.4배", "예산 증액"], ["100%P+", "ROAS 상승"]] },
].map(
  (c) => `<div class="case">
  <img class="case-img" src="${asset(c.img)}" alt="">
  <div class="case-head">
    <span class="case-no">${c.no}</span>
    <div><p class="case-brand">${esc(c.brand)}</p><p class="case-scale">${esc(c.scale)}</p></div>
  </div>
  <div class="case-stats">${c.stats.map(([v, l]) => `<div><strong>${v}</strong><span>${l}</span></div>`).join("")}</div>
  <p class="case-role">${esc(c.role)}</p>
</div>`,
).join("")}
</div>
<div class="oneline">연 단위로 월·시즌·브랜드 이벤트에 맞춰 편성하고, 상황에 따라 유연하게 대응합니다</div>`),
);

// 02-7 PART 2 표지 — 숏폼





pages.push(
  slide(
    `<div class="part">
  <p class="part-k">LINE 02</p>
  <p class="part-t">구매 전환형 숏폼</p>
  <p class="part-d">인플루언서 시딩 바이럴 · 2차 활용 소스 · 광고 숏폼 기획제작</p>
</div>`,
    { dark: true, bare: true },
  ),
);

// 03 시장 구조





pages.push(
  slide(`
${head("요즘 브랜드 업무", "인플루언서 바이럴에 이어 매출 연속성을 확보하고 싶으신가요?")}
<div class="split">
  <div class="split-side">
    <div class="circle circle-indigo"><span>인플루언서<br>시딩</span></div>
    <p class="split-t">A사 발주</p>
    <p class="split-d">채널 배포 · 소스컷 일부</p>
  </div>
  <div class="split-gap">
    <p class="gap-label">내부 리소스가 많이 드는 구간</p>
    <ul class="gap-list"><li>컨텐츠 가이드라인</li><li>필요한 컷 설계</li><li>전환 소재 연결</li></ul>
  </div>
  <div class="split-side">
    <div class="circle circle-gold"><span>광고 숏폼<br>제작</span></div>
    <p class="split-t">B사 발주</p>
    <p class="split-d">받은 소스로 편집 · 마케팅 의도 부재</p>
  </div>
</div>
<div class="verdict">각 잡은 채널 협업이 아닌 이상 시딩에 남는 건 소스컷과 약간의 바이럴입니다. 그 소스를 전환 소재로 잇는 일이 비어 있습니다.</div>`),
);

// 04 포지션





pages.push(
  slide(`
${head("해그로시 서비스 영역", "시딩과 2차 활용 영상 확보부터 구매전환 숏폼 기획제작까지 하나로 해결해 드립니다")}
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
    <div class="pos-note">시딩과 숏폼을 한 팀이 맡습니다</div>
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

// 06 기대 효과





pages.push(
  slide(`
${head("기대 효과", "챔피언 소재 몇 종으로 매출을 늘려 드립니다")}
<div class="impact">
${[
  ["매출 스케일업", "챔피언 소재 몇 종으로 예산을 몰고 파생본을 이어 갑니다"],
  ["광고 운영 안정", "소재가 마르지 않아 증액 시 CPA가 먼저 오르지 않습니다"],
  ["잡무 제거", "크리에이터 선정 · 가이드라인 · 배송 · 소스컷 회수를 대행합니다"],
  ["피드백 단축", "대시보드에서 단계 확인 후 수정을 일괄로 전달하십니다"],
]
  .map(
    ([t, d], i) => `<div class="imp ${i % 2 ? "imp-alt" : ""}">
  <span class="imp-no">0${i + 1}</span>
  <p class="imp-t">${t}</p>
  <p class="imp-d">${d}</p>
</div>`,
  )
  .join("")}
</div>`),
);

// 07 성과 사례





pages.push(
  slide(`
${head("주요 성과", "소재 제작과 캠페인 운영으로 이런 결과를 만들어 왔습니다")}
<div class="cases">
${CASES.map(
  (c) => `<div class="case">
  <img class="case-img" src="${asset(c.img)}" alt="">
  <div class="case-head">
    <span class="case-no">${c.no}</span>
    <div><p class="case-brand">${esc(c.brand)}</p><p class="case-scale">${esc(c.scale)}</p></div>
  </div>
  <div class="case-stats">${c.stats.map(([v, l]) => `<div><strong>${v}</strong><span>${l}</span></div>`).join("")}</div>
  <p class="case-role">${esc(c.role)}</p>
</div>`,
).join("")}
</div>
<p class="foot-note">${esc(POLICY.noGuarantee)}</p>`),
);

// 08 포트폴리오





pages.push(
  slide(`
${head("최근 주요 포트폴리오", "기획과 서사, 마케팅과 세일즈를 아는 팀이 만든 광고형 숏폼입니다")}
<div class="wall">
${WALL.map((s) => `<img src="${asset(`/portfolio/clips/${s}.jpg`)}" alt="">`).join("")}
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

// 10 제작 조직 (현장)





pages.push(
  slide(`
${head("스케일업 숏폼 기획제작 조직", "촬영 현장과 브랜드 현장에서 저희 팀이 직접 찍고 직접 만듭니다")}
<div class="creds">
${CREDENTIALS.map((c) => `<span class="cred">${c}</span>`).join("")}
</div>
<div class="crew">
${Array.from({ length: 8 }, (_, i) => `<img src="${asset(`/portfolio/crew/crew-0${i + 1}.webp`)}" alt="">`).join("")}
</div>`),
);

// 11 역할 구성 · AI





pages.push(
  slide(`
${head("역할 구성", "숏폼 한 편에 아홉 개 역할이 각자 담당으로 붙습니다")}
<div class="two t-6040">
  <div class="roles">
${ROLES.map(([t, d]) => `<div class="role"><p class="role-t">${t}</p><p class="role-d">${d}</p></div>`).join("")}
  </div>
  <div class="side-col">
    <div class="panel panel-ink">
      <p class="pk">디렉터</p>
      <p class="pt2">직접 태워 본 사람이<br>소재를 설계합니다</p>
      <div class="fig"><strong>100억</strong><span>디렉터 개인의 누적 광고 집행 경험</span></div>
    </div>
    <div class="panel panel-indigo">
      <p class="pk light">AI 기획제작 전문</p>
      <p class="pt3">이 홈페이지와 어드민 대시보드 모두 저희 PO가 AI로 직접 기획·제작했습니다. 마케팅 의도의 반영은 담당자가 감도 있게 핸들링합니다.</p>
    </div>
  </div>
</div>`),
);

// 12 제작 시스템





pages.push(
  slide(`
${head("제작 시스템", "프로젝트에서 반복 검증한 위너 소재 제작 시스템을 그대로 쓰실 수 있습니다")}
<div class="band3 tall">
  <div class="bd bd-indigo"><p class="bd-n">01</p><p class="bd-t">판독 기준</p><p class="bd-d">조회수가 아니라 구매 전환. 훅 유지율 · CPA · ROAS로 위너를 가립니다.</p></div>
  <div class="bd bd-gold"><p class="bd-n">02</p><p class="bd-t">제작 사이클</p><p class="bd-d">기획 → 제작 → 데이터 판독 → 변주. 프로젝트에서 수십 회 반복한 순서입니다.</p></div>
  <div class="bd bd-alt"><p class="bd-n">03</p><p class="bd-t">팀 구조</p><p class="bd-d">담당이 나뉘어 붙습니다. 한 명이 빠져도 일정이 멈추지 않습니다.</p></div>
</div>`),
);

// 13 진행 단계





pages.push(
  slide(`
${head("세부 업무 흐름", "두 트랙이 각자 단계를 밟아 나갑니다")}
<div class="two">
  <div class="track track-indigo">
    <p class="track-t">인플루언서 시딩</p>
    <p class="track-d">패키지 플랜</p>
    <ol>${SEEDING_STAGES.map((s) => `<li>${esc(s.label)}</li>`).join("")}</ol>
  </div>
  <div class="track track-gold">
    <p class="track-t">숏폼 기획제작</p>
    <p class="track-d">모든 플랜</p>
    <ol>${SHORTS_STAGES.map((s) => `<li>${esc(s.label)}</li>`).join("")}</ol>
  </div>
</div>`),
);

// 14 이용 방법 (실제 화면)



pages.push(
  slide(`
${head("프로젝트 대시보드 확인", "초기 요청사항부터 컨텐츠 컨펌과 진행 단계까지 한번에 확인하세요")}
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
${head("플랜 안내", "브랜드 상황에 맞는 구성을 고르시면 됩니다 — 싱글과 패키지는 택일입니다")}

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
  <div class="plan-col plan-col-pkg">
    <p class="plan-k">패키지 플랜</p>
    <p class="plan-h">시딩으로 소스부터 확보</p>
    <p class="plan-d">찍을 소스부터 없으실 때. 인플루언서 시딩으로 소스컷을 확보하고 숏폼까지 이어서 만듭니다.</p>
    <table class="tbl"><tbody>${planRows(packages, "package")}</tbody></table>
    <div class="seed-in">
${packages
  .map(
    (p) => `<div><span>시딩 ${p.influencerCount}명</span><strong>${formatKRW(p.seedingPrice ?? 0)}</strong></div>`,
  )
  .join("")}
    </div>
  </div>
</div>

<p class="vat">※ 부가세 별도 · ${esc(POLICY.seedingBundleOnly)}</p>`),
);

// 15-4 PART 3 표지 — 종합 브랜드 마케팅





pages.push(
  slide(
    `<div class="part">
  <p class="part-k">LINE 03</p>
  <p class="part-t">종합 브랜드 마케팅</p>
  <p class="part-d">채널 · 컨텐츠 · 광고에 이벤트 · 프로모션 · CRM 까지 하나의 전략으로</p>
</div>`,
    { dark: true, bare: true },
  ),
);

// 15-5 통합 브랜드 액션





pages.push(
  slide(`
${head("통합 브랜드 액션", "브랜드마다 필요한 파트를 붙여 하나의 전략으로 묶어 왔습니다")}
<div class="acts">
${[
  ["G 브랜드", "CRM 멤버십 · AARRR 퍼널 시나리오 · 브랜드 마케팅 · 종합 마케팅 전략", "ROAS 500% 개선, CPA 45% 절감"],
  ["K 브랜드", "브랜드 세계관 기획 · 팬덤 컨텐츠 · 커뮤니티 바이럴 · 5개 온드 채널", "유튜브 300편 제작, 공식 SNS 5개 채널 IMC"],
  ["W 브랜드", "오가닉 SEO · 리드 세일즈 구축 · GA4 데이터 마케팅 · 블로그 최적화", "B2B SEO 도메인 최적화부터 억대 세일즈 연결"],
  ["L 브랜드", "노코드툴 그로스 · 온드 채널 매출 구조화 · 페이드 스케일업 · AARRR", "예산 10배+ 증액, CPA 30원대, DAU 30% 상승"],
  ["M 브랜드", "런칭마케팅기획 · SNS바이럴 · 퍼포먼스마케팅 · 유튜브 PPL", "ROAS 3배+, 광고 예산 4배+ 스케일업"],
  ["J 브랜드", "자사몰 최적화 · 퍼포먼스마케팅 · 숏폼 촬영 · 이벤트 프로모션", "제품 컨셉 개편과 세일즈 퍼널 구축으로 ROI 개선"],
].map(
  ([brand, parts, result]) => `<div class="act">
  <p class="act-b">${esc(brand)}</p>
  <p class="act-p">${esc(parts)}</p>
  <p class="act-r">${esc(result)}</p>
</div>`,
).join("")}
</div>
<p class="foot-note">${esc(POLICY.noGuarantee)}</p>`),
);

// 16 계약 · 결제





pages.push(
  slide(`
${head("계약 · 결제", "구성 확정부터 납품까지 여덟 단계로 진행해 드립니다")}
<div class="contract">
${CONTRACT.map(
  ([n, t, d]) => `<div class="ct"><span class="ct-no">${n}</span><p class="ct-t">${esc(t)}</p><p class="ct-d">${esc(d)}</p></div>`,
).join("")}
</div>
<div class="pay-band">세금계산서 발행 후 현금(계좌이체)이 기본이며, 카드 결제도 가능합니다 · 부가세 별도</div>`),
);

// 17 문의처





pages.push(
  slide(
    `<div class="cover end">
  <div class="cover-l">
    <p class="cover-en">CONTACT</p>
    <h1>다음 달 광고 소재,<br>함께 준비해 드릴까요?</h1>
    <p class="cover-sub">브랜드 상황을 남겨 주시면 구성과 금액을 정리해 회신드립니다.</p>
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
.crew{display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:1fr 1fr;gap:3.5mm;flex:1;min-height:0}
.crew img{width:100%;height:100%;object-fit:cover;border-radius:2mm}

/* 역할 */
.roles{display:grid;grid-template-columns:repeat(3,1fr);gap:3.5mm;align-content:start}
.role{background:var(--alt);border-radius:2mm;padding:5.5mm}
.role-t{font-size:10pt;font-weight:700}
.role-d{font-size:7.5pt;color:#8a8a8a;margin-top:1.5mm;line-height:1.6}
.side-col{display:flex;flex-direction:column;gap:4mm}
.side-col .panel{flex:1}

/* 사례 */
.cases{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm;flex:1}
.case{border:1px solid var(--line);border-radius:3mm;padding:0 0 6mm;display:flex;flex-direction:column;overflow:hidden}
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
.team{border:1px solid var(--line);border-radius:3mm;padding:8mm 7mm;display:flex;flex-direction:column}
.team-tag{font-size:7.5pt;font-weight:700;color:#fff;background:var(--night);border-radius:99mm;padding:2mm 4.5mm;align-self:flex-start}
.team-name{font-size:11.5pt;font-weight:700;margin-top:5mm}
.team-list{margin-top:5mm;display:flex;flex-direction:column;gap:3mm}
.team-list li{font-size:8.5pt;line-height:1.65;color:var(--muted);padding-left:4mm;position:relative}
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
