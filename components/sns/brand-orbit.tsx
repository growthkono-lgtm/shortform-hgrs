"use client";

import { useViewProgress } from "./use-view-progress";

/**
 * 브랜드 오빗 — hgrs.io/partnership 의 원형 다이어그램.
 *
 * 원본의 뜻은 "**독립적으로 나뉘어 있던 업무·파트가 합쳐져서 하나의 전략이 된다**"이다.
 * 그래서 위성 넷은 처음에 오른쪽에 일렬로 떨어져 있다가, 스크롤에 맞춰 제자리로 모인다
 * (globals.css `.converge`). 이 동작이 이 도형의 전부이므로 정지 이미지로 대체하지 않는다.
 *
 * 겹침 처리: 위성은 반투명이고 중앙 오브 **위**에 온다. 원본에서 겹치는 부분이
 * 밝게 뜨는 것과 같은 결이고, 위성 글자가 오브에 먹히지도 않는다.
 * (이전 버전은 오브를 위에 올려 글자가 잘렸다 — 패딩으로 밀어내다 정렬이 무너졌다)
 */

type Size = "sm" | "lg";

/** 위/오른쪽/아래/왼쪽 — 자리와, 모이기 전 출발 위치(오른쪽 일렬) */
const SEATS = [
  { pos: "left-1/2 top-0 -translate-x-1/2", fx: "112%", fy: "96%" },
  { pos: "right-0 top-1/2 -translate-y-1/2", fx: "62%", fy: "0%" },
  { pos: "left-1/2 bottom-0 -translate-x-1/2", fx: "168%", fy: "-96%" },
  { pos: "left-0 top-1/2 -translate-y-1/2", fx: "224%", fy: "0%" },
];

export function BrandOrbit({
  brand,
  period,
  items,
  size = "sm",
}: {
  brand: string;
  period?: string | null;
  items: readonly string[];
  size?: Size;
}) {
  const lg = size === "lg";
  // 큰 도형은 천천히(오래 걸쳐) 모이게 — 그림이 커서 같은 구간이면 순식간에 끝난다.
  //
  // minWidth: 폰에서는 아예 모인 상태로 그린다. 좁은 화면에서는 출발 위치
  // (오른쪽 224%)가 화면 밖이라, 스크롤 중간 상태가 "위성 서넛이 오른쪽에
  // 겹쳐 글자가 포개진 그림"으로 멈춰 보인다 — 연출이 아니라 고장으로 읽힌다.
  const { ref, p } = useViewProgress<HTMLDivElement>({
    ...(lg ? { from: 0.95, to: 0.3 } : { from: 0.92, to: 0.55 }),
    minWidth: 1024,
  });

  return (
    <div
      ref={ref}
      style={{ "--p": p } as React.CSSProperties}
      className={`converge relative mx-auto aspect-square w-full ${
        lg ? "max-w-[520px]" : "max-w-[300px]"
      }`}
    >
      {/* 두 겹 궤도선 — 원본의 얇은 링 */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-full border border-white/[0.09]"
      />
      <span
        aria-hidden
        className="absolute inset-[13%] rounded-full border border-white/[0.14]"
      />

      {/* 중앙 오브 — 위성보다 아래에 깔린다 */}
      <span
        aria-hidden
        className="brand-orb absolute inset-[26%] rounded-full blur-[0.5px]"
      />

      {items.slice(0, 4).map((item, i) => (
        <span
          key={item}
          className={`absolute seat-${i} ${lg ? "size-[44%]" : "size-[47%]"} ${SEATS[i].pos}`}
        >
          <span
            className="sat grid size-full place-items-center rounded-full bg-accent/55 px-2 text-center leading-[1.35] font-bold text-white"
            style={
              {
                "--fx": SEATS[i].fx,
                "--fy": SEATS[i].fy,
                fontSize: lg ? "0.8125rem" : "0.625rem",
              } as React.CSSProperties
            }
          >
            {item}
          </span>
        </span>
      ))}

      {/* 브랜드 라벨 — 언제나 맨 위 */}
      <span className="pointer-events-none absolute inset-0 z-20 grid place-items-center text-center">
        <span>
          <span
            className={`stat-figure block text-white ${lg ? "text-3xl" : "text-lg"}`}
          >
            {brand}
            <span
              className={`ml-1 font-normal text-white/70 ${lg ? "text-sm" : "text-[0.6875rem]"}`}
            >
              브랜드
            </span>
          </span>
          {period && (
            <span
              className={`mt-1.5 block text-white/60 ${lg ? "text-xs" : "text-[0.625rem]"}`}
            >
              {period}
            </span>
          )}
        </span>
      </span>
    </div>
  );
}
