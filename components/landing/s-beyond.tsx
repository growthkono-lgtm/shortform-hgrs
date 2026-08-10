import { PARTNERSHIP_URL } from "@/lib/constants";

/**
 * Beyond — Pricing과 FAQ 사이의 **갈림길 안내판**.
 *
 * 가격을 보고 "우리한테 필요한 건 소재가 아니라 브랜드 전체인데"로 갈리는 방문자가 있다.
 * 그 사람이 여기서 답을 못 찾으면 그냥 나간다.
 *
 * 다만 이 랜딩의 목적은 패키지 결제다. 그래서 **풀 섹션이 아니라 낮은 밴드**로 둔다 —
 * 배경 대비는 약하게, 버튼은 하나만. 구매 동선을 끊지 않는 게 이 섹션의 설계 조건이다.
 */
export function Beyond() {
  return (
    <section id="beyond" className="scroll-mt-16 bg-paper px-5 py-12 sm:px-8 md:py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 rounded-2xl border border-line bg-paper-alt px-6 py-7 sm:px-8 md:flex-row md:items-center md:justify-between md:gap-10">
        <div className="max-w-2xl">
          <h2 className="text-base font-bold sm:text-lg">
            소재를 넘어, 브랜드 전체의 그로스가 필요하신가요?
          </h2>
          <p className="mt-2.5 text-sm leading-[1.8] text-muted">
            포지셔닝 재정의, SNS 채널 브랜드마케팅, 캠페인 설계까지 — 이 스튜디오의
            모체인 해그로시는 브랜드 단위 프로젝트로 일합니다. 크래프톤, 뤼이드,
            파크론과의 성과는 그 방식에서 나왔습니다.
          </p>
        </div>

        <a
          href={PARTNERSHIP_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full border border-ink/25 px-5 py-3 text-sm font-bold whitespace-nowrap transition-colors duration-200 hover:border-ink hover:bg-ink hover:text-paper md:self-auto"
        >
          IMC 프로젝트 문의
          <svg
            viewBox="0 0 24 24"
            aria-hidden
            className="size-4 fill-none stroke-current stroke-2"
          >
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </section>
  );
}
