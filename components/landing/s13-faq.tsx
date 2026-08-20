import { Section, SectionHeading } from "@/components/ui/section";
import { SHORTFORM_FAQ } from "@/lib/shortform-faq";
import { KeepDots } from "@/components/ui/keep-dots";

/** S13. FAQ — 아코디언 */
export function Faq() {
  return (
    <Section eyebrow="FAQ">
      <SectionHeading>자주 묻는 질문</SectionHeading>

      <div className="mt-10 overflow-hidden rounded-2xl border border-line">
        {SHORTFORM_FAQ.map((faq, i) => (
          <details
            key={faq.q}
            className={i > 0 ? "border-t border-line" : undefined}
          >
            <summary className="cursor-pointer list-none px-6 py-5 text-base font-bold marker:hidden hover:bg-paper-alt">
              <KeepDots text={faq.q} />
            </summary>
            <p className="max-w-3xl px-6 pb-6 text-sm leading-[1.8] text-muted">
              <KeepDots text={faq.a} />
            </p>
          </details>
        ))}
      </div>
    </Section>
  );
}
