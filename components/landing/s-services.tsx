"use client";

import { Marquee } from "@/components/ui/marquee";
import { SectionHeading } from "@/components/ui/section";
import {
  SeedingPreview,
  SourcePreview,
  ShortformPreview,
} from "./service-previews";

/**
 * 1·2·3 스텝 요약 + 함께한 클라이언트. 두 헤드라인 모두 피그마 문구 그대로.
 *
 * 클라이언트 월은 hgrs.io와 같은 방식이다 — **좌우로 흐르는 2행 마퀴**.
 * 로고 파일은 hgrs.io가 서빙하는 원본 PNG를 그대로 가져왔다.
 *
 * 로고는 폭·높이가 제각각이라 그대로 늘어놓으면 크기가 널뛴다.
 * 칸 높이를 고정하고 로고마다 시각 보정 배율(scale)을 줘 무게를 맞춘다 —
 * 가로로 긴 워드마크는 낮게, 정사각에 가까운 심볼은 크게.
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

/**
 * [슬러그, 표시명]. 앞 24개는 hgrs.io 원본 PNG, 뒤 9개는 로고 월 캡처에서 잘라낸 것.
 *
 * 배율 값이 없는 이유: 로고 파일 자체를 560x160 동일 캔버스로 다시 구웠다
 * (scripts 로 여백 제거 + 비율별 광학 크기 정렬). CSS에서 로고마다 scale 을 주면
 * 화면 폭이 바뀔 때마다 다시 어긋난다 — 그렇게 하다 크기가 널뛰었다.
 */
const CLIENTS: [string, string][] = [
  ["krafton", "KRAFTON"],
  ["pubg", "PUBG BATTLEGROUNDS"],
  ["lotte-rental", "롯데렌탈"],
  ["greencar", "Greencar"],
  ["real-class", "REAL CLASS"],
  ["zeroblock", "ZERO block"],
  ["banaco", "BANACO"],
  ["fitflex", "FITFLEX"],
  ["dmand", "dmand"],
  ["cyberdigm", "Cyberdigm"],
  ["irvinelab", "Irvinelab"],
  ["code-i", "code i"],
  ["mudit", "Mudit"],
  ["posh", "POSH"],
  ["bluehouse-seoul", "BLUEHOUSE SEOUL"],
  ["natura-health", "NATURA HEALTH"],
  ["curas", "cura's"],
  ["purum-wellness", "푸름웰니스"],
  ["modu-training", "모두의 트레이닝"],
  ["sambunui-il", "삼분의일"],
  ["luvd", "Luv.D"],
  ["yeonae-jagyeok", "연애의자격"],
  ["gochodaejol", "고초대졸 닷컴"],
  ["juwangsan", "주왕산가든"],
  // ↓ hgrs.io CDN 에 개별 파일이 없어 사장님이 준 로고 월 캡처에서 잘라낸 것들
  ["moev", "moev"],
  ["walla", "walla"],
  ["parklon", "PARKLON"],
  ["riiid", "Riiid"],
  ["gcar", "GCAR"],
  ["naechinso", "내친소"],
  ["resq", "ResQ"],
  ["re", "re:"],
  ["yeolda", "열다"],
];



export function Services() {
  return (
    <>
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

      <section className="overflow-hidden bg-paper py-20 md:py-24">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <p className="eyebrow">Clients</p>
          <SectionHeading className="mt-5">
            커머스부터 서비스, 플랫폼까지{" "}
            <strong className="font-bold">함께한 클라이언트</strong>
          </SectionHeading>
        </div>

        {/* hgrs.io와 같은 5행 좌우 마퀴. 행마다 시작점을 어긋나게 잘라
            같은 로고가 세로로 겹쳐 보이지 않게 한다. */}
        <div className="relative mt-14 space-y-8">
          {[0, 1, 2, 3, 4].map((row) => {
            const offset = Math.round((CLIENTS.length / 5) * row);
            const items = [...CLIENTS.slice(offset), ...CLIENTS.slice(0, offset)];
            return (
              <Marquee key={row} durationSec={38 + row * 6} reverse={row % 2 === 1}>
                <div className="flex items-center gap-8 pr-8 sm:gap-10 sm:pr-10">
                  {items.map(([slug, name]) => (
                    <span
                      key={slug}
                      className="flex w-[136px] shrink-0 items-center justify-center sm:w-[160px]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/logos/${slug}.png`}
                        alt={name}
                        loading="lazy"
                        decoding="async"
                        className="h-auto w-full object-contain opacity-70"
                      />
                    </span>
                  ))}
                </div>
              </Marquee>
            );
          })}

          {/* 양끝 페이드 — 잘린 느낌 대신 계속 흐르는 느낌 */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-paper to-transparent sm:w-28" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-paper to-transparent sm:w-28" />
        </div>
      </section>
    </>
  );
}
