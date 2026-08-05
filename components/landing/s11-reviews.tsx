import { Section, SectionHeading } from "@/components/ui/section";
import { AssetSlot } from "@/components/ui/slot";

/** S11. 고객 후기 — Reviews (캡처 확보 전 텍스트 카드로 시작) */
export function Reviews() {
  return (
    <Section eyebrow="Reviews">
      <SectionHeading>실제로 받은 말들</SectionHeading>

      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <AssetSlot
            key={i}
            name={`review_${i + 1}`}
            ratio="4/3"
            hint="카톡·슬랙 캡처 (마스킹 필수)"
          />
        ))}
      </div>

      <p className="mt-8 text-xs text-muted">
        캡처 확보 전까지는 텍스트 후기 카드로 대체합니다 — 개인정보·상호는 마스킹 후
        게시.
      </p>
    </Section>
  );
}
