import { CREW_SHOTS } from "@/lib/crew";
import { ENGAGEMENT, TEAM } from "@/lib/sns-brand";
import { Rich } from "./rich";

/**
 * 어떤 팀이 어떻게 붙는가 — 채널 서비스에서 제일 자주 받는 질문이다.
 *
 * 다크로 깐다. 앞의 Method(라이트)와 뒤의 Cases(라이트) 사이에서 "회사 이야기"가
 * 뭉개지지 않게 하려는 것으로, 숏폼 랜딩의 Crew 섹션과 같은 이유·같은 톤이다.
 * 현장 사진도 그 섹션과 같은 원본을 쓴다 (스톡 아님).
 */
export function Team() {
  return (
    <section
      id="team"
      className="on-dark scroll-mt-16 bg-night py-20 text-white md:py-28"
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <p className="eyebrow">Team</p>
        <h2 className="mt-5 max-w-3xl text-[1.5rem] leading-[1.35] font-bold sm:text-[2.125rem] sm:leading-[1.3] lg:text-[2.75rem]">
          한 명이 아니라,
          <br />
          <strong className="font-bold">네 개 팀이 붙습니다</strong>
        </h2>
        <Rich
          html={TEAM.lead}
          className="mt-5 max-w-2xl text-[0.9375rem] leading-[1.85] text-white/60 sm:text-base"
        />

        <ul className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {TEAM.teams.map((team) => (
            <li key={team.tag} className="bg-night p-6 sm:p-7">
              <span className="stat-figure grid size-9 place-items-center rounded-full bg-white/10 text-[0.6875rem] text-white">
                {team.tag}
              </span>
              <h3 className="mt-4 text-base font-bold">{team.name}</h3>
              <ul className="mt-4 space-y-2">
                {team.items.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-[0.8125rem] leading-[1.7] text-white/60"
                  >
                    <span
                      aria-hidden
                      className="mt-1.5 size-1 shrink-0 rounded-full bg-gold"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>

        {/* 현장 사진 — 팀이 실제로 나가서 찍는다는 근거. 넉 장만 띠로 흘린다 */}
        <div className="mt-10 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {CREW_SHOTS.slice(0, 4).map((shot) => (
            <div
              key={shot.src}
              className="relative aspect-[4/3] overflow-hidden rounded-xl bg-white/[0.06]"
            >
              {/* 이미 webp 로 압축된 파일이라 next/image 런타임 최적화를 태우지 않는다 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shot.src}
                alt={shot.alt}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 size-full object-cover"
              />
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs leading-[1.7] text-white/45">
          스톡 이미지가 아니라 저희 팀이 브랜드 현장과 촬영 현장에서 직접 찍은
          사진입니다.
        </p>

        <p className="mt-12 border-t border-white/15 pt-8 text-[0.9375rem] leading-[1.85] font-bold text-white/80">
          {TEAM.footnote}
        </p>
      </div>
    </section>
  );
}

/**
 * 계약 구조 — 연 단위.
 * 금액은 싣지 않는다(확정 사항). 대신 기간·투입·리듬·소유를 표로 못박아
 * "무엇을 사는 것인지"가 문의 전에 정리되게 한다.
 */
export function Engagement() {
  return (
    <section
      id="engagement"
      className="scroll-mt-16 bg-paper-alt py-20 md:py-28"
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <p className="eyebrow">Engagement</p>
        <h2 className="mt-5 max-w-3xl text-[1.5rem] leading-[1.35] font-bold sm:text-[2.125rem] sm:leading-[1.3] lg:text-[2.75rem]">
          월 단위로 갈아타는 대행이 아니라,
          <br />
          <strong className="font-bold">연 단위로 쌓는 파트너십</strong>
        </h2>
        <p className="mt-5 max-w-2xl text-[0.9375rem] leading-[1.8] text-muted sm:text-base">
          {ENGAGEMENT.lead}
        </p>

        <dl className="mt-12 overflow-hidden rounded-2xl border border-line bg-paper">
          {ENGAGEMENT.rows.map((row, i) => (
            <div
              key={row.k}
              className={`grid gap-1 px-6 py-5 sm:grid-cols-[80px_minmax(0,1fr)_minmax(0,1fr)] sm:items-baseline sm:gap-6 sm:px-8 ${
                i > 0 ? "border-t border-line" : ""
              }`}
            >
              <dt className="eyebrow !text-[0.6875rem]">{row.k}</dt>
              <dd className="text-[0.9375rem] font-bold text-ink sm:text-base">
                {row.v}
              </dd>
              <dd className="text-xs leading-[1.7] text-muted sm:text-[0.8125rem]">
                {row.note}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-6 text-sm leading-[1.8] text-muted">
          {ENGAGEMENT.note}
        </p>
      </div>
    </section>
  );
}
