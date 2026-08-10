/**
 * 성장 사례 4건 — 피그마 개편안의 독립 섹션 4개.
 *
 * 대표 소재는 사장님이 브랜드별로 직접 지정했다(media[0]). 여기에 여백을 메우기 위해
 * **같은 브랜드 소재만** 한 편 더 붙인다(media[1]). 다른 브랜드 소재를 섞으면
 * 그 소재가 낸 성과처럼 읽히므로 절대 섞지 않는다.
 *
 * 성과 문구는 피그마 주석 그대로다. 사례↔주석 대응은 캔버스 좌표로 확인했다
 * (뤼이드 Y498 / 주석 Y1470 … 크래프톤 Y2151). 추정이 아니다.
 *
 * 크래프톤 대표 소재는 원본이 유튜브 쇼츠(BdGKoiPITZ0)인데 저작권 문제로
 * 영상을 싣지 않고 정지 스크린샷만 쓴다 (플레이어 UI 상단 175px 잘라냄).
 */

export type CaseMedia = { poster: string; video?: string; aspect: string };

export type GrowthCase = {
  title: string;
  scale: string;
  media: CaseMedia[];
  /** 우상향 연출용 지표. 성과 문장 안의 숫자를 그대로 쓴다 — 새로 지어내지 않는다 */
  metrics?: { label: string; to: number; prefix?: string; suffix?: string; grouped?: boolean }[];
  /** 성과 한 줄 — 크게 조판한다 */
  result: string;
  /**
   * 어떤 계약 형태에서 난 성과인지. 성과 문장과 반드시 함께 보여야 한다.
   *
   * 문구를 "소재 납품 및 캠페인 운영 대행 시" → "풀 프로젝트 수행 성과 (…)"로 바꿨다.
   * 앞의 표현은 "이 패키지를 사면 이 성과가 난다"로 읽힐 여지가 있었다.
   * 실제로는 브랜드를 통으로 맡은 프로젝트에서 나온 결과이고, 이 패키지는 그 프로젝트의
   * **제작 시스템만** 떼어 온 것이다 — 그 구분이 라벨에서 먼저 보여야 한다.
   */
  scope: string;
};

const clip = (slug: string, aspect = "9 / 16"): CaseMedia => ({
  poster: `/portfolio/clips/${slug}.jpg`,
  video: `/portfolio/clips/${slug}.mp4`,
  aspect,
});

export const GROWTH_CASES: GrowthCase[] = [
  {
    title: "뤼이드 리얼 아카데미",
    scale: "투자 2,000억",
    media: [clip("riiid-report"), clip("riiid-momcafe")],
    metrics: [
      { label: "연속 고지출", to: 3, suffix: "주" },
      { label: "CPA 단가", to: 1, prefix: "▼", suffix: "위" },
    ],
    result: "3주 연속 고지출 & CPA 단가 견인 소재",
    scope: "풀 프로젝트 수행 성과 (소재 제작 + 캠페인 운영)",
  },
  {
    title: "파크론 제로블럭",
    scale: "매출 200억대",
    media: [
      clip("parkron-tpu"),
      // 같은 제로블럭 소재 — 이전 작업분에서 이미 웹용으로 인코딩돼 있다
      {
        poster: "/portfolio/reels/zeroblock-itv.jpg",
        video: "/portfolio/reels/zeroblock-itv.mp4",
        aspect: "9 / 16",
      },
    ],
    metrics: [
      { label: "메타 예산 증액", to: 5, suffix: "배" },
      { label: "CPA 절감", to: 9, prefix: "▼", suffix: "만원" },
    ],
    result: "메타 캠페인 예산 5배 증액 성공, CPA 9만원 절감 소재 중 일부",
    scope: "풀 프로젝트 수행 성과 (소재 제작 + 캠페인 운영)",
  },
  {
    title: "이노바인코리아 모에브",
    scale: "매출 300억대",
    // 모에브는 확보된 소재가 이 컷 하나뿐이다. 다른 브랜드로 채우지 않는다.
    media: [{ poster: "/portfolio/cases/inovine-moev.jpg", aspect: "1 / 1" }],
    metrics: [
      { label: "3개월 매출", to: 4000, prefix: "₩", suffix: "만", grouped: true },
      { label: "ROAS", to: 3, suffix: "배" },
    ],
    result:
      "제품 출시 고투마켓 단계 소재 부스팅, 3개월 내 매출 4천만원 · ROAS 3배",
    scope: "풀 프로젝트 수행 성과",
  },
  {
    title: "크래프톤 배틀그라운드",
    scale: "글로벌",
    media: [
      { poster: "/portfolio/cases/krafton-jonathan.jpg", aspect: "800 / 1263" },
      clip("krafton-pnc-inonix"),
    ],
    result: "대표이사 컨텐츠부터 협찬 연예인까지 다양한 바이럴 쇼츠 촬영 기획 제작",
    scope: "연간 공식 프로젝트 수행 (바이럴 컨텐츠 기획·제작)",
  },
];
