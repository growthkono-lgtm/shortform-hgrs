import { Section, SectionHeading } from "@/components/ui/section";

const PROBLEMS = [
  {
    title: "도달 ≠ 전환",
    body: "인플루언서 릴스는 인지도를 만들지만 구매 버튼까지 데려가진 못합니다.",
  },
  {
    title: "소재 고갈",
    body: "메타 광고는 소재가 생명, 촬영 없이 새 소재를 계속 수급할 방법이 없습니다.",
  },
  {
    title: "3개 업체 3배 커뮤니케이션",
    body: "시딩 대행 + 제작사 + 광고 대행사, 조율하다 한 달이 갑니다.",
  },
];

/** S3. 문제 제기 — Problem */
export function Problem() {
  return (
    <Section eyebrow="Problem">
      <SectionHeading>
        시딩 돌렸는데, <strong className="font-bold">매출은 왜 그대로</strong>
        일까요?
      </SectionHeading>

      <div className="mt-12 grid gap-5 sm:grid-cols-3">
        {PROBLEMS.map((p) => (
          <div
            key={p.title}
            className="rounded-2xl border border-line bg-paper p-7 sm:p-8"
          >
            <h3 className="text-lg font-bold">{p.title}</h3>
            <p className="mt-3 text-sm leading-[1.75] text-muted">{p.body}</p>
          </div>
        ))}
      </div>

      <p className="mt-10 border-l-2 border-accent pl-5 text-base font-bold text-ink-soft sm:text-lg">
        숏폼을 놓치는 순간, 광고 계정은 소재부터 마릅니다.
      </p>
    </Section>
  );
}
