import { Section, SectionHeading } from "@/components/ui/section";
import { METHOD, POV } from "@/lib/sns-brand";
import { Rich } from "./rich";

/**
 * 관점 — "운영 대행과 무엇이 다른가".
 * 사례를 보기 전에 판단 기준을 먼저 세운다. 여기서 대비표를 한 번 보여주면
 * 아래 케이스가 전부 그 기준의 증거로 읽힌다.
 */
export function Pov() {
  return (
    <Section eyebrow="Point of View" alt id="pov">
      <SectionHeading>
        컨텐츠는 그냥 감이 아니라,
        <br />
        <strong className="font-bold">철저하게 의도한 마케팅 전략으로</strong>
      </SectionHeading>
      <p className="mt-4 text-xs text-muted">— {POV.titleNote}</p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
        <div className="min-w-0 space-y-5">
          {POV.body.map((para) => (
            <Rich
              key={para.slice(0, 14)}
              html={para}
              className="text-[0.9375rem] leading-[1.9] text-ink-soft sm:text-base"
            />
          ))}

          <blockquote className="!mt-9 border-l-2 border-gold pl-5 text-[1.0625rem] leading-[1.7] font-bold text-ink sm:text-xl">
            “{POV.quote}”
          </blockquote>
        </div>

        {/* 대비표 — 두 칸. 왼쪽은 흐리게, 오른쪽만 또렷하게 */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {POV.contrast.map((col, i) => (
            <div
              key={col.label}
              className={
                i === 0
                  ? "rounded-2xl border border-line bg-paper p-6"
                  : "rounded-2xl border border-accent/30 bg-accent/[0.06] p-6"
              }
            >
              <p
                className={
                  i === 0
                    ? "text-xs font-bold text-muted"
                    : "text-xs font-bold text-accent-deep"
                }
              >
                {col.label}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.items.map((item) => (
                  <li
                    key={item}
                    className={
                      i === 0
                        ? "flex gap-2.5 text-sm leading-[1.7] text-muted"
                        : "flex gap-2.5 text-sm leading-[1.7] font-bold text-ink"
                    }
                  >
                    <span
                      aria-hidden
                      className={i === 0 ? "text-line" : "text-accent"}
                    >
                      {i === 0 ? "×" : "✓"}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/** 방식 — 3개 모듈. 필요한 것만 골라 붙는다는 게 이 서비스의 판매 논리다 */
export function Method() {
  return (
    <Section eyebrow="Method" id="method">
      <SectionHeading>
        성과에 필요한 작업만 하는,
        <br />
        <strong className="font-bold">덕션 시스템</strong>
      </SectionHeading>
      <p className="mt-5 max-w-2xl text-[0.9375rem] leading-[1.8] text-muted sm:text-base">
        {METHOD.lead}
      </p>

      <ol className="mt-12 grid gap-5 md:grid-cols-3">
        {METHOD.modules.map((m) => (
          <li
            key={m.no}
            className="rounded-2xl border border-line bg-paper p-7 sm:p-8"
          >
            <span className="stat-figure grid size-8 place-items-center rounded-full bg-accent text-xs text-white">
              {m.no}
            </span>
            <h3 className="mt-5 text-lg font-bold">{m.title}</h3>
            <p className="mt-3.5 text-sm leading-[1.85] text-muted">{m.body}</p>
          </li>
        ))}
      </ol>

      <p className="mt-8 text-sm leading-[1.8] text-muted">{METHOD.footnote}</p>
    </Section>
  );
}
