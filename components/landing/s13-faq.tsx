import { Section, SectionHeading } from "@/components/ui/section";
import { POLICY } from "@/lib/constants";

/** 9문항 — 정책 노출 ⑤: 저작권·수정·기한 문항에서 정책 문구를 그대로 반복 */
const FAQS: { q: string; a: string }[] = [
  {
    q: "인플루언서는 어떤 기준으로 선정되나요?",
    a: "브랜드 카테고리·타겟 연령·콘텐츠 톤을 기준으로, 팔로워 수보다 실제 반응률과 결이 맞는 계정을 우선합니다. 모집 결과는 대시보드에서 계정별로 확인하실 수 있습니다.",
  },
  {
    q: "인플루언서 콘텐츠를 사전에 검수할 수 있나요?",
    a: `${POLICY.noIndividualEdit} 대신 배포 전 가이드라인 단계에서 필수 노출 요소와 금지 표현을 확정해, 방향이 어긋나지 않도록 앞단에서 맞춥니다.`,
  },
  {
    q: "제작된 영상의 저작권과 사용기간은 어떻게 되나요?",
    a: `편집·기획 저작물의 사용권은 결제 브랜드에 귀속됩니다. 다만 ${POLICY.usagePeriod}입니다. 기간을 넘겨 사용할 경우 크리에이터의 저작권·초상권 문제가 발생할 수 있습니다.`,
  },
  {
    q: "수정은 몇 번까지 가능한가요?",
    a: `${POLICY.revisionOnce}. 검수 화면에서 수정 요청을 남기시면 카운터가 소진되고, 이후에는 채널톡으로 별도 견적을 안내드립니다.`,
  },
  {
    q: "전체 소요기간은 얼마나 걸리나요?",
    a: "플랜과 수량에 따라 다르며, 결제 후 대시보드 스텝퍼에 단계별 예상 기간이 표시됩니다. 인플루언서 모집 단계는 D-day로 마감일을 안내드립니다.",
  },
  {
    q: "완성본은 어떻게 받나요?",
    a: `최종 승인 후 Google Drive 폴더로 원본을 전달드립니다. ${POLICY.downloadExpiry} — 만료 전 리마인드 메일을 보내드리니 기간 안에 내려받아 보관해 주세요.`,
  },
  {
    q: "세금계산서 발행이 되나요?",
    a: "가능합니다. 결제 화면에서 사업자번호와 발행 이메일을 입력하시면 담당자가 확인 후 발행해 드립니다.",
  },
  {
    q: "결제수단은 무엇이 있나요?",
    a: "카드·간편결제·가상계좌를 지원합니다. 가상계좌는 입금이 확인되는 시점에 프로젝트가 시작됩니다.",
  },
  {
    q: "광고 운영도 맡길 수 있나요?",
    a: "본 패키지는 소재 기획·제작 범위입니다. 광고 운영은 별도 협의로 진행합니다.",
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
