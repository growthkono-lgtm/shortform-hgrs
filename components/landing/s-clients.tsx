"use client";

import { Marquee } from "@/components/ui/marquee";
import { SectionHeading } from "@/components/ui/section";

/**
 * 함께한 클라이언트 로고월. 원래 s-services.tsx 안에 Service 섹션과 한 컴포넌트로
 * 묶여 있었는데, 그 사이에 System 섹션이 들어가면서 파일을 분리했다.
 * 마크업·문구·로고 목록은 그대로다.
 *
 * hgrs.io와 같은 방식이다 — **좌우로 흐르는 5행 마퀴**.
 * 로고 파일은 hgrs.io가 서빙하는 원본 PNG를 그대로 가져왔다.
 */

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

export function Clients() {
  return (
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
  );
}
