import Link from "next/link";
import { ISSUE, TOC } from "@/lib/sns-brand";
import { Spread } from "./mag";

/**
 * 커버 — 매거진 표지.
 * 서비스 랜딩의 히어로처럼 CTA를 크게 박지 않는다. 제호 / 헤드라인 / 목차 순서로
 * "이건 읽는 지면이다"를 먼저 선언하고, 전환은 목차 맨 끝(Contact)에 둔다.
 */
export function Cover() {
  return (
    <section className="border-b border-line bg-paper-warm pt-28 pb-16 sm:pt-32 sm:pb-20">
      <Spread>
        {/* 제호 — 좌 매체명 / 우 발행호 */}
        <div className="flex items-baseline justify-between border-b border-ink pb-3">
          <p className="mag-label">{ISSUE.masthead}</p>
          <p className="mag-label text-ink">{ISSUE.issue}</p>
        </div>

        <h1 className="mag-serif mt-10 text-[2rem] leading-[1.35] text-ink sm:mt-14 sm:text-[3rem] sm:leading-[1.32] lg:text-[3.75rem]">
          {ISSUE.headline[0]}
          <br />
          {ISSUE.headline[1]}
        </h1>

        <p className="mt-7 max-w-2xl text-[0.9375rem] leading-[1.9] text-ink-soft sm:mt-9 sm:text-lg sm:leading-[1.85]">
          {ISSUE.standfirst}
        </p>

        {/* 목차 — 앵커. 매거진에서 독자가 먼저 훑는 곳이자 이 페이지의 구조 설명이다 */}
        <nav aria-label="이번 호 목차" className="mt-14 sm:mt-20">
          <p className="mag-label border-b border-line pb-2">Contents</p>
          <ul className="mt-1">
            {TOC.map((item) => (
              <li key={item.id} className="border-b border-line">
                <Link
                  href={`#${item.id}`}
                  className="group flex flex-wrap items-baseline gap-x-4 gap-y-0.5 py-3.5 transition-colors duration-200 hover:bg-paper"
                >
                  <span className="mag-label w-24 shrink-0 sm:w-28">
                    {item.label}
                  </span>
                  <span className="mag-serif flex-1 text-[0.9375rem] text-ink-soft group-hover:text-ink sm:text-base">
                    {item.title}
                  </span>
                  <span
                    aria-hidden
                    className="text-muted transition-transform duration-200 group-hover:translate-x-1"
                  >
                    ↓
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Spread>
    </section>
  );
}
