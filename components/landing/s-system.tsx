/**
 * System — "왜 이 가격에 이 퀄리티가 가능한가".
 *
 * 앞의 Service 섹션은 **무엇을 파는가**(1·2·3 스텝)를 말한다. 그 다음 방문자가 실제로
 * 품는 의문은 하나다 — "이 값에 이 퀄리티가 왜 나오지?". 그 답이 이 섹션이다:
 * 편당 단가로 소재를 파는 팀이 아니라, 브랜드 프로젝트를 통으로 굴리던 팀이
 * 그 안의 제작 시스템만 잘라 열었다는 것.
 *
 * 배경은 다크로 깐다. 앞(Service, 웜 오프화이트)과 뒤(Clients 로고월, 화이트) 사이에서
 * 이 주장이 한 덩어리로 세게 읽혀야 하고, 밝게 두면 세 섹션이 흰 띠 하나로 뭉친다.
 * 카드 구조(번호 → 타이틀 → 본문)는 Service 카드 그대로, 다크 위 표면 처리만
 * Crew 섹션의 카드(테두리 white/10 + 면 white/[0.04])를 따른다. 새 색은 쓰지 않는다.
 */

/**
 * 2026-08-13 사장님 지시로 교체. 이전 카드는 *일하는 방식*(위너 기준·사이클·분업)을
 * 말했는데, 방문자가 "이 값에 이 퀄리티가 왜 나오지?"에 실제로 납득하는 근거는
 * **누가 붙느냐**였다. 그래서 세 칸을 전부 이력으로 바꿨다.
 * 검증 불가한 수치를 새로 만들지 않고, 사장님이 불러 주신 이력만 옮긴다.
 */
/**
 * 아이콘은 장식이 아니라 카드가 말하는 자산의 종류를 가리킨다 —
 * 감도(스파크) / 수상 이력(뱃지) / 운영 규모(우상향 그래프).
 * 아이콘 라이브러리를 새로 들이지 않고 이 레포의 인라인 SVG 관례를 따른다.
 */
const ICONS = {
  spark: (
    <path
      d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z"
      strokeLinejoin="round"
    />
  ),
  badge: (
    <>
      <circle cx="12" cy="9" r="5.2" />
      <path d="M8.3 13.4L7 21l5-2.4L17 21l-1.3-7.6" strokeLinejoin="round" />
    </>
  ),
  growth: (
    <>
      <path d="M4 19h16" strokeLinecap="round" />
      <path d="M7 19v-4.5M12 19V9.5M17 19V5.5" strokeLinecap="round" />
    </>
  ),
} as const;

const CARDS = [
  {
    no: "1",
    icon: "spark" as const,
    title: "AI 강연자 출신 총괄 디렉터",
    body: "중소기업청 모두의창업 AI 강연자로 선 총괄 디렉터가 누구보다 효율적인 AI 제작 감도를 반영합니다.",
  },
  {
    no: "2",
    icon: "badge" as const,
    title: "구글·메타 우수 크리에이티브 기획제작진",
    body: "구글 5대·메타 15대 우수 크리에이티브에 선정된 브랜드 출신 기획제작진, 그리고 국내 초기 숏폼 바이럴을 만든 블랭크 출신 콘텐츠 PD가 붙습니다.",
  },
  {
    no: "3",
    icon: "growth" as const,
    title: "인당 평균 운영 경험 100억",
    body: "퍼포먼스 마케팅 인당 평균 운영 경험 100억 원. 숏폼 납품 이력이 다수인 담당이 소재 판독을 맡습니다.",
  },
];

export function System() {
  return (
    <section
      id="system"
      className="on-dark scroll-mt-16 bg-night py-20 text-white md:py-28"
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <p className="eyebrow">System</p>

        <h2 className="mt-5 max-w-3xl text-[1.5rem] leading-[1.35] font-bold sm:text-[2.125rem] sm:leading-[1.3] lg:text-[2.75rem]">
          프로젝트에서 검증한 제작 시스템을
          <br />
          그대로 패키지에 넣었습니다
        </h2>

        <p className="mt-6 max-w-3xl text-[0.9375rem] leading-[1.85] text-white/60 sm:mt-7 sm:text-base">
          저희는 원래 편당 단가로 소재를 파는 팀이 아니었습니다. 브랜드 하나를
          맡아 기획부터 소재 제작, 캠페인 운영까지 통으로 수행해온 프로젝트
          팀입니다. 그 프로젝트 안에서 반복 검증된 &lsquo;위너 소재 제작
          시스템&rsquo;만 잘라내, 편수 단위로 결제할 수 있게 연 것이 이
          패키지입니다.
        </p>

        <div className="mt-12 grid gap-5 md:mt-14 md:grid-cols-3">
          {CARDS.map((c) => (
            <div
              key={c.no}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-7"
            >
              <span
                aria-hidden="true"
                className="grid size-11 place-items-center rounded-xl bg-accent/20 text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-[22px]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  {ICONS[c.icon]}
                </svg>
              </span>
              <h3 className="mt-4 flex items-start gap-2.5 text-lg font-bold">
                <span className="stat-figure mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-accent text-xs text-white">
                  {c.no}
                </span>
                {c.title}
              </h3>
              <p className="mt-3.5 text-sm leading-[1.85] text-white/60">
                {c.body}
              </p>
            </div>
          ))}
        </div>

        {/* 누적 제작 소재 편수는 실집계가 확인되기 전까지 싣지 않는다 —
            근거 섹션에서 검증 안 된 숫자를 하나 얹는 순간 나머지 숫자도 같이 의심받는다.

            2026-08-13: "브랜드 프로젝트 30+" 만 두면 30 이라는 숫자가 오히려 작아 보인다
            (사장님 지적). 한 건이 연·분기 단위로 굴러간 프로젝트라는 단위를 밝혀야
            같은 숫자가 제대로 읽힌다. */}
        <p className="mt-8 text-right text-xs text-white/40">
          연·분기 단위 브랜드 프로젝트 30+ 수행
        </p>
      </div>
    </section>
  );
}
