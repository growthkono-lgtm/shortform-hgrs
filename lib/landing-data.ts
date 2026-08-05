/**
 * 랜딩 실데이터.
 *
 * ⚠️ 출처가 붙은 수치는 반드시 출처와 함께 노출한다.
 * 자체 집계 수치는 "자체 집계" 표기를 뺄 수 없다 — 표시광고법상 근거 없는
 * 수치 단정으로 읽힐 수 있고, 결제를 받는 사이트는 기준이 더 엄격하다.
 */

/** S2 — 시장 근거 */
export type MarketStat = {
  figure: string;
  unit?: string;
  caption: string;
  source: string;
  sourceUrl: string;
};

export const MARKET_STATS: MarketStat[] = [
  {
    figure: "76.1",
    unit: "%",
    caption:
      "온라인 동영상 이용자가 가장 많이 보는 형식은 숏츠입니다. 인스타그램 릴스(18.6%)가 뒤를 잇습니다.",
    source: "방송통신위원회 방송매체 이용행태조사",
    sourceUrl: "https://www.kcc.go.kr",
  },
  {
    figure: "10 → 35",
    unit: "%",
    caption:
      "틱톡 이용률은 2021년 10%에서 2025년 35%로 늘었습니다. 이용층도 10대에서 50대까지 넓어졌습니다.",
    source: "한국갤럽 미디어·콘텐츠·SNS 이용률 조사",
    sourceUrl: "https://www.gallup.co.kr/gallupdb/reportContent.asp?seqNo=1586",
  },
  {
    figure: "5.7",
    unit: "%",
    caption:
      "숏폼 이용자의 5.7%가 최근 한 달 안에 숏폼을 보고 실제 구매까지 갔습니다. 도달이 아니라 결제로 이어진 비율입니다.",
    source: "방송통신위원회 방송매체 이용행태조사",
    sourceUrl: "https://www.kcc.go.kr",
  },
];

/**
 * S5 — 성과.
 *
 * 광고주가 직접 밝힌 결과만 싣는다. 우리가 산출한 수치가 아니므로
 * "브랜드가 전한 결과"임을 화면에도 명시한다.
 */
export type OutcomeCase = {
  headline: string;
  metrics: { value: string; label: string }[];
  quote: string;
  company: string;
  role?: string;
  /** 해당 브랜드의 실제 소재가 있을 때만 채운다 */
  poster?: string;
  video?: string;
};

export const OUTCOME_CASES: OutcomeCase[] = [
  {
    headline: "3년 내 최고 ROAS, 가입 CPA는 40% 낮췄습니다",
    metrics: [
      { value: "3년 내 최고", label: "ROAS" },
      { value: "40%", label: "가입 CPA 절감" },
    ],
    quote:
      "3년 내 최고 ROAS 달성했고, 가입 단가 CPA도 40% 절감했어요. M/S 모니터링도 잘 챙겨줬어요.",
    company: "G 대기업",
    role: "실장",
  },
  {
    headline: "월 300만원으로 시작한 라인이 5개월 만에 2천만원을 씁니다",
    metrics: [
      { value: "300만 → 2,000만", label: "월 광고비 (5개월)" },
      { value: "1개 라인", label: "통으로 위임" },
    ],
    quote:
      "월에 3백 쓰며 시작한 신규 브랜드 라인을 통으로 맡겼는데 5개월 안에 2천까지 씁니다. 저희 브랜드 보신 분들은 다 아실 겁니다.",
    company: "M 헤어뷰티 커머스",
    poster: "/portfolio/reels/moen-ppl.jpg",
    video: "/portfolio/reels/moen-ppl.mp4",
  },
  {
    headline: "오가닉 매출 2배, 구매전환율 10%P 개선",
    metrics: [
      { value: "2배", label: "오가닉 매출" },
      { value: "+10%P", label: "구매전환율" },
      { value: "600%", label: "KPI 달성" },
    ],
    quote:
      "조직이 고민하던 KPI 지표를 홀로 600% 달성. 그로스팀을 컨텐츠팀으로 셋팅 운영하더니 오가닉 매출 2배 증대, 구매전환율 10%P 개선.",
    company: "Y 상담 스타트업",
    role: "대표",
  },
];

/** S8 — 카운터 */
export const TRUST_COUNTERS = [
  {
    key: "brand_count",
    value: "30",
    suffix: "+",
    label: "함께한 브랜드",
    en: "Brands",
    note: null as string | null,
  },
  {
    key: "creative_count",
    value: "300",
    suffix: "+",
    label: "제작한 영상",
    en: "Videos Produced",
    note: "크래프톤 배틀그라운드 이스포츠 연간 제작분 기준",
  },
  {
    key: "avg_project_price",
    value: "₩20,000,000",
    suffix: "+",
    label: "평균 프로젝트 단가",
    en: "Avg. Project Value",
    note: null,
  },
  {
    key: "achievement",
    value: "90",
    suffix: "%",
    label: "브랜드 목표 달성률",
    en: "Goal Achievement",
    note: "자체 집계 기준",
  },
] as const;

/** S9 — 스텝별 소요기간 (영업일 기준 예상) */
export const FULL_STEPS = [
  { title: "결제", duration: "당일" },
  { title: "담당자 배정", duration: "1일 내" },
  {
    title: "브랜드 프로필 · 그로스 AI 가이드라인",
    duration: "2~3일",
  },
  { title: "인플루언서 모집", duration: "7~10일", note: "D-day 안내" },
  { title: "배포 완료 · 결과 리포트", duration: "3~5일", policy: "noIndividualEdit" },
  { title: "전환 숏폼 제작", duration: "7~14일" },
  { title: "워터마크 검수 (1회 수정)", duration: "2~3일" },
  { title: "최종 승인 · 다운로드", duration: "1일 내" },
] as const;

export const SHORTS_ONLY_STEPS = [
  { title: "결제", duration: "당일" },
  { title: "담당자 배정", duration: "1일 내" },
  { title: "가이드라인 · 소스 접수", duration: "2~3일" },
  { title: "제작", duration: "7~14일" },
  { title: "검수 · 승인 · 다운로드", duration: "2~3일" },
] as const;
