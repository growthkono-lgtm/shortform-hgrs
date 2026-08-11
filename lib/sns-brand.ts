/**
 * /sns-brand — "브랜드 SNS 채널 커뮤니케이션" **리드 확보 랜딩**의 카피 단일 출처.
 *
 * 규칙 하나만 지키면 된다:
 *   `verbatim: true` 가 붙은 문자열은 해그로시 자사 원문(hgrs.io/portfolio/*)에서
 *   **한 글자도 고치지 않고 옮긴 것**이다. 맞춤법이 어색해 보여도 손대지 않는다.
 *   (예: "확산 시키는", "DB 세출" — 원문 표기 그대로다)
 *
 * 원문 백업: ~/Documents/framer-archive-hgrs/cases/text/*.txt
 * 화면 문구를 고칠 일이 생기면 컴포넌트가 아니라 이 파일을 고친다.
 */

export const HERO = {
  eyebrow: "Brand SNS Channel",
  title: ["브랜드 퍼널을 완성하는", "SNS 채널 그로스 프로젝트"],
  sub: ["단순 바이럴이 아닌,", "팬덤과 고객 연결의 커뮤니케이션을 완성합니다."],
  stats: [
    { figure: "2억~4천대", label: "프로젝트 경험" },
    { figure: "종합 4개팀", label: "전략-기획-제작-운영" },
    { figure: "30+", label: "깊이 있게 함께한 브랜드" },
  ],
  ctaPrimary: "프로젝트 상담 신청",
  ctaSecondary: "브랜드 성과 사례",
} as const;

/* 포지셔닝(POV) 섹션은 2026-08-11 와이어프레임에서 빠졌다.
   메시지는 히어로와 Actions 서브카피가 나눠 가진다. */

export type Figure = {
  src: string;
  width: number;
  height: number;
  caption: string;
};

export type Feature = {
  id: string;
  label: string;
  category: string;
  meta: string;
  /** 카드 헤드라인 */
  title: string;
  /** 본문 — 문단 단위 */
  body: string[];
  /** 성과 스트립. note 가 있으면 괄호 설명이 아래 줄로 붙는다 */
  stats: { v: string; note?: string }[];
  hero: Figure;
  figures: Figure[];
  videos?: { id: string; title: string }[];
};

/**
 * 케이스 4건 — 2026-08-11 피그마 와이어프레임의 문안으로 전면 교체했다.
 * 이전 버전은 hgrs.io/portfolio 원문을 길게 실었는데, 사장님이 직접 짧게 다시 쓰셨다.
 * 접었다 펴는 처리도 없앴다 — 본문이 세 문단이라 접을 이유가 사라졌다.
 */
export const FEATURES: Feature[] = [
  {
    id: "krafton",
    label: "Feature 01",
    category: "GAME · FANDOM",
    meta: "크래프톤 (배틀그라운드 / 12개월)",
    title: "남아있는 골수 팬부터, 떠나갔던 유저까지 확보한 팬덤 영상 이야기",
    body: [
      "크래프톤 대표 이사, 연예인 조나단, 유명MC, 젠지 등 인기 구단까지 다양한 공식 브랜디드 컨텐츠로 함께한 배틀그라운드 이스포츠 채널.",
      "해그로시는 브랜드의 타겟을 크게 <em>4종류로 나눠</em> 우선순위의 고객층을 목표로 <em>연간 동시 시청자 수 확보</em>를 목표로 <em>5개의 채널</em>을 운영했습니다.",
      "그리고 지난 부정적 댓글들은 <em>'이런 컨텐츠 계속 해달라는' 팬들의 응원으로</em> 바뀌고, 롱폼 시리즈와 함께 수많은 숏폼 부스팅으로 컨텐츠 가설을 검증하고 점진적인 지표 성과를 높일 수 있었습니다.",
    ],
    stats: [
      { v: "공식 SNS 채널 통합 운영" },
      { v: "유튜브 총 300편 기획제작" },
      { v: "종합 마케팅 대행" },
    ],
    hero: {
      src: "/sns/krafton-contents.jpg",
      width: 1080,
      height: 1080,
      caption: "배틀그라운드 이스포츠 공식 채널에 편성한 컨텐츠들",
    },
    figures: [
      {
        src: "/sns/krafton-plan.png",
        width: 1600,
        height: 891,
        caption: "컨텐츠 기획안 — 포맷·출연·구성·레퍼런스까지 한 장에",
      },
      {
        src: "/sns/krafton-funnel.png",
        width: 1600,
        height: 897,
        caption: "페르소나별 유입 경로와 CRM 연결까지 그린 퍼널 설계",
      },
    ],
    videos: [
      { id: "63_0QN5MUXY", title: "배틀그라운드 이스포츠 공식 컨텐츠" },
      { id: "Bsp_HBS8ckM", title: "배틀그라운드 이스포츠 공식 컨텐츠" },
    ],
  },
  {
    id: "lovedy",
    label: "Feature 02",
    category: "SERVICE · OWNED GROWTH",
    meta: "럽디 (연애 상담 서비스 / 12개월)",
    title: "유튜브에서 인물 브랜딩을 성공하면 고객 DB로 연결됩니다.",
    body: [
      "문제를 공감하고 전문적으로 해결해주는 카운셀러들을 유튜브는 애정합니다. 연애상담 브랜드의 상담사들을 <em>특정 주제별 캐릭터 있는 선생님</em>으로 변신시키고 이들에게 연애 문제의 해결책을 받고 싶은 시청자들을 고객으로 유치했습니다.",
      "<em>광고비 한 푼 없이</em> 유튜브 팀과 채널 하나를 잘 셋업하니 신규 브랜드 매출이 <em>6개월내 2억 이상</em>을 돌파하고, 결제 전환되는 DB량이 폭발적으로 성장합니다.",
    ],
    stats: [
      { v: "퍼널 리드 600%P 성장", note: "인스타그램, 뉴스레터 포함" },
      { v: "세일즈CRM 전환율 60%", note: "고객 코드를 분류해 팀 간 매칭" },
      { v: "신사업 매출 2억", note: "6개월 내 성과" },
    ],
    hero: {
      src: "/sns/lovedy-funnel.png",
      width: 1600,
      height: 1064,
      caption:
        "SEO 채널·컨텐츠 미디어 믹스에서 CRM 최적화까지 이어지는 퍼널 지도",
    },
    figures: [
      {
        src: "/sns/lovedy-youtube.jpg",
        width: 1600,
        height: 901,
        caption: "상담사를 각 주제의 대표 전문가로 세운 온드 유튜브",
      },
      {
        src: "/sns/lovedy-result.png",
        width: 1600,
        height: 1064,
        caption: "컨텐츠 그로스가 만든 DB·전환 지표 변화",
      },
    ],
  },
  {
    id: "yeolda",
    label: "Feature 03",
    category: "STARTUP · PERSON BRANDING",
    meta: "열다 (옷장정리 O2O 플랫폼 / 4개월)",
    title: "옷장 정리라는 새로운 맥락의 유료 서비스, 유튜브와 광고로 승부!",
    body: [
      "퍼포먼스마케팅으로 옷장 정리 Before/After 컷을 열심히 광고 돌리지만 결국 <em>CAC(고객 한명당 유치비용) 이슈로 ROI 개선</em>이 필요했던 스타트업입니다.",
      "브랜드 내부 고객과 직원을 통해 30-40평대 아파트부터 빌라 투룸, 원룸까지 사연자들의 집을 다니며 옷장 정리의 마법을 보여줍니다.",
      "그리고 퍼포먼스마케팅 <em>광고 소재로 Multi-Use</em>하며 <em>CAC를 대폭 개선</em>합니다.",
    ],
    stats: [
      { v: "CAC 17%P 개선" },
      { v: "첫 영상부터 알고리즘 대박" },
      { v: "브랜딩-광고 통합 시스템" },
    ],
    hero: {
      src: "/sns/yeolda-shoot.jpg",
      width: 1600,
      height: 900,
      caption: "'열다 정리 전문가' 촬영 현장 — 인물 섭외부터 촬영까지 직접",
    },
    figures: [
      {
        src: "/sns/yeolda-plan.png",
        width: 1600,
        height: 900,
        caption: "채널 컨텐츠와 퍼포먼스마케팅을 한 장에 묶은 통합 플랜",
      },
      {
        src: "/sns/yeolda-app.jpg",
        width: 1600,
        height: 900,
        caption: "예약 전환까지 이어지는 O2O 서비스",
      },
    ],
    videos: [
      { id: "XmX0iYOTUGE", title: "집 정리의 모든 것 — 온드 채널 컨텐츠" },
    ],
  },
  {
    id: "trusty",
    label: "Feature 04",
    category: "COMMERCE · IMC",
    meta: "트러스티푸드 (펫푸드 커머스)",
    title:
      "넘쳐나는 수의사 컨텐츠, 그 중 펫푸드와 저속노화 키워드는 우리가 으뜸",
    body: [
      "시리즈 투자를 막 마친 트러스티푸드와 광고, 유튜브, 인스타그램 등 다양한 프로젝트를 함께합니다.",
      "<em>실제 사연 있는 강아지 친구들과 보호자들을 섭외</em>해 인터뷰 에피소드와 함께 생식 등의 펫푸드 요리 과정을 선보입니다.",
      "결국 <em>처방식 고급 라인 사료 및 컨설팅 영역까지</em> 연결하는 큰 그림을 만듭니다.",
    ],
    stats: [
      { v: "SNS 채널 통합 브랜딩" },
      { v: "댕터뷰-블라인드 시식대회" },
      { v: "종합 IMC 프로젝트" },
    ],
    hero: {
      src: "/sns/trusty-product.jpg",
      width: 1600,
      height: 1066,
      caption: "컨텐츠 IMC로 채널과 광고를 함께 키운 펫푸드 커머스",
    },
    figures: [],
  },
];

/**
 * 최근 주요 포트폴리오 — 실제 편성·제작한 **롱폼 영상**.
 * 사장님이 준 영상 링크 목록(영상모음2/영상링크.docx)과 트러스티랩스 채널에서
 * 지정한 편들이다. 쇼츠·정지 이미지는 뺐다 — 이 자리는 롱폼만 튼다.
 */
export const PORTFOLIO = {
  title: "최근 주요 포트폴리오",
  videos: [
    { id: "Bsp_HBS8ckM", title: "배그극장" },
    { id: "aEbmZ3H5EWo", title: "배그극장" },
    { id: "f5QK9Hik2C8", title: "PNC" },
    { id: "_h3PLQlhs1s", title: "PNC" },
    { id: "yNsu5XfTN1E", title: "이스포츠 스케치" },
    { id: "kN57OTVMSD0", title: "이스포츠 하이라이트" },
    { id: "Yy9K61hUC3Y", title: "핏플렉스 브랜드 캠페인" },
    { id: "XmX0iYOTUGE", title: "열다 옷장정리" },
    { id: "EU26OQv6ATE", title: "열다 옷장정리" },
    { id: "6gfORrmxY2Q", title: "열다 옷장정리" },
    { id: "Th4pjIRJUz8", title: "우리 강아지 비만·피부염 해결 (후편)" },
    { id: "LCQywT3a2pQ", title: "강아지 사료 솔루션 — 짱구 이야기 (전편)" },
    { id: "IzXDfxBQw5A", title: "노아만을 위한 식단 (전편)" },
    { id: "ta2ILzOdiOQ", title: "영양수의사가 답합니다 (후편)" },
    { id: "L3W_Uif3sjo", title: "수의사가 경고하는 강아지 간식의 숨겨진 위험" },
    { id: "my3vzEv5YkQ", title: "사료 하나로 달라지는 건강" },
    { id: "JTO0-Cedrs8", title: "강아지 사료 언제 바꿔야 할까?" },
  ],
} as const;

/**
 * SNS 채널 기본 프로세스 — 2026-08-11 피그마 문안.
 * 기존 3모듈("덕션 시스템")을 이 네 항목으로 갈아 끼웠다.
 */
export const PROCESS = {
  title: "SNS 종합 브랜드 마케팅 시스템",
  lead: "SNS 채널 연간 기획운영으로 진행하되, 필요 시 추가 범위를 협의합니다.",
  items: [
    {
      no: "01",
      title: "인스타그램 · 유튜브",
      body: "메인 채널을 둘 중 선정 후 그 외 채널에는 컨텐츠 미러링을 병행해 드립니다.",
      shot: {
        src: "/sns/krafton-contents.jpg",
        w: 1080,
        h: 1080,
        cap: "채널별로 갈아 편성한 컨텐츠",
      },
    },
    {
      no: "02",
      title: "광고 부스팅",
      body: "챔피언성 인기 피드는 퍼포먼스마케팅 및 채널 자체 트래픽을 붓습니다.",
      shot: {
        src: "/sns/krafton-funnel.png",
        w: 1600,
        h: 897,
        cap: "유입 경로와 부스팅 지점을 그린 퍼널 설계",
      },
    },
    {
      no: "03",
      title: "인플루언서 게스트 콜라보",
      body: "유튜버, 연예인, 인플루언서, 스트리머 등과 콜라보 시 협업을 매니징합니다.",
      shot: {
        src: "/sns/yeolda-shoot.jpg",
        w: 1600,
        h: 900,
        cap: "인물 섭외부터 촬영까지 직접 — 브랜드 채널 촬영 현장",
      },
    },
    {
      no: "04",
      title: "CRM 퍼널링",
      body: "고객 DB로의 연결이 필요할 때 그 시스템을 함께 구축 관리합니다.",
      shot: {
        src: "/sns/lovedy-result.png",
        w: 1600,
        h: 1064,
        cap: "컨텐츠 그로스가 만든 DB·전환 지표 변화",
      },
    },
  ],
} as const;

/**
 * 어떤 팀이 붙는가 — hgrs.io/partnership 원문의 4팀 구성을 그대로 옮겼다.
 * 채널 프로젝트에도 같은 4팀이 붙는다.
 */
export const TEAM = {
  title: ["브랜드를 이해하는 채널 운영,", "마케팅을 아는 덕션 시스템"],
  lead: "<em>분기별 신규 4-5개 프로젝트만 추가 진행합니다.</em>",
  teams: [
    {
      tag: "PM",
      photo: "/sns/team-pm.jpg",
      name: "PM/CP(기획총괄)팀",
      items: [
        "프로젝트 마일스톤 관리",
        "전략 기획 및 세부 지표 싱크",
        "브랜드 종합 목표 달성 체크",
        "클라이언트 협업 경험 최적화",
      ],
    },
    {
      tag: "CT",
      photo: "/sns/team-ct.jpg",
      name: "컨텐츠팀",
      items: [
        "브랜딩 크리에이티브",
        "시니어 출신 고감도 촬영 감독진",
        "방송/예능/유튜브/마케팅 PD",
        "멀티 유즈 및 그로스 성과 연결",
      ],
    },
    {
      tag: "FN",
      photo: "/sns/team-fn.jpg",
      name: "퍼널팀",
      items: [
        "AARRR 전환율 고도화",
        "AEO/SEO/리드 제너레이션",
        "GA4 및 CRM 그로스툴 최적화",
        "홈페이지 및 자사몰 구축",
      ],
    },
    {
      tag: "PF",
      photo: "/sns/team-pf.jpg",
      name: "퍼포먼스팀",
      items: [
        "매출 지표 스케일업",
        "구매 전환형 숏폼 기획제작",
        "브랜드 마케팅, 프로모션 운영",
        "인플루언서 리뷰 시딩 바이럴",
      ],
    },
  ],
  footnote:
    "인하우스 안에는 또 다른 인하우스 팀이 필요합니다. 이제 단순 구독이 아닌 진짜 시스템을 경험하세요.",
} as const;

/**
 * 계약 구조 — 연 단위.
 * **금액은 싣지 않는다** (2026-08-11 확정). 채널 규모와 편성량에 따라 진단 후 제안.
 * 여기에 단가를 적어 넣지 말 것 — 파트너십(IMC) 단가와 기준이 다르다.
 */
export const ENGAGEMENT = {
  title: [
    "전략과 컨텐츠와 에디팅을 한번에,",
    "최소 6개월-기본 1년 단위 파트너십",
  ],
  lead: "연 단위로 보면 월·시즌·브랜드 이벤트·테마에 따라 초기에 장기 편성 계획을 세운 뒤, 상황에 맞춰 유연하게 대응하며 채널 성과를 부스팅합니다.",
  /** 계약 조건표가 아니라 **킥오프부터 어떻게 굴러가는지**를 보여준다 (2026-08-11) */
  rows: [
    {
      k: "킥오프",
      v: "연 단위(월별 · 브랜드 비즈니스 시즌별) 컨텐츠 편성계획 싱크",
      note: "1년 치 편성표를 먼저 그리고 시작합니다",
    },
    {
      k: "채널 설계",
      v: "브랜드 포지셔닝 · 타겟 세그먼트 · 채널 컨셉 확정",
      note: "메인 채널을 정하고 그 외 채널은 미러링으로",
    },
    {
      k: "제작 사이클",
      v: "월 편성 → 촬영 · 편집 → 발행 → 성과 판독",
      note: "월간 리포트가 다음 달 편성의 근거가 됩니다",
    },
    {
      k: "시즌 대응",
      v: "신제품 · 프로모션 · 이벤트에 맞춰 편성 조정",
      note: "분기마다 방향과 지표를 다시 맞춥니다",
    },
    {
      k: "범위 확장",
      v: "광고 부스팅 · 인플루언서 콜라보 · CRM 퍼널링",
      note: "필요한 시점에 범위를 협의해 붙입니다",
    },
    {
      k: "소유",
      v: "산출물 · 채널 · 계정 전부 브랜드",
      note: "계약이 끝나도 자산은 브랜드에 남습니다",
    },
  ],
  note: "금액은 채널 규모와 편성량에 따라 달라집니다. 문의 주시면 진단과 함께 범위·금액을 정리해 드립니다.",
} as const;

/** FAQ — hgrs.io/partnership 원문 발췌. 채널 프로젝트에 해당하는 문항만 골랐다 */
export const FAQ: { q: string; a: string }[] = [
  {
    q: "일반 대행 프로세스가 아닌가요?",
    a: "25년부터 본격적인 브랜드 코칭, 액셀러레이팅을 위해 기 대행 구조는 특정 단가 이상의 파트너십에 한정합니다. 단발적인 오퍼레이팅은 지양하며 보통 대표/이사진과의 협의를 통해 양 법인 간 프로젝트가 확정됩니다.",
  },
  {
    q: "컨텐츠 프로덕션의 기능도 하나요?",
    a: "유튜브, 인스타그램, X 등 기업 공식 채널부터 브랜딩 세계관 구축 채널까지 기획, 촬영, 편집, 채널 최적화를 진행합니다. 브랜딩과 잠재고객, CRM, 세일즈까지 연결하는 고감도 크리에이티브 인프라를 보유합니다.",
  },
  {
    q: "어떻게 팀이 구성되고 투입하나요?",
    a: "인하우스에서 1명 채용하는 것보다 2배 정도의 인력이 온보딩 기간 거의 없이 빠르고 깊이 있게 투입합니다. 최소 2명에서 최대 10명까지 팀이 움직인 경험들을 보유합니다.",
  },
  {
    q: "가장 주력 분야가 무엇인가요?",
    a: "SNS/광고 소재 기획제작을 통한 매출 성과에 우위를 가집니다. 또, 퍼널/지표 중심의 그로스 마케팅에 강점을 보유합니다. 커머스, 서비스, 플랫폼 및 다양한 규모(스몰~스타트업~글로벌 대기업)의 경험을 다수 보유합니다.",
  },
  {
    q: "금액은 어떻게 확인하나요?",
    a: "채널 규모와 편성량, 필요한 모듈 범위에 따라 달라집니다. 채널 현황과 목표를 남겨 주시면 진단과 함께 필요한 작업 범위와 금액을 정리해 회신드립니다.",
  },
];

export const FINAL_CTA = {
  title: [
    "브랜딩부터 고객 마케팅까지",
    "시너지를 내는 SNS 채널 활성화가 필요하시다면",
  ],
  body: "지금 채널 현황과 6개월 뒤 목표만 알려주세요. 세 모듈 전부가 필요한 상황이 아니라면 그렇게 말씀드립니다.",
} as const;

export const ARCHIVE = {
  label: "ARCHIVE",
  title: "해그로시가 성과를 보장하는 이유",
  body: "만약, 여러분 브랜드를 세심하게 챙겨줄 검증된 마케팅팀이 필요하다면 잠시 쉬어 가세요. 어쩌면 공감 가고, 조금은 궁금한 마케팅 노하우가 녹아 있을지도 모릅니다.",
  href: "https://brunch.co.kr/brunchbook/bmaha2",
  cta: "브런치북으로 읽기",
} as const;

/** 사례 섹션 머리말 */
export const CASES = {
  title: [
    "글로벌 대기업부터",
    "저예산 스타트업까지",
    "SNS로 비즈니스 기여하기",
  ],
  lead: "해그로시는 브랜드가 당면한 과제를 함께 해결하기 위해 고객 세그먼트 분류, 페르소나 매칭, 사연자 섭외, 시청 후 DB 확보, 커뮤니티 바이럴, 심리 테스트 검사지 등 다양한 종합 마케팅의 결과를 만들어 왔습니다.",
} as const;

export const CONTACT = {
  title: "다음 호의 피처가 될 브랜드를 찾습니다",
  lead: "채널 현황과 목표를 보내주시면, 진단과 함께 필요한 작업 범위를 제안드립니다. 세 모듈 전부가 필요한 상황이 아니라면 그렇게 말씀드립니다.",
} as const;

/* ────────────────────────────────────────────────────────────
   아래 세 블록은 hgrs.io/partnership 섹션을 그대로 옮긴 것이다.
   (사장님이 캡처로 지정한 섹션 — 1차 구축에서 누락됐다가 복구)
   문안은 원문 그대로다. 손대지 말 것.
   ──────────────────────────────────────────────────────────── */

/**
 * 역량 — hgrs.io/partnership "브랜드의 지속성에는…" 섹션.
 * 원본은 카드 **여섯 장**이 한 트랙에 이어 붙어 가로로 흐른다. 앞의 셋만 옮겼다가
 * 나머지 셋(숏폼·데이터·CRM)을 트랙에 합쳤다 — 원본과 같은 구성이다.
 */
export const CAPABILITY = {
  title: [
    "요즘 SNS 채널은",
    "단순 브랜딩 뿐만 아니라",
    "<em>마케팅 성과까지 함께 설계</em>해야 합니다.",
  ],
  cards: [
    {
      id: "funnel",
      head: "고객 퍼널의 그로스 여정",
      tail: "으로 ROI를 개선",
      kind: "chart" as const,
      figure: 200,
      suffix: "%+",
      note: null as string | null,
      labelSide: true,
    },
    {
      id: "youtube",
      head: "유튜브 컨텐츠 기획제작",
      tail: "으로 오가닉 브랜드 육성",
      kind: "youtube" as const,
      figure: 88,
      suffix: "%+",
      note: null as string | null,
      labelSide: false,
    },
    {
      id: "scale",
      head: "광고 스케일업",
      tail: "은 브랜드 결을 지키며 완성",
      kind: "line" as const,
      figure: 163,
      suffix: "%+",
      note: "ROAS 초과 달성",
      labelSide: false,
    },
    {
      id: "shorts",
      head: "숏폼 전문 기획제작력",
      tail: "과 미디어 광고 전략화",
      kind: "vertical" as const,
      figure: null,
      suffix: "",
      note: null as string | null,
      labelSide: false,
      /** 원본은 세로 카드 안에서 화살표로 넘기는 유튜브 3편 슬라이더다 */
      videos: ["BdGKoiPITZ0", "TJGx4iZBgTI", "KNiT370o2S8"],
    },
    {
      id: "data",
      head: "GA4, 믹스패널, 데이터라이즈",
      tail: " 등 전문 데이터 마케팅",
      kind: "metrics" as const,
      figure: null,
      suffix: "",
      note: null as string | null,
      labelSide: false,
      /** L브랜드 원문에서 그대로 온 값 — "예산 10배+ 증액, CPA 30원대, DAU 30% 상승" */
      metrics: [
        { k: "DAU", v: "30", u: "%+" },
        { k: "광고예산", v: "10", u: "배+" },
        { k: "CPA", v: "30", u: "원대 달성" },
      ],
    },
    {
      id: "crm",
      head: "CRM의 전환율",
      tail: "을 개선하는 시나리오화 캠페인 자동화",
      kind: "metrics" as const,
      figure: null,
      suffix: "",
      note: null as string | null,
      labelSide: false,
      /** 럽디 원문 — "퍼널 리드 600%P 성장과 세일즈 CRM 전환율 60%" */
      metrics: [
        { k: "퍼널 리드", v: "600", u: "%P" },
        { k: "CRM 전환율", v: "60", u: "%" },
        { k: "신사업 매출", v: "2", u: "억+" },
      ],
    },
  ],
} as const;

export const ACTIONS = {
  title: "통합 브랜드 액션도 수행 중입니다.",
  items: [
    {
      brand: "G",
      period: null,
      items: [
        "CRM 멤버십",
        "AARRR 퍼널 시나리오",
        "브랜드 마케팅",
        "종합 마케팅 전략",
      ],
      results: [
        "신규 회원 유치 전략부터 디지털 마케팅 총괄",
        "ROAS 500% 개선, CPA 45% 절감, 예산 00억",
      ],
    },
    {
      brand: "K",
      period: null,
      items: [
        "브랜드 세계관 기획",
        "팬덤 컨텐츠 기획 제작",
        "커뮤니티 여론 바이럴",
        "5개 온드 채널 최적화",
      ],
      results: [
        "배틀그라운드 공식 SNS 5개 채널 IMC 크리에이티브",
        "브랜드 세계관과 컨텐츠 그로스, 유튜브 300편 제작",
      ],
    },
    {
      brand: "W",
      period: "6개월",
      items: [
        "오가닉 SEO",
        "리드 세일즈 구축",
        "GA4 데이터 마케팅",
        "블로그 최적화",
      ],
      results: [
        "B2B SEO 도메인 최적화부터 억대 세일즈 연결",
        "리드 DB 제너레이션과 GA4 컨텐츠 그로스 성과",
      ],
    },
    {
      brand: "J",
      period: "3개월",
      items: [
        "자사몰 최적화",
        "퍼포먼스마케팅",
        "숏폼 촬영 컨텐츠",
        "이벤트 프로모션",
      ],
      results: [
        "하이엔드 리포지셔닝을 위한 브랜드 마케팅 전개",
        "제품 컨셉 개편과 세일즈 퍼널 구축으로 ROI 개선",
      ],
    },
    {
      brand: "L",
      period: "12개월",
      items: [
        "노코드툴 그로스",
        "온드 채널 매출 구조화",
        "페이드 스케일업",
        "AARRR 퍼널 완성",
      ],
      results: [
        "최초 디지털 채널 구축부터 GA4 그로스 마케팅",
        "예산 10배+ 증액, CPA 30원대, DAU 30% 상승",
      ],
    },
    {
      brand: "G",
      period: "14개월",
      items: [
        "스타트업 마케팅 교육",
        "퍼포먼스마케팅",
        "제휴 SEO마케팅",
        "DAU 그로스 마케팅",
      ],
      results: [
        "구글, 유튜브 숏폼 광고 마케팅 (21-22,25Y)",
        "예산 월 5천대에서 4억까지 스케일업, CRM 최적화",
      ],
    },
    {
      brand: "M",
      period: "4개월",
      items: ["런칭마케팅기획", "SNS바이럴", "퍼포먼스마케팅", "유튜브 PPL"],
      results: [
        "런칭 단계 전략-PPL-바이럴-메타 마케팅 턴 키",
        "ROAS 3배+, 광고 예산 4배+ 스케일업 증명",
      ],
    },
    {
      brand: "L",
      period: "12개월",
      items: [
        "온드 유튜브 채널",
        "CRM 마케팅",
        "브랜드 세계관 연결",
        "상담문의 DB 확보",
      ],
      results: [
        "브랜드 제품 런칭 전략과 CRM 통합 프로젝트",
        "그로스해킹 방식의 영업이익 개선 목표 운영",
      ],
    },
  ],
  lead: "해그로시는 프로덕션의 전문성과 함께 종합 마케팅 전략을 전개해 온 전문 컨텐츠 그로스 집단입니다.",
  more: "... And More",
} as const;
