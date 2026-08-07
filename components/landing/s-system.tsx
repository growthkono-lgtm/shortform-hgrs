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

const CARDS = [
  {
    no: "1",
    title: "위너 기준이 먼저 정의됩니다",
    body: "조회수가 아니라 구매 전환이 기준입니다. 소재별로 훅 유지율·CPA·ROAS를 판독하고, 지출이 꺾이지 않고 이어지는 소재만 '위너'로 분류해 변주합니다.",
  },
  {
    no: "2",
    title: "프로젝트에서 굴리던 사이클 그대로",
    body: "기획→제작→집행 데이터 판독→변주 제작으로 이어지는 사이클을 프로젝트 단위에서 수십 회 반복해 왔습니다. 이 패키지는 그 사이클 중 '기획→제작' 구간을 상품화한 것입니다.",
  },
  {
    no: "3",
    title: "역할이 분업된 팀이 붙습니다",
    body: "기획·촬영·편집·모션·퍼포먼스 판독이 각자 담당으로 붙는 10인 팀 시스템입니다. 한 명의 프리랜서가 아니라, 담당이 빠져도 멈추지 않는 구조로 납품합니다.",
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
          저희는 원래 편당 단가로 소재를 파는 팀이 아니었습니다. 브랜드 하나를 맡아
          기획부터 소재 제작, 캠페인 운영까지 통으로 수행해온 프로젝트 팀입니다. 그
          프로젝트 안에서 반복 검증된 &lsquo;위너 소재 제작 시스템&rsquo;만 잘라내, 편수
          단위로 결제할 수 있게 연 것이 이 패키지입니다.
        </p>

        <div className="mt-12 grid gap-5 md:mt-14 md:grid-cols-3">
          {CARDS.map((c) => (
            <div
              key={c.no}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-7"
            >
              <h3 className="flex items-start gap-2.5 text-lg font-bold">
                <span className="stat-figure mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-accent text-xs text-white">
                  {c.no}
                </span>
                {c.title}
              </h3>
              <p className="mt-3.5 text-sm leading-[1.85] text-white/60">{c.body}</p>
            </div>
          ))}
        </div>

        {/* 누적 제작 소재 편수는 실집계가 확인되기 전까지 싣지 않는다 —
            근거 섹션에서 검증 안 된 숫자를 하나 얹는 순간 나머지 숫자도 같이 의심받는다. */}
        <p className="mt-8 text-right text-xs text-white/40">브랜드 프로젝트 30+</p>
      </div>
    </section>
  );
}
