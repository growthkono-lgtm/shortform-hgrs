import { Section, SectionHeading } from "@/components/ui/section";
import { BRAND_PLANS } from "@/lib/sns-brand";

/**
 * 브랜드 채널 그로스 — 두 플랜. (2026-08-20)
 *
 * 소개서(`scripts/build-deck.ts` `brand-plan` 장)의 두 칸 레이아웃을 그대로
 * 웹으로 옮겼다. 소개서에서는 PLAN B 칸만 인디고 테두리·엷은 인디고 면으로
 * 구분하는데(`.plan-col-pkg`), 여기서도 같은 규칙을 쓴다.
 *
 * **금액 숫자는 없다.** 문안은 전부 `lib/sns-brand.ts` 의 BRAND_PLANS 에서
 * 읽는다 — 이 파일에는 카피를 적지 않는다.
 */
export function Plans() {
  return (
    <Section id="plans" eyebrow={BRAND_PLANS.eyebrow}>
      <SectionHeading>{BRAND_PLANS.title[0]}</SectionHeading>
      <p className="mt-5 max-w-2xl text-[0.9375rem] leading-[1.8] text-muted sm:text-base">
        {BRAND_PLANS.lead}
      </p>

      {/* 모바일 1열 → lg 2열. 카드가 stretch 되므로 조건표는 mt-auto 로 바닥에 붙는다 */}
      <div className="mt-10 grid gap-4 sm:mt-12 lg:grid-cols-2 lg:gap-5">
        {BRAND_PLANS.plans.map((plan, i) => (
          <div
            key={plan.key}
            className={`flex flex-col rounded-2xl border p-6 sm:p-8 ${
              i === 0
                ? "border-line bg-paper"
                : "border-accent/40 bg-accent/[0.04]"
            }`}
          >
            <p className="eyebrow">{plan.key}</p>
            <h3 className="mt-2.5 text-xl leading-[1.35] font-bold sm:text-[1.5rem]">
              {plan.name}
            </h3>
            <p className="mt-2.5 text-[0.9375rem] leading-[1.8] text-muted">
              {plan.desc}
            </p>

            <ul className="mt-6 space-y-2.5">
              {plan.items.map((item) => (
                <li
                  key={item.title}
                  className="rounded-xl bg-paper-alt px-5 py-4"
                >
                  <strong className="block text-[0.9375rem] leading-[1.5] font-bold">
                    {item.title}
                  </strong>
                  {item.note && (
                    <span className="mt-1.5 block text-[0.8125rem] leading-[1.7] text-muted">
                      {item.note}
                    </span>
                  )}
                </li>
              ))}
            </ul>

            <dl className="mt-auto pt-7">
              {plan.meta.map((row) => (
                <div
                  key={row.k}
                  className="flex gap-4 border-t border-line py-3.5 text-sm sm:gap-6"
                >
                  <dt className="w-20 shrink-0 text-muted sm:w-24">{row.k}</dt>
                  <dd className="leading-[1.6] font-bold">{row.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      {/* 소개서의 `.oneline` 밴드 — 정가가 있는 라인은 숏폼뿐이라는 못 */}
      <p className="mt-8 rounded-2xl bg-night px-6 py-6 text-center text-[0.9375rem] leading-[1.6] font-bold text-white sm:text-base">
        {BRAND_PLANS.note}
      </p>
    </Section>
  );
}
