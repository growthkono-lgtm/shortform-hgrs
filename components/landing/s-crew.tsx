import { Marquee } from "@/components/ui/marquee";
import { CREW_FACTS, CREW_ROLES, CREW_SHOTS } from "@/lib/crew";
import { PARTNERSHIP_URL } from "@/lib/constants";

/**
 * "누가 만드나" — FAQ 한 줄로 묻혀 있던 문항을 섹션으로 꺼낸 자리.
 *
 * 똑같아 보이는 숏폼 외주처 여럿을 놓고 고를 때 실제로 갈리는 건 소재 퀄리티가 아니라
 * **뒤에 회사와 시스템이 있느냐**다. 그래서 이 섹션은 세 덩어리로만 간다:
 *   1) 숫자 — 30여 브랜드 / 역할 10 / 자체 촬영 오피스
 *   2) 역할표 — 한 사람이 다 하는 게 아니라는 걸 눈으로 보여준다
 *   3) 현장 사진 — 스톡이 아니라 실제로 나가서 찍은 사진. 이게 이 섹션의 핵심 근거다.
 *
 * 배경은 다크로 깐다. 앞의 크리에이티브 월이 흰 바탕에 소재로 가득 찬 화면이라
 * 여기까지 밝게 두면 두 섹션이 한 덩어리로 뭉쳐 "회사 이야기"가 안 읽힌다.
 */
export function Crew() {
  return (
    <section id="crew" className="on-dark scroll-mt-16 bg-night py-20 text-white md:py-28">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <p className="eyebrow">Crew</p>
        <h2 className="mt-5 max-w-3xl text-[1.5rem] leading-[1.35] font-bold sm:text-[2.125rem] sm:leading-[1.3] lg:text-[2.75rem]">
          30여 브랜드의 그로스·컨텐츠 프로젝트로
          <br />
          <strong className="font-bold">마케팅 성과 사이클을 이해하는 팀</strong>이
          만듭니다
        </h2>
        <p className="mt-5 max-w-2xl text-[0.9375rem] leading-[1.8] text-white/60 sm:text-base">
          프리랜서 한 명에게 넘기고 연락을 기다리는 방식이 아닙니다. 기획·촬영·편집·모션·퍼포먼스가
          각자 담당으로 붙는 <strong className="font-bold text-white">팀 시스템 안에서
          안정적으로 진행</strong>되고, 담당 한 명이 빠져도 일정이 멈추지 않습니다.
        </p>

        {/* 숫자 3개 — 회사가 있다는 근거를 문장보다 먼저 읽히게 */}
        <dl className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-3">
          {CREW_FACTS.map((f) => (
            <div key={f.label} className="bg-night px-6 py-7">
              <dt className="stat-figure text-3xl text-gold sm:text-4xl">{f.figure}</dt>
              <dd className="mt-3">
                <p className="text-sm font-bold">{f.label}</p>
                <p className="mt-1.5 text-xs leading-[1.7] text-white/50">{f.note}</p>
              </dd>
            </div>
          ))}
        </dl>

        {/* 역할표 — 한 사람이 다 하는 게 아니라는 걸 10칸으로 보여준다 */}
        <h3 className="mt-16 text-lg font-bold">숏폼 한 편에 붙는 역할</h3>
        <p className="mt-2 text-sm text-white/50">
          편수와 상관없이 아래 역할이 같은 순서로 붙습니다.
        </p>

        <ul className="mt-7 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {CREW_ROLES.map((m, i) => (
            <li
              key={`${m.tag}-${i}`}
              className="flex items-start gap-3.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5"
            >
              {/* 얼굴 사진 대신 역할 배지 — 없는 인물 사진을 만들어 붙이면 그 순간 근거가 아니라 연출이 된다 */}
              <span
                aria-hidden
                className="font-display mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-white/10 text-[0.6875rem] font-bold tracking-[0.02em] text-white/75"
              >
                {m.tag}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold">{m.role}</span>
                <span
                  className={`mt-0.5 block text-xs leading-[1.6] ${
                    m.from ? "text-gold" : "text-white/45"
                  }`}
                >
                  {m.from ?? m.scope}
                </span>
              </span>
            </li>
          ))}
        </ul>

        <h3 className="mt-16 text-lg font-bold">실제 촬영 현장</h3>
        <p className="mt-2 max-w-2xl text-sm text-white/50">
          스톡 이미지가 아니라 저희 팀이 나가서 찍은 사진입니다. 김포 촬영 오피스와
          브랜드 현장에서 진행합니다.
        </p>
      </div>

      {/* 현장 사진 — 물량 자체가 메시지인 자리라 흘려도 된다.
          세로 사진이 섞여 있어 높이만 고정하고 폭은 원본 비율대로 둔다. */}
      <div className="mt-8">
        <Marquee copies={3} durationSec={90}>
          {CREW_SHOTS.map((shot) => (
            <div
              key={shot.src}
              className="relative h-[168px] shrink-0 overflow-hidden rounded-xl bg-white/[0.06] sm:h-[240px]"
              style={{ aspectRatio: shot.ratio }}
            >
              {/* 이미 webp 로 압축해 넣었다. next/image 로 돌리면 트랙 3벌 × 8장이
                  전부 런타임 최적화 요청이 된다 (크리에이티브 월과 같은 이유). */}
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
        </Marquee>
      </div>

      <div className="mx-auto mt-12 w-full max-w-6xl px-5 sm:px-8">
        <a
          href={PARTNERSHIP_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white hover:text-ink"
        >
          팀·회사 소개 자세히 보기
          <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-none stroke-current stroke-2">
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </section>
  );
}
