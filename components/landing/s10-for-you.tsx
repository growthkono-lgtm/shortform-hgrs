import { Section, SectionHeading } from "@/components/ui/section";

const TARGETS = [
  {
    title: "신제품 런칭",
    body: "초기 인지와 전환 소재를 동시에 확보해야 할 때",
  },
  {
    title: "광고 소재 고갈",
    body: "메타 계정 성과가 떨어지는 이유가 소재 피로일 때",
  },
  {
    title: "시딩은 해봤는데 전환이 없을 때",
    body: "도달은 나왔지만 매출로 이어지지 않았던 경험이 있을 때",
  },
  {
    title: "자사몰·스마트스토어 스케일업",
    body: "지금 구조에서 예산을 더 태워야 하는 국면일 때",
  },
];

/** S10. 추천 대상 — For You */
export function ForYou() {
  return (
    <Section eyebrow="For You" alt>
      <SectionHeading>이런 국면에 있다면, 맞습니다</SectionHeading>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {TARGETS.map((target) => (
          <div
            key={target.title}
            className="rounded-2xl border border-line bg-paper p-6"
          >
            <h3 className="text-base leading-snug font-bold">{target.title}</h3>
            <p className="mt-3 text-sm leading-[1.7] text-muted">
              {target.body}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
