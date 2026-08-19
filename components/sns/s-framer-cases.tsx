import Link from "next/link";
import Image from "next/image";
import { FRAMER_CASES } from "@/lib/framer-portfolio";

/**
 * 프레이머 시절 hgrs.io/portfolio 에 실려 있던 IMC 프로젝트 기록.
 *
 * 프레이머 CMS 원문을 그대로 옮겨 온 것이다. 요약을 다시 쓰거나 줄이지 않는다 —
 * 카드에 보이는 두 줄은 프레이머 상세 페이지 상단 두 줄 그대로다.
 */
export function FramerCases() {
  return (
    <section
      id="imc-cases"
      className="border-t border-white/10 bg-night px-5 py-20 sm:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold tracking-[0.2em] text-lime-300">
          IMC PROJECTS
        </p>
        <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
          브랜드를 통으로 맡았던 기록
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">
          숏폼 제작만 떼어 오기 전, 채널·광고·CRM 까지 함께 굴렸던 프로젝트들입니다.
          기간과 맡은 범위를 그대로 적었습니다.
        </p>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FRAMER_CASES.map((c) => {
            const cover = c.blocks.find((b) => "img" in b);
            const hasBody = c.blocks.length > 2;
            const card = (
              <>
                {cover && "img" in cover ? (
                  <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-white/10 bg-night-soft">
                    <Image
                      src={cover.img}
                      alt={cover.alt || c.name}
                      fill
                      sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 90vw"
                      className="object-cover"
                    />
                  </div>
                ) : null}
                <h3 className="mt-4 text-base font-semibold text-white">
                  {c.name}
                </h3>
                {c.summary.map((s) => (
                  <p key={s} className="mt-1 text-sm leading-relaxed text-white/60">
                    {s}
                  </p>
                ))}
                {hasBody ? (
                  <span className="mt-3 inline-block text-xs font-semibold text-lime-300">
                    프로젝트 기록 보기 →
                  </span>
                ) : null}
              </>
            );

            return (
              <li
                key={c.slug}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                {hasBody ? (
                  <Link href={`/portfolio/${encodeURIComponent(c.slug)}`} className="block">
                    {card}
                  </Link>
                ) : (
                  card
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
