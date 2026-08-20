/**
 * hgrs.io 홈 — 카피 단일 출처.
 *
 * 프레이머 홈(2026-08-11 어드민 캡처)의 문안을 **그대로** 옮겼다.
 * 손대지 않은 곳: 영문 헤드라인의 "Positiong" 오타까지 원문 그대로 둔다.
 * 바꾼 곳은 하나 — 마지막 CTA 두 장이 지금 실제로 있는 두 랜딩을 가리킨다
 * (프레이머 시절 "CMO 기획 프로그램 / 종합 IMC 프로젝트"는 더 이상 그 주소가 없다).
 */

export const HOME_HERO = {
  title: ["A Strategy Program", "To Build Brand Positiong", "and Scale-Up"],
  sub: "브랜드 포지셔닝과 스케일업을 구축하는 퍼널 프로그램",
  stat: { figure: "90%", label: "Brand Goal Achievement Rate" },
  ctas: [
    { href: "/shortform", label: "숏폼 스튜디오", primary: true },
    {
      href: "/sns-brand",
      label: "브랜드 채널 마케팅",
      primary: false,
    },
  ],
} as const;

export const HOME_STORY = {
  label: "Project Story",
  question: [
    "어떻게 하면 브랜드 성장을",
    "더 빠르고, 깊이 있고,",
    "효율적으로 만들 수 있을까?",
  ],
  answer: [
    "해그로시는 How Might We라는",
    "프로덕트 개발의 관점에서",
    "브랜드를 바라보며 출발했습니다.",
  ],
  blocks: [
    [
      "헤드가 브랜드 전략과 기획을 킥오프하고",
      "선별된 오퍼레이팅 팀과 시스템이 투입해",
      "고감도 성과, 단가 경쟁력을 증명합니다.",
    ],
    [
      "보통 3-6개월 턴 키 프로젝트가 진행되며,",
      "인하우스에 필요한 모든 섹터를 전략에 맞게",
      "선별 구축합니다.",
    ],
  ],
  closing: {
    lead: "코칭 혹은 액션.",
    body: [
      "글로벌 대기업부터 스타트업, 스몰 브랜드까지",
      "30개 이상 조직에 작품 빚듯 목표 지표를",
      "달성했습니다.",
    ],
  },
} as const;

export const HOME_GROWTH = {
  label: "Hacking Growth See",
  intro: "그로스에는 정해진 정답이 없습니다.",
  lead: [
    "브랜드가 가진 자산과 한계를 명확히 알",
    "고 우선순위 로드맵을 그려야 합니다.",
  ],
  items: [
    {
      no: "1",
      title: ["프로젝트 성공률을 높이는", "소수 브랜드 한정 시스템"],
      body: [
        "인당 투입하는 브랜드 수를 제한하고",
        "성과 챌린지 달성에 따른 보상으로",
        "브랜드의 성공률을 더욱 높입니다.",
      ],
    },
    {
      no: "2",
      title: ["이미 검증된 업무 구조와", "보다 경쟁력 있는 인프라 제공"],
      body: [
        "통합 마케팅에 필요한 모든 인력,",
        "채널과 제작 풀이 턴 키 방식으로",
        "목표에 맞게 스프레드됩니다.",
      ],
    },
    {
      no: "3",
      title: ["인하우스의 브랜드 마케팅부터", "그로스해킹의 데이터 설계까지"],
      body: [
        "브랜드에 필요한 대부분의 섹터를",
        "전문 스킬로 보유하고 또 연결해서",
        "적기의 최적화를 완성합니다.",
      ],
    },
  ],
} as const;

/**
 * "어떤 결과가 필요하신가요?" — 두 카드.
 * 프레이머는 CMO 기획 프로그램 / 종합 IMC 프로젝트였는데, 지금 실제로 열려 있는
 * 두 랜딩으로 갈아 끼웠다 (사장님 지시).
 */
export const HOME_CHOICE = {
  title: "어떤 결과가 필요하신가요?",
  cards: [
    {
      kicker: "광고 소재가 먼저 필요하다면",
      title: "숏폼 스튜디오",
      cta: "상세보기",
      href: "/shortform",
      shot: "/sns/krafton-contents.jpg",
    },
    {
      kicker: "채널 · 컨텐츠 · 광고를 함께 굴릴 팀이 필요하다면",
      title: "브랜드 채널 마케팅",
      cta: "상세보기",
      href: "/sns-brand",
      shot: "/sns/yeolda-shoot.jpg",
    },
  ],
} as const;
