"use client";

import { SectionHeading, SectionLede } from "@/components/ui/section";
import {
  BrandAiPreview,
  DeliveryPreview,
  GuidelinePreview,
  SeedingPreview,
  ShortformPreview,
  SourcePreview,
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
/**
 * 실제로 어드민에서 돌아가는 순서 그대로다 (2026-08-10 확장).
 * 세 덩어리로만 보여주니 "시딩하고 영상 만든다"로만 읽혔다 —
 * 앞단의 분석·기획과 뒷단의 검수·납품이 빠져 있으면 제작 외주와 구분이 안 된다.
 */
const PILLARS = [
  {
    no: "1",
    title: "브랜드 AI 기본 분석",
    body: "상세페이지 URL만 주시면 타겟·USP·객단가·금지 표현을 구조화해 초안을 잡습니다.",
    Preview: BrandAiPreview,
  },
  {
    no: "2",
    title: "컨텐츠 가이드라인 세부 기획",
    body: "편별로 포맷과 후킹을 갈라 편성합니다. 무엇을 왜 그렇게 찍을지가 여기서 정해집니다.",
    Preview: GuidelinePreview,
  },
  {
    no: "3",
    title: "인플루언서 시딩&바이럴",
    body: "브랜드에 맞는 크리에이터를 골라 붙이고 리뷰를 실제 채널에 배포합니다.",
    Preview: SeedingPreview,
  },
  {
    no: "4",
    title: "2차 활용 소스 컷 확보",
    body: "배포로 끝내지 않고 원본에서 광고용 컷을 다시 뽑아 자산으로 남깁니다.",
    Preview: SourcePreview,
  },
  {
    no: "5",
    title: "매출형 숏폼 기획제작",
    body: "확보한 소스로 구매 전환형 숏폼을 만들어 광고 계정에 바로 태웁니다.",
    Preview: ShortformPreview,
  },
  {
    no: "6",
    title: "검수 · 납품",
    body: "미리보기로 확인하고 1회 무상 수정을 거쳐 최종본을 그대로 내려받습니다.",
    Preview: DeliveryPreview,
  },
];

/** 단계 사이 화살표 — 원형 배지. 방향만 prop으로 돌린다 */
function StepArrow({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute z-10 size-7 place-items-center rounded-full border border-line bg-paper text-accent shadow-[0_1px_3px_rgba(3,3,3,0.06)] ${className ?? ""}`}
    >
      <svg viewBox="0 0 16 16" className="size-3.5" fill="none">
        <path
          d="M3 8h9m0 0L8.5 4.5M12 8l-3.5 3.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Services() {
  return (
    <section id="services" className="scroll-mt-16 bg-paper-alt py-20 md:py-28">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <p className="eyebrow">Service</p>
        <SectionHeading className="mt-5">
          대시보드에서 한번에 처리되는{" "}
          <strong className="font-bold">스케일업 소재 프로세스</strong>
        </SectionHeading>
        <SectionLede>
          결제 후 <strong className="font-bold text-ink">내 프로젝트</strong>에
          상세페이지 URL과 일정만 남겨 주시면 됩니다. 분석부터 납품까지 여섯
          단계가 같은 대시보드 안에서 순서대로 처리됩니다.
        </SectionLede>

        {/* 카드 사이 화살표를 gap 위에 얹기 때문에 md에서 gap-x를 넉넉히 준다.
            화살표는 카드(overflow-hidden) 밖 래퍼에 붙여야 잘리지 않는다. */}
        <div className="mt-12 grid gap-6 md:mt-14 md:grid-cols-3 md:gap-x-9 md:gap-y-7">
          {PILLARS.map((p, i) => (
            <div key={p.no} className="relative">
              <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-paper">
                {/* 제목·설명을 미리보기 위로 올리고 배경을 틴트로 갈랐다 —
                    "무엇을 하는 단계인지" 먼저 읽히고 화면은 근거로 따라온다. */}
                <div className="flex-1 border-b border-line bg-accent/[0.055] p-6 sm:p-7">
                  <h3 className="flex items-center gap-2.5 text-lg font-bold">
                    <span className="stat-figure grid size-6 shrink-0 place-items-center rounded-full bg-accent text-xs text-white">
                      {p.no}
                    </span>
                    {p.title}
                  </h3>
                  <p className="mt-3 text-sm leading-[1.8] text-muted">
                    {p.body}
                  </p>
                </div>
                <div className="relative aspect-[4/3] overflow-hidden bg-paper-alt">
                  <p.Preview />
                </div>
              </div>

              {/* 데스크톱: 같은 줄의 다음 카드로 (3·6번 뒤에는 붙이지 않는다) */}
              {(i + 1) % 3 !== 0 && (
                <StepArrow className="top-1/2 -right-8 hidden -translate-y-1/2 md:grid" />
              )}
              {/* 모바일: 한 줄 세로 배치라 아래로 */}
              {i < PILLARS.length - 1 && (
                <StepArrow className="-bottom-[1.625rem] left-1/2 grid -translate-x-1/2 rotate-90 md:hidden" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
