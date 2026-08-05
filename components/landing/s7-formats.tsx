import { Section, SectionHeading } from "@/components/ui/section";
import { PhoneMockup } from "@/components/ui/phone-mockup";
import { FORMAT_SHOTS } from "@/lib/portfolio";

const FORMATS = [
  { title: "후기형", body: "실사용 경험을 1인칭으로. 신뢰가 구매 장벽을 낮춥니다." },
  { title: "전문가형", body: "권위 있는 화자가 근거를 설명해 설득 강도를 올립니다." },
  { title: "제품 실험형", body: "눈으로 확인되는 실험 장면으로 성능을 증명합니다." },
  { title: "비교형", body: "대안과 나란히 두어 선택 이유를 명확하게 만듭니다." },
  { title: "문제제기형", body: "타겟이 겪는 상황을 먼저 꺼내 스크롤을 멈춥니다." },
  { title: "비포애프터형", body: "변화의 폭을 한 화면에 담아 결과를 각인시킵니다." },
];

/** S7. 전환형 포맷 메뉴판 — Formats */
export function Formats() {
  return (
    <Section eyebrow="Formats">
      <SectionHeading>
        성과가 검증된 <strong className="font-bold">전환 포맷</strong>으로만 제작합니다
      </SectionHeading>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FORMATS.map((format, i) => (
          <div
            key={format.title}
            className="rounded-2xl border border-line bg-paper p-6"
          >
            <PhoneMockup
              poster={FORMAT_SHOTS[format.title]}
              alt={`${format.title} 숏폼 예시`}
              slotName={`format_${i + 1}`}
              className="max-w-[180px]"
            />
            <h3 className="mt-6 text-base font-bold">{format.title}</h3>
            <p className="mt-2 text-sm leading-[1.7] text-muted">{format.body}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-sm text-muted">
        전체 포맷 라이브러리는 결제 후 가이드라인 단계에서 브랜드에 맞게 제안됩니다.
      </p>
    </Section>
  );
}
