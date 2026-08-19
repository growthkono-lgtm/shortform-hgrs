import Link from "next/link";
import Image from "next/image";
import { FRAMER_CASES } from "@/lib/framer-portfolio";
import { storyOf } from "@/lib/framer-story-map";

/**
 * 프레이머 시절 hgrs.io/portfolio 에 실려 있던 IMC 프로젝트 기록 28건.
 *
 * 카드는 **정리해서 다시 쓴 고객 이야기**로 보낸다(`/blog/story-…`). 프레이머
 * 원문은 요약 두 줄 + 긴 본문이라 그대로는 안 읽혔다. 원문이 요약 두 줄뿐이라
 * 글로 만들 수 없던 항목만 상세 페이지(`/portfolio/{slug}`)로 간다.
 *
 * 두 줄 설명은 프레이머 원문 그대로다 — 여기서 다시 쓰지 않는다.
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
          브랜드를 통으로 맡았던 기록 {FRAMER_CASES.length}건
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">
          숏폼 제작만 떼어 오기 전, 채널·광고·CRM 까지 함께 굴렸던 프로젝트입니다.
          기간과 맡은 범위를 그대로 적었고, 자세한 기록은 각 카드에서 이어집니다.
        </p>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FRAMER_CASES.map((c) => {
            const cover = c.blocks.find((b) => "img" in b);
            const story = storyOf(c.slug);
            const href = story
              ? `/blog/${story}`
              : c.blocks.length > 1
                ? `/portfolio/${encodeURIComponent(c.slug)}`
                : null;

            const inner = (
              <>
                {cover && "img" in cover ? (
                  <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-white/10 bg-night-soft">
                    <Image
                      src={cover.img}
                      alt={cover.alt || c.name}
                      fill
                      sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 90vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                ) : null}
                <h3 className="mt-4 text-base font-semibold text-white group-hover:underline">
                  {c.name}
                </h3>
                {c.summary.map((s) => (
                  <p key={s} className="mt-1 text-sm leading-relaxed text-white/60">
                    {s}
                  </p>
                ))}
                {href ? (
                  <span className="mt-3 inline-block text-xs font-semibold text-lime-300">
                    {story ? "프로젝트 기록 읽기 →" : "자세히 보기 →"}
                  </span>
                ) : null}
              </>
            );

            return (
              <li
                key={c.slug}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                {href ? (
                  <Link href={href} className="group block">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
