"use client";

import { SectionHeading } from "@/components/ui/section";
import {
  SeedingPreview,
  SourcePreview,
  ShortformPreview,
} from "./service-previews";

/**
 * 1·2·3 스텝 요약. 헤드라인은 피그마 문구 그대로.
 *
 * 클라이언트 로고월은 s-clients.tsx로 분리했다 — 이 섹션과 로고월 사이에
 * System 섹션("왜 이 가격에 이 퀄리티가 가능한가")이 들어가기 때문이다.
 */

/**
 * 카드마다 그 단계에서 **실제로 보게 될 화면**을 얹는다 —
 * 와이어프레임이 이 자리에 "참고 이미지"로 어드민 캡처를 붙여 뒀다.
 * 소재 영상을 넣는 자리가 아니다 (한 번 그렇게 넣었다가 되돌렸다).
 */
const PILLARS = [
  {
    no: "1",
    title: "인플루언서 시딩&바이럴",
    body: "브랜드에 맞는 크리에이터를 골라 붙이고 리뷰를 실제 채널에 배포합니다.",
    Preview: SeedingPreview,
  },
  {
    no: "2",
    title: "2차 활용 소스 컷 확보",
    body: "배포로 끝내지 않고 원본에서 광고용 컷을 다시 뽑아 자산으로 남깁니다.",
    Preview: SourcePreview,
  },
  {
    no: "3",
    title: "매출형 숏폼 기획제작",
    body: "확보한 소스로 구매 전환형 숏폼을 만들어 광고 계정에 바로 태웁니다.",
    Preview: ShortformPreview,
  },
];

export function Services() {
  return (
    <section id="services" className="scroll-mt-16 bg-paper-alt py-20 md:py-28">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <p className="eyebrow">Service</p>
        <SectionHeading className="mt-5">
          다양한 스케일업으로 증명된{" "}
          <strong className="font-bold">
            인플루언서 컨텐츠 · 광고 숏폼 패키지
          </strong>
        </SectionHeading>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {PILLARS.map((p) => (
            <div
              key={p.no}
              className="overflow-hidden rounded-2xl border border-line bg-paper"
            >
              {/* 번호를 미리보기 위에 얹으면 화면 안 제목(폴더명·핸들)을 가린다.
                  모바일에서 특히 심했다. 본문 영역으로 내려 제목 앞에 둔다. */}
              <div className="relative aspect-[4/3] overflow-hidden bg-paper-alt">
                <p.Preview />
              </div>
              <div className="p-6 sm:p-7">
                <h3 className="flex items-center gap-2.5 text-lg font-bold">
                  <span className="stat-figure grid size-6 shrink-0 place-items-center rounded-full bg-accent text-xs text-white">
                    {p.no}
                  </span>
                  {p.title}
                </h3>
                <p className="mt-3 text-sm leading-[1.8] text-muted">{p.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
