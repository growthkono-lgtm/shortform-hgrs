/**
 * "누가 만드나" 섹션 데이터.
 *
 * FAQ에만 한 줄로 묻혀 있던 문항(숏폼 기획제작은 어떤 전문가가 하나요?)을 섹션으로 꺼낸 것이다.
 * 똑같은 숏폼 외주처 중에서 고를 때 실제로 갈리는 건 결과물이 아니라
 * **뒤에 회사와 시스템이 있느냐**다. 그래서 이 섹션의 근거는 두 가지뿐이다 —
 * 역할이 나뉜 팀(아래 ROLES)과 그 팀이 실제로 나가 찍은 현장 사진(CREW_SHOTS).
 *
 * ⚠️ ROLES 의 `from`(출신)은 **문서로 확인된 것만 적는다**.
 *    현재 확인된 두 줄은 FAQ에 사장님이 직접 확정한 문구가 출처다:
 *      · 블랭크 코퍼레이션 출신
 *      · 대형 라이브커머스 종합몰 컨텐츠 담당자 출신
 *    나머지는 역할만 두고 `from`을 비웠다. 실제 이력이 확인되는 대로 여기만 채우면
 *    화면은 자동으로 따라온다. 확인 안 된 회사명을 임의로 넣지 말 것 —
 *    외주처 검증 단계에서 제일 먼저 찔리는 게 이 줄이다.
 */

export type CrewRole = {
  /** 아바타에 찍히는 이니셜 — 역할 영문 약어 */
  tag: string;
  role: string;
  /** 확인된 출신. 없으면 담당 범위를 대신 보여준다 */
  from?: string;
  scope: string;
};

export const CREW_ROLES: CrewRole[] = [
  {
    tag: "CD",
    role: "숏폼 기획 총괄",
    from: "블랭크 코퍼레이션 출신",
    scope: "후킹·구성·USP 설계",
  },
  {
    tag: "CM",
    role: "커머스 컨텐츠 기획",
    from: "대형 라이브커머스 종합몰 컨텐츠 담당 출신",
    scope: "상세·판매 흐름 설계",
  },
  // 사장님 본인. 이력이 확인된 줄이라 from 에 올린다 (30여 브랜드 그로스 프로젝트 총괄)
  {
    tag: "GH",
    role: "그로스 헤드",
    from: "30여 브랜드 그로스 프로젝트 총괄",
    scope: "캠페인 구조·KPI 리뷰",
  },
  { tag: "PF", role: "퍼포먼스 미디어바이어", scope: "소재별 CPA·ROAS 판독" },
  { tag: "DP", role: "촬영 감독", scope: "현장 디렉팅·촬영" },
  { tag: "ED", role: "편집 리드", scope: "컷 편집·리텐션 설계" },
  { tag: "ED", role: "숏폼 에디터", scope: "변주본·A/B 파생" },
  { tag: "MG", role: "모션 디자이너", scope: "자막·모션 그래픽" },
  { tag: "CW", role: "카피라이터", scope: "훅 카피·CTA 문구" },
  { tag: "PM", role: "시딩 · 제작 PM", scope: "일정·산출물 관리" },
];

/**
 * 실제 촬영 현장 사진 — 팀이 나가서 찍은 사진.
 * hgrs-assets/drive-full/촬영현장스케치 원본을 webp 1200px로 변환해 넣었다.
 *
 * **이 섹션의 근거는 이 사진들이다.** 스톡이 아니라 우리 사람이 장비를 들고 있는 사진이라
 * "제대로 된 집단"이 문장이 아니라 눈으로 읽힌다. 임의 이미지로 바꾸지 말 것.
 * 순서도 의미가 있다 — 맨 앞 한 장이 큰 칸에 들어간다(사람이 여럿 나온 컷을 앞에).
 */
export const CREW_SHOTS: { src: string; alt: string; ratio: string }[] = [
  { src: "/portfolio/crew/crew-01.webp", alt: "스튜디오 다중 카메라 촬영 현장", ratio: "4/3" },
  { src: "/portfolio/crew/crew-02.webp", alt: "브랜드 제품 인터뷰 촬영 현장", ratio: "4/3" },
  { src: "/portfolio/crew/crew-03.webp", alt: "짐벌 촬영 현장", ratio: "16/9" },
  { src: "/portfolio/crew/crew-04.webp", alt: "오프라인 매장 촬영 현장", ratio: "4/3" },
  { src: "/portfolio/crew/crew-05.webp", alt: "제품 스틸 촬영 세팅", ratio: "4/3" },
  { src: "/portfolio/crew/crew-06.webp", alt: "촬영 중인 카메라 모니터", ratio: "4/3" },
  { src: "/portfolio/crew/crew-07.webp", alt: "조명·소품 세팅 중인 촬영 현장", ratio: "3/4" },
  { src: "/portfolio/crew/crew-08.webp", alt: "제품 조명 세팅 현장", ratio: "3/4" },
];

/** 팀 시스템의 근거 3줄 — 숫자는 사장님 이력(30여 브랜드) 기준 */
export const CREW_FACTS: { figure: string; label: string; note: string }[] = [
  {
    figure: "30+",
    label: "브랜드 그로스·컨텐츠 프로젝트",
    note: "소재를 만든 게 아니라 매출 사이클을 함께 돌린 횟수입니다.",
  },
  {
    figure: "10",
    label: "역할이 나뉜 제작 인원",
    note: "기획·촬영·편집·모션·퍼포먼스가 각자 담당으로 붙습니다.",
  },
  // 사무실 상주 인력이 아니라 프로젝트 단위로 붙는 구조라 "오피스" 숫자는 근거가 못 된다.
  // 대신 이 팀이 원래 굴리던 프로젝트 규모를 세운다 (랜딩 전체에서 쓰는 값과 같다)
  {
    figure: "₩2,000만+",
    label: "평균 프로젝트 단가",
    note: "브랜드를 통으로 맡던 팀이 숏폼 소재 영역만 잘라 열었습니다.",
  },
];
