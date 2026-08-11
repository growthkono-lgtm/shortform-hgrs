import { Cta } from "@/components/ui/cta";

/** /portfolio 첫 화면 — 이 페이지가 무엇을 모아 둔 곳인지만 짧게 말한다 */
export function PortfolioHero() {
  return (
    <section className="hero-night on-dark relative overflow-hidden pt-28 pb-16 text-white sm:pt-32 sm:pb-20">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <p className="eyebrow">Portfolio</p>
        <h1 className="mt-5 text-[1.75rem] leading-[1.3] font-bold text-balance sm:text-[2.75rem] sm:leading-[1.24] lg:text-[3.25rem]">
          글로벌 대기업부터 저예산 스타트업까지
          <br />
          함께 만든 성과 기록
        </h1>
        <p className="mt-5 max-w-2xl text-[0.9375rem] leading-[1.85] text-white/65 sm:text-base">
          실제로 편성·제작한 컨텐츠와 브랜드별 통합 액션 조합을 그대로
          모았습니다.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Cta href="/sns-brand#contact" variant="invert">
            프로젝트 상담 신청
          </Cta>
          <Cta href="/sns-brand" variant="outlineLight">
            브랜드 SNS 채널 보기
          </Cta>
        </div>
      </div>
    </section>
  );
}
