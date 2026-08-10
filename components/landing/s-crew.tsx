import { cn } from "@/lib/cn";
import { CREW_FACTS, CREW_ROLES, CREW_SHOTS } from "@/lib/crew";

/**
 * "누가 만드나" — FAQ 한 줄로 묻혀 있던 문항을 섹션으로 꺼낸 자리.
 *
 * 똑같아 보이는 숏폼 외주처 여럿을 놓고 고를 때 실제로 갈리는 건 소재 퀄리티가 아니라
 * **뒤에 회사와 시스템이 있느냐**다. 그래서 이 섹션은 세 덩어리로만 간다:
 *   1) 현장 사진 — 스톡이 아니라 우리 사람이 장비를 들고 찍은 사진. 이 섹션의 첫 근거다
 *   2) 숫자 — 30여 브랜드 / 역할 10 / 평균 프로젝트 단가
 *   3) 역할표 — 한 사람이 다 하는 게 아니라는 걸 눈으로 보여준다
 *
 * 2026-08-10: 사진을 맨 위로 올렸다. 섹션 맨 아래 얇은 띠로 흘려보냈더니
 * 장식으로 읽혀 "팀 사진이 없다"는 말을 들었다. 크게, 먼저 보여야 한다.
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

        {/* 사진이 이 섹션의 첫 근거다 — 역할표·숫자보다 먼저 온다.
            아래로 흘려보내는 얇은 띠로 두면 장식으로 읽히고, 실제로 "팀 사진이 없다"는
            말을 들었다. 크게, 위에, 한 화면에 담기게 놓는다. */}
        <div className="mt-12 grid auto-rows-[96px] grid-cols-2 gap-2.5 sm:auto-rows-[150px] sm:grid-cols-3 lg:auto-rows-[170px] lg:grid-cols-4">
          {CREW_SHOTS.map((shot, i) => (
            <div
              key={shot.src}
              className={cn(
                "relative overflow-hidden rounded-xl bg-white/[0.06]",
                // 맨 앞 한 장은 크게, 맨 뒤 한 장은 가로로 — 남는 칸 없이 딱 떨어진다
                i === 0 && "col-span-2 row-span-2",
                i === CREW_SHOTS.length - 1 && "col-span-2",
              )}
            >
              {/* 이미 webp 로 압축해 넣었다. next/image 로 돌리면 8장이 전부 런타임 최적화 요청이 된다.
                  여덟 장 다 lazy 를 걸지 않는다 — 걸었더니 스크롤 도착 시점에 빈 회색 칸만 보여
                  "팀 사진이 없다"로 읽혔다. 전부 합쳐 470KB 남짓이라 이쪽이 낫다 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shot.src}
                alt={shot.alt}
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

        {/* 숫자 3개 — 사진 다음에 근거를 숫자로 굳힌다 */}
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
          필요한 인프라가 정해진 프로세스로 움직입니다.
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
      </div>

    </section>
  );
}
