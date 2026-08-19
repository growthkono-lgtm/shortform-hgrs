import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd, breadcrumb } from "@/components/seo/structured-data";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FRAMER_CASES } from "@/lib/framer-portfolio";

/**
 * /portfolio/{slug} — 프레이머 시절 상세 페이지가 있던 그 주소 그대로.
 *
 * 본문은 프레이머 CMS 원문이다. 문단 순서와 이미지 위치를 손대지 않는다.
 * 프레이머에 URL 이 이 형태(www.hgrs.io/portfolio/{클라이언트명})로 박혀 있어
 * 명함·검색결과에서 들어오는 링크가 그대로 살아 있어야 한다.
 */
export function generateStaticParams() {
  return FRAMER_CASES.map((c) => ({ slug: c.slug }));
}

type Props = { params: Promise<{ slug: string }> };

const caseOf = (slug: string) =>
  FRAMER_CASES.find((c) => c.slug === decodeURIComponent(slug));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = caseOf((await params).slug);
  if (!c) return {};
  const path = `/portfolio/${encodeURIComponent(c.slug)}`;
  return {
    title: { absolute: `${c.name} | 해그로시 프로젝트 기록` },
    description: c.summary.join(" · "),
    alternates: { canonical: path },
    openGraph: {
      title: `${c.name} | 해그로시 프로젝트 기록`,
      description: c.summary.join(" · "),
      url: path,
    },
  };
}

export default async function FramerCasePage({ params }: Props) {
  const c = caseOf((await params).slug);
  if (!c) notFound();

  const crumbs = breadcrumb([
    { name: "해그로시", path: "/" },
    { name: "성과 사례", path: "/portfolio" },
    { name: c.name, path: `/portfolio/${encodeURIComponent(c.slug)}` },
  ]);

  return (
    <>
      <JsonLd data={crumbs} />
      <SiteHeader cta={{ href: "/sns-brand#contact", label: "프로젝트 문의" }} />
      <main className="bg-night px-5 pb-24 pt-28 sm:px-8">
        <article className="mx-auto max-w-3xl">
          <Link href="/portfolio" className="text-xs text-white/50 hover:text-white">
            ← 성과 사례
          </Link>
          <h1 className="mt-4 text-2xl font-bold leading-snug text-white sm:text-3xl">
            {c.name}
          </h1>
          {c.summary.map((s) => (
            <p key={s} className="mt-2 text-base leading-relaxed text-lime-200/90">
              {s}
            </p>
          ))}

          <div className="mt-10 space-y-6">
            {c.blocks.map((b, i) =>
              "img" in b ? (
                <Image
                  key={`${b.img}-${i}`}
                  src={b.img}
                  alt={b.alt || c.name}
                  width={1200}
                  height={800}
                  sizes="(min-width: 768px) 768px, 100vw"
                  className="h-auto w-full rounded-xl border border-white/10"
                />
              ) : (
                <p
                  key={`p-${i}`}
                  className="text-[15px] leading-[1.9] text-white/75"
                >
                  {b.p}
                </p>
              ),
            )}
          </div>

          <div className="mt-14 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-white/70">
              비슷한 구간에 있다면, 지금 상태부터 같이 보겠습니다.
            </p>
            <Link
              href="/sns-brand#contact"
              className="mt-4 inline-block rounded-full bg-lime-300 px-5 py-2.5 text-sm font-semibold text-night"
            >
              프로젝트 문의하기
            </Link>
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
