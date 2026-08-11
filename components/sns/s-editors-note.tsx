import { EDITORS_NOTE } from "@/lib/sns-brand";
import { MagHeadline, PullQuote, Spread } from "./mag";

/** Editor's Note — 케이스를 읽기 전에 관점부터 밝힌다 */
export function EditorsNote() {
  return (
    <section id="note" className="scroll-mt-20 bg-paper py-16 sm:py-24">
      <Spread>
        <MagHeadline label="Editor's Note" />

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
          <h2 className="mag-serif text-[1.5rem] text-ink sm:text-[2rem] lg:text-[2.25rem]">
            {EDITORS_NOTE.title}
          </h2>
          <div className="mag-body lg:pt-2">
            {EDITORS_NOTE.body.map((para) => (
              <p key={para.slice(0, 12)}>{para}</p>
            ))}
          </div>
        </div>

        <PullQuote source={EDITORS_NOTE.quoteSource}>
          {EDITORS_NOTE.quote}
        </PullQuote>
      </Spread>
    </section>
  );
}
