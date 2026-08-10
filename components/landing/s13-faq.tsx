import { Section, SectionHeading } from "@/components/ui/section";

/** 사장님이 확정한 6문항. 여기 없는 문항은 넣지 않는다 */
const FAQS: { q: string; a: string }[] = [
  {
    q: "인플루언서 선정 및 결과는 어디서 확인하나요?",
    a: "내 대시보드에서 선정 완료된 인플루언서 정보를 확인할 수 있습니다.",
  },
  {
    q: "인플루언서 컨텐츠를 확정 전 수정 요청할 수 있나요?",
    a: "사전 제출된 컨텐츠 가이드라인 기준으로 최저가에 소스컷 확보를 목표하므로, 완성본 단계에서 확인 가능합니다.",
  },
  {
    q: "인플루언서 컨텐츠가 배포되면 바로 광고 숏폼 기획제작이 들어가나요?",
    a: "네, 맞습니다. 내 대시보드에서 진행 단계를 보실 수 있고, 소스컷 확보 및 바이럴 배포로부터 약 7일 내외 안에 숏폼 컨텐츠가 지속적으로 공유됩니다.",
  },
  {
    q: "소스컷을 따로 받을 수 있나요? 완성본은 어디서 받나요?",
    a: "모두 내 대시보드에서 다운로드 가능하되, 별도의 소스컷이 아닌 인플루언서 편집본을 받아볼 수 있습니다.",
  },
  {
    q: "숏폼 기획제작은 어떤 전문가가 하나요?",
    // 이 문항은 위 Crew 섹션으로 따로 뺐다. 여기서는 한 줄로 답하고 그쪽으로 넘긴다
    a: "블랭크 코퍼레이션 출신, 대형 라이브커머스 종합몰 컨텐츠 담당자 출신 등 소재와 마케팅 사이클을 함께 운영해 본 제작자들이 진행합니다. 기획·촬영·편집·모션·퍼포먼스가 각자 담당으로 붙는 팀 시스템이며, 실제 현장과 역할 구성은 위 '제작팀' 섹션에서 확인하실 수 있습니다.",
  },
  {
    // 프로젝트 팀이 왜 편수 패키지를 파는지 — Pricing 아래 Beyond 밴드와 같은 갈림길을
    // FAQ에서도 한 번 더 정리한다. 결제 문항 앞이 실제로 이 의문이 떠오르는 자리다.
    q: "기존에 하시던 프로젝트와 이 패키지는 어떻게 다른가요?",
    a: "해그로시는 브랜드 하나를 맡아 기획부터 소재 제작, 캠페인 운영까지 수행하는 프로젝트 팀입니다(평균 프로젝트 단가 2,000만원대). 이 패키지는 그 프로젝트에서 검증된 소재 제작 시스템만 편수 단위로 잘라 연 것으로, 제작 품질과 팀 구성은 동일합니다. 캠페인 운영을 포함한 브랜드 단위 프로젝트가 필요하시면 해그로시로 문의해 주세요.",
  },
  {
    q: "금액은 어떻게 확인하나요?",
    a: "신청해 주시면 브랜드 상황에 맞는 구성과 편수별 금액이 담긴 소개서를 이메일로 보내드립니다. 확정 후 카드 결제로 진행되며, 입금·세금계산서 발행이 필요하시면 함께 안내드립니다.",
  },
];

/** S13. FAQ — 아코디언 */
export function Faq() {
  return (
    <Section eyebrow="FAQ">
      <SectionHeading>자주 묻는 질문</SectionHeading>

      <div className="mt-10 overflow-hidden rounded-2xl border border-line">
        {FAQS.map((faq, i) => (
          <details
            key={faq.q}
            className={i > 0 ? "border-t border-line" : undefined}
          >
            <summary className="cursor-pointer list-none px-6 py-5 text-base font-bold marker:hidden hover:bg-paper-alt">
              {faq.q}
            </summary>
            <p className="px-6 pb-6 text-sm leading-[1.8] text-muted">{faq.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
