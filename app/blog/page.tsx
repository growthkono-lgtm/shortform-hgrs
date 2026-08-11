import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { JsonLd, breadcrumb } from "@/components/seo/structured-data";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { POSTS } from "@/lib/blog";

/**
 * /blog — 목록.
 *
 * 브런치로 나가던 임시 리다이렉트를 걷어내고 자체 블로그를 이 경로에 세웠다.
 * 브런치 글은 별도 아카이브 링크로 남긴다(다른 성격의 글이라 섞지 않는다).
 */
export const metadata: Metadata = {
  title: { absolute: "브랜드 컨텐츠 · 채널 그로스 인사이트 | 해그로시" },
  description:
    "브랜드 SNS 채널과 숏폼 소재를 실제로 굴려 본 기록. 채널 성과 판독, 컨텐츠 퍼널 설계, 광고 소재 Multi-Use 이야기를 정리합니다.",
  alternates: { canonical: "/blog" },
  openGraph: { title: "브랜드 컨텐츠 · 채널 그로스 인사이트 | 해그로시", url: "/blog" },
};

const CRUMBS = breadcrumb([
  { name: "해그로시", path: "/" },
  { name: "블로그", path: "/blog" },
]);

export default function BlogIndex() {
  return (
    <>
      <JsonLd data={CRUMBS} />
      <SiteHeader tone="paper" cta={{ href: "/sns-brand#contact", label: "프로젝트 문의" }} />
      <main className="bg-paper px-5 pt-28 pb-20 sm:px-8 sm:pt-32 md:pb-28">
        <div className="mx-auto w-full max-w-6xl">
          <p className="eyebrow">Insight</p>
          <h1 className="mt-5 max-w-3xl text-[1.75rem] leading-[1.32] font-bold sm:text-[2.5rem]">
            브랜드 컨텐츠와 채널을
            <br />
            <strong className="font-bold">실제로 굴려 본 기록</strong>
          </h1>
          <p className="mt-5 max-w-2xl text-[0.9375rem] leading-[1.85] text-muted sm:text-base">
            성과가 난 이유와 나지 않은 이유를 같이 적습니다. 프로젝트에서 확인한
            것만 씁니다.
          </p>

          <ul className="mt-14 grid gap-6 md:grid-cols-2">
            {POSTS.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-line bg-paper transition-colors hover:border-ink/25"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-paper-alt">
                    <Image
                      src={post.cover.src}
                      alt={post.cover.alt}
                      fill
                      sizes="(min-width: 768px) 560px, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6 sm:p-7">
                    <p className="eyebrow">{post.category}</p>
                    <h2 className="mt-3 text-[1.125rem] leading-[1.45] font-bold sm:text-xl">
                      {post.title}
                    </h2>
                    <p className="mt-3 text-sm leading-[1.8] text-muted">
                      {post.excerpt}
                    </p>
                    <p className="mt-5 text-xs text-muted">
                      {post.publishedAt} · 읽는 데 {post.readingMinutes}분
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <a
            href="https://brunch.co.kr/brunchbook/bmaha2"
            target="_blank"
            rel="noreferrer"
            className="group mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-paper-alt px-6 py-6"
          >
            <span className="min-w-0">
              <span className="eyebrow block">Archive</span>
              <span className="mt-2 block text-base font-bold group-hover:underline group-hover:underline-offset-4">
                해그로시가 성과를 보장하는 이유
              </span>
              <span className="mt-1.5 block text-xs leading-[1.7] text-muted">
                디렉터가 직접 쓰는 마케팅 노하우 연재 — 브런치북
              </span>
            </span>
            <span aria-hidden className="shrink-0 text-sm font-bold text-ink">
              →
            </span>
          </a>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
